import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";

const loginSchema = z.object({ email: z.string().email(), password: z.string().min(8).max(128) });

export async function POST(request: Request) {
  const start = Date.now();
  const parsed = loginSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter a valid email and password." }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
  if (!user || !user.isActive || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  await prisma.user.update({ where: { id: user.id }, data: { lastLogin: new Date() } });
  await createSession({ userId: user.id, role: user.role });
  console.log(`Login completed in ${Date.now() - start}ms`);
  return NextResponse.json({ user: { id: user.id, name: user.name, role: user.role }, redirectTo: user.role === "ADMIN" ? "/admin/dashboard" : "/dashboard" });
}

import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const updateSchema = z.object({ isActive: z.boolean().optional(), password: z.string().min(8).max(128).optional() });

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    const { id } = await context.params;
    const parsed = updateSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success || (parsed.data.isActive === undefined && !parsed.data.password)) return NextResponse.json({ error: "Provide a valid employee update." }, { status: 400 });
    const employee = await prisma.user.findFirst({ where: { id, role: "EMPLOYEE" } });
    if (!employee) return NextResponse.json({ error: "Employee not found." }, { status: 404 });
    const updated = await prisma.user.update({ where: { id }, data: { isActive: parsed.data.isActive, passwordHash: parsed.data.password ? await bcrypt.hash(parsed.data.password, 12) : undefined }, select: { id: true, name: true, email: true, isActive: true } });
    await prisma.auditLog.create({ data: { userId: admin.id, action: parsed.data.password ? "RESET_PASSWORD" : "UPDATE", entityType: "USER", entityId: id } });
    return NextResponse.json({ employee: updated });
  } catch (error) { const forbidden = error instanceof Error && error.message === "FORBIDDEN"; return NextResponse.json({ error: forbidden ? "Forbidden" : "Unauthorized" }, { status: forbidden ? 403 : 401 }); }
}

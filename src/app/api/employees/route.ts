import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const employeeSchema = z.object({ name: z.string().trim().min(2).max(100), email: z.string().email(), password: z.string().min(8).max(128), departmentIds: z.array(z.string()).min(1) });

export async function GET() {
  try { await requireAdmin(); const employees = await prisma.user.findMany({ where: { role: "EMPLOYEE" }, select: { id: true, name: true, email: true, isActive: true, presenceStatus: true, departments: { include: { department: { select: { id: true, name: true } } } } }, orderBy: { name: "asc" } }); return NextResponse.json({ employees }); }
  catch (error) { return NextResponse.json({ error: error instanceof Error && error.message === "FORBIDDEN" ? "Forbidden" : "Unauthorized" }, { status: error instanceof Error && error.message === "FORBIDDEN" ? 403 : 401 }); }
}

export async function POST(request: Request) {
  try { const admin = await requireAdmin(); const parsed = employeeSchema.safeParse(await request.json().catch(() => null)); if (!parsed.success) return NextResponse.json({ error: "Provide a name, valid email, password, and department." }, { status: 400 }); const exists = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } }); if (exists) return NextResponse.json({ error: "An account with that email already exists." }, { status: 409 }); const passwordHash = await bcrypt.hash(parsed.data.password, 12); const employee = await prisma.user.create({ data: { name: parsed.data.name, email: parsed.data.email.toLowerCase(), passwordHash, departments: { create: parsed.data.departmentIds.map((departmentId) => ({ departmentId })) } }, select: { id: true, name: true, email: true } }); await prisma.auditLog.create({ data: { userId: admin.id, action: "CREATE", entityType: "USER", entityId: employee.id, metadata: JSON.stringify({ email: employee.email }) } }); return NextResponse.json({ employee }, { status: 201 }); }
  catch (error) { return NextResponse.json({ error: error instanceof Error && error.message === "FORBIDDEN" ? "Forbidden" : "Unauthorized" }, { status: error instanceof Error && error.message === "FORBIDDEN" ? 403 : 401 }); }
}

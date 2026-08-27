import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin, requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const taskSchema = z.object({ title: z.string().trim().min(2).max(160), description: z.string().trim().max(5000).default(""), assignedToId: z.string().min(1), departmentId: z.string().min(1), priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]), dueDate: z.string().optional() });

export async function GET() {
  try {
    const user = await requireUser();
    const tasks = await prisma.task.findMany({
      where: user.role === "ADMIN" ? undefined : { assignedToId: user.id },
      include: { department: { select: { name: true } }, assignedTo: { select: { id: true, name: true } }, comments: { include: { user: { select: { name: true } } }, orderBy: { createdAt: "desc" } } },
      orderBy: { dueDate: "asc" },
    });
    return NextResponse.json({ tasks });
  } catch (error) {
    const status = error instanceof Error && error.message === "FORBIDDEN" ? 403 : 401;
    return NextResponse.json({ error: "Unauthorized" }, { status });
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();
    const parsed = taskSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Complete all required task fields." }, { status: 400 });
    const employee = await prisma.user.findFirst({ where: { id: parsed.data.assignedToId, role: "EMPLOYEE", isActive: true } });
    if (!employee) return NextResponse.json({ error: "The selected employee is not active." }, { status: 400 });
    const task = await prisma.task.create({ data: { title: parsed.data.title, description: parsed.data.description, assignedToId: employee.id, assignedById: admin.id, departmentId: parsed.data.departmentId, priority: parsed.data.priority, dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null }, include: { department: { select: { name: true } } } });
    await prisma.notification.create({ data: { userId: employee.id, type: "TASK_ASSIGNED", title: "New task assigned", message: `New task assigned: ${task.title}`, relatedTaskId: task.id } });
    await prisma.auditLog.create({ data: { userId: admin.id, action: "CREATE", entityType: "TASK", entityId: task.id, metadata: JSON.stringify({ assignedToId: employee.id }) } });
    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    const forbidden = error instanceof Error && error.message === "FORBIDDEN";
    return NextResponse.json({ error: forbidden ? "Forbidden" : "Unauthorized" }, { status: forbidden ? 403 : 401 });
  }
}

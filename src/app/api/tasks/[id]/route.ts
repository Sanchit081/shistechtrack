import { NextResponse } from "next/server";
import { z } from "zod";
import { authFailure, requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const updateSchema = z.object({ status: z.enum(["PENDING", "IN_PROGRESS", "ON_HOLD", "COMPLETED", "CANCELLED"]).optional(), progressPercentage: z.number().int().min(0).max(100).optional(), description: z.string().trim().max(5000).optional() });
const commentSchema = z.object({ comment: z.string().trim().min(2).max(2000) });

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await context.params;
    const task = await prisma.task.findFirst({ where: { id, ...(user.role === "ADMIN" ? {} : { assignedToId: user.id }) }, include: { department: true, comments: { include: { user: { select: { name: true } } }, orderBy: { createdAt: "desc" } } } });
    if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });
    return NextResponse.json({ task });
  } catch (error) {
    return authFailure(error);
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await context.params;
    const existing = await prisma.task.findFirst({ where: { id, ...(user.role === "ADMIN" ? {} : { assignedToId: user.id }) } });
    if (!existing) return NextResponse.json({ error: "Task not found" }, { status: 404 });
    const parsed = updateSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Invalid task update." }, { status: 400 });
    const status = parsed.data.status;
    const task = await prisma.task.update({ where: { id }, data: { ...parsed.data, completedAt: status === "COMPLETED" ? new Date() : status ? null : undefined } });
    return NextResponse.json({ task });
  } catch (error) {
    return authFailure(error);
  }
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await context.params;
    const task = await prisma.task.findFirst({ where: { id, ...(user.role === "ADMIN" ? {} : { assignedToId: user.id }) } });
    if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });
    const parsed = commentSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Comment must be between 2 and 2000 characters." }, { status: 400 });
    const comment = await prisma.taskComment.create({ data: { taskId: id, userId: user.id, comment: parsed.data.comment }, include: { user: { select: { name: true } } } });
    return NextResponse.json({ comment }, { status: 201 });
  } catch (error) {
    return authFailure(error);
  }
}

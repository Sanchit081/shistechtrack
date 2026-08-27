import { NextResponse } from "next/server";
import { z } from "zod";
import { authFailure, requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const messageSchema = z.object({ roomId: z.string().min(1), message: z.string().trim().min(1).max(4000) });

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const roomId = new URL(request.url).searchParams.get("roomId") ?? "general-it-team";
    const room = await prisma.chatRoom.findUnique({ where: { id: roomId } });
    if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });
    const messages = await prisma.chatMessage.findMany({ where: { roomId, deletedAt: null }, include: { sender: { select: { id: true, name: true, profileImage: true } }, attachments: { select: { id: true, originalFilename: true } } }, orderBy: { createdAt: "asc" }, take: 100 });
    return NextResponse.json({ room: { id: room.id, name: room.name }, messages, viewerId: user.id });
  } catch (error) {
    return authFailure(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const parsed = messageSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Message cannot be empty." }, { status: 400 });
    const room = await prisma.chatRoom.findUnique({ where: { id: parsed.data.roomId } });
    if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });
    const message = await prisma.chatMessage.create({ data: { roomId: room.id, senderId: user.id, message: parsed.data.message }, include: { sender: { select: { id: true, name: true, profileImage: true } } } });
    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    return authFailure(error);
  }
}

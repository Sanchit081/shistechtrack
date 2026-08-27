import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { authFailure, requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);
const maxSize = 10 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const form = await request.formData();
    const roomId = form.get("roomId");
    const file = form.get("file");
    if (typeof roomId !== "string" || !(file instanceof File)) return NextResponse.json({ error: "A room and file are required." }, { status: 400 });
    if (!allowedTypes.has(file.type) || file.size > maxSize) return NextResponse.json({ error: "Only JPG, PNG, WEBP, and PDF files up to 10 MB are allowed." }, { status: 400 });
    const room = await prisma.chatRoom.findUnique({ where: { id: roomId } });
    if (!room) return NextResponse.json({ error: "Room not found." }, { status: 404 });
    const storedFilename = `${randomUUID()}${path.extname(file.name).toLowerCase()}`;
    const storagePath = path.join(process.cwd(), "uploads", storedFilename);
    await mkdir(path.dirname(storagePath), { recursive: true });
    await writeFile(storagePath, Buffer.from(await file.arrayBuffer()));
    const message = await prisma.chatMessage.create({ data: { roomId, senderId: user.id, message: file.name, messageType: file.type === "application/pdf" ? "DOCUMENT" : "IMAGE", attachments: { create: { uploadedById: user.id, originalFilename: file.name, storedFilename, mimeType: file.type, fileSize: file.size, storagePath } } }, include: { sender: { select: { id: true, name: true, profileImage: true } }, attachments: true } });
    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    return authFailure(error);
  }
}

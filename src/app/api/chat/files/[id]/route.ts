import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import { authFailure, requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireUser();
    const { id } = await context.params;
    const attachment = await prisma.attachment.findUnique({ where: { id }, include: { message: { include: { room: true } } } });
    if (!attachment) return NextResponse.json({ error: "File not found." }, { status: 404 });
    try {
      const body = await readFile(attachment.storagePath);
      return new Response(body, { headers: { "Content-Type": attachment.mimeType, "Content-Disposition": `inline; filename="${attachment.originalFilename.replace(/[^a-zA-Z0-9._-]/g, "_")}"`, "Cache-Control": "private, no-store" } });
    } catch {
      return NextResponse.json({ error: "File unavailable." }, { status: 404 });
    }
  } catch (error) {
    return authFailure(error);
  }
}

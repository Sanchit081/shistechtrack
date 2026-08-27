import { NextResponse } from "next/server";
import { z } from "zod";
import { authFailure, requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({ status: z.enum(["AVAILABLE", "AWAY", "DO_NOT_DISTURB", "BE_RIGHT_BACK", "OFFLINE"]) });

export async function PATCH(request: Request) {
  try {
    const user = await requireUser();
    const parsed = schema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Invalid availability status." }, { status: 400 });
    const updated = await prisma.user.update({ where: { id: user.id }, data: { presenceStatus: parsed.data.status }, select: { presenceStatus: true } });
    return NextResponse.json({ status: updated.presenceStatus });
  } catch (error) {
    return authFailure(error);
  }
}

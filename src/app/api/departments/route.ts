import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() { try { await requireUser(); const departments = await prisma.department.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }); return NextResponse.json({ departments }); } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); } }

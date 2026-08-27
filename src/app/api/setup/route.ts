import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";

export async function POST() {
  try {
    // Check if database is already set up
    const userCount = await prisma.user.count();
    if (userCount > 0) {
      return NextResponse.json({ error: "Database already initialized" }, { status: 400 });
    }

    // Create departments
    const departments = [
      { name: "Website & Web Management", description: "Websites, portals, and digital platforms" },
      { name: "Digital Marketing & Content", description: "Campaigns, content, and communications" },
      { name: "Video Production & Editing", description: "Video capture, editing, and production" },
      { name: "CCTV & Surveillance", description: "Security systems and surveillance operations" },
      { name: "Hardware & Software Support", description: "Devices, systems, and technical support" },
    ];

    for (const dept of departments) {
      await prisma.department.upsert({
        where: { name: dept.name },
        update: { description: dept.description },
        create: dept,
      });
    }

    // Create admin user
    const passwordHash = await bcrypt.hash("ChangeMe123!", 10);
    const admin = await prisma.user.upsert({
      where: { email: "admin@shis.edu.in" },
      update: { passwordHash, role: Role.ADMIN, isActive: true },
      create: {
        name: "SHIS Administrator",
        email: "admin@shis.edu.in",
        passwordHash,
        role: Role.ADMIN,
      },
    });

    // Create chat room
    await prisma.chatRoom.upsert({
      where: { id: "general-it-team" },
      update: {},
      create: {
        id: "general-it-team",
        name: "General IT Team",
        type: "GENERAL",
      },
    });

    return NextResponse.json({ 
      success: true, 
      message: "Database initialized successfully",
      admin: { email: admin.email, name: admin.name }
    });
  } catch (error) {
    console.error("Setup error:", error);
    return NextResponse.json({ 
      error: "Failed to initialize database",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}

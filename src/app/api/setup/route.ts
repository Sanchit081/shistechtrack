import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";

export async function POST() {
  try {
    // Create enum types first (PostgreSQL doesn't support IF NOT EXISTS for types, so we check manually)
    const enumTypes = [
      { name: "Role", values: ['ADMIN', 'EMPLOYEE'] },
      { name: "TaskStatus", values: ['PENDING', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED'] },
      { name: "Priority", values: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] },
      { name: "MessageType", values: ['TEXT', 'IMAGE', 'DOCUMENT', 'FILE'] },
      { name: "PresenceStatus", values: ['AVAILABLE', 'AWAY', 'DO_NOT_DISTURB', 'BE_RIGHT_BACK', 'OFFLINE'] }
    ];

    for (const enumType of enumTypes) {
      try {
        // Check if enum exists
        const result = await prisma.$queryRawUnsafe(
          `SELECT 1 FROM pg_type WHERE typname = '${enumType.name}'`
        );
        if (!result || (Array.isArray(result) && result.length === 0)) {
          // Create enum if it doesn't exist
          await prisma.$executeRawUnsafe(
            `CREATE TYPE "${enumType.name}" AS ENUM (${enumType.values.map(v => `'${v}'`).join(', ')})`
          );
        }
      } catch (e) {
        console.log(`Enum ${enumType.name} creation info:`, e);
      }
    }

    // Create tables using raw SQL since Prisma db push doesn't work in serverless
    const createTables = [
      `CREATE TABLE IF NOT EXISTS "Department" (
          "id" TEXT NOT NULL,
          "name" TEXT NOT NULL,
          "description" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
      )`,
      `CREATE TABLE IF NOT EXISTS "User" (
          "id" TEXT NOT NULL,
          "name" TEXT NOT NULL,
          "email" TEXT NOT NULL,
          "passwordHash" TEXT NOT NULL,
          "role" "Role" NOT NULL DEFAULT 'EMPLOYEE',
          "presenceStatus" "PresenceStatus" NOT NULL DEFAULT 'AVAILABLE',
          "profileImage" TEXT,
          "isActive" BOOLEAN NOT NULL DEFAULT true,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL,
          "lastLogin" TIMESTAMP(3),
          CONSTRAINT "User_pkey" PRIMARY KEY ("id")
      )`,
      `CREATE TABLE IF NOT EXISTS "ChatRoom" (
          "id" TEXT NOT NULL,
          "name" TEXT NOT NULL,
          "type" TEXT NOT NULL DEFAULT 'GENERAL',
          "departmentId" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "ChatRoom_pkey" PRIMARY KEY ("id")
      )`,
      `CREATE TABLE IF NOT EXISTS "ChatMessage" (
          "id" TEXT NOT NULL,
          "roomId" TEXT NOT NULL,
          "senderId" TEXT NOT NULL,
          "message" TEXT NOT NULL,
          "messageType" "MessageType" NOT NULL DEFAULT 'TEXT',
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "editedAt" TIMESTAMP(3),
          "deletedAt" TIMESTAMP(3),
          CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
      )`,
      `CREATE TABLE IF NOT EXISTS "Task" (
          "id" TEXT NOT NULL,
          "title" TEXT NOT NULL,
          "description" TEXT NOT NULL,
          "assignedToId" TEXT NOT NULL,
          "assignedById" TEXT NOT NULL,
          "departmentId" TEXT NOT NULL,
          "priority" "Priority" NOT NULL DEFAULT 'MEDIUM',
          "status" "TaskStatus" NOT NULL DEFAULT 'PENDING',
          "progressPercentage" INTEGER NOT NULL DEFAULT 0,
          "startDate" TIMESTAMP(3),
          "dueDate" TIMESTAMP(3),
          "completedAt" TIMESTAMP(3),
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL,
          CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
      )`,
      `CREATE TABLE IF NOT EXISTS "UserDepartment" (
          "userId" TEXT NOT NULL,
          "departmentId" TEXT NOT NULL,
          CONSTRAINT "UserDepartment_pkey" PRIMARY KEY ("userId", "departmentId")
      )`,
      `CREATE TABLE IF NOT EXISTS "TaskComment" (
          "id" TEXT NOT NULL,
          "taskId" TEXT NOT NULL,
          "userId" TEXT NOT NULL,
          "comment" TEXT NOT NULL,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "TaskComment_pkey" PRIMARY KEY ("id")
      )`,
      `CREATE TABLE IF NOT EXISTS "Attachment" (
          "id" TEXT NOT NULL,
          "messageId" TEXT NOT NULL,
          "uploadedById" TEXT NOT NULL,
          "originalFilename" TEXT NOT NULL,
          "storedFilename" TEXT NOT NULL,
          "mimeType" TEXT NOT NULL,
          "fileSize" INTEGER NOT NULL,
          "storagePath" TEXT NOT NULL,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "Attachment_pkey" PRIMARY KEY ("id")
      )`,
      `CREATE TABLE IF NOT EXISTS "Notification" (
          "id" TEXT NOT NULL,
          "userId" TEXT NOT NULL,
          "type" TEXT NOT NULL,
          "title" TEXT NOT NULL,
          "message" TEXT NOT NULL,
          "relatedTaskId" TEXT,
          "isRead" BOOLEAN NOT NULL DEFAULT false,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
      )`,
      `CREATE TABLE IF NOT EXISTS "AuditLog" (
          "id" TEXT NOT NULL,
          "userId" TEXT NOT NULL,
          "action" TEXT NOT NULL,
          "entityType" TEXT NOT NULL,
          "entityId" TEXT NOT NULL,
          "metadata" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
      )`,
      `CREATE UNIQUE INDEX IF NOT EXISTS "Department_name_key" ON "Department"("name")`,
      `CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email")`,
      `CREATE UNIQUE INDEX IF NOT EXISTS "Attachment_storedFilename_key" ON "Attachment"("storedFilename")`
    ];

    // Drop existing tables if they exist with wrong schema
    const dropTables = [
      `DROP TABLE IF EXISTS "AuditLog" CASCADE`,
      `DROP TABLE IF EXISTS "Notification" CASCADE`,
      `DROP TABLE IF EXISTS "Attachment" CASCADE`,
      `DROP TABLE IF EXISTS "TaskComment" CASCADE`,
      `DROP TABLE IF EXISTS "UserDepartment" CASCADE`,
      `DROP TABLE IF EXISTS "Task" CASCADE`,
      `DROP TABLE IF EXISTS "ChatMessage" CASCADE`,
      `DROP TABLE IF EXISTS "ChatRoom" CASCADE`,
      `DROP TABLE IF EXISTS "User" CASCADE`,
      `DROP TABLE IF EXISTS "Department" CASCADE`
    ];

    for (const sql of dropTables) {
      await prisma.$executeRawUnsafe(sql);
    }

    for (const sql of createTables) {
      await prisma.$executeRawUnsafe(sql);
    }

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

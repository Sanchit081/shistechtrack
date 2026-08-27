import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const departments = [
  ["Website & Web Management", "Websites, portals, and digital platforms"],
  ["Digital Marketing & Content", "Campaigns, content, and communications"],
  ["Video Production & Editing", "Video capture, editing, and production"],
  ["CCTV & Surveillance", "Security systems and surveillance operations"],
  ["Hardware & Software Support", "Devices, systems, and technical support"],
] as const;

async function main() {
  for (const [name, description] of departments) {
    await prisma.department.upsert({ where: { name }, update: { description }, create: { name, description } });
  }

  const passwordHash = await bcrypt.hash("ChangeMe123!", 12);
  await prisma.user.upsert({
    where: { email: "admin@shis.edu.in" },
    update: { passwordHash, role: Role.ADMIN, isActive: true },
    create: { name: "SHIS Administrator", email: "admin@shis.edu.in", passwordHash, role: Role.ADMIN },
  });

  await prisma.chatRoom.upsert({ where: { id: "general-it-team" }, update: {}, create: { id: "general-it-team", name: "General IT Team", type: "GENERAL" } });
}

main().finally(() => prisma.$disconnect());

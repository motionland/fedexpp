import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs"; // Fix Windows import issue

const prisma = new PrismaClient();

async function main() {
  const status = [
    { name: "Pending", description: "Package is pending" },
    { name: "In Transit", description: "Package is in transit" },
    { name: "Delivered", description: "Package is delivered" },
    { name: "Received", description: "Package Received" },
  ];

  for (const s of status) {
    const existingStatus = await prisma.status.findUnique({
      where: { name: s.name },
    });

    if (!existingStatus) {
      await prisma.status.create({ data: s });
    }
  }

  const team = [
    {
      name: "Administrasi",
      email: "admin@gmail.com",
      password: bcrypt.hashSync("admin", 10), // Fix bcrypt issue
      pin: "1234",
      role: "admin",
      department: "Default Department",
      status: "active",
    },
    {
      name: "User1",
      email: "user@gmail.com",
      password: bcrypt.hashSync("admin", 10), // Fix bcrypt issue
      pin: "1234",
      role: "user",
      department: "Default Department",
      status: "active",
    },
  ];

  for (const t of team) {
    await prisma.team.upsert({
      where: { email: t.email },
      update: {},
      create: t,
    });
  }

  const permissions = [
    {
      name: "view_dashboard",
      description: "View dashboard"
    },
    {
      name: "manage_users",
      description: "Manage users"
    },
    {
      name: "edit_settings",
      description: "Edit settings"
    },
    {
      name: "view_reports",
      description: "View reports"
    },

  ];

  for (const p of permissions) {
    const permission = await prisma.permission.findFirst({
      where: { name: p.name },
    })

    if(!permission) {
      await prisma.permission.create({data: p});
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

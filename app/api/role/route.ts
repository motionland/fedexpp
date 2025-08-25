import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs"

export async function GET() {
  const roles = await prisma.role.findMany({
    include: {
        permissions: true,
    },
  });

  return NextResponse.json(roles);
}

export async function POST(req: Request) {
  
  const { name } = await req.json();

  const role = await prisma.role.create({
    data: {
      name
    },
  });

  return NextResponse.json(role);
}

export async function PUT(req: Request) {
  const { id, permissions } = await req.json();

  const role = await prisma.role.update({
    where: { id: parseInt(id) },
    data: {
      permissions: {
        set: permissions.map((permissionId: number) => ({ id: permissionId })),
      },
    },
    include: {
      permissions: true,
    },
  });


  return NextResponse.json(role);
}

export async function DELETE(req: Request) {
  const { id } = await req.json();

  await prisma.role.delete({
    where: { id: parseInt(id) },
  });

  return NextResponse.json({ success: true });
}

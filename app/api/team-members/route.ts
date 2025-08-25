import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs"

export async function GET() {
  const teams = await prisma.team.findMany();

  return NextResponse.json(teams);
}

export async function POST(req: Request) {
  
  const defaultPassword = "Password@123";
  const defaultStatus = "active";
  const defaultDepartment = "Default Department";
  const hashedPassword = await bcrypt.hash(defaultPassword, 10);
  const { name, email, pin, role, department, status, password } = await req.json();

  const team = await prisma.team.create({
    data: {
      name,
      email,
      pin,
      role,
      department: department || defaultDepartment,
      status: status || defaultStatus,
      password: password || hashedPassword,
    },
  });

  return NextResponse.json(team);
}

export async function PUT(req: Request) {
  const { id, name, email, pin, role, department, status } = await req.json();

  const team = await prisma.team.update({
    where: { id: parseInt(id) },
    data: { name, email, pin, role, department, status },
  });

  return NextResponse.json(team);
}

export async function DELETE(req: Request) {
  const { id } = await req.json();

  await prisma.team.delete({
    where: { id: parseInt(id) },
  });

  return NextResponse.json({ success: true });
}

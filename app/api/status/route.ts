import prisma from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"


export async function GET() {
  try {
    const status = await prisma.status.findMany()
    
    return NextResponse.json(status, {status: 200})
  } catch (error) {
    return NextResponse.json({message: 'Error get status', error }, { status: 500})
  }
}

export async function POST(req:NextRequest) {
  try {
    const {name} = await req.json()

    const existingStatus = await prisma.status.findUnique({
      where: { name },
    });

    if (existingStatus) {
      return NextResponse.json(
        { message: 'Status already exists', existingStatus },
        { status: 400 }
      );
    }

    const description = name === "Received" ? `Package ${name.toLowerCase()}` : `Package is ${name.toLowerCase()}`

    const statusPost = await prisma.status.create({
      data: {
        name,
        description
      }
    })

    return NextResponse.json({message: 'Status post successfully', statusPost }, { status: 201})
  } catch (error: any) {
    return NextResponse.json({message: 'Error post status', error: error.message }, { status: 500})
  }
}

export async function PUT(req: Request) {
  const { id, name } = await req.json();
  const description = name === "Received" ? `Package ${name.toLowerCase()}` : `Package is ${name.toLowerCase()}`

  try {
    const status = await prisma.status.update({
      where: { id: parseInt(id) },
      data: { name, description },
    });
  
    return NextResponse.json({message: 'Update status successfully', status }, { status: 200})
  } catch (error) {
    return NextResponse.json({message: 'Error update status', error }, { status: 500})
  }
}

export async function DELETE(req: NextRequest ){
  try {
    const { id } = await req.json();
    const statusId = Number(id)
    if (isNaN(statusId)) {
      return NextResponse.json({ message: 'Invalid status ID'}, { status: 400 })
    }

    const deletedStatus = await prisma.status.delete({
      where: {id: statusId}
    }) 

    return NextResponse.json({message: 'Status deleted successfully', deletedStatus }, { status: 200})
  } catch (error: any) {
    return NextResponse.json({message: 'Error deleted status', error: error.message }, { status: 500})
  }
}

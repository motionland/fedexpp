import { NextResponse } from "next/server";
import minioClient from "@/lib/minio";
import prisma from "@/lib/prisma";

// export async function POST(req: Request) {
//   try {
//     const contentType = req.headers.get("content-type");
//     if (!contentType || !contentType.includes("multipart/form-data")) {
//       return NextResponse.json({ message: "Invalid content type" }, { status: 400 });
//     }

//     const formData = await req.formData();
//     const files = formData.getAll("file") as File[] | null;
//     const trackingId = formData.get("trackingId") as string | null;

//     if (!files || files.length === 0) {
//       return NextResponse.json({ message: "No files uploaded" }, { status: 400 });
//     }

//     const validMimeTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
//     const uploadDir = path.join(process.cwd(), "public/upload");

//     if (!fs.existsSync(uploadDir)) {
//       fs.mkdirSync(uploadDir, { recursive: true });
//     }

//     const uploadedImages = [];

//     for (const file of files) {
//       if (!validMimeTypes.includes(file.type)) {
//         return NextResponse.json({ message: "Invalid file type" }, { status: 400 });
//       }

//       const arrayBuffer = await file.arrayBuffer();
//       const buffer = Buffer.from(arrayBuffer);
//       const fileName = `${Date.now()}-${file.name}`;
//       const filePath = path.join(uploadDir, fileName);

//       fs.writeFileSync(filePath, buffer);

//       const image = await prisma.image.create({
//         data: {
//           url: `/upload/${fileName}`,
//           trackingId: trackingId && !isNaN(Number(trackingId)) ? Number(trackingId) : null,
//         },
//       });

//       uploadedImages.push({
//         imageUrl: image.url,
//         trackingId: image.trackingId ?? null,
//       });
//     }

//     return NextResponse.json({
//       message: `Files saved successfully`,
//       images: uploadedImages,
//     });
//   } catch (error) {
//     console.error("Error saving files:", error);
//     return NextResponse.json({ message: "Error saving files", error }, { status: 500 });
//   }
// }

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type");
    if (!contentType || !contentType.includes("multipart/form-data")) {
      return NextResponse.json({ message: "Invalid content type" }, { status: 400 });
    }

    const formData = await req.formData();
    const files = formData.getAll("file") as File[] | null;
    const trackingId = formData.get("trackingId") as string | null;

    if (!files || files.length === 0) {
      return NextResponse.json({ message: "No files uploaded" }, { status: 400 });
    }

    const validMimeTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    const uploadedImages = [];

    for (const file of files) {
      if (!validMimeTypes.includes(file.type)) {
        return NextResponse.json({ message: "Invalid file type" }, { status: 400 });
      }

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const fileName = `${Date.now()}-${file.name}`;
      const bucketName = process.env.MINIO_BUCKET_NAME!;

      const bucketExists = await minioClient.bucketExists(bucketName).catch(() => false);
      if (!bucketExists) {
        await minioClient.makeBucket(bucketName, "us-east-1");
      }

      await minioClient.putObject(bucketName, fileName, buffer);
      
      const image = await prisma.image.create({
        data: {
          url: fileName,
          trackingId: trackingId && !isNaN(Number(trackingId)) ? Number(trackingId) : null,
        },
      });

      uploadedImages.push({
        imageUrl: image.url,
        trackingId: image.trackingId ?? null,
      });
    }

    return NextResponse.json({
      message: `Files uploaded successfully`,
      images: uploadedImages,
    });
  } catch (error) {
    console.error("Error uploading files:", error);
    return NextResponse.json({ message: "Error uploading files", error }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try { 
    const {id, fileName} = await req.json();
  
    const bucketName = process.env.MINIO_BUCKET_NAME!;
  
    await minioClient.removeObject(bucketName, fileName);
    await prisma.image.delete({ where: { id } });

    return NextResponse.json({success: id}, {status: 200});
  } catch(error) {
    console.error("error deleting file:", error);
    return NextResponse.json({message: "Error deleting files"}, {status: 500});
  }
}
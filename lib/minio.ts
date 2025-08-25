import { Client } from "minio";

const minioClient = new Client({
  endPoint: process.env.MINIO_ENDPOINT!.replace(/^https?:\/\//, ""),
  port: parseInt(process.env.MINIO_PORT!, 10),
  useSSL: process.env.MINIO_USE_SSL === "false",
  accessKey: process.env.MINIO_ACCESS_KEY!,
  secretKey: process.env.MINIO_SECRET_KEY!,
});

export default minioClient;

export async function getObjectLink(objectName: string) {
  const bucketName = process.env.MINIO_BUCKET_NAME || "your-bucket-name-unset";
  const method = "GET";
  const time = 24 * 60 * 60; // 1 day

  try {
    const preDesignUrl = await minioClient.presignedUrl(
      method,
      bucketName,
      objectName,
      time,
      {
        "Content-Type": "image/webp",
        "response-content-type": "image/webp",
      }
    );
    return preDesignUrl;
  } catch (e) {
    console.log(e);
  }
}

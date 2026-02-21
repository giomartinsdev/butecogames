import { randomUUID } from "node:crypto";
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { env } from "../config/env.js";

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  },
});

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const DOWNLOAD_TIMEOUT = 10_000; // 10s

const CONTENT_TYPE_TO_EXT: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

function r2KeyFromUrl(publicUrl: string): string | null {
  const prefix = env.R2_PUBLIC_URL + "/";
  if (publicUrl.startsWith(prefix)) return publicUrl.slice(prefix.length);
  return null;
}

/**
 * Deletes an image from R2 by its public URL.
 */
export async function deleteR2Image(publicUrl: string): Promise<void> {
  const key = r2KeyFromUrl(publicUrl);
  if (!key) return;
  try {
    await s3.send(new DeleteObjectCommand({ Bucket: env.R2_BUCKET_NAME, Key: key }));
  } catch (err) {
    console.error("[Image Download] Failed to delete R2 object:", key, err);
  }
}

/**
 * Downloads an image from a URL and uploads it to R2.
 * If oldImageUrl is provided, deletes the old image first to prevent dead files.
 * Returns the full public URL for the uploaded image.
 */
export async function downloadEventImage(
  eventId: string,
  imageUrl: string,
  oldImageUrl?: string | null
): Promise<string> {
  const response = await fetch(imageUrl, {
    signal: AbortSignal.timeout(DOWNLOAD_TIMEOUT),
  });

  if (!response.ok) {
    throw new Error(`Failed to download image: HTTP ${response.status}`);
  }

  const contentType = response.headers.get("content-type")?.split(";")[0]?.trim();
  if (!contentType || !contentType.startsWith("image/")) {
    throw new Error(`Invalid content type: ${contentType}`);
  }

  const contentLength = response.headers.get("content-length");
  if (contentLength && parseInt(contentLength) > MAX_IMAGE_SIZE) {
    throw new Error(`Image too large: ${contentLength} bytes (max ${MAX_IMAGE_SIZE})`);
  }

  const buffer = await response.arrayBuffer();
  if (buffer.byteLength > MAX_IMAGE_SIZE) {
    throw new Error(`Image too large: ${buffer.byteLength} bytes (max ${MAX_IMAGE_SIZE})`);
  }

  // Delete old image from R2 before uploading new one
  if (oldImageUrl) {
    await deleteR2Image(oldImageUrl);
  }

  const ext = CONTENT_TYPE_TO_EXT[contentType] || ".png";
  const filename = `${randomUUID()}${ext}`;
  const key = `events/${eventId}/${filename}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: env.R2_BUCKET_NAME,
      Key: key,
      Body: Buffer.from(buffer),
      ContentType: contentType,
    })
  );

  return `${env.R2_PUBLIC_URL}/${key}`;
}

import sharp from 'sharp';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const BREAKPOINTS = [320, 640, 960, 1280];

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY!,
    secretAccessKey: process.env.R2_SECRET_KEY!,
  },
});

const R2_BUCKET = process.env.R2_BUCKET || 'knockodds-media';
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || 'https://media.knockodds.com';

export interface ProcessedImage {
  original: string;
  webp: Record<number, string>;
  avif: Record<number, string>;
  blur: string;
  width: number;
  height: number;
}

async function uploadToCDN(buffer: Buffer, key: string, contentType: string): Promise<string> {
  await r2.send(new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    CacheControl: 'public, max-age=31536000, immutable',
  }));
  return `${R2_PUBLIC_URL}/${key}`;
}

export async function processImage(inputBuffer: Buffer, outputPrefix: string): Promise<ProcessedImage> {
  const metadata = await sharp(inputBuffer).metadata();
  const result: ProcessedImage = {
    original: '',
    webp: {},
    avif: {},
    blur: '',
    width: metadata.width!,
    height: metadata.height!,
  };

  // Generate blur placeholder (tiny base64)
  const blurBuffer = await sharp(inputBuffer)
    .resize(20)
    .blur(10)
    .webp({ quality: 20 })
    .toBuffer();
  result.blur = `data:image/webp;base64,${blurBuffer.toString('base64')}`;

  // Upload original as WebP
  const originalWebp = await sharp(inputBuffer).webp({ quality: 85 }).toBuffer();
  result.original = await uploadToCDN(originalWebp, `${outputPrefix}-original.webp`, 'image/webp');

  // Generate responsive sizes
  for (const w of BREAKPOINTS) {
    if (w > metadata.width!) continue;

    const resized = sharp(inputBuffer).resize(w);

    const webpBuffer = await resized.clone().webp({ quality: 80 }).toBuffer();
    result.webp[w] = await uploadToCDN(webpBuffer, `${outputPrefix}-${w}.webp`, 'image/webp');

    const avifBuffer = await resized.clone().avif({ quality: 65 }).toBuffer();
    result.avif[w] = await uploadToCDN(avifBuffer, `${outputPrefix}-${w}.avif`, 'image/avif');
  }

  return result;
}

export async function downloadImage(url: string): Promise<Buffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download image: ${res.status}`);
  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export async function processFromUrl(imageUrl: string, outputPrefix: string): Promise<ProcessedImage> {
  const buffer = await downloadImage(imageUrl);
  return processImage(buffer, outputPrefix);
}

export function buildSrcSet(processed: ProcessedImage, format: 'webp' | 'avif' = 'webp'): string {
  const images = format === 'webp' ? processed.webp : processed.avif;
  return Object.entries(images)
    .map(([w, url]) => `${url} ${w}w`)
    .join(', ');
}

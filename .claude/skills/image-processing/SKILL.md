---
name: image-processing
description: Use when processing, resizing, converting, or optimizing images for the MMA platform, including fighter photos, event banners, and OG images
---

# Image Processing Pipeline

## Overview

Sharp-based pipeline: download → resize breakpoints → WebP/AVIF → blur placeholder → CDN upload → srcset URLs.

## Pipeline

```typescript
import sharp from 'sharp';
const BREAKPOINTS = [320, 640, 960, 1280];

async function processImage(buffer: Buffer, prefix: string) {
  const meta = await sharp(buffer).metadata();
  // Blur placeholder
  const blur = await sharp(buffer).resize(20).blur(10).webp({ quality: 20 }).toBuffer();
  const blurDataURL = `data:image/webp;base64,${blur.toString('base64')}`;
  // Responsive sizes
  for (const w of BREAKPOINTS) {
    if (w > meta.width!) continue;
    await sharp(buffer).resize(w).webp({ quality: 80 }).toBuffer(); // → upload CDN
    await sharp(buffer).resize(w).avif({ quality: 65 }).toBuffer(); // → upload CDN
  }
}
```

## CDN Upload (Cloudflare R2)

```typescript
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: process.env.R2_ACCESS_KEY!, secretAccessKey: process.env.R2_SECRET_KEY! }
});
```

## Image Requirements

| Context | Min Width | Ratio | Format |
|---|---|---|---|
| Fighter photo | 400px | 1:1 | WebP |
| Fight banner | 1200px | 16:9 | WebP |
| OG image | 1200px | 1200x630 | PNG |
| News thumbnail | 640px | 16:9 | WebP |
| Google Discover | 1200px | any | WebP |

## Next.js Usage

```tsx
<Image src={url} alt={alt} width={400} height={400}
  placeholder="blur" blurDataURL={blurData}
  sizes="(max-width: 640px) 100vw, 400px" loading="lazy" />
```

## Common Mistakes

- Missing width/height → CLS shift
- No blur placeholders → poor perceived perf
- Serving JPEG instead of WebP → wasted bandwidth
- OG images < 1200px → poor social sharing
- Missing `sizes` attribute → oversized downloads

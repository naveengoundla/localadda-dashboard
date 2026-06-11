/**
 * Client-side image compression before R2 upload.
 * Downscales to maxDim (longest edge) and re-encodes as JPEG.
 * A 12MB phone photo becomes a ~200-400KB upload.
 * Returns the original file untouched if it's already small,
 * not an image, or if anything goes wrong (never blocks an upload).
 */
export async function compressImage(
  file: File,
  maxDim = 1600,
  quality = 0.82,
): Promise<{ blob: Blob; ext: string; contentType: string }> {
  const passthrough = {
    blob: file as Blob,
    ext: file.name.split('.').pop()?.toLowerCase() || 'jpg',
    contentType: file.type || 'image/jpeg',
  };

  if (!file.type.startsWith('image/') || file.type === 'image/gif') return passthrough;

  try {
    const bitmap = await createImageBitmap(file);
    const { width, height } = bitmap;
    const scale = Math.min(1, maxDim / Math.max(width, height));

    // Already small and reasonably sized on disk — skip re-encoding
    if (scale === 1 && file.size < 500 * 1024) {
      bitmap.close();
      return passthrough;
    }

    const canvas = document.createElement('canvas');
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      bitmap.close();
      return passthrough;
    }
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', quality),
    );
    if (!blob || blob.size >= file.size) return passthrough;

    return { blob, ext: 'jpg', contentType: 'image/jpeg' };
  } catch {
    return passthrough;
  }
}

const FALLBACK_PROJECT_IMAGE = '/meta/projects.png';

/** Keeps malformed CMS image values from reaching next/image's URL parser. */
export function getSafeProjectImage(value: string | undefined | null): string {
  const image = value?.trim();
  if (!image) return FALLBACK_PROJECT_IMAGE;
  if (
    /^data:image\/(?:png|jpeg|webp|gif);base64,[a-z0-9+/]+=*$/i.test(image) &&
    image.length <= 1_400_000
  ) {
    return image;
  }
  if (image.startsWith('/') && !image.startsWith('//')) return image;

  try {
    const url = new URL(image);
    return url.protocol === 'https:' || url.protocol === 'http:'
      ? image
      : FALLBACK_PROJECT_IMAGE;
  } catch {
    return FALLBACK_PROJECT_IMAGE;
  }
}

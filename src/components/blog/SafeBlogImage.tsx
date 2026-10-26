'use client';

import Image, { ImageProps } from 'next/image';
import React, { useState } from 'react';

import { cn } from '@/lib/utils';

interface SafeBlogImageProps extends Omit<ImageProps, 'onError'> {
  fallbackSrc?: string;
}

export function SafeBlogImage({
  src,
  alt,
  className,
  fallbackSrc = '/meta/blogs.png',
  ...props
}: SafeBlogImageProps) {
  const [imgSrc, setImgSrc] = useState<string>(
    typeof src === 'string' && src.trim().length > 0 ? src : fallbackSrc,
  );
  const [hasError, setHasError] = useState(false);

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      setImgSrc(fallbackSrc);
    }
  };

  // If the source is an external URL, bypass optimization if host not verified
  const isExternal = typeof imgSrc === 'string' && imgSrc.startsWith('http');

  return (
    <Image
      src={imgSrc}
      alt={alt || 'Blog post cover'}
      className={cn('transition-opacity duration-300', className)}
      onError={handleError}
      unoptimized={isExternal || hasError}
      {...props}
    />
  );
}

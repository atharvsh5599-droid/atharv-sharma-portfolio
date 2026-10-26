import Container from '@/components/common/Container';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { generateMetadata as getMetadata } from '@/config/Meta';
import { resumeConfig } from '@/config/Resume';
import { Metadata } from 'next';
import Link from 'next/link';
import React from 'react';

export const metadata: Metadata = {
  ...getMetadata('/resume'),
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function ResumePage() {
  return (
    <Container className="py-16">
      <div className="space-y-8">
        <div className="space-y-4 text-center">
          <h1 className="text-4xl font-bold tracking-tight lg:text-5xl">
            Resume
          </h1>
          <p className="text-muted-foreground mx-auto max-w-2xl text-lg">
            View or download my resume.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild variant="outline">
              <Link href={resumeConfig.resumeUrl} target="_blank" rel="noreferrer">
                Open Resume
              </Link>
            </Button>
            <Button asChild>
              <a href={resumeConfig.resumeUrl} download="Atharv_Resume.pdf">
                Download Resume
              </a>
            </Button>
          </div>
        </div>
        <Separator />
        <div className="mx-auto max-w-4xl">
          <iframe
            src={resumeConfig.resumeUrl}
            title="Atharv Sharma resume"
            className="min-h-[75vh] w-full rounded-md border"
          />
        </div>
      </div>
    </Container>
  );
}

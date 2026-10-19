import Container from '@/components/common/Container';
import ContactForm from '@/components/contact/ContactForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { contactConfig } from '@/config/Contact';
import { generateMetadata as getMetadata } from '@/config/Meta';
import { Github, Linkedin, Mail, MapPin, MessageSquare, Timer } from 'lucide-react';
import { Metadata } from 'next';
import Link from 'next/link';
import React from 'react';

export const metadata: Metadata = {
  ...getMetadata('/contact'),
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

export default function ContactPage() {
  return (
    <Container className="py-16">
      <div className="space-y-8">
        {/* Header */}
        <div className="space-y-4 text-center">
          <h1 className="text-4xl font-bold tracking-tight lg:text-5xl">
            {contactConfig.title}
          </h1>
          <p className="text-muted-foreground mx-auto max-w-2xl text-lg">
            {contactConfig.description}
          </p>
        </div>
        <Separator />

        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div className="space-y-4">
            <Card className="rounded-lg">
              <CardContent className="space-y-5 p-6">
                <div>
                  <h2 className="text-xl font-semibold">Contact directly</h2>
                  <p className="text-muted-foreground mt-1 text-sm">
                    Best for recruiters, collaborators, and project inquiries.
                  </p>
                </div>

                <div className="space-y-3">
                  <Button asChild className="w-full justify-start">
                    <Link href={`mailto:${contactConfig.email}`}>
                      <Mail className="mr-2 h-4 w-4" />
                      {contactConfig.email}
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full justify-start">
                    <Link href={contactConfig.linkedin} target="_blank" rel="noreferrer">
                      <Linkedin className="mr-2 h-4 w-4" />
                      LinkedIn
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full justify-start">
                    <Link href={contactConfig.github} target="_blank" rel="noreferrer">
                      <Github className="mr-2 h-4 w-4" />
                      GitHub
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full justify-start">
                    <Link href={contactConfig.geeksforgeeks} target="_blank" rel="noreferrer">
                      <span className="mr-2 font-bold">GfG</span>
                      GeeksforGeeks
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-lg">
              <CardContent className="space-y-4 p-6 text-sm">
                <div className="flex gap-3">
                  <MessageSquare className="text-muted-foreground mt-0.5 h-4 w-4" />
                  <p>{contactConfig.availability}</p>
                </div>
                <div className="flex gap-3">
                  <Timer className="text-muted-foreground mt-0.5 h-4 w-4" />
                  <p>{contactConfig.responseTime}</p>
                </div>
                <div className="flex gap-3">
                  <MapPin className="text-muted-foreground mt-0.5 h-4 w-4" />
                  <p>{contactConfig.location}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <ContactForm />
        </div>
      </div>
    </Container>
  );
}

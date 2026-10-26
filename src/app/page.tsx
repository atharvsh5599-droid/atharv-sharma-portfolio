import React from 'react';

import Container from '@/components/common/Container';
import About from '@/components/landing/About';
import CTA from '@/components/landing/CTA';
import CodingProfiles from '@/components/landing/CodingProfiles';
import Experience from '@/components/landing/Experience';
import GeeksforGeeks from '@/components/landing/GeeksforGeeks';
import Github from '@/components/landing/Github';
import Hero from '@/components/landing/Hero';
import Journey from '@/components/landing/Journey';
import Learning from '@/components/landing/Learning';
import Work from '@/components/landing/Projects';

export default function page() {
  return (
    <Container className="min-h-screen py-16">
      <Hero />
      <Experience />
      <Work />
      <About />
      <Learning />
      <CodingProfiles />
      <Github />
      <GeeksforGeeks />
      <CTA />
      <Journey />
    </Container>
  );
}

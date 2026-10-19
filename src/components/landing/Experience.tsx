import { about } from '@/config/About';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarDays, GraduationCap, Trophy } from 'lucide-react';
import React from 'react';

import Container from '../common/Container';
import SectionHeading from '../common/SectionHeading';

export default function Experience() {
  return (
    <Container className="mt-20">
      <SectionHeading subHeading="Background" heading="Education & Participation" />
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center gap-3">
            <span className="bg-muted rounded-md p-2">
              <GraduationCap className="size-5" aria-hidden="true" />
            </span>
            <CardTitle>Education</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="font-medium">{about.education.degree}</p>
            <p className="text-muted-foreground text-sm">
              School: {about.education.school}
            </p>
            <p className="text-muted-foreground flex items-center gap-2 text-sm">
              <CalendarDays className="size-4" aria-hidden="true" />
              Expected graduation: {about.education.graduationYear}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-3">
            <span className="bg-muted rounded-md p-2">
              <Trophy className="size-5" aria-hidden="true" />
            </span>
            <CardTitle>Smart India Hackathon</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium">Participant</p>
            <p className="text-muted-foreground mt-2 text-sm">
              Took part in SIH as a learning and problem-solving experience.
            </p>
          </CardContent>
        </Card>
      </div>
    </Container>
  );
}

import Container from '@/components/common/Container';
import SectionHeading from '@/components/common/SectionHeading';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUpRight, Code2, Github } from 'lucide-react';
import Link from 'next/link';

const profiles = [
  {
    title: 'GitHub',
    description: 'Browse my repositories and follow what I build next.',
    href: 'https://github.com/atharvsh5599-droid',
    label: 'Visit GitHub profile',
    icon: Github,
  },
  {
    title: 'GeeksforGeeks',
    description: 'Find my coding profile and problem-solving activity.',
    href: 'https://www.geeksforgeeks.org/profile/as9817467007',
    label: 'Visit GeeksforGeeks profile',
    icon: Code2,
  },
];

export default function CodingProfiles() {
  return (
    <Container className="mt-20">
      <SectionHeading subHeading="Find Me Online" heading="Coding Profiles" />
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {profiles.map((profile) => {
          const Icon = profile.icon;

          return (
            <Link
              key={profile.title}
              href={profile.href}
              target="_blank"
              rel="noreferrer"
              aria-label={profile.label}
              className="group rounded-xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <Card className="h-full transition-colors group-hover:bg-muted/50">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="bg-muted rounded-md p-2">
                      <Icon className="size-5" aria-hidden="true" />
                    </span>
                    <CardTitle>{profile.title}</CardTitle>
                  </div>
                  <ArrowUpRight className="text-muted-foreground size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
                </CardHeader>
                <CardContent className="text-muted-foreground text-sm">
                  {profile.description}
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </Container>
  );
}

import Container from '@/components/common/Container';
import SectionHeading from '@/components/common/SectionHeading';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const learningAreas = [
  {
    title: 'Programming',
    items: ['C++', 'Python'],
  },
  {
    title: 'Problem Solving',
    items: ['Data Structures', 'Algorithms', 'Coding practice'],
  },
  {
    title: 'Python Libraries',
    items: ['NumPy', 'Pandas'],
  },
  {
    title: 'Web Foundations',
    items: ['HTML', 'CSS'],
  },
];

const exploring = [
  'Advanced Data Structures and Algorithms using C++',
  'Full-Stack Web Development',
  'Artificial Intelligence and Machine Learning',
  'Python and its ecosystem',
];

export default function Learning() {
  return (
    <Container className="mt-20">
      <SectionHeading subHeading="Skills & Growth" heading="Currently Exploring" />
      <p className="text-muted-foreground mt-3 max-w-3xl">
        I&apos;m building strong fundamentals through consistent practice and
        exploring new areas step by step.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {learningAreas.map((area) => (
          <Card key={area.title} className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{area.title}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {area.items.map((item) => (
                <Badge key={item} variant="secondary">
                  {item}
                </Badge>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      <ul className="text-muted-foreground mt-6 grid gap-2 sm:grid-cols-2">
        {exploring.map((item) => (
          <li key={item} className="rounded-md border border-dashed px-4 py-3">
            {item}
          </li>
        ))}
      </ul>
    </Container>
  );
}

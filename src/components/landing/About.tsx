import { about, mySkills } from '@/config/About';
import React from 'react';

import Container from '../common/Container';
import SectionHeading from '../common/SectionHeading';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';

export default function About() {
  return (
    <Container className="mt-20">
      <SectionHeading subHeading="About" heading="Me" />
      {/* About me */}
      <div className="mt-8 flex flex-col gap-4 md:flex-row">
        <div className="mt-4">
          <h3 className="text-2xl font-bold">{about.name}</h3>
          <p className="text-secondary mt-4">{about.description}</p>
          <p className="text-secondary mt-4">
            I&apos;m pursuing a {about.education.degree}, with expected graduation in {about.education.graduationYear}. I attended {about.education.school}.
          </p>
          <p className="text-secondary mt-8 font-bold">Skills &amp; Foundations</p>
          <p className="text-secondary mt-2">C++, Python, Data Structures, Algorithms, Problem Solving, NumPy, Pandas, HTML, and CSS.</p>
          <div className="flex flex-wrap gap-2">
            {mySkills.map((skill) => (
              <Tooltip key={skill.key}>
                <TooltipTrigger asChild>
                  <div className="mt-4 size-6 hover:cursor-pointer">
                    {skill}
                  </div>
                </TooltipTrigger>
                <TooltipContent>{skill.key}</TooltipContent>
              </Tooltip>
            ))}
          </div>
          <p className="text-secondary mt-8 font-bold">Currently Exploring</p>
          <p className="text-secondary mt-2">Advanced DSA with C++, Full-Stack Web Development, AI/ML, and Python and its ecosystem.</p>
        </div>
      </div>
    </Container>
  );
}

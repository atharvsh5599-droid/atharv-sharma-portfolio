import { about } from '@/config/About';
import { certificates } from '@/config/Achievements';
import { contactConfig } from '@/config/Contact';
import { experiences } from '@/config/Experience';
import { heroConfig, socialLinks } from '@/config/Hero';
import { projects } from '@/config/Projects';

function includesAny(text: string, keywords: string[]) {
  return keywords.some((keyword) => text.includes(keyword));
}

function projectLink(project: (typeof projects)[number]) {
  return project.github ?? project.live ?? project.link;
}

function projectTech(project: (typeof projects)[number]) {
  return project.technologies.map((technology) => technology.name).join(', ');
}

function formatProject(project: (typeof projects)[number]) {
  return `- **${project.title}**: ${project.description} Tech: ${projectTech(
    project,
  )}. [Link](${projectLink(project)})`;
}

function getRelevantProjects(message: string) {
  const lower = message.toLowerCase();
  const ignoredWords = new Set([
    'project',
    'projects',
    'main',
    'show',
    'built',
    'using',
    'with',
    'tech',
  ]);

  return projects.filter((project) => {
    const title = project.title.toLowerCase();
    const description = project.description.toLowerCase();
    const technologies = project.technologies
      .map((technology) => technology.name.toLowerCase())
      .join(' ');

    return [...title.split(/\s+/), ...technologies.split(/\s+/)]
      .filter((word) => word.length > 2 && !ignoredWords.has(word))
      .some(
        (word) =>
          lower.includes(word) ||
          (word.length > 4 && description.includes(word) && lower.includes(word)),
      );
  });
}

export function getPortfolioKnowledgeContext() {
  const skills = heroConfig.skills.map((skill) => skill.name).join(', ');
  const education = `${about.education.degree}, expected graduation ${about.education.graduationYear}; school: ${about.education.school}`;
  const experienceText = experiences
    .map(
      (experience) =>
        `${experience.position} at ${experience.company}, ${experience.location} (${experience.startDate} - ${experience.endDate}): ${experience.description.join(
          ' ',
        )}`,
    )
    .join('\n- ');
  const projectText = projects
    .map(
      (project) =>
        `${project.title}: ${project.description} Tech: ${projectTech(
          project,
        )}. Link: ${projectLink(project)}`,
    )
    .join('\n- ');
  const certificateText = certificates
    .map(
      (certificate) =>
        `${certificate.title} - ${certificate.issuer} (${certificate.date})`,
    )
    .join('\n- ');
  const socialLinksText = socialLinks
    .map((link) => `${link.name}: ${link.href}`)
    .join('\n- ');

  return [
    `NAME: ${about.name}`,
    `TITLE: ${heroConfig.title}`,
    `ABOUT: ${about.description}`,
    `EDUCATION: ${education}`,
    `SKILLS: ${skills}`,
    `LOCATION: ${contactConfig.location}`,
    `AVAILABILITY: ${contactConfig.availability}`,
    `RESPONSE TIME: ${contactConfig.responseTime}`,
    `EXPERIENCE: ${experienceText || 'No employment history has been provided.'}`,
    `PROJECTS: ${projectText || 'No verified projects have been provided yet.'}`,
    `CERTIFICATES: ${certificateText || 'No certificates have been provided.'}`,
    `SOCIAL LINKS:\n- ${socialLinksText}`,
  ].join('\n\n');
}

export function getPortfolioFallback(message: string) {
  const lower = message.toLowerCase();
  const skills = heroConfig.skills.map((skill) => skill.name).join(', ');
  const email = socialLinks.find((link) => link.name === 'Email')?.href ?? '';
  const github = socialLinks.find((link) => link.name === 'Github')?.href ?? '';
  const linkedIn =
    socialLinks.find((link) => link.name === 'LinkedIn')?.href ?? '';

  if (
    includesAny(lower, [
      'project',
      'projects',
      'github',
      'repo',
      'built',
      'portfolio',
    ])
  ) {
    const relevantProjects = getRelevantProjects(lower);
    const selectedProjects =
      relevantProjects.length > 0 ? relevantProjects : projects;

    return [
      selectedProjects.length > 0
        ? `${relevantProjects.length > 0 ? 'Relevant projects:' : 'My projects include:'}\n${selectedProjects.map(formatProject).join('\n')}`
        : "I'm currently building my portfolio and will share projects here soon.",
      `You can also review my GitHub here: [Atharv Sharma](${github}).`,
    ].join('\n\n');
  }

  if (
    includesAny(lower, [
      'everything',
      'overview',
      'summary',
      'about you',
      'about me',
      'who are you',
      'profile',
      'background',
    ])
  ) {
    return [
      `I'm **${about.name}**, an **${heroConfig.title}** based in **${contactConfig.location}**.`,
      `- **Education**: ${about.education.degree}, expected graduation ${about.education.graduationYear}. School: ${about.education.school}.`,
      `- **Core skills**: ${skills}.`,
      '- **Experience**: Participated in Smart India Hackathon (SIH).',
      '- **Current focus**: C++, Data Structures and Algorithms, Python, AI/ML, and Full-Stack Web Development.',
      `- **Availability**: ${contactConfig.availability}.`,
    ].join('\n');
  }

  if (
    includesAny(lower, [
      'skill',
      'tech',
      'stack',
      'ai',
      'ml',
      'machine learning',
      'langchain',
      'python',
      'c++',
      'linux',
      'fastapi',
      'work with',
    ])
  ) {
    return [
      `I am building my programming foundation. Current skills include: **${skills}**.`,
      '- I am strengthening my C++ and Data Structures and Algorithms fundamentals.',
      '- I am exploring Python, NumPy, Pandas, AI/ML, and Full-Stack Web Development.',
    ].join('\n');
  }

  if (
    includesAny(lower, [
      'contact',
      'hire',
      'reach',
      'connect',
      'message',
      'call',
      'email',
      'work together',
      'available',
      'availability',
      'location',
    ])
  ) {
    return [
      `I'm based in **${contactConfig.location}** and **${contactConfig.availability.toLowerCase()}**.`,
      `- **Email**: [${contactConfig.email}](${email})`,
      `- **LinkedIn**: [Atharv Sharma](${linkedIn})`,
      `- **GitHub**: [atharvsh5599-droid](${github})`,
      `- **Response time**: ${contactConfig.responseTime}.`,
      '',
      'For a useful first message, include the role/project, timeline, tech stack, and expected next step.',
    ].join('\n');
  }

  if (
    includesAny(lower, [
      'experience',
      'hackathon',
      'job',
      'intern',
      'training',
      'trainee',
      'work history',
    ])
  ) {
    const experienceList = experiences
      .map(
        (experience) =>
          `- **${experience.position}** at **${experience.company}**, ${experience.location} (${experience.startDate} - ${experience.endDate}): ${experience.description[0]}`,
      )
      .join('\n');

    return experienceList
      ? `My experience:\n${experienceList}`
      : 'I participated in Smart India Hackathon (SIH). I am currently focused on learning and developing my technical foundations.';
  }

  if (
    includesAny(lower, [
      'education',
      'college',
      'university',
      'degree',
      'b.tech',
      'btech',
      'nit',
      'hamirpur',
      'graduation',
    ])
  ) {
    return `I am pursuing **${about.education.degree}**, with expected graduation in **${about.education.graduationYear}**. My school is **${about.education.school}**.`;
  }

  if (
    includesAny(lower, [
      'certificate',
      'certification',
      'achievement',
      'course',
      'bootcamp',
    ])
  ) {
    const certificateList = certificates
      .map(
        (certificate) =>
          `- **${certificate.title}** from ${certificate.issuer} (${certificate.date})`,
      )
      .join('\n');

    return certificateList
      ? `Certificates:\n${certificateList}`
      : 'I participated in Smart India Hackathon (SIH). No certificates have been provided.';
  }

  if (includesAny(lower, ['resume', 'cv'])) {
    return `I am currently building my portfolio. Please contact me at [${contactConfig.email}](mailto:${contactConfig.email}).`;
  }

  return `${about.description} Ask me about my education, skills, current learning, Smart India Hackathon participation, or contact details.`;
}

export function hasPortfolioIntent(message: string) {
  const lower = message.toLowerCase();

  return includesAny(lower, [
    'everything',
    'overview',
    'summary',
    'about you',
    'about me',
    'who are you',
    'profile',
    'background',
    'skill',
    'tech',
    'stack',
    'ai',
    'ml',
    'machine learning',
    'langchain',
    'python',
    'c++',
    'linux',
    'fastapi',
    'work with',
    'project',
    'github',
    'repo',
    'portfolio',
    'built',
    'experience',
    'alstom',
    'sjvn',
    'job',
    'intern',
    'training',
    'trainee',
    'work history',
    'education',
    'college',
    'university',
    'degree',
    'b.tech',
    'btech',
    'nit',
    'hamirpur',
    'graduation',
    'resume',
    'cv',
    'contact',
    'hire',
    'reach',
    'connect',
    'message',
    'call',
    'email',
    'work together',
    'available',
    'availability',
    'location',
    'certificate',
    'certification',
    'achievement',
    'course',
    'bootcamp',
  ]);
}

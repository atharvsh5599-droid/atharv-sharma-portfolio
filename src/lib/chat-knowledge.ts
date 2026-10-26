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
          (word.length > 4 &&
            description.includes(word) &&
            lower.includes(word)),
      );
  });
}

export function getPortfolioKnowledgeContext() {
  const skills =
    'C++, Python, Data Structures, Algorithms, Problem Solving, NumPy, Pandas, HTML, and CSS';
  const education = `${about.education.degree} at ${about.education.college}, expected graduation ${about.education.graduationYear}; school: ${about.education.school}`;
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
    'CURRENTLY EXPLORING: Advanced Data Structures and Algorithms using C++, Full-Stack Web Development, Artificial Intelligence and Machine Learning, and the Python ecosystem.',
    'VERIFIED PARTICIPATION: Participated in Smart India Hackathon (SIH).',
    `LOCATION: ${contactConfig.location}`,
    `AVAILABILITY: ${contactConfig.availability}`,
    `RESPONSE TIME: ${contactConfig.responseTime}`,
    `EXPERIENCE: ${experienceText || 'No employment history has been provided.'}`,
    `PROJECTS: ${projectText || 'No verified projects have been provided yet.'}`,
    `CERTIFICATES: ${certificateText || 'No certificates have been provided.'}`,
    `CODING PROFILE: GeeksforGeeks: ${contactConfig.geeksforgeeks}`,
    `SOCIAL LINKS:\n- ${socialLinksText}`,
  ].join('\n\n');
}

export function getPortfolioFallback(message: string) {
  const lower = message.toLowerCase();
  const skills =
    'C++, Python, Data Structures, Algorithms, Problem Solving, NumPy, Pandas, HTML, and CSS';
  const email = socialLinks.find((link) => link.name === 'Email')?.href ?? '';
  const github = socialLinks.find((link) => link.name === 'Github')?.href ?? '';
  const linkedIn =
    socialLinks.find((link) => link.name === 'LinkedIn')?.href ?? '';

  if (includesAny(lower, ['geeksforgeeks', 'geeks for geeks', 'gfg'])) {
    return `Atharv's GeeksforGeeks profile: [Visit profile](${contactConfig.geeksforgeeks}).`;
  }

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
        : "Atharv hasn't listed verified projects here yet. Check back as he continues building his portfolio.",
      `You can also visit [Atharv's GitHub profile](${github}).`,
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
      `**${about.name}** is an **${heroConfig.title}** based in **${contactConfig.location}**.`,
      `- **Education**: ${about.education.degree} at ${about.education.college}, expected graduation ${about.education.graduationYear}. School: ${about.education.school}.`,
      `- **Core skills**: ${skills}.`,
      '- **Experience**: Participated in Smart India Hackathon (SIH).',
      '- **Current focus**: C++, Data Structures and Algorithms, Python, AI/ML, and Full-Stack Web Development.',
      `- **Current focus**: ${contactConfig.availability}.`,
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
      `Atharv's listed skills and foundations include: **${skills}**.`,
      '- He is strengthening his C++ and Data Structures and Algorithms fundamentals.',
      '- He is exploring Python, NumPy, Pandas, AI/ML, and Full-Stack Web Development.',
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
      `Atharv is based in **${contactConfig.location}** and is **${contactConfig.availability.toLowerCase()}**.`,
      `- **Email**: [${contactConfig.email}](${email})`,
      `- **LinkedIn**: [Atharv Sharma](${linkedIn})`,
      `- **GitHub**: [atharvsh5599-droid](${github})`,
      `- **GeeksforGeeks**: [Visit my profile](${contactConfig.geeksforgeeks})`,
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
      ? `Experience:\n${experienceList}`
      : 'Atharv participated in Smart India Hackathon (SIH) and is currently developing his technical foundations.';
  }

  if (
    includesAny(lower, [
      'education',
      'college',
      'university',
      'degree',
      'b.tech',
      'btech',
      'school',
      'graduating',
      'graduation',
    ])
  ) {
    return `Atharv is pursuing **${about.education.degree}** at **${about.education.college}**, with expected graduation in **${about.education.graduationYear}**. His school is **${about.education.school}**.`;
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
      : 'No certificates have been listed. Atharv participated in Smart India Hackathon (SIH).';
  }

  if (includesAny(lower, ['resume', 'cv'])) {
    return `A resume is not available here yet. Contact Atharv at [${contactConfig.email}](mailto:${contactConfig.email}).`;
  }

  return `${about.description} Ask me about my education, skills, current learning, Smart India Hackathon participation, or contact details.`;
}

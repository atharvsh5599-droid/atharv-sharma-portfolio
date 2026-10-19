/*
 * CUSTOMIZATION EXAMPLE
 *
 * Want to customize this portfolio for yourself? Here's how easy it is:
 *
 * 1. Update your personal info:
 *    name: "Your Name"
 *    title: "Your Professional Title"
 *    avatar: "/path/to/your/image.jpg"
 *
 * 2. Add your skills:
 *    skills: [
 *      { name: "Python", href: "https://python.org", component: "Python" }, // Note: You'd need to create Python component
 *      { name: "React", href: "https://react.dev", component: "ReactIcon" },
 *      { name: "Node.js", href: "https://nodejs.org", component: "NodeJs" },
 *    ]
 *
 * 3. Write your description using the template:
 *    template: "I'm a **passionate developer** who loves building apps with {skills:0} and {skills:1}. I specialize in **web development** and enjoy working with {skills:2}."
 *
 * 4. Update your social links:
 *    Just change the href values to your own social media profiles
 *
 * That's it! Your portfolio will automatically update with your information.
 */
import Github from '@/components/svgs/Github';
import LinkedIn from '@/components/svgs/LinkedIn';
import Mail from '@/components/svgs/Mail';
import CPlusPlus from '@/components/technologies/CPlusPlus';
import FastAPI from '@/components/technologies/FastAPI';
import Linux from '@/components/technologies/Linux';
import MachineLearning from '@/components/technologies/MachineLearning';
import OpenAI from '@/components/technologies/OpenAI';
import Python from '@/components/technologies/Python';
import Html from '@/components/technologies/Html';
import CSS from '@/components/technologies/CSS';
// Technology Components

// Component mapping for skills
export const skillComponents = {
  CPlusPlus: CPlusPlus,
  Python: Python,
  Linux: Linux,
  MachineLearning: MachineLearning,
  OpenAI: OpenAI,
  FastAPI: FastAPI,
  Html: Html,
  CSS: CSS,
};

export const heroConfig = {
  // Personal Information
  name: 'Atharv Sharma',
  title: 'Aspiring Software Developer | C++ & DSA Enthusiast',
  // Skills Configuration
  skills: [
    {
      name: 'C++',
      href: 'https://isocpp.org/',
      component: 'CPlusPlus',
    },
    {
      name: 'Python',
      href: 'https://www.python.org/',
      component: 'Python',
    },
    { name: 'HTML', href: 'https://developer.mozilla.org/en-US/docs/Web/HTML', component: 'Html' },
    { name: 'CSS', href: 'https://developer.mozilla.org/en-US/docs/Web/CSS', component: 'CSS' },
  ],

  // Description Configuration
  description: {
    template:
      "Hi, I'm Atharv Sharma, a passionate learner and aspiring developer with a strong interest in programming, problem-solving, and building software.",
  },

  // Buttons Configuration
  buttons: [
    {
      variant: 'outline',
      text: 'View My Work',
      href: '/projects',
      icon: 'CV',
    },
    {
      variant: 'default',
      text: 'Contact Me',
      href: '/contact',
      icon: 'Chat',
    },
  ],
};

// Social Links Configuration
export const socialLinks = [
  {
    name: 'LinkedIn',
    href: 'https://www.linkedin.com/in/atharv-sharma-1746a1367/',
    icon: <LinkedIn />,
  },
  {
    name: 'Github',
    href: 'https://github.com/atharvsh5599-droid',
    icon: <Github />,
  },
  {
    name: 'Email',
    href: 'mailto:atharv.sh5599@gmail.com',
    icon: <Mail />,
  },
];

# Atharv Sharma — Personal Portfolio

A personal portfolio website for **Atharv Sharma**, a B.Tech student specializing in Computer Science Engineering (AI/ML), aspiring software developer, and C++ & Data Structures and Algorithms enthusiast.

The portfolio showcases my technical skills, education, coding journey, projects, and professional profiles. It also includes an authenticated CMS for drafting and publishing blog posts and project case studies.

## About Me

Hi, I'm **Atharv Sharma**, a passionate learner and aspiring developer with a strong interest in programming, problem-solving, and building software.

I am currently pursuing a B.Tech in Computer Science Engineering with a specialization in Artificial Intelligence and Machine Learning. My current focus is on strengthening my C++ and Data Structures & Algorithms fundamentals while exploring Python, AI/ML, and Full-Stack Web Development.

I enjoy learning new technologies, practicing coding problems, and continuously improving my technical skills.

## Career Focus

This portfolio represents my journey as an aspiring:

- Software Developer
- C++ Programmer
- Data Structures & Algorithms Enthusiast
- Python Learner
- Aspiring AI/ML Engineer
- Full-Stack Web Development Learner

My goal is to strengthen my programming fundamentals, build practical projects, and prepare for software development internships and career opportunities.

## Main Sections

- **Hero:** My introduction, developer tagline, and links to my professional profiles.
- **About Me:** My background, interests, and learning journey.
- **Skills:** C++, Python, Data Structures & Algorithms, NumPy, Pandas, HTML, and CSS.
- **Currently Exploring:** Advanced DSA, Python, AI/ML, and Full-Stack Web Development.
- **Projects:** Published project cards and case studies, managed through the project CMS.
- **Blog:** Technical articles managed through the blog CMS.
- **Admin CMS:** GitHub-authenticated dashboards for drafting, editing, previewing, and publishing content.
- **Education:** My B.Tech in Computer Science Engineering (AI/ML) at Jawaharlal Nehru Government Engineering College, expected graduation in 2029, and schooling at DAV Public School.
- **My Journey:** My learning progress and participation in Smart India Hackathon (SIH).
- **Coding Profiles:** My GeeksforGeeks coding profile.
- **GitHub:** A link to my public GitHub profile and repositories.
- **Contact:** My email address and professional social links.

## Technical Skills

### Programming Languages

- C++
- Python

### Data Structures & Algorithms

- Data Structures
- Algorithms
- Problem Solving

### Python Libraries

- NumPy
- Pandas

### Web Technologies

- HTML
- CSS

### Currently Learning

- Advanced Data Structures & Algorithms
- Full-Stack Web Development
- Artificial Intelligence and Machine Learning
- Python ecosystem and practical development

## Education

**Degree:** B.Tech in Computer Science Engineering (AI/ML)

**College:** Jawaharlal Nehru Government Engineering College

**Expected Graduation:** 2029

**School:** DAV Public School

## Experience & Achievements

I am currently focused on improving my programming skills, practicing Data Structures & Algorithms, exploring new technologies, and building practical software projects.

- Participated in Smart India Hackathon (SIH).

This section will grow as I gain more project experience and participate in additional technical opportunities.

## Coding Profiles & Social Links

- **GitHub:** https://github.com/atharvsh5599-droid
- **LinkedIn:** https://www.linkedin.com/in/atharv-sharma-1746a1367
- **GeeksforGeeks:** https://www.geeksforgeeks.org/profile/as9817467007
- **Email:** atharv.sh5599@gmail.com

## Projects

Project entries are created at **`/admin/projects`** after signing in at **`/admin/login`** with an authorized GitHub account. Save work as a draft or publish it to add it to the public projects page and its `/projects/[slug]` case study page.

Each entry supports a title, URL slug, summary, cover image, technologies, GitHub and live links, timeline, role, team, featured flag, challenges, learnings, and a Markdown case study. Cover images can be uploaded as PNG, JPEG, WebP, or GIF files up to 1 MB, or provided as an image URL. Published project details are also added to the portfolio chatbot's knowledge context.

Project CMS records are stored in Upstash Redis. The existing local MDX project case studies remain supported alongside CMS entries.

## Tech Stack

- Next.js 15 App Router and React 19
- TypeScript and Tailwind CSS 4
- Motion for animation
- MDX for local blog posts and project case studies
- Upstash Redis for blog and project CMS records
- Auth.js with GitHub OAuth and an administrator ID allowlist
- Google Gemini API for the portfolio chatbot (optional)

## Getting Started

Follow these steps to run the project locally.

### Prerequisites

Install [Bun](https://bun.sh/) or Node.js with npm.

### 1. Clone the repository

```bash
git clone https://github.com/atharvsh5599-droid/atharv-sharma-portfolio.git
```

### 2. Navigate to the project folder

```bash
cd atharv-sharma-portfolio
```

### 3. Install dependencies

```bash
bun install
```

Or use `npm install`.

### 4. Configure environment variables

Copy `.env.example` to `.env.local` and fill in the credentials you plan to use:

```bash
cp .env.example .env.local
```

The admin CMS requires:

- `AUTH_SECRET` — generate with `openssl rand -base64 32`.
- `AUTH_GITHUB_ID` and `AUTH_GITHUB_SECRET` — a GitHub OAuth application. Set its local callback URL to `http://localhost:3000/api/auth/callback/github`.
- `ADMIN_GITHUB_ID` — the numeric GitHub user ID allowed to administer the CMS. Additional IDs can be listed in `ADMIN_GITHUB_IDS`.
- `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` — the Upstash Redis database used by blog and project CMS content.

`GEMINI_API_KEY` enables the chatbot's Gemini responses. `NEXT_PUBLIC_URL` should be set to the public site URL when deploying.

### 5. Start the development server

```bash
bun run dev
```

Or use `npm run dev`.

The development server is available at the local URL shown in the terminal, usually `http://localhost:3000`.

### CMS routes

- `/admin/login` — sign in with GitHub.
- `/admin/blog` — manage blog posts.
- `/admin/projects` — manage project case studies.

Admin routes require a valid GitHub OAuth setup and an authorized numeric GitHub ID. Blog and project content management also require Upstash Redis credentials.

## Customization

The portfolio can be updated as my skills and experience grow.

Future improvements may include:

- Adding new software projects.
- Linking additional coding profiles.
- Updating technical skills.
- Showcasing internships and verified achievements.
- Improving project documentation.
- Adding live demos and project screenshots.

Keep personal information, project descriptions, and achievements accurate and up to date.

## Design Goals

- Modern and professional appearance.
- Responsive layout for desktop, tablet, and mobile.
- Clean typography and readable content.
- Smooth animations and subtle interactions.
- Accessible navigation.
- Maintainable and reusable components.
- Fast loading and reliable functionality.

## License

This repository contains the personal portfolio of Atharv Sharma.

Unless a separate license is provided, the repository's code and personal assets remain subject to their applicable copyright and usage terms.

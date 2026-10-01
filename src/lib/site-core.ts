// Small, client-safe slice of site content. Client components import from
// here so they do not pull the whole (huge) site-data module into the browser.

export const company = {
  name: "Ukvalley Technologies",
  shortName: "Ukvalley",
  tagline: "Unlocking Your Business Potential with Custom Software",
  foundedYear: 2017,
  city: "Maharashtra, India",
  email: "sales@ukvalley.com",
  phonePrimary: "+91 97673 76000",
  phoneSecondary: "+91 70200 24201",
  hr: {
    phone: "+91 90282 47051",
    email: "hr@ukvalley.com",
  },
  sales: {
    phone: "+91 90282 47055",
    email: "sales@ukvalley.com",
  },
  // Placeholders — replace with real registered identifiers
  cin: "U72900MH2017PTCXXXXXX",
  gstin: "27ABCDE1234F1Z5",
  udyam: "UDYAM-MH-XX-00-0000000",
};

/**
 * True for a real registration number; false for an empty value or one of the
 * "XXXX"-style placeholders above (they must never be shown as verified).
 */
export function isRealIdentifier(value: string | undefined): value is string {
  const v = (value ?? "").trim();
  return v !== "" && !/XX|ABCDE1234F|0000000/i.test(v);
}

/** Full years since founding — computed so the figure never goes stale. */
export const yearsInBusiness = new Date().getFullYear() - company.foundedYear;

export const heroStats = [
  { value: `${yearsInBusiness}+`, label: "Years building software" },
  { value: "1,550+", label: "Projects shipped" },
  { value: "50+", label: "Production systems live" },
  { value: "24h", label: "Response SLA" },
];

export const processSteps = [
  {
    step: "01",
    title: "Discovery & scoping",
    desc: "A free 30-minute call with a software architect — not a salesperson. We map your goals, constraints and success metrics, then send a written scope with a rough estimate in 3 business days.",
    duration: "Week 1",
    points: [
      "Stakeholder interviews & workflow audit",
      "Written scope + rough estimate in 3 days",
      "Success metrics agreed before any code",
    ],
  },
  {
    step: "02",
    title: "Architecture & prototype",
    desc: "We design the data model, integrations and security posture up front, then ship a thin-slice prototype of the riskiest part — real working software in week 3, not slides.",
    duration: "Week 2–3",
    points: [
      "Architecture & data-model sign-off",
      "Thin-slice prototype of the hardest feature",
      "Stack choice justified in writing",
    ],
  },
  {
    step: "03",
    title: "Build sprints with weekly demos",
    desc: "Two-week sprints with a live demo every Friday. Shared Jira, a dedicated Slack channel and a named architect on every call — you always know what shipped, what's next and what it costs.",
    duration: "Ongoing",
    points: [
      "Working demo every week — no exceptions",
      "Shared Jira + Slack, full visibility",
      "Code review & tests on every merge",
    ],
  },
  {
    step: "04",
    title: "Launch, handoff & support",
    desc: "A load-tested, zero-downtime launch with a rollback plan. You own the code and every credential from day one — backed by a 24-hour response SLA and monthly health reports.",
    duration: "Launch +",
    points: [
      "Load-tested launch with rollback plan",
      "Full code + credential handover, you own it",
      "24-hour SLA & monthly health reports",
    ],
  },
];

export type TechCategory = {
  label: string;
  icon: string;
  items: string[];
  why: string;
};

export const techStack: TechCategory[] = [
  {
    label: "Frontend",
    icon: "monitor",
    items: ["React", "Next.js", "Angular", "Vue.js", "TypeScript", "Tailwind CSS", "Redux"],
    why: "SEO-ready, type-safe interfaces that stay fast under real traffic, built on a shared design system your team can extend without us. It's the difference between a site that ranks and loads in under 2.5 seconds, and one that looks fine in a demo and disappears from search.",
  },
  {
    label: "Mobile",
    icon: "smartphone",
    items: ["Flutter", "Kotlin", "React Native", "Swift"],
    why: "One codebase for Android & iOS with native modules only where the platform demands it, so a feature doesn't ship twice, six weeks apart. It's what lets a small team maintain a polished app on both stores without doubling the engineering headcount.",
  },
  {
    label: "Backend",
    icon: "server",
    items: ["Node.js", "Python", "Django", "Laravel", "PHP", "Java", "GraphQL", "REST"],
    why: "APIs and workflow engines that hold up under real transactional load, with documented contracts your next developer can read without asking us. Designed for the traffic you'll actually have in year two, not the traffic a demo survives.",
  },
  {
    label: "Database",
    icon: "database",
    items: ["MongoDB", "PostgreSQL", "MySQL", "Redis"],
    why: "Data modeled for your access patterns — indexed, backed up and migrated without downtime, because a slow query discovered at 10× scale is a Monday-morning outage, not a benchmark. Every schema decision comes with the reasoning written down.",
  },
  {
    label: "Cloud & Infra",
    icon: "cloud",
    items: ["AWS", "Azure", "Docker", "Terraform", "CI/CD"],
    why: "Infrastructure as code with monitoring, security hardening and 24×7 incident response, so a deploy is routine rather than a hope. Nothing depends on one engineer's memory of how the server was configured three years ago.",
  },
  {
    label: "Testing & QA",
    icon: "flaskConical",
    items: ["Jest", "Playwright", "Cypress", "Selenium", "Postman"],
    why: "Automated unit, e2e and API regression suites — every release ships with proof it works, not a developer's word for it. The suite lives in your repo and keeps protecting releases long after we've moved on.",
  },
];

export type NavLink = { label: string; href: string };

export const nav: {
  services: NavLink[];
  company: NavLink[];
  work: NavLink[];
  solutions: NavLink[];
  hire: NavLink[];
} = {
  services: [
    { label: "Web & Web App Development", href: "/services/web-development" },
    { label: "Mobile App Development", href: "/services/mobile-app-development" },
    { label: "Custom Software · CRM · ERP · HRMS", href: "/services/custom-software" },
    { label: "Cloud & DevOps Engineering", href: "/services/cloud-devops" },
    { label: "Digital Marketing", href: "/services/digital-marketing" },
    { label: "Managed IT · Cloud · Cybersecurity", href: "/services/managed-it" },
    { label: "Blockchain & DeFi Development", href: "/services/blockchain" },
    { label: "Graphic & Brand Design", href: "/services/graphic-design" },
  ],
  company: [
    { label: "About Us", href: "/about" },
    { label: "Our Team", href: "/team" },
    { label: "Process", href: "/process" },
    { label: "Engagement Model", href: "/engagement" },
    { label: "Careers", href: "/careers" },
    { label: "Pricing", href: "/pricing" },
    { label: "Why Ukvalley", href: "/why-ukvalley" },
    { label: "Support & SLA", href: "/support-maintenance" },
    { label: "Locations", href: "/locations" },
    { label: "FAQ", href: "/faq" },
  ],
  work: [
    { label: "Case Studies", href: "/case-studies" },
    { label: "Products", href: "/products" },
    { label: "Industries", href: "/industries" },
    { label: "Tech Stack", href: "/tech-stack" },
    { label: "Client Success", href: "/clients" },
    { label: "Project Rescue", href: "/project-rescue" },
  ],
  solutions: [
    { label: "All Solutions", href: "/solutions" },
    { label: "CRM Systems", href: "/solutions/crm" },
    { label: "ERP Systems", href: "/solutions/erp" },
    { label: "HRMS & Payroll", href: "/solutions/hrms" },
    { label: "Learning Management (LMS)", href: "/solutions/lms" },
    { label: "E-commerce Platforms", href: "/solutions/ecommerce" },
    { label: "Booking & Appointments", href: "/solutions/booking-appointments" },
    { label: "POS Systems", href: "/solutions/pos" },
    { label: "Loan Origination", href: "/solutions/loan-origination" },
    { label: "Healthcare Platforms", href: "/solutions/healthcare" },
    { label: "Logistics & Fleet Tracking", href: "/solutions/logistics-tracking" },
    { label: "Real Estate CRM", href: "/solutions/real-estate-crm" },
    { label: "Food Delivery & Restaurants", href: "/solutions/food-delivery" },
  ],
  hire: [
    { label: "All Developers", href: "/hire" },
    { label: "Hire React Developers", href: "/hire/react-developers" },
    { label: "Hire Next.js Developers", href: "/hire/nextjs-developers" },
    { label: "Hire Node.js Developers", href: "/hire/nodejs-developers" },
    { label: "Hire Flutter Developers", href: "/hire/flutter-developers" },
    { label: "Hire React Native Developers", href: "/hire/react-native-developers" },
    { label: "Hire Python Developers", href: "/hire/python-developers" },
    { label: "Hire Angular Developers", href: "/hire/angular-developers" },
    { label: "Hire Laravel / PHP Developers", href: "/hire/laravel-developers" },
    { label: "Hire DevOps Engineers", href: "/hire/devops-engineers" },
    { label: "Hire QA Engineers", href: "/hire/qa-engineers" },
    { label: "Hire UI/UX Designers", href: "/hire/ui-ux-designers" },
    { label: "Hire Sales Executives", href: "/hire/sales-executives" },
  ],
};


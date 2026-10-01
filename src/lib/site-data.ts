// ============================================================
// UKVALLEY TECHNOLOGIES — homepage content
// Single source of truth for copy. Edit values here to update
// the site. (Polished placeholders — swap for real data later.)
// ============================================================

export { company, heroStats, processSteps, techStack, nav, yearsInBusiness } from "./site-core";
import { company as coreCompany, yearsInBusiness as coreYears } from "./site-core";
export type { TechCategory, NavLink } from "./site-core";


export const stats = [
  { value: "150+", label: "Satisfied clients", sub: "Across India & overseas" },
  { value: "1,550+", label: "Projects delivered", sub: "Web, mobile & enterprise" },
  { value: `${coreYears}+`, label: "Years in business", sub: `Building since ${coreCompany.foundedYear}` },
  { value: "10+", label: "Awards & recognitions", sub: "For delivery excellence" },
];


// Logos shown in the trust marquee — placeholder brand names.
// Replace with real client logos (SVG) when available.
export const trustedBy = [
  "Finvalley",
  "TeleValley",
  "BBNPlay",
  "Dream Loans",
  "TurfPro",
  "AgriChain",
  "MediCore",
  "RetailOne",
  "BuildRight",
  "LogiFlow",
];

export type Service = {
  icon: string; // lucide icon key, mapped in component
  title: string;
  blurb: string;
  bullets: string[];
  href: string;
};

export const services: Service[] = [
  {
    icon: "code",
    title: "Web & Web App Development",
    blurb:
      "Static, dynamic, e-commerce and custom web apps built on React, Next.js, Angular and Vue — fast, SEO-ready and scalable.",
    bullets: ["Custom web apps", "E-commerce platforms", "Progressive web apps", "Admin dashboards", "API integrations", "SEO optimization", "CMS development", "Performance auditing"],
    href: "/services/web-development",
  },
  {
    icon: "smartphone",
    title: "Mobile App Development",
    blurb:
      "Native iOS & Android plus cross-platform Flutter and React Native apps — engineered for performance and a polished UX.",
    bullets: ["iOS & Android", "Flutter / React Native", "App store delivery", "Push notifications", "Offline-first sync"],
    href: "/services/mobile-app-development",
  },
  {
    icon: "layoutDashboard",
    title: "Custom Software · CRM · ERP · HRMS",
    blurb:
      "Business automation systems built around how your operations actually run — replacing spreadsheets and WhatsApp with one accountable platform.",
    bullets: ["CRM & ERP", "HRMS & payroll", "Business automation", "Role-based dashboards", "Workflow engines"],
    href: "/services/custom-software",
  },
  {
    icon: "cloud",
    title: "Cloud & DevOps Engineering",
    blurb:
      "Cloud migration, CI/CD pipelines, container orchestration and observability — so your platform ships faster and stays up without surprise bills.",
    bullets: ["Cloud migration", "CI/CD & containers", "Observability & IaC", "Auto-scaling", "Cost optimization"],
    href: "/services/cloud-devops",
  },
  {
    icon: "megaphone",
    title: "Digital Marketing",
    blurb:
      "SEO, performance marketing, social and content that turns your website into a lead engine — not a brochure no one visits.",
    bullets: ["SEO & local SEO", "Performance ads", "Content & social", "Analytics & reporting"],
    href: "/services/digital-marketing",
  },
  {
    icon: "shieldCheck",
    title: "Managed IT · Cloud · Cybersecurity",
    blurb:
      "Cloud migration on AWS/Azure, 24×7 monitoring, hardening and incident response — secure infrastructure your business can rely on.",
    bullets: ["Cloud migration", "24×7 monitoring", "Security hardening", "Incident response", "Compliance audits"],
    href: "/services/managed-it",
  },
  {
    icon: "blocks",
    title: "Blockchain & DeFi Development",
    blurb:
      "Smart contracts, decentralized ledgers and secure DeFi platforms — audited, tested and built for real transactional volume.",
    bullets: ["Smart contracts", "DeFi platforms", "Security audits", "Token economics"],
    href: "/services/blockchain",
  },
  {
    icon: "palette",
    title: "Graphic & Brand Design",
    blurb:
      "Logos, brand identity and visual marketing assets that make your business look established before you say a word.",
    bullets: ["Logo & identity", "Marketing collateral", "Brand systems", "UI/UX design"],
    href: "/services/graphic-design",
  },
];

export type Product = {
  name: string;
  slug: string;
  tagline: string;
  description: string;
  highlights: string[];
  featured?: boolean;
  metric?: { value: string; label: string };
  platform: string;
  audience: string;
  /** The operational problem the product exists to remove, as 2-3 paragraphs: the failure mode, its cost, then how the product solves it. */
  problem: string[];
  /** Feature set with one-line explanations. */
  features: { title: string; desc: string }[];
  /** Concrete outcomes customers see after deployment. */
  outcomes: string[];
  /** Typical teams or businesses the product fits. */
  useCases: string[];
  /** Technology behind the product. */
  stack: string[];
  /** Buyer questions answered on the product page. */
  faqs: { q: string; a: string }[];
};

export const products: Product[] = [
  {
    name: "TeleValley",
    slug: "televalley",
    tagline: "SIM-based sales engagement",
    description:
      "Replaces expensive cloud telephony with reps' own SIM cards — full call tracking, recording and analytics at a fraction of the cost.",
    highlights: ["Call tracking & recording", "Live analytics", "CRM-ready", "SIM-based routing"],
    featured: true,
    metric: { value: "60%", label: "Lower telephony cost" },
    platform: "Flutter · Android",
    audience: "B2B sales teams, call centers, brokerages",
    problem: [
      "Cloud telephony charges every sales seat a monthly rental just to log and record calls, and the moment a rep dials from a personal SIM the call disappears from the record entirely. Managers end up coaching from CRM notes typed after the fact, not from what was actually said on the call.",
      "The cost compounds fast. A single seat of cloud telephony runs close to ₹8,400 a month before a rep has closed anything, and every call made off-platform is a customer relationship the business doesn't truly own — when a rep resigns, their numbers, their rapport and their pipeline history resign with them.",
      "TeleValley closes both gaps at once: reps keep their own SIMs and numbers, but every call is logged, recorded and pushed into the CRM automatically, with disposition captured in one tap. Telephony cost per seat typically falls 60% in the first month — and it's the exact system our own sales team runs on every day, not a demo built to sell you one.",
    ],
    features: [
      { title: "SIM-based call routing", desc: "Reps call from their own numbers; every call is logged to a central server automatically." },
      { title: "Call recording with consent", desc: "Encrypted recordings with retention rules, consent prompts and role-based playback." },
      { title: "Live disposition capture", desc: "One-tap outcome tagging after each call feeds the pipeline stage and next action." },
      { title: "CRM sync", desc: "Two-way sync with the CRM the team already uses — leads, notes and follow-ups stay in one place." },
      { title: "Manager analytics", desc: "Talk time, connect rate, outcomes per rep and per campaign, with recordings one click away." },
      { title: "Admin console & audit logs", desc: "Team setup, number management, export controls and a full audit trail for compliance." },
    ],
    outcomes: [
      "Telephony cost per seat typically falls by 60% in the first month",
      "Every sales call is logged and recorded, not just the ones placed through a dialler",
      "Managers coach from real recordings; connect rate and conversion improve within a quarter",
      "Zero hardware to install — reps keep their SIMs, their numbers and their customer relationships",
    ],
    useCases: [
      "Inside-sales and telemarketing floors replacing per-seat cloud telephony",
      "Real-estate and insurance brokerages with field agents on personal numbers",
      "Loan and collections teams that need call evidence on record",
      "Field-service and logistics operations coordinating over calls",
    ],
    stack: ["Flutter", "Native Android telephony", "Django REST API", "PostgreSQL", "Encrypted object storage", "Role-based access"],
    faqs: [
      { q: "Does TeleValley work on iPhone?", a: "TeleValley runs on Android, because iOS does not allow apps to record or route native calls. Most Indian sales floors are Android-first, and we supply a manager web dashboard that works on any device." },
      { q: "Is call recording legal for our team?", a: "Recording business calls with consent is permitted in India. TeleValley plays a configurable consent prompt and lets you set retention and access rules, so your policy is enforced by the software rather than by memory." },
      { q: "Can it sync with our existing CRM?", a: "Yes — TeleValley integrates with common CRMs over REST and can be mapped to a custom one during onboarding. Leads, dispositions and notes flow both ways." },
      { q: "How is it priced?", a: "A flat deployment fee plus a modest per-team support plan — no per-seat telephony rental. Onboarding, rep training and ongoing product updates are included." },
    ],
  },
  {
    name: "Finvalley",
    slug: "finvalley",
    tagline: "Stock analysis partner",
    description:
      "A stock-analysis app that turns market data into actionable signals for retail investors.",
    highlights: ["Real-time signals", "Portfolio insights", "Watchlists", "Risk scoring"],
    platform: "Flutter · iOS & Android",
    audience: "Retail investors",
    problem: [
      "Retail investors drown in market data and starve for decisions. Charts, news and tips arrive from a dozen disconnected sources, and none of them know what the investor actually holds or how much risk they can carry.",
      "The result is decision fatigue that costs real money: investors chase tips instead of signals, discover portfolio concentration only after a sector correction has already hit, and miss the window to act because the alert that mattered was buried in fifteen that didn't.",
      "Finvalley turns raw market data into signals with a reason attached — momentum, breakout and reversal calls in plain English, portfolio risk scored against real holdings, and alerts pushed the moment they matter. It's built to be white-labelled, so brokerages and advisory firms can put their own name on an analytics layer their clients will actually open daily.",
    ],
    features: [
      { title: "Real-time signals", desc: "Momentum, breakout and reversal signals computed on live NSE/BSE data, explained in plain English." },
      { title: "Portfolio insights", desc: "Import holdings and see concentration, sector exposure and unrealised risk at a glance." },
      { title: "Smart watchlists", desc: "Watchlists with alerts on price, volume and signal changes — pushed, not polled." },
      { title: "Risk scoring", desc: "A per-stock and per-portfolio risk score built from volatility, liquidity and drawdown history." },
      { title: "Screeners", desc: "Filter the market by fundamentals, technicals and signal strength in seconds." },
      { title: "Learning layer", desc: "Every signal links to a short explainer, so users learn the reasoning, not just the tip." },
    ],
    outcomes: [
      "Investors act on fewer, clearer signals instead of reacting to noise",
      "Portfolio concentration and sector risk become visible before they become losses",
      "Alerts arrive in time to act, on both iOS and Android",
      "New investors build judgment through explained signals rather than blind tips",
    ],
    useCases: [
      "Retail investors managing their own equity portfolios",
      "Advisory firms wanting a white-labelled client app",
      "Trading-education businesses adding a practical tool for students",
      "Brokerages offering value-added analytics to clients",
    ],
    stack: ["Flutter", "Node.js signal engine", "PostgreSQL & Redis", "Market data feeds", "Push notifications", "Razorpay subscriptions"],
    faqs: [
      { q: "Is Finvalley investment advice?", a: "No. Finvalley is an analysis and education tool — it surfaces signals and risk metrics with the reasoning behind them. Investment decisions remain the user's own, and the app says so clearly." },
      { q: "Which exchanges and instruments are covered?", a: "NSE and BSE equities today, with index and ETF coverage. Derivatives analytics are on the roadmap." },
      { q: "Can we white-label it for our clients?", a: "Yes — Finvalley is built for white-label deployment with your branding, your subscription plans and your own client onboarding." },
      { q: "How is user data protected?", a: "Portfolio data is encrypted at rest and in transit, never shared with third parties, and deletable on request — in line with the DPDP Act." },
    ],
  },
  {
    name: "BBNPlay",
    slug: "bbnplay",
    tagline: "Prediction skills gaming",
    description:
      "A prediction-based skills gaming platform with secure gameplay and leaderboards.",
    highlights: ["Secure gameplay", "Leaderboards", "Wallet system", "Anti-fraud checks"],
    platform: "Flutter · Laravel API",
    audience: "Skills-gaming operators",
    problem: [
      "Prediction and skills-gaming platforms live or die on trust: users must believe results are fair, payouts are prompt, and the wallet is safe. Most operators bolt these protections on late, after the first fraud incident has already cost more than the platform earned.",
      "That's a costly order of operations. Multi-accounting and device spoofing drain prize pools before anyone notices the pattern, a slow or disputed payout turns a paying user into a one-star review, and reconciling wallet ledgers by hand is how operators discover the fraud months too late to recover it.",
      "BBNPlay builds the trust layer in from day one: server-authoritative scoring that locks entries the moment a round starts, device fingerprinting and velocity limits that catch multi-accounting before payout, and wallet ledgers that reconcile to the rupee against gateway statements automatically. Operators launch new contest formats from the console — no release cycle, no reduced fraud coverage.",
    ],
    features: [
      { title: "Secure gameplay engine", desc: "Server-authoritative contests with tamper-proof scoring and locked entries once a round starts." },
      { title: "Leaderboards", desc: "Live, per-contest and seasonal leaderboards with tie-break rules and prize distribution." },
      { title: "Wallet system", desc: "Deposits, winnings and bonuses in separate ledgers with UPI deposits and instant withdrawals." },
      { title: "Anti-fraud checks", desc: "Device fingerprinting, multi-account detection, velocity limits and KYC gating on withdrawals." },
      { title: "Operator console", desc: "Contest creation, prize pools, user management and payout approvals with maker-checker." },
      { title: "Compliance tooling", desc: "Age and state eligibility checks, responsible-play limits and exportable audit logs." },
    ],
    outcomes: [
      "Contests settle automatically with a verifiable scoring trail",
      "Fraud and multi-account abuse are caught before payout, not after",
      "Wallet ledgers reconcile to the rupee with payment-gateway statements",
      "Operators launch new contest formats from the console without a release",
    ],
    useCases: [
      "Fantasy and prediction-gaming operators",
      "Quiz and trivia platforms with cash prizes",
      "Brands running skill-based promotional contests",
      "Media companies adding engagement products around live events",
    ],
    stack: ["Flutter", "Laravel API", "MySQL & Redis", "Razorpay & UPI", "Push notifications", "Device fingerprinting"],
    faqs: [
      { q: "How do you keep contests fair?", a: "Scoring runs server-side from official data feeds, entries lock at round start, and every score change is logged. Users can audit their own contest history." },
      { q: "Can it handle state-wise restrictions?", a: "Yes — eligibility rules by state and age are enforced at signup and at contest entry, and are updated as regulations change." },
      { q: "How fast are withdrawals?", a: "Instant to UPI for KYC-verified users within operator-set limits; larger amounts route through maker-checker approval." },
      { q: "Can we run our own contest formats?", a: "Yes — the operator console supports custom scoring rules, prize structures and entry fees without a developer." },
    ],
  },
  {
    name: "Dream Loans",
    slug: "dream-loans",
    tagline: "Loan funding platform",
    description:
      "A loan origination and funding platform that streamlines applications to disbursal.",
    highlights: ["Origination flow", "KYC & scoring", "Disbursal tracking", "EMI calculator"],
    platform: "Flutter · Laravel · MongoDB",
    audience: "NBFCs, lending startups",
    problem: [
      "Lending teams that run on spreadsheets and WhatsApp cannot answer the auditor's simplest question: who approved this file, when, and on what basis. Every regulatory inspection becomes an archaeology exercise, and every policy change waits on a developer.",
      "The slow-down shows up before the audit ever arrives. A file that takes nine working days to move from application to decision is a customer who's already accepted a competitor's offer by day four, KYC documents shared over WhatsApp are a privacy incident waiting to be reported, and a credit policy enforced from memory produces deviations nobody signed off on.",
      "Dream Loans turns the whole pipeline — application, KYC, scoring, maker-checker approval, disbursal and repayment — into one auditable system where every state change writes an immutable log entry automatically. Credit-policy changes ship as configuration the same day instead of a developer sprint, and an inspection export that used to take weeks now takes minutes.",
    ],
    features: [
      { title: "Guided origination", desc: "Product-wise application forms with document checklists, co-applicants and completeness tracking." },
      { title: "KYC & bureau integration", desc: "Aadhaar/PAN verification and CIBIL/Experian pulls inside the flow, with consent logs." },
      { title: "Configurable credit policy", desc: "Rules, scorecards and deviation matrices the credit team edits as configuration." },
      { title: "Maker-checker approvals", desc: "Approval chains with delegation, and captured reasons on every override." },
      { title: "Disbursal & repayment", desc: "Agreements, part-disbursals, EMI schedules, NACH mandates and automatic NPA classification." },
      { title: "Audit-ready ledgers", desc: "Immutable logs on every state change with inspection-ready exports." },
    ],
    outcomes: [
      "Application-to-decision time typically falls by more than half",
      "Regulatory exports take minutes; every file carries its full approval history",
      "Credit-policy changes ship the same day as configuration, not code",
      "Collections start from a clean repayment schedule instead of a reconciliation",
    ],
    useCases: [
      "NBFCs modernising a spreadsheet-based origination desk",
      "Lending startups that need audit-grade infrastructure from day one",
      "Co-lending and DSA-led models needing partner portals",
      "Vehicle, gold and consumer-durable finance with product-specific flows",
    ],
    stack: ["Flutter", "Laravel API", "MongoDB", "Bureau & e-KYC integrations", "E-sign", "Razorpay & NACH"],
    faqs: [
      { q: "Can Dream Loans match our existing credit policy?", a: "Yes — policies become editable configuration: rules, scorecards, deviation matrices and approval chains. Your credit head changes them without a developer cycle." },
      { q: "Is it suitable for RBI-audited NBFCs?", a: "It is built audit-first: maker-checker on every money movement, immutable logs and exportable trails. Regulatory report formats are mapped during onboarding." },
      { q: "Which loan products are supported?", a: "Personal, business, loan against property, vehicle and consumer-durable flows ship as product templates, each with its own documents and workflow." },
      { q: "Do we own the deployment?", a: "Yes — Dream Loans deploys on cloud accounts you own, with your data in regions you choose. We configure and hand over; we never pool client data." },
    ],
  },
  {
    name: "Turf Booking",
    slug: "turf-booking",
    tagline: "Sports venue reservations",
    description:
      "A turf and sports-venue booking app with real-time slot availability and payments.",
    highlights: ["Live slots", "Online payments", "Venue dashboard", "Team bookings"],
    platform: "Flutter · Node",
    audience: "Sports venues, turf owners",
    problem: [
      "Turf and sports venues sell perishable inventory — an empty evening slot is revenue gone forever. Bookings taken by phone and WhatsApp produce double bookings, unpaid holds that block slots nobody else can take, and no-shows that leave the ground idle right at peak time.",
      "Each of those failure modes has a price. A double-booked slot means refunding one customer and apologising to the other; an unpaid hold sitting on the calendar for hours keeps a paying customer from ever seeing the venue as available; and a no-show at 7pm on a weekday is a slot that can never be resold, however good tomorrow's booking rate is.",
      "Turf Booking replaces all three failure points with one concurrency-safe slot engine, UPI-verified bookings that expire automatically if unpaid, and WhatsApp reminders with one-tap reschedule that refill cancellations instead of losing them. Multi-turf owners get occupancy heatmaps and revenue-per-slot-hour across every venue, without a single phone round.",
    ],
    features: [
      { title: "Real-time slot engine", desc: "Concurrency-safe availability per turf with buffers, blocking and maintenance windows." },
      { title: "UPI-verified booking", desc: "Payment links and UPI intent; unpaid holds expire automatically, paid bookings get priority." },
      { title: "WhatsApp reminders", desc: "Confirmation and pre-slot reminders with one-tap reschedule to refill cancellations." },
      { title: "Dynamic pricing", desc: "Peak, off-peak and weekend rate cards per venue, editable by the operator." },
      { title: "Team & recurring bookings", desc: "Split payments and weekly recurring slots for teams, academies and leagues." },
      { title: "Venue dashboard", desc: "Occupancy heatmaps, repeat-customer rate and revenue per slot hour." },
    ],
    outcomes: [
      "Double bookings drop to zero from day one",
      "No-shows typically fall by two-thirds once bookings are paid and reminded",
      "Peak slots earn their true value with dynamic pricing",
      "Owners see occupancy and revenue per venue without a phone round",
    ],
    useCases: [
      "Multi-turf football and cricket venues",
      "Badminton, pickleball and tennis courts",
      "Sports academies running batches and coaching slots",
      "Event and party venues selling hourly slots",
    ],
    stack: ["Flutter", "Node.js API", "PostgreSQL", "Razorpay", "WhatsApp Business API", "Google Maps"],
    faqs: [
      { q: "Can it handle multiple venues under one owner?", a: "Yes — each venue keeps its own turfs, rules and pricing, while owners see occupancy and revenue across all of them in one dashboard." },
      { q: "What happens to unpaid bookings?", a: "Unpaid holds expire after a window you set, freeing the slot. Payment-verified bookings get priority, which keeps the calendar honest." },
      { q: "Does it support memberships or packages?", a: "Yes — prepaid packages, memberships and recurring team bookings are supported, with redemption tracked per booking." },
      { q: "Can customers reschedule themselves?", a: "Yes — from the reminder message, within your policy windows. Cancellations become refillable slots instead of no-shows." },
    ],
  },
];

export type CaseStudy = {
  slug: string;
  client: string;
  sector: string;
  title: string;
  problem: string;
  result: string;
  metrics: { value: string; label: string }[];
  stack: string[];
  timeline: string;
  team: string;
  approach: string[];
  /** One paragraph on the sector reality this engagement sat inside. */
  industryContext: string;
  /** The specific pain points we found on day one. */
  challenges: string[];
  /** Narrative of what was actually built. */
  solution: string;
  /** The modules / capabilities delivered. */
  modules: { title: string; desc: string }[];
  /** Measured outcomes, written as full sentences. */
  results: string[];
  /** External systems the build connects to. */
  integrations: string[];
  /** What the client said after go-live (names anonymised on request). */
  testimonial: { quote: string; name: string; role: string };
};

export const caseStudies: CaseStudy[] = [
  {
    slug: "loan-origination-nbfc",
    client: "A Tier-1 Indian NBFC",
    sector: "FinTech",
    title: "Loan origination rebuilt from spreadsheet to disbursal",
    problem:
      "A 30-person lending team ran applications on Excel and WhatsApp — slow, error-prone and impossible to audit.",
    result:
      "We delivered Dream Loans: a unified origination, KYC and disbursal platform with a live operations dashboard.",
    metrics: [
      { value: "65%", label: "Faster processing" },
      { value: "0→1", label: "Audit trail" },
      { value: "8 wks", label: "To first deploy" },
    ],
    stack: ["Flutter", "Laravel", "MongoDB"],
    timeline: "8 weeks to first deploy · 16 weeks to full rollout",
    team: "1 architect · 2 backend · 1 mobile · 1 QA",
    approach: [
      "Audited the existing spreadsheet workflow and mapped it to a state machine for loan stages.",
      "Shipped a thin-slice prototype in week three: application → KYC → decision, end to end.",
      "Added automated payout calculation and a full audit trail for every status change.",
      "Migrated 18 months of historical applications so the team started with continuity, not a blank system.",
    ],
    industryContext:
      "Indian NBFC lending runs under RBI's digital-lending guidelines: every KYC pull, credit decision and disbursal has to be traceable, and every deviation from policy approved on record. Teams that run on spreadsheets pass audits by reconstruction — slow, expensive and fragile — and lose files the moment two officers edit the same sheet.",
    challenges: [
      "Applications logged in Excel with no version history; two officers regularly overwrote each other's status updates",
      "KYC documents shared over WhatsApp, so audit preparation meant scrolling through months of chat threads",
      "Credit decisions taken from memory of the policy, not a configured rule set — inconsistent across officers",
      "Disbursal and repayment schedules kept in a second spreadsheet that never reconciled with the first",
    ],
    solution:
      "We built Dream Loans as one origination platform: guided application intake per loan product, a document vault with checklist tracking, Aadhaar/PAN KYC and bureau pulls wired into the flow, a configurable credit policy with maker-checker approvals, and disbursal plus repayment scheduling that feeds collections. Every state change writes an immutable audit entry with user, time and reason.",
    modules: [
      { title: "Application intake", desc: "Product-wise guided forms with completeness tracking, co-applicant support and document checklists." },
      { title: "KYC & bureau verification", desc: "Aadhaar/PAN verification and CIBIL pulls inside the flow, with consent logs on every file." },
      { title: "Credit decision engine", desc: "Rules, scorecards and a deviation matrix the credit team edits as configuration, not code." },
      { title: "Maker-checker approvals", desc: "Approval chains with delegation, and captured reasons on every deviation or override." },
      { title: "Disbursal & repayment", desc: "Agreement generation, part-disbursal support, EMI schedules and automatic NPA classification." },
      { title: "Operations dashboard", desc: "Live pipeline, turnaround time per stage and officer workload for the operations head." },
    ],
    results: [
      "Application-to-decision time fell 65%, from an average of nine working days to three.",
      "Every file now carries a complete audit trail; the first RBI-format inspection export took minutes instead of weeks.",
      "A thin-slice prototype was live in week three and the first production deploy in week eight, with 18 months of history migrated and zero files lost.",
      "Credit-policy changes ship as configuration the same day, with no developer cycle in between.",
    ],
    integrations: ["CIBIL bureau API", "Aadhaar e-KYC", "PAN verification", "Razorpay", "SMS gateway", "Tally"],
    testimonial: {
      quote: "They shipped our loan platform in eight weeks. The code is ours, the documentation is real, and the team responds within hours — not days.",
      name: "Anita Desai",
      role: "Founder, NBFC",
    },
  },
  {
    slug: "pos-inventory-qsr",
    client: "A 200-store QSR chain",
    sector: "Retail & POS",
    title: "POS + inventory replacing manual stock counts",
    problem:
      "Stock-outs and manual counts across 200 stores caused recurring revenue loss and reporting delays.",
    result:
      "A custom POS and inventory system with real-time stock visibility and automated reorder thresholds.",
    metrics: [
      { value: "40%", label: "Less stock-out time" },
      { value: "3×", label: "Faster reporting" },
      { value: "200", label: "Stores onboarded" },
    ],
    stack: ["React", "Node", "PostgreSQL"],
    timeline: "6 weeks pilot in 5 stores · 14 weeks full rollout",
    team: "1 architect · 2 full-stack · 1 QA",
    approach: [
      "Ran a 5-store pilot to validate the reorder-threshold model against real demand.",
      "Built an offline-first POS terminal that syncs when connectivity returns.",
      "Centralized inventory reporting so HQ sees every store in a single dashboard.",
      "Phased rollout with on-site training per region to avoid adoption friction.",
    ],
    industryContext:
      "Quick-service restaurant margins live on stock accuracy and counter speed. With 200 outlets, a weekly manual stock count meant HQ always saw last week's truth, reorders were guesses, and any internet outage at a store froze billing in the middle of the lunch rush.",
    challenges: [
      "Stock counted by hand once a week per store; shrinkage and stock-outs were discovered days after they happened",
      "Cloud POS that stopped billing whenever a store's broadband dropped — usually at peak hours",
      "Reorder quantities decided by store managers on instinct, with no demand data behind them",
      "HQ reporting assembled from 200 emailed spreadsheets, three days after month-end",
    ],
    solution:
      "We replaced the counter software with an offline-first POS terminal that keeps billing, discounts and receipts working locally and syncs when connectivity returns. Every bill decrements live inventory once synced, reorder thresholds are computed from real sell-through per store, and HQ sees all outlets in one dashboard with day-close, shrinkage and slow-mover reports.",
    modules: [
      { title: "Offline-first billing terminal", desc: "Bills, KOT tickets, split payments and GST receipts continue through outages; conflict-safe sync on reconnect." },
      { title: "Live inventory per outlet", desc: "Recipe-level stock deduction per item sold, with wastage and transfer logging." },
      { title: "Automated reorder engine", desc: "Thresholds derived from 30-day sell-through per SKU per store, feeding purchase suggestions." },
      { title: "HQ dashboard", desc: "Consolidated sales, stock and shrinkage across all 200 stores, refreshed in real time." },
      { title: "Cashier & shift controls", desc: "Role-based discount limits, void permissions and shift cash reconciliation." },
      { title: "Regional rollout kit", desc: "Store onboarding checklist, printer and scanner configuration and on-site training material." },
    ],
    results: [
      "Stock-out time per store fell 40% within the first quarter of full rollout.",
      "Month-end reporting moved from three days of spreadsheet consolidation to a same-day dashboard — three times faster.",
      "All 200 stores were onboarded in 14 weeks, region by region, with no store losing a day of billing.",
      "Reorder quantities are now data-driven, cutting emergency purchases and reducing wastage on perishables.",
    ],
    integrations: ["Thermal receipt printers", "Barcode scanners", "UPI & card terminals", "Tally", "WhatsApp Business API"],
    testimonial: {
      quote: "Store managers stopped calling HQ about stock. The dashboard answers before they ask — and billing hasn't stopped once since we switched.",
      name: "Vikram Rao",
      role: "Head of Operations, QSR chain",
    },
  },
  {
    slug: "televalley-telephony-cost",
    client: "A B2B sales org",
    sector: "Sales Engagement",
    title: "TeleValley: cutting telephony cost by 60%",
    problem:
      "Cloud telephony rentals at ~₹8,400/seat/month made outbound sales expensive to scale.",
    result:
      "TeleValley routes calls through reps' existing SIMs with full tracking, recording and analytics.",
    metrics: [
      { value: "60%", label: "Cost reduction" },
      { value: "100%", label: "Call tracking" },
      { value: "CRM", label: "Native sync" },
    ],
    stack: ["Flutter", "Kotlin", "Django"],
    timeline: "7 weeks to MVP · 12 weeks to GA",
    team: "1 architect · 2 mobile · 1 backend · 1 QA",
    approach: [
      "Designed a SIM-routing layer that logs every call to a central server without per-seat telephony rentals.",
      "Added call recording, live disposition capture and a CRM sync the sales team already used.",
      "Shipped a live analytics dashboard so managers could coach from real call data.",
      "ROI was visible in the first month — the product became one of our own portfolio lines.",
    ],
    industryContext:
      "Outbound B2B sales in India runs on phone calls, and cloud telephony vendors charge per seat per month for the privilege of tracking them. For a growing sales floor that rental becomes the single largest line after salaries, while managers still cannot hear the calls that matter.",
    challenges: [
      "Cloud telephony rentals of roughly ₹8,400 per seat per month made every new hire an expensive decision",
      "Calls made from personal SIMs were invisible: no logs, no recordings, no disposition data",
      "Managers coached from CRM notes typed after the call, not from what was actually said",
      "Switching numbers on onboarding meant reps lost the customer relationships attached to their existing SIMs",
    ],
    solution:
      "We built TeleValley: an Android app that routes and logs calls through each rep's own SIM, records them with consent, captures live disposition and syncs to the CRM the team already used. A Django backend stores call metadata and recordings, and a manager dashboard surfaces call volume, talk time, outcomes and recordings for coaching — with no per-seat telephony rental.",
    modules: [
      { title: "SIM-based call routing", desc: "Calls placed and received on the rep's own number, logged automatically to the central server." },
      { title: "Call recording & storage", desc: "Consent-aware recording, encrypted storage, retention rules and role-based playback." },
      { title: "Live disposition capture", desc: "One-tap outcome tagging after every call, feeding pipeline stages in the CRM." },
      { title: "CRM sync", desc: "Two-way sync with the existing CRM so leads, notes and next actions stay in one place." },
      { title: "Manager analytics", desc: "Talk time, connect rate, outcomes per rep and per campaign, with recordings one click away." },
      { title: "Admin console", desc: "Team setup, number management, audit logs and export controls for compliance." },
    ],
    results: [
      "Telephony cost per seat fell by 60% in the first month, with no loss of tracking or recording.",
      "100% of outbound and inbound sales calls are now logged and recorded, up from roughly a third.",
      "Managers coach from real call recordings; connect-rate and conversion improved within the first quarter.",
      "The product proved itself so well it joined our own portfolio and now runs across multiple client sales teams.",
    ],
    integrations: ["Android telephony APIs", "Existing CRM (REST)", "Cloud object storage", "SMS gateway", "Google Workspace"],
    testimonial: {
      quote: "TeleValley cut our telephony bill by more than half without losing any tracking. The ROI was visible in the first month.",
      name: "Karan Mehta",
      role: "Head of Growth, B2B SaaS",
    },
  },
  {
    slug: "real-estate-lead-crm",
    client: "A multi-city real estate developer",
    sector: "Real Estate",
    title: "Lead-to-closure CRM for a multi-city developer",
    problem:
      "Site visits, broker leads and follow-ups lived in spreadsheets — 40% of enquiries were never contacted a second time.",
    result:
      "A custom broker CRM with lead scoring, site-visit scheduling and document workflows from enquiry to registration.",
    metrics: [
      { value: "2.1×", label: "More site visits" },
      { value: "0", label: "Leads dropped" },
      { value: "30%", label: "Faster closure" },
    ],
    stack: ["Next.js", "Node", "PostgreSQL"],
    timeline: "6 weeks to MVP · 12 weeks to all-city rollout",
    team: "1 architect · 2 backend · 1 frontend · 1 QA",
    approach: [
      "Mapped the full enquiry journey — broker walk-ins, digital leads and repeat visitors — into one pipeline.",
      "Built automated follow-up cadences so no lead aged without a scheduled next action.",
      "Added site-visit scheduling with mobile check-in so managers saw conversion per project.",
      "Digitized agreement and document workflows so sales and legal worked off the same record.",
    ],
    industryContext:
      "Property sales is a follow-up business. Enquiries arrive from portals, hoardings, brokers and walk-ins, and a developer selling across several cities can lose almost half of them simply because nobody owns the second call. RERA disclosures and construction-linked payment plans add a document trail that has to be right.",
    challenges: [
      "Leads from 99acres, MagicBricks, the website and broker networks landed in five inboxes and three spreadsheets",
      "40% of enquiries were never contacted a second time — there was no owner and no due date",
      "Site visits were booked over the phone and forgotten; conversion per project was unknown",
      "Agreements, demand letters and registration status moved between sales and legal on WhatsApp",
    ],
    solution:
      "We built a lead-to-closure CRM around the developer's real pipeline: portal and broker leads flow into one queue with source tagging and deduplication, each lead carries a mandatory next action with an owner and due date, site visits are scheduled with reminders and mobile check-in, and every unit record holds its agreement, milestone payments and registration status so sales and legal work off one screen.",
    modules: [
      { title: "Unified lead inbox", desc: "Portal feeds, website forms, walk-ins and broker submissions deduplicated and scored by budget and location." },
      { title: "Follow-up cadences", desc: "Mandatory next action on every lead; missed actions escalate to the sales head automatically." },
      { title: "Site-visit scheduler", desc: "Buyer reminders over WhatsApp, mobile check-in on arrival and visit-to-booking conversion per project." },
      { title: "Broker & channel-partner portal", desc: "Partners submit leads, see status and track commissions without calling the office." },
      { title: "Unit inventory & pricing", desc: "Tower, floor and unit availability with construction-linked payment plans per unit." },
      { title: "Documents & registration", desc: "Agreement generation, demand letters, receipts and registration tracking on the unit record." },
    ],
    results: [
      "Site visits per month rose 2.1× once every lead had an owner and a scheduled next step.",
      "Dropped leads went to zero: no enquiry can age without a due action, and misses escalate the same day.",
      "Enquiry-to-registration closure time fell 30% because sales and legal stopped waiting on each other.",
      "Rolled out to every city in 12 weeks; broker partners adopted the portal within the first month.",
    ],
    integrations: ["99acres & MagicBricks lead APIs", "WhatsApp Business API", "Razorpay payment links", "Tally", "Email & SMS gateways"],
    testimonial: {
      quote: "For the first time we know exactly how many visits each project generated and which broker sent them. Nothing falls through anymore.",
      name: "Sameer Kulkarni",
      role: "Director of Sales, real estate developer",
    },
  },
  {
    slug: "manufacturing-hrms-rollout",
    client: "Mid-size auto-components manufacturer",
    sector: "Manufacturing",
    title: "Three factories, one payroll: an HRMS that survived month-end",
    problem:
      "Attendance from three biometric systems and a WhatsApp leave group was consolidated manually for two days every month. Payroll errors were routine and statutory filings (PF, PT across two states) were last-minute.",
    result:
      "A unified HRMS with device integration, rule-based shifts and parallel-run-verified payroll. Month-end closed in one day; filings generate ready-to-submit challans.",
    metrics: [
      { value: "2 days → 1 day", label: "Payroll cycle" },
      { value: "0", label: "Errors in first 6 runs" },
      { value: "620", label: "Employees onboarded" },
    ],
    stack: ["Next.js", "PostgreSQL", "Device API integration", "Tailwind CSS"],
    timeline: "14 weeks",
    team: "5 people",
    approach: [
      "Integrated all three biometric device protocols into one attendance stream with automated exception reports.",
      "Configured shift, overtime and leave rules as data — unit-wise, editable by HR without code changes.",
      "Ran one full parallel payroll, reconciled line by line, and trained HR on their own data before cutover.",
      "Delivered employee self-service (payslips, leave, reimbursements) on mobile, cutting HR walk-ups.",
    ],
    industryContext:
      "Indian manufacturing payroll is a compliance exercise as much as an accounting one: Factories Act overtime rules, shift allowances, PF, ESI and professional tax across states — computed for hundreds of workers from attendance data that arrives from biometric devices, paper registers and WhatsApp groups. Month-end is where most HRMS implementations quietly fail.",
    challenges: [
      "Three factories ran three different biometric brands, and HR consolidated their logs by hand for two days every month",
      "Leave requests lived in a WhatsApp group; approvals were remembered, not recorded",
      "Shift and overtime rules differed by unit and were applied inconsistently, producing recurring payroll disputes",
      "Professional tax across two states and PF/ESI challans were prepared at the last minute, with frequent corrections",
    ],
    solution:
      "We built a unified HRMS that pulls attendance from all three device protocols into one stream, applies unit-wise shift, overtime and leave rules configured as data by HR, and runs a payroll engine that computes PF, ESI, PT, TDS and gratuity from the company's real salary structures. A parallel payroll run was reconciled line by line before cutover, and employees got a self-service app for payslips, leave and reimbursements.",
    modules: [
      { title: "Multi-device attendance", desc: "Integration with all three biometric protocols plus exception reports for missed punches and mismatches." },
      { title: "Shift & overtime rules", desc: "Unit-wise shift patterns, week-offs and overtime slabs maintained by HR without code changes." },
      { title: "Leave management", desc: "Policy-driven accruals, comp-offs and approval workflows replacing the WhatsApp group." },
      { title: "Indian payroll engine", desc: "PF, ESI, PT across two states, TDS, bonus and gratuity with full revision history." },
      { title: "Statutory outputs", desc: "Ready-to-file challans, registers and returns generated from the same payroll run." },
      { title: "Employee self-service app", desc: "Payslips, leave balances, requests and reimbursements on each worker's phone." },
    ],
    results: [
      "Payroll cycle fell from two days of consolidation to a single day, including statutory outputs.",
      "Zero payroll errors across the first six live runs, verified against the parallel-run baseline.",
      "620 employees across three factories onboarded in 14 weeks, with HR trained on their own data before cutover.",
      "HR walk-ups for payslips and leave balances dropped sharply once self-service went live on mobile.",
    ],
    integrations: ["Biometric device APIs (3 brands)", "Tally", "Bank salary file export", "EPFO & ESIC formats", "SMS gateway"],
    testimonial: {
      quote: "Month-end used to mean two sleepless days for HR. Now payroll closes in one, and the challans are ready before anyone asks.",
      name: "Rekha Patil",
      role: "Head of HR, auto-components manufacturer",
    },
  },
  {
    slug: "dental-clinic-chain-digital",
    client: "Dental clinic chain, 9 branches",
    sector: "Healthcare",
    title: "From phone diaries to a queue that runs itself",
    problem:
      "Appointments lived in phone diaries and WhatsApp. No-shows ran 30%, patient history was scattered across branches, and receptionists spent their day on reminder calls.",
    result:
      "A central booking system with WhatsApp confirmations, automated reminders, unified patient records across all branches and a reception dashboard per clinic.",
    metrics: [
      { value: "-62%", label: "No-shows" },
      { value: "9 branches", label: "One patient record" },
      { value: "3.5 hrs/day", label: "Reception time saved" },
    ],
    stack: ["React Native", "Node.js", "WhatsApp Business API", "PostgreSQL"],
    timeline: "10 weeks",
    team: "4 people",
    approach: [
      "Moved booking to a central system with per-branch calendars, dentist schedules and treatment-slot rules.",
      "Automated WhatsApp confirmations and T-24h/T-2h reminders with one-tap reschedule links.",
      "Unified patient history — prescriptions, X-rays, treatment notes — across all nine branches.",
      "Gave each reception a live queue view with walk-in handling, keeping phone bookings as a fallback.",
    ],
    industryContext:
      "Multi-branch clinics grow faster than their front desks. Appointment diaries stay local to each branch, patient history is scattered, and reception staff spend their day making reminder calls that patients ignore. No-shows leave chairs idle, and every idle chair is lost revenue plus a longer wait for the next patient.",
    challenges: [
      "Nine branches kept nine phone diaries; a patient's history at one branch was invisible at the others",
      "No-shows ran at 30%, and reminder calls consumed most of each receptionist's day",
      "Prescriptions, X-rays and treatment notes lived in paper files and WhatsApp photos",
      "Walk-ins and phone bookings collided with online requests, producing double bookings",
    ],
    solution:
      "We built a central booking and patient-record system: per-branch calendars with dentist schedules and treatment-slot rules, automated WhatsApp confirmations and T-24h/T-2h reminders with one-tap reschedule, a unified patient record across all nine branches, and a reception dashboard with live queue, walk-in handling and token display. Phone bookings remain as a fallback inside the same calendar.",
    modules: [
      { title: "Central appointment engine", desc: "Concurrency-safe slots per branch, dentist and chair, with buffers and holiday calendars." },
      { title: "WhatsApp confirmations & reminders", desc: "Multi-touch reminder cadence with one-tap confirm or reschedule links." },
      { title: "Unified patient record", desc: "History, prescriptions, X-rays and treatment plans visible at any branch with role-scoped access." },
      { title: "Reception console", desc: "Live queue, walk-in handling, token display and same-day rescheduling for each clinic." },
      { title: "Billing & treatment plans", desc: "Multi-visit treatment plans with per-visit billing and GST-compliant invoices." },
      { title: "Privacy & audit", desc: "Role-based access and an audit log on every record view and edit, DPDP-aligned." },
    ],
    results: [
      "No-shows fell 62% within the first quarter after WhatsApp reminders with reschedule links went live.",
      "All nine branches now share one patient record; a returning patient is recognised at any location.",
      "Reception staff recovered about 3.5 hours per day previously spent on reminder calls.",
      "Double bookings dropped to zero once walk-ins, phone and online bookings shared one calendar.",
    ],
    integrations: ["WhatsApp Business API", "SMS gateway", "Razorpay", "Thermal printers for tokens", "Google Calendar sync"],
    testimonial: {
      quote: "Our receptionists finally talk to the patients in front of them instead of chasing the ones who aren't coming. Chairs are full.",
      name: "Dr. Nikhil Shah",
      role: "Founder, dental clinic chain",
    },
  },
  {
    slug: "d2c-brand-ecommerce-rto",
    client: "D2C apparel brand",
    sector: "Retail / D2C",
    title: "Cutting COD returns by a third without touching revenue",
    problem:
      "Cash on delivery drove 58% of orders — and 31% of them returned to origin. Blanket COD fees were being considered; the brand wanted the revenue without the risk.",
    result:
      "Risk-segmented checkout: WhatsApp order confirmation, pincode-level rules from their own courier history and prepaid nudges — RTO down by a third with conversion roughly flat.",
    metrics: [
      { value: "31% → 21%", label: "COD RTO" },
      { value: "+8%", label: "Prepaid share" },
      { value: "₹6.2L/mo", label: "Reverse-logistics saved" },
    ],
    stack: ["Next.js", "Razorpay", "Shiprocket API", "WhatsApp Business API"],
    timeline: "8 weeks",
    team: "4 people",
    approach: [
      "Built pincode risk scores from 18 months of the brand's own courier return data — not generic blacklists.",
      "Added WhatsApp order confirmation for COD orders with a two-hour response window before dispatch.",
      "Introduced prepaid nudges (small discount, UPI-first checkout) funded by the RTO savings.",
      "Built a returns dashboard the ops team actually uses: refusal flags, pincode trends and courier SLA tracking.",
    ],
    industryContext:
      "Cash on delivery is a third of Indian e-commerce and most of its risk. COD orders convert far better than prepaid and return to origin far more often; every RTO costs two-way shipping, packaging and a week of working capital. The naive fixes — disabling COD or blanket fees — trade real revenue for a small reduction in risk.",
    challenges: [
      "58% of orders were COD and 31% of those returned to origin, absorbing most of the brand's logistics budget",
      "No visibility into which pincodes, products or customers drove returns — decisions were made on anecdote",
      "Orders shipped without confirmation, so refusals were discovered only when the courier gave up",
      "Prepaid checkout was clunky enough that customers defaulted to COD even when they intended to pay",
    ],
    solution:
      "We built a risk-segmented checkout and operations layer on the brand's Next.js storefront: pincode risk scores computed from 18 months of the brand's own courier data, WhatsApp order confirmation for COD with a two-hour window before dispatch, repeat-refuser flags, partial COD fees only for high-risk pincodes, a UPI-first prepaid flow with small nudges, and a returns dashboard tracking refusals, pincode trends and courier SLAs.",
    modules: [
      { title: "Pincode risk engine", desc: "Return probability per pincode from the brand's own history, refreshed weekly." },
      { title: "COD confirmation flow", desc: "WhatsApp confirmation with a two-hour response window; unconfirmed orders held before dispatch." },
      { title: "Repeat-refuser detection", desc: "Customer-level flags across phone, address and device signals with prepaid-only fallback." },
      { title: "UPI-first checkout", desc: "One-page checkout with UPI intent first, saved addresses and a small prepaid discount." },
      { title: "Shipping integration", desc: "Shiprocket rates, labels, NDR workflows and courier SLA tracking per pincode." },
      { title: "Returns & margin dashboard", desc: "RTO rate, reverse-logistics cost and net revenue per order for the operations team." },
    ],
    results: [
      "COD return-to-origin fell from 31% to 21% within eight weeks of launch.",
      "Prepaid share rose eight percentage points, funded by discounts smaller than the RTO cost they replaced.",
      "Reverse-logistics spend dropped by about ₹6.2 lakh per month while overall conversion stayed roughly flat.",
      "The operations team now decides pincode rules from data, reviewed weekly on the returns dashboard.",
    ],
    integrations: ["Razorpay", "Shiprocket API", "WhatsApp Business API", "Meta & Google product feeds", "Google Analytics 4"],
    testimonial: {
      quote: "We kept COD and cut returns by a third. The dashboard changed how our ops team talks about pincodes — it's numbers now, not gut feel.",
      name: "Aisha Khan",
      role: "Co-founder, D2C apparel brand",
    },
  },
  {
    slug: "school-lms-fees-automation",
    client: "K-12 school group, 4 campuses",
    sector: "Education",
    title: "An LMS that parents actually open — and fees that reconcile themselves",
    problem:
      "Three disconnected tools (one per campus), fee collection tracked in spreadsheets, and homework/announcements on WhatsApp groups parents muted.",
    result:
      "One LMS across all campuses: homework, attendance, announcements and online fee payment with automatic reconciliation. Parent app engagement is daily, not occasional.",
    metrics: [
      { value: "94%", label: "Fee on-time collection" },
      { value: "Daily", label: "Parent app usage" },
      { value: "40+ hrs/mo", label: "Admin time saved" },
    ],
    stack: ["Flutter", "Node.js", "PostgreSQL", "Razorpay"],
    timeline: "16 weeks",
    team: "6 people",
    approach: [
      "Consolidated four campuses into one data model with per-campus branding, roles and calendars.",
      "Engineered for low-bandwidth parents: offline-first homework views and lightweight notifications.",
      "Automated fee schedules, receipts, reminders and reconciliation against the bank statement.",
      "Trained teachers in small groups on their own classes — adoption was 100% within three weeks.",
    ],
    industryContext:
      "School groups accumulate tools the way they accumulate campuses: one LMS per acquisition, fees in spreadsheets, and homework on WhatsApp groups parents mute. Most parents are on mid-range Android phones with patchy 4G, so an app that assumes fibre and a laptop simply goes unopened.",
    challenges: [
      "Four campuses ran three unrelated tools; no single view of attendance, results or fees existed",
      "Fee collection tracked in spreadsheets and reconciled against bank statements by hand each term",
      "Homework and announcements posted to WhatsApp groups most parents had muted",
      "Report cards compiled per class per term in Excel, with board-format output re-typed by hand",
    ],
    solution:
      "We consolidated the four campuses into one LMS with per-campus branding, roles and calendars: homework and attendance that work offline-first on low-end Android, announcements delivered as lightweight push and WhatsApp notifications, online fee payment with instalment plans and automatic bank reconciliation, and exam and result workflows that generate board-format report cards.",
    modules: [
      { title: "Multi-campus core", desc: "One data model with per-campus branding, calendars, roles and reporting." },
      { title: "Offline-first parent app", desc: "Homework, attendance and notices cached on the device; syncs when the connection returns." },
      { title: "Fee management", desc: "Instalment schedules, payment links, receipts, reminders and automatic bank-statement reconciliation." },
      { title: "Exams & results", desc: "Marks entry, moderation and board-format report-card generation per campus." },
      { title: "Teacher console", desc: "Attendance, homework posting and class-wise communication from a phone or laptop." },
      { title: "Admin dashboards", desc: "Collections, defaulters, attendance trends and engagement per campus for the management team." },
    ],
    results: [
      "On-time fee collection reached 94% in the first term after automated reminders and payment links went live.",
      "Parent-app usage became daily rather than occasional, because homework and notices now arrive where parents look.",
      "Administrative staff saved more than 40 hours a month on fee reconciliation and report-card preparation.",
      "All four campuses were live on one system in 16 weeks; teacher adoption reached 100% within three weeks of training.",
    ],
    integrations: ["Razorpay", "WhatsApp Business API", "Push notifications (FCM)", "Bank statement import", "Zoom / Google Meet"],
    testimonial: {
      quote: "Parents open the app every day now — that never happened with our old tools. And fees reconcile themselves, which our accounts team still finds hard to believe.",
      name: "Meera Iyer",
      role: "Group Administrator, K-12 school group",
    },
  },
  {
    slug: "cold-chain-fleet-tracking",
    client: "Cold-chain logistics operator",
    sector: "Logistics",
    title: "Temperature-proof delivery: live tracking that survives dead zones",
    problem:
      "Clients demanded temperature proof per trip. Drivers' phones lost signal on highway stretches; trip sheets were photographed and emailed, and disputes were settled by whoever's paperwork looked better.",
    result:
      "An offline-first driver app that buffers GPS and temperature readings without signal, syncing on reconnect — with a client-facing portal showing live trips and immutable proof trails.",
    metrics: [
      { value: "100%", label: "Trips with temp proof" },
      { value: "-70%", label: "Delivery disputes" },
      { value: "180 vehicles", label: "Live-tracked" },
    ],
    stack: ["React Native", "SQLite offline sync", "Node.js", "PostgreSQL", "IoT sensor integration"],
    timeline: "14 weeks",
    team: "5 people",
    approach: [
      "Built offline-first capture: GPS and temperature buffered locally, chunked uploads with idempotent sync.",
      "Integrated reefer temperature sensors so readings are machine-captured, not driver-reported.",
      "Shipped a client portal with live trip maps, ETA and downloadable per-trip compliance reports.",
      "Added exception alerts — temperature excursions and route deviations reach ops in under a minute.",
    ],
    industryContext:
      "Cold-chain logistics sells proof, not just transport. Pharma and food clients demand a temperature record for every trip, but highway dead zones break phone-based tracking, and paper trip sheets photographed at delivery settle disputes in favour of whoever's paperwork looks better.",
    challenges: [
      "Driver phones lost signal for long highway stretches, leaving gaps in GPS and temperature records",
      "Temperature readings were driver-reported from a dashboard gauge, not machine-captured",
      "Trip sheets were photographed and emailed; disputes over detention and excursions took weeks to settle",
      "Clients called the operations desk for status updates because there was no tracking link to share",
    ],
    solution:
      "We built an offline-first driver app that buffers GPS and reefer-sensor temperature readings locally and syncs in idempotent chunks when connectivity returns, integrated the reefer units' sensors so readings are machine-captured, and shipped a client portal with live trip maps, ETAs and downloadable per-trip compliance reports. Exception alerts for excursions and route deviations reach operations in under a minute.",
    modules: [
      { title: "Offline-first driver app", desc: "GPS and temperature buffered on the device; resumable, idempotent sync over weak signal." },
      { title: "Reefer sensor integration", desc: "Direct capture from temperature probes, removing driver-reported readings entirely." },
      { title: "Dispatch workbench", desc: "Trip creation, vehicle assignment, LR generation and e-way bill data per consignment." },
      { title: "Client tracking portal", desc: "Live map, ETA and an immutable temperature trail per trip, with PDF compliance exports." },
      { title: "Exception alerting", desc: "Excursion, detour and idle-time alerts routed to operations within a minute." },
      { title: "Fleet analytics", desc: "On-time performance, utilisation and per-vehicle cost for the fleet manager." },
    ],
    results: [
      "100% of trips now carry a machine-captured temperature proof trail that survives dead zones.",
      "Delivery disputes fell by 70% because every claim is settled from the same immutable record.",
      "180 vehicles were live-tracked within 14 weeks, with clients self-serving status from the portal.",
      "Status calls to the operations desk dropped sharply once clients had tracking links and alerts.",
    ],
    integrations: ["GPS telematics APIs", "Reefer temperature sensors (IoT)", "E-way bill portal", "SMS & WhatsApp", "Tally"],
    testimonial: {
      quote: "A pharma client audited us last quarter and we just exported the trip reports. That conversation used to take a week of digging.",
      name: "Rajan Pillai",
      role: "Managing Director, cold-chain logistics operator",
    },
  },
  {
    slug: "restaurant-direct-ordering",
    client: "QSR chain, 22 outlets",
    sector: "Food & Beverage",
    title: "Escaping the 30%: direct ordering that aggregates couldn't eat",
    problem:
      "Aggregator commissions took 28–30% of order value. The chain's own website converted poorly, and phone orders had no payment capture or order history.",
    result:
      "A direct-ordering PWA plus POS integration across 22 outlets: WhatsApp reordering, UPI checkout, loyalty and kitchen tickets — direct orders now a third of revenue.",
    metrics: [
      { value: "32% of revenue", label: "Direct orders (was 6%)" },
      { value: "₹0", label: "Commission on those orders" },
      { value: "41%", label: "Repeat rate via loyalty" },
    ],
    stack: ["Next.js PWA", "Node.js", "Razorpay", "Printer/KOT integration"],
    timeline: "12 weeks",
    team: "5 people",
    approach: [
      "Built an install-free PWA with two-tap reordering from WhatsApp — no app-store friction for repeat customers.",
      "Integrated directly with outlet POS/KOT printers so direct orders enter the same kitchen flow as walk-ins.",
      "Launched a points-based loyalty program redeemable across all outlets, with UPI-first checkout.",
      "Ran outlet-level rollout with QR table cards and staff incentives; each outlet went live in one day.",
    ],
    industryContext:
      "Food aggregators take 25–30% of every order and own the customer relationship. A direct channel doesn't replace them, but every order that moves to it is margin and data the restaurant keeps — provided the ordering experience is faster than opening the aggregator app.",
    challenges: [
      "Aggregator commissions consumed 28–30% of order value on the majority of delivery revenue",
      "The chain's own website converted poorly: slow on phones, no saved addresses, no repeat ordering",
      "Phone orders had no payment capture, no order history and no way to reach the kitchen except a shout",
      "Loyalty existed as paper stamp cards that nobody carried",
    ],
    solution:
      "We built an install-free progressive web app with two-tap reordering from WhatsApp, UPI-first checkout, live order tracking and a points-based loyalty programme redeemable across all 22 outlets. Direct orders print straight to each outlet's kitchen ticket printer through the existing POS, so they enter the same flow as walk-ins, and a manager view reconciles direct, aggregator and dine-in sales per item.",
    modules: [
      { title: "Ordering PWA", desc: "Menu with variants and photos, saved addresses, one-tap repeat order and no app-store install." },
      { title: "UPI-first checkout", desc: "UPI intent, cards and wallets via Razorpay, with order confirmation on WhatsApp." },
      { title: "POS & KOT integration", desc: "Direct orders printed to kitchen ticket printers at each outlet through the existing POS." },
      { title: "Loyalty programme", desc: "Points earned and redeemed across outlets, with birthday offers and win-back nudges." },
      { title: "WhatsApp reordering", desc: "A weekly reminder with the customer's last order and a two-tap repeat link." },
      { title: "Manager analytics", desc: "Direct vs aggregator share, item-level margin and repeat rate per outlet." },
    ],
    results: [
      "Direct orders grew from 6% to 32% of revenue within two quarters of launch.",
      "Zero commission is paid on those orders; the build cost was recovered from saved commissions in under a year.",
      "Loyalty members reorder at a 41% repeat rate, driven mostly by the WhatsApp two-tap flow.",
      "All 22 outlets went live within 12 weeks, each in a single day, with QR table cards and staff incentives.",
    ],
    integrations: ["Razorpay", "Existing POS / KOT printers", "WhatsApp Business API", "Google Maps", "GST invoicing"],
    testimonial: {
      quote: "A third of our delivery revenue now comes in with no commission attached. Regulars reorder from WhatsApp in two taps — they don't even open the aggregator apps.",
      name: "Farhan Sheikh",
      role: "Owner, QSR chain",
    },
  },
  {
    slug: "turf-booking-network-scale",
    client: "Sports-turf booking network",
    sector: "Sports / Travel",
    title: "From call-and-pray to 1,800 automated bookings a month",
    problem:
      "Bookings arrived by calls and WhatsApp; double-bookings were weekly, no-shows were 25%, and slot pricing was flat regardless of peak demand.",
    result:
      "A multi-turf booking platform with real-time slot inventory, UPI-verified bookings, smart reminders and dynamic peak pricing. No-shows fell by two-thirds.",
    metrics: [
      { value: "1,800/mo", label: "Paid online bookings" },
      { value: "25% → 8%", label: "No-shows" },
      { value: "+18%", label: "Peak-slot revenue" },
    ],
    stack: ["Next.js", "Node.js", "PostgreSQL", "Razorpay", "WhatsApp Business API"],
    timeline: "9 weeks",
    team: "4 people",
    approach: [
      "Centralised slot inventory across all venues with per-turf rules, blocking and maintenance windows.",
      "Made every booking UPI-verified with a WhatsApp confirmation and reminder chain.",
      "Introduced peak/off-peak pricing with an admin-adjustable rate card per venue.",
      "Added operator dashboards for occupancy, repeat customers and revenue per slot hour.",
    ],
    industryContext:
      "Sports-turf venues sell perishable inventory: an empty 7 p.m. slot on a Saturday is revenue gone forever. Bookings by phone and WhatsApp mean double bookings, unpaid holds that block slots, and flat pricing that leaves peak-hour money on the table while off-peak slots sit empty.",
    challenges: [
      "Bookings arrived by call and WhatsApp across multiple venues; double bookings happened weekly",
      "No-shows ran at 25% because bookings were unpaid holds with no reminder",
      "Slot pricing was flat regardless of demand, so peak slots sold out cheap and off-peak slots stayed empty",
      "Owners had no view of occupancy, repeat customers or revenue per slot hour across venues",
    ],
    solution:
      "We built a multi-turf booking platform with centralised real-time slot inventory, per-turf rules and maintenance windows, UPI-verified bookings with WhatsApp confirmation and reminders, admin-adjustable peak and off-peak rate cards, and operator dashboards for occupancy and revenue. Unpaid holds auto-expire, and payment-verified bookings get priority.",
    modules: [
      { title: "Real-time slot inventory", desc: "Concurrency-safe availability across venues with buffers, blocking and maintenance windows." },
      { title: "UPI-verified booking", desc: "Razorpay payment links and UPI intent; unpaid holds expire automatically." },
      { title: "WhatsApp confirmation & reminders", desc: "Booking confirmation, T-24h and T-2h reminders with one-tap reschedule." },
      { title: "Dynamic rate cards", desc: "Peak, off-peak and weekend pricing per venue, editable by the operator." },
      { title: "Team & group bookings", desc: "Split payments and recurring weekly bookings for teams and academies." },
      { title: "Operator dashboards", desc: "Occupancy heatmaps, repeat-customer rate and revenue per slot hour per venue." },
    ],
    results: [
      "Paid online bookings reached 1,800 per month across the network within a quarter of launch.",
      "No-shows fell from 25% to 8% once every booking was payment-verified and reminded on WhatsApp.",
      "Peak-slot revenue rose 18% with dynamic pricing, while off-peak occupancy improved from discounted rates.",
      "Double bookings dropped to zero; the platform went live across all venues in nine weeks.",
    ],
    integrations: ["Razorpay", "WhatsApp Business API", "SMS gateway", "Google Maps", "Google Calendar"],
    testimonial: {
      quote: "We used to pray people would turn up. Now they've already paid, they've been reminded twice, and the Saturday evening slots earn what they're worth.",
      name: "Deepak Nair",
      role: "Founder, sports-turf booking network",
    },
  },
  {
    slug: "cloud-cost-rescue-engagement",
    client: "Fintech back-office platform",
    sector: "SaaS / DevOps",
    title: "The cloud bill audit: 34% recovered in one week, monitoring added the next",
    problem:
      "A growing SaaS platform's cloud costs had doubled in a year. Nobody owned the bill: forgotten staging environments, oversized instances and cross-region chatter inflated it monthly.",
    result:
      "A one-week cost audit plus structural fixes — right-sizing, lifecycle rules, transfer routing and budget alerts — recovering a third of spend, with monitoring and backup verification added immediately after.",
    metrics: [
      { value: "-34%", label: "Monthly cloud spend" },
      { value: "1 week", label: "Audit to fixes" },
      { value: "100%", label: "Backups restore-verified" },
    ],
    stack: ["AWS", "Terraform", "Grafana", "Node.js"],
    timeline: "4 weeks",
    team: "3 people",
    approach: [
      "Inventoried every resource with an owner; flagged the unowned ones and shut down the forgotten environments.",
      "Right-sized instances against 30-day utilisation data and applied storage lifecycle policies.",
      "Rerouted cross-region service traffic, the single largest fixable line item.",
      "Made savings structural: enforced tagging in CI, budget alerts at 80%, and Grafana dashboards with on-call alerts.",
    ],
    industryContext:
      "Cloud bills grow the way unused subscriptions do: slowly, invisibly, and with a plausible explanation for every line. For a SaaS platform without a named owner for infrastructure, forgotten environments, oversized instances and cross-region traffic can double the bill in a year without a single bad decision being made on purpose.",
    challenges: [
      "Monthly cloud spend had doubled in twelve months and nobody owned the bill",
      "Staging environments from finished projects were still running at full size",
      "Instances were sized for a traffic spike that never repeated; average utilisation was under 20%",
      "Backups existed but had never been restore-tested; monitoring was limited to a health-check ping",
    ],
    solution:
      "We ran a one-week cost audit — inventorying every resource against an owner, checking 30-day utilisation and tracing data-transfer charges — then applied structural fixes: shut down orphaned environments, right-sized instances, storage lifecycle policies and rerouted cross-region service traffic. In the following weeks we codified the setup in Terraform, enforced tagging in CI, added budget alerts and built Grafana dashboards with on-call routing, and restore-tested every backup.",
    modules: [
      { title: "Cost audit & inventory", desc: "Every resource mapped to an owner and purpose; orphaned assets flagged and retired." },
      { title: "Right-sizing & lifecycle", desc: "Instances resized to real utilisation; hot, cool and archive tiers applied to storage." },
      { title: "Traffic re-routing", desc: "Cross-region service calls consolidated, removing the single largest fixable line item." },
      { title: "Infrastructure as code", desc: "Existing environment codified in Terraform incrementally, without downtime." },
      { title: "Monitoring & alerting", desc: "Grafana dashboards, latency and error-rate alerts routed to a named on-call engineer." },
      { title: "Backup verification", desc: "Scheduled restore drills with documented recovery times for every data store." },
    ],
    results: [
      "Monthly cloud spend fell 34% within one week of the audit, before any architectural change.",
      "Every backup is now restore-verified on a schedule; recovery time is documented rather than assumed.",
      "Tagging enforced in CI and budget alerts at 80% keep the savings structural rather than a one-off cleanup.",
      "The recovered budget funded the monitoring and on-call setup the platform had been missing.",
    ],
    integrations: ["AWS Cost Explorer", "Terraform", "Grafana & Prometheus", "PagerDuty-style on-call routing", "GitHub Actions"],
    testimonial: {
      quote: "They migrated our platform to the cloud and set up CI/CD without a single weekend of downtime. Deploys that used to be a fire drill are now a non-event.",
      name: "Priya Nair",
      role: "CTO, SaaS platform",
    },
  },
];

export type Industry = {
  name: string;
  slug: string;
  icon: string;
  blurb: string;
  /** Fuller professional overview shown in the switchboard panel & detail lead, as 2-3 paragraphs: the failure mode, its cost, then how we build differently. */
  overview: string[];
  /** Sector pain points we design against. */
  challenges: string[];
  /** Regulatory / standards touchpoints we build for. */
  compliance: string[];
  outcomes: string[];
  proof?: { value: string; label: string }[];
  featuredCase?: { title: string; href: string };
  /** The systems we build for this sector, each with a one-line description. */
  deliverables: { title: string; desc: string }[];
  /** Sector-specific buyer questions. */
  faqs: { q: string; a: string }[];
};

export const industries: Industry[] = [
  {
    name: "FinTech & Lending",
    slug: "fintech-lending",
    icon: "landmark",
    blurb:
      "Loan origination, KYC, scoring and disbursal platforms built for Indian regulatory reality — audit-ready by design, not as an afterthought.",
    overview: [
      "Indian lending runs on tight timelines and tighter scrutiny. We build origination, underwriting and servicing platforms that automate KYC and bureau pulls, enforce maker-checker controls on every money movement, and keep an immutable audit trail your auditor — and the regulator's — can walk end to end.",
      "Running on spreadsheets instead costs lenders at the worst moment: a file stuck in manual KYC for days loses the customer to a faster competitor, disbursal and collection data scattered across sheets means nobody can produce a clean NPA number on demand, and audit prep that takes weeks pulls the credit team off lending just to answer a sampling request.",
      "We've shipped this exact discipline as our own product — Dream Loans — so co-applicants, deviation approvals, part-disbursals and NPA classification arrive already solved. A thin slice from application to decision is typically live in three weeks, and processing time falls by 65% once the pipeline replaces the spreadsheet.",
    ],
    challenges: [
      "Manual KYC and bureau checks stalling every file",
      "Disbursal and collection data scattered across sheets and legacy cores",
      "Audit prep taking weeks because trails are reconstructed by hand",
      "Product changes stuck in dev queues for months",
    ],
    compliance: [
      "RBI digital-lending guidelines",
      "CKYC / Aadhaar e-KYC",
      "CIC bureau integrations (CIBIL, Experian)",
      "DPDP Act consent handling",
      "Audit-grade logging",
    ],
    outcomes: ["Origination & disbursal", "KYC & scoring", "Audit-ready ledgers", "Regulatory compliance"],
    deliverables: [
      { title: "Loan origination system", desc: "Application intake, KYC, bureau pulls, configurable credit policy and maker-checker approvals." },
      { title: "Loan management & collections", desc: "Disbursal, EMI schedules, NACH mandates, NPA classification and collections workflows." },
      { title: "DSA & co-lending portals", desc: "Partner lead submission, status transparency and commission or split tracking." },
      { title: "Customer app & servicing", desc: "Statements, payments, foreclosure requests and document downloads on the borrower's phone." },
    ],
    faqs: [
      { q: "Can you build for RBI digital-lending guidelines?", a: "Yes — consent logging, disclosure screens, maker-checker on every money movement and immutable audit trails are architectural defaults in our lending builds, not add-ons." },
      { q: "Do you integrate with bureaus and KYC providers?", a: "CIBIL and Experian pulls, Aadhaar and PAN verification, e-sign and NACH mandates are standard integrations we have shipped in production." },
      { q: "How long does an origination platform take?", a: "A thin slice — application to KYC to decision — is live by week three; a full origination-to-disbursal platform typically reaches production in 8–12 weeks." },
    ],
    proof: [
      { value: "65%", label: "Faster loan processing" },
      { value: "0→1", label: "Complete audit trail" },
      { value: "8 wks", label: "To first deploy" },
    ],
    featuredCase: {
      title: "Dream Loans: NBFC origination, KYC & disbursal platform",
      href: "/case-studies/loan-origination-nbfc",
    },
  },
  {
    name: "Healthcare",
    slug: "healthcare",
    icon: "heartPulse",
    blurb:
      "Clinic management, appointments, EMR and telemedicine platforms built around patient-data privacy — access-controlled, audit-logged and compliant with Indian data-protection expectations.",
    overview: [
      "Clinical software fails when it fights the way doctors actually work. We build clinic management, EMR and telemedicine systems around real consultation workflows — fast to use between patients, access-controlled by role, and audit-logged so patient data stays private and provable.",
      "The alternative costs clinics in idle chairs and exposed data: a third of appointments go unattended when there's no reminder chain, a patient's history at one branch is invisible at another so every consultation restarts from zero, and records kept in paper files and WhatsApp photos are exactly what a DPDP audit or a privacy complaint finds first.",
      "We go live with the appointment queue and EMR first, because that's the path staff touch every hour, then bring labs, pharmacy, billing and telemedicine onto the same patient record. Clinics typically see no-shows fall by a third within the first quarter, with every record view and edit logged from day one.",
    ],
    challenges: [
      "Appointments and records living in registers and WhatsApp",
      "No-shows and idle chairs with no recall or follow-up system",
      "Billing, claims and inventory tracked in disconnected tools",
      "Privacy expectations outpacing what current tools can evidence",
    ],
    compliance: [
      "DPDP Act data-protection controls",
      "Role-based access & audit logs",
      "ABDM-ready record structures",
      "Consent & retention policies",
    ],
    outcomes: ["Appointments & EMR", "Patient portals", "Billing & claims", "Telemedicine"],
    deliverables: [
      { title: "Clinic & hospital management", desc: "Appointments, token queues, specialty EMR, prescriptions and multi-branch patient records." },
      { title: "Lab & diagnostics platforms", desc: "Order tracking, analyser integration, result uploads and WhatsApp report delivery." },
      { title: "Telemedicine", desc: "Video consults with payment, e-prescriptions and notes in the same patient timeline." },
      { title: "Pharmacy, billing & TPA", desc: "Stock-linked billing, insurance workflows and GST-compliant invoicing." },
    ],
    faqs: [
      { q: "How do you protect patient data?", a: "Role-scoped access, audit logs on every record view and edit, encryption at rest and in transit, and deployment on infrastructure you own — privacy is architectural, not a policy page." },
      { q: "Can you integrate with our lab analysers?", a: "Where analysers expose HL7 or vendor interfaces we integrate directly; otherwise a fast worklist screen keeps results digital end to end." },
      { q: "Do you support multiple branches?", a: "Yes — shared patient records with per-branch calendars, queues and reporting; doctors can see history from any branch with permission." },
    ],
    proof: [
      { value: "35%", label: "Fewer no-shows" },
      { value: "100%", label: "Records digitised" },
      { value: "24/7", label: "Patient access" },
    ],
    featuredCase: {
      title: "Dental clinic chain: digital front desk across 9 branches",
      href: "/case-studies/dental-clinic-chain-digital",
    },
  },
  {
    name: "Retail & E-commerce",
    slug: "retail-ecommerce",
    icon: "shoppingBag",
    blurb:
      "POS, inventory and storefronts that keep stock and sales in one accountable system — offline-first terminals, automated reorder thresholds and HQ-level visibility across every store.",
    overview: [
      "Retail margins live and die on stock accuracy. We build POS, inventory and storefront systems where every counter, warehouse and channel reads from one ledger — offline-first billing that survives outages, automated reorder thresholds and HQ dashboards that surface shrinkage before month-end does.",
      "Running counters and channels as separate systems bleeds margin quietly: a cloud-only POS that stops billing the moment the internet drops turns an evening rush into a queue of frustrated customers, stock counted by hand weekly means shrinkage is discovered days after it happened, and orders reconciled manually across marketplace, POS and website is how a stock-out looks like healthy inventory on paper.",
      "Our terminals keep billing, printing and decrementing stock locally through any outage and sync the moment the line returns — the only test that actually matters at the counter. A 200-store rollout cut stock-out time by 40% and moved month-end reporting from three days of spreadsheets to a same-day dashboard.",
    ],
    challenges: [
      "Stock counts differing between store, godown and online",
      "Billing stalls during internet outages",
      "Discounts and returns leaking margin without a trail",
      "Marketplace, POS and website orders reconciled by hand",
    ],
    compliance: [
      "GST-compliant invoicing",
      "E-invoicing & e-way bill readiness",
      "PCI-aware payment integration",
      "Marketplace API sync (Amazon, Flipkart)",
    ],
    outcomes: ["POS & inventory", "Storefronts", "Order management", "Multi-channel sync"],
    deliverables: [
      { title: "Offline-first POS", desc: "Billing that survives outages, GST receipts, barcode and weighing-scale flows, shift and cash controls." },
      { title: "Inventory & multi-store HQ", desc: "Live stock per outlet and godown, reorder thresholds from sell-through and shrinkage reporting." },
      { title: "D2C storefronts", desc: "Fast Next.js storefronts with UPI-first checkout, COD confirmation and RTO risk rules." },
      { title: "Marketplace & order sync", desc: "Amazon, Flipkart and website orders reconciled into one order-management system." },
    ],
    faqs: [
      { q: "What happens to billing when the internet drops?", a: "Nothing — our POS terminals bill, print and decrement stock locally, then sync with conflict-safe reconciliation when the line returns." },
      { q: "Can you cut our COD returns?", a: "Yes — confirmation workflows, pincode risk rules from your own courier history and prepaid nudges typically reduce RTO by a third without hurting conversion." },
      { q: "Do you work with our existing hardware?", a: "Usually — standard Windows and Android terminals, thermal printers, scanners and weighing scales are supported, so most counters need nothing new." },
    ],
    proof: [
      { value: "40%", label: "Less stock-out time" },
      { value: "3×", label: "Faster reporting" },
      { value: "200", label: "Stores onboarded" },
    ],
    featuredCase: {
      title: "QSR chain: POS + inventory across 200 stores",
      href: "/case-studies/pos-inventory-qsr",
    },
  },
  {
    name: "Real Estate",
    slug: "real-estate",
    icon: "building",
    blurb:
      "Listing, lead and CRM platforms that move a property from enquiry to closure — lead scoring, site-visit scheduling and document workflows in one pipeline.",
    overview: [
      "Property sales is a follow-up game, and most CRMs lose the thread after enquiry #3. We build lead-to-closure platforms that score and route every enquiry, schedule site visits that actually happen, and keep agreement-to-registration documents moving through checkpoints nobody can skip.",
      "Four enquiries in ten never get a second call when nobody owns the lead — and each one cost real marketing rupees to generate from a portal or a hoarding. Site visits booked over the phone and forgotten mean the buyer who does turn up meets nobody, and broker commissions reconciled from memory every month sour the exact channel that brings the leads in.",
      "Our rule is simple: no lead exists without a next action and a due date, enforced by the system rather than a manager's memory. A multi-city developer saw 2.1× more site visits and zero dropped leads within weeks of rolling the pipeline out to real leads.",
    ],
    challenges: [
      "Leads from portals, ads and walk-ins scattered across inboxes",
      "Site visits booked and forgotten",
      "Broker and channel-partner payouts reconciled manually",
      "Agreements and approvals tracked over email",
    ],
    compliance: [
      "RERA-aligned workflows & disclosures",
      "TDS & GST handling on transactions",
      "DPDP-compliant lead consent",
    ],
    outcomes: ["Listings & lead capture", "Broker CRM", "Document workflows", "Virtual tours"],
    deliverables: [
      { title: "Lead-to-closure CRM", desc: "Portal, website and broker leads in one pipeline with scoring, cadences and mandatory next actions." },
      { title: "Site-visit & channel-partner tools", desc: "Visit scheduling with mobile check-in, and a partner portal with commission tracking." },
      { title: "Unit inventory & payment milestones", desc: "Tower and unit availability, construction-linked plans, demand letters and receipts." },
      { title: "Project websites & virtual tours", desc: "SEO-ready project sites with lead capture, 3D walkthroughs and RERA disclosures." },
    ],
    faqs: [
      { q: "Do you pull leads from 99acres and MagicBricks automatically?", a: "Yes — portal leads arrive via API or email parsing, deduplicated and scored, so your team works one list instead of six dashboards." },
      { q: "Can brokers see their own leads?", a: "Yes — a channel-partner portal shows submission status, visit outcomes and commissions, which keeps partners engaged and honest." },
      { q: "Do you handle RERA and construction-linked payments?", a: "Yes — RERA-aligned disclosures, milestone-based demand generation and Tally sync are standard in our real-estate builds." },
    ],
    proof: [
      { value: "2.1×", label: "More site visits" },
      { value: "0", label: "Leads dropped" },
      { value: "30%", label: "Faster closure" },
    ],
    featuredCase: {
      title: "Developer: lead-to-closure CRM, multi-city",
      href: "/case-studies/real-estate-lead-crm",
    },
  },
  {
    name: "Manufacturing",
    slug: "manufacturing",
    icon: "factory",
    blurb:
      "Production tracking, inventory and ERP modules that replace shop-floor paperwork — machine-wise output, BOM-level traceability and quality gates your supervisors actually use.",
    overview: [
      "Shop floors generate the truth; most systems never capture it. We build production, HRMS and maintenance systems that record machine output, shift attendance and quality checks at the source — so planning runs on live numbers, payroll closes in days, and every rework has a reason code.",
      "Re-keying paper into spreadsheets is where the truth gets lost: a stock number that disagrees between the register and the godown is discovered at the annual count, payroll that closes late every month because three biometric brands never talk to each other costs HR two days a cycle, and a quality escape with no reason code repeats itself because nobody can trace where it started.",
      "We integrate every device protocol into one attendance stream and turn shift, overtime and credit rules into configuration your team edits directly. A three-factory rollout cut the payroll cycle from two days to one with zero errors across the first six live runs.",
    ],
    challenges: [
      "Production data re-keyed from paper into spreadsheets",
      "Payroll and shift compliance closing late every month",
      "Maintenance reactive — breakdowns schedule the day",
      "Quality escapes that trace back to nothing",
    ],
    compliance: [
      "Factories Act attendance & overtime rules",
      "GST-compliant procurement",
      "ISO-aligned quality documentation",
      "Audit-ready material reconciliation",
    ],
    outcomes: ["Production tracking", "Inventory & BOM", "Quality workflows", "ERP integration"],
    deliverables: [
      { title: "Production & shop-floor tracking", desc: "Machine-wise output, job cards, rework reason codes and downtime capture at the source." },
      { title: "Inventory, BOM & job work", desc: "Multi-godown stock, BOM-level traceability, job-work issue and reconciliation with vendors." },
      { title: "HRMS & shift payroll", desc: "Biometric attendance, unit-wise shift and overtime rules, and Factories Act compliant payroll." },
      { title: "Quality & maintenance", desc: "Inspection checklists, quality gates and preventive-maintenance schedules supervisors actually use." },
    ],
    faqs: [
      { q: "Can the ERP work alongside Tally?", a: "Yes — operations run in the ERP and vouchers sync to Tally for statutory books, or we migrate you off Tally entirely. Your CA's workflow decides." },
      { q: "Do you integrate biometric devices and machines?", a: "Yes — we have integrated multiple biometric protocols and machine counters into single data streams, with exception reports for gaps." },
      { q: "How do you roll out without stopping production?", a: "Unit by unit, with a parallel run on real data and role-wise training on the floor before cutover — the same approach that closed a three-factory payroll in one day." },
    ],
    proof: [
      { value: "30%", label: "Less machine downtime" },
      { value: "25%", label: "Lower inventory cost" },
      { value: "100%", label: "BOM traceability" },
    ],
    featuredCase: {
      title: "Auto-components maker: HRMS rollout across 3 factories",
      href: "/case-studies/manufacturing-hrms-rollout",
    },
  },
  {
    name: "Logistics",
    slug: "logistics",
    icon: "truck",
    blurb:
      "Fleet, route and dispatch systems with live tracking and proof-of-delivery — one dashboard for fleet owners, drivers and the customers waiting on their consignments.",
    overview: [
      "Cold chain and last-mile run on proof, not promises. We build fleet-tracking and delivery platforms with GPS telematics, temperature probes and geofenced proof-of-delivery — every trip carries an evidence trail and every exception surfaces while the vehicle is still moving, not at invoice time.",
      "Running dispatch by phone call costs an operator on every trip: twenty 'where is my load' calls a day is a dispatcher who isn't dispatching, a proof of delivery photographed and emailed days later loses a detention dispute to whoever's paperwork looks better, and fuel, toll and expenses reconciled at month-end mean a losing route stays invisible until the damage is done.",
      "We build the driver app offline-first, because a dead zone is the first thing it has to survive, then layer in a dispatch workbench, customer tracking links and per-trip profitability on top. A cold-chain operator now tracks 98% on-time dispatch with fleet costs down 20%.",
    ],
    challenges: [
      "Trip status chased over phone calls",
      "Temperature excursions discovered after the claim",
      "Detention and shortage deductions disputed with no evidence",
      "Fuel and route costs reconciled from fuel slips",
    ],
    compliance: [
      "E-way bill integration",
      "AIS-140 GPS telematics standards",
      "GST-compliant consignment billing",
      "Cold-chain audit logging",
    ],
    outcomes: ["Fleet & route", "Live dispatch", "Proof of delivery", "Warehouse management"],
    deliverables: [
      { title: "Fleet tracking & dispatch", desc: "Live vehicles on a map, trip assignment, LR and e-way bill data, and exception alerts." },
      { title: "Offline-first driver app", desc: "Trip details, navigation, photo/OTP proof of delivery and location capture that survives dead zones." },
      { title: "Customer tracking portals", desc: "Shareable live status, ETA and delivery proof, with automatic delay notifications." },
      { title: "Warehouse & trip profitability", desc: "Inbound, put-away and dispatch flows plus fuel, toll and expense capture per trip." },
    ],
    faqs: [
      { q: "Do we need GPS devices in every vehicle?", a: "No — the driver app reports location on its own. GPS devices add precision where phones fail; we support both and mixed fleets." },
      { q: "Can you capture temperature for cold chain?", a: "Yes — we integrate reefer sensors so readings are machine-captured, buffered offline and attached to each trip as an immutable proof trail." },
      { q: "How do customers track consignments?", a: "A shareable link shows live status and proof of delivery, with automatic alerts on exceptions. It usually removes most 'where is my load' calls." },
    ],
    proof: [
      { value: "98%", label: "On-time dispatch" },
      { value: "20%", label: "Lower fleet cost" },
      { value: "Live", label: "Consignment tracking" },
    ],
    featuredCase: {
      title: "Cold-chain operator: live fleet & temperature tracking",
      href: "/case-studies/cold-chain-fleet-tracking",
    },
  },
  {
    name: "Agriculture",
    slug: "agriculture",
    icon: "wheat",
    blurb:
      "Supply-chain and traceability platforms connecting farms, aggregators and buyers — batch-level tracking from field to fork, with price and demand signals for every node.",
    overview: [
      "Agri value chains lose margin in the gaps between farmer, aggregator and buyer. We build procurement and traceability platforms that capture lots at the source, track quality and weight through every hand-off, and give both sides price and demand signals they can act on before the season decides for them.",
      "Without that visibility, provenance disappears the moment produce leaves the field, procurement weights and grades get disputed at every scale because there's no shared record, and working-capital decisions get made blind to real demand — while scheme and subsidy reports are compiled by hand, quarter after quarter.",
      "We design for the field first: offline-first capture on low-end Android so lots, weights and photos sync the moment signal returns, with vernacular UI that doesn't assume a smartphone expert on the other end. The result is batch-level traceability from farm gate to buyer and typically 20% less post-harvest loss.",
    ],
    challenges: [
      "Lot provenance unverifiable once produce leaves the field",
      "Procurement weights and grades disputed at every scale",
      "Working-capital decisions made without demand visibility",
      "Scheme and subsidy reporting compiled manually",
    ],
    compliance: [
      "FSSAI-linked batch traceability",
      "Mandi record formats & eNAM-ready data",
      "Warehouse receipt & grading records",
    ],
    outcomes: ["Supply-chain tracking", "Traceability", "Market linkage", "Crop analytics"],
    deliverables: [
      { title: "Procurement & lot traceability", desc: "Lot capture at the farm gate, grading and weight records through every hand-off, batch-level tracking to the buyer." },
      { title: "FPO & aggregator platforms", desc: "Member registries, procurement, payments and scheme reporting for farmer producer organisations." },
      { title: "Market-linkage apps", desc: "Price discovery, demand signals and order booking for farmers and buyers on low-end Android." },
      { title: "Warehouse & cold-storage systems", desc: "Warehouse receipts, inventory by lot and quality, and dispatch scheduling." },
    ],
    faqs: [
      { q: "Do your apps work in areas with poor connectivity?", a: "Yes — field capture is offline-first: lots, weights and photos are stored on the device and sync when signal returns, with no data lost." },
      { q: "Can you support FSSAI and mandi record formats?", a: "Yes — batch traceability aligned to FSSAI needs, and export formats compatible with mandi records and eNAM data are built into our agri work." },
      { q: "Can farmers with basic phones use the system?", a: "Yes — we design for mid-range Android with vernacular UI, large touch targets, and WhatsApp or SMS notifications for those who prefer them." },
    ],
    proof: [
      { value: "100%", label: "Batch traceability" },
      { value: "20%", label: "Less post-harvest loss" },
      { value: "1 app", label: "Farm to buyer" },
    ],
  },
  {
    name: "Construction",
    slug: "construction",
    icon: "hardHat",
    blurb:
      "Project, site and procurement systems that keep contractors, BOQs and timelines accountable end to end — daily progress, material reconciliation and safety compliance in one place.",
    overview: [
      "Construction overrun is booked quietly — in extra site days, unreconciled material and labour claims that surface at closure. We build project and site systems where daily progress, material issue and safety check-ins are captured on the site itself, and BOQ versus actual is visible while there's still time to act.",
      "Progress reported by phone and verified never is how a two-week delay becomes a two-month one before anyone raises a flag, material pilferage stays invisible until the stock audit finds a gap nobody can explain, and client billing held up by missing measurement records means cash flow suffers for work that's already been done.",
      "Site engineers capture progress, material issue and safety checklists from a phone app that works offline and syncs later — no laptop required on site. BOQ-versus-actual tracking surfaces overruns early, and measurement-book data flows straight into RA bills and GST works-contract invoices.",
    ],
    challenges: [
      "Progress reported by phone and verified never",
      "Material pilferage invisible until the stock audit",
      "Contractor labour and compliance records in paper files",
      "Client billing held up by missing measurement records",
    ],
    compliance: [
      "BOQ-based measurement & billing",
      "PF / ESI labour compliance records",
      "Site-safety audit checklists",
      "GST works-contract invoicing",
    ],
    outcomes: ["Project & site tracking", "BOQ & procurement", "Labour & vendor", "Safety compliance"],
    deliverables: [
      { title: "Site progress & daily reporting", desc: "Mobile progress capture with photos, work-done quantities and delay reasons per site." },
      { title: "BOQ, procurement & material reconciliation", desc: "BOQ versus actual, indents and approvals, GRN and material issue tracked to the site." },
      { title: "Labour, contractor & compliance", desc: "Contractor attendance, wage sheets, PF/ESI records and safety checklists." },
      { title: "Client billing & measurement books", desc: "Measurement records, RA bills and GST works-contract invoicing from site data." },
    ],
    faqs: [
      { q: "Can site engineers use it without a laptop?", a: "Yes — daily progress, material issue and safety check-ins are captured on a phone app that works offline on site and syncs later." },
      { q: "Does it handle BOQ versus actual?", a: "Yes — BOQ quantities, indents, GRNs and consumption are tracked per site so overruns show while there is still time to act." },
      { q: "Can it generate RA bills?", a: "Yes — measurement books and running-account bills are produced from recorded quantities, with GST works-contract invoicing." },
    ],
    proof: [
      { value: "20%", label: "Fewer delays" },
      { value: "100%", label: "BOQ accountability" },
      { value: "Daily", label: "Site progress reports" },
    ],
  },
  {
    name: "Education & EdTech",
    slug: "education-edtech",
    icon: "graduationCap",
    blurb:
      "Learning management, admissions and institute-operations platforms built for low-bandwidth learners — attendance, fee workflows and online classrooms that work on the devices students actually own.",
    overview: [
      "Learning platforms fail when they assume bandwidth and attention students don't have. We build LMS, admissions and institute-operations systems that stream and download cleanly on low-end devices, automate the fee and attendance workflows offices drown in, and give parents a portal they open voluntarily.",
      "A video that buffers on a real 4G connection is a course a student quietly stops opening, fees reconciled across cash, UPI and bank statements by hand every term means defaulters are found weeks late, and report cards compiled per class in Excel cost teaching staff days that should have gone to students instead.",
      "We build the daily-use path first — low-bandwidth video, offline-first attendance and homework, lightweight notifications — before layering in fees and admissions on top. A four-campus school group now sees daily parent-app engagement and collects 94% of fees on time.",
    ],
    challenges: [
      "Fees reconciled across cash, UPI and bank statements by hand",
      "Attendance and results compiled per class, per term",
      "Online classes that stall on low-bandwidth connections",
      "Parent communication scattered across SMS, apps and paper",
    ],
    compliance: [
      "DPDP Act minors' consent handling",
      "Fee receipt & refund audit trails",
      "Board-format report generation",
    ],
    outcomes: ["LMS & online classes", "Admissions & fees", "Exams & results", "Parent & student apps"],
    deliverables: [
      { title: "Learning management system", desc: "Course library, batches, low-bandwidth video, downloadable lessons and live-class integration." },
      { title: "Admissions & fee management", desc: "Enquiry-to-enrolment pipeline, instalment plans, payment links, reminders and bank reconciliation." },
      { title: "Exams, results & report cards", desc: "Auto-graded tests, marks entry, moderation and board-format report generation." },
      { title: "Parent & student apps", desc: "Attendance, homework, notices and results on the family's phone, offline-first." },
    ],
    faqs: [
      { q: "Will video work for students on slow connections?", a: "Yes — adaptive bitrate streaming, 360p-first defaults and downloadable lessons, tested on real mid-range Android devices rather than office Wi-Fi." },
      { q: "Can it run multiple campuses or centres?", a: "Yes — one data model with per-campus branding, calendars, fee structures and reporting, as we did for a four-campus school group." },
      { q: "Does it handle instalment fees and reminders?", a: "Yes — instalment schedules, automated reminders, payment links and defaulter lists are a core module with automatic bank-statement reconciliation." },
    ],
    proof: [
      { value: "3×", label: "More course completions" },
      { value: "70%", label: "Less admin paperwork" },
      { value: "24/7", label: "Student access" },
    ],
    featuredCase: {
      title: "K-12 school group: LMS & fee automation, 4 campuses",
      href: "/case-studies/school-lms-fees-automation",
    },
  },
  {
    name: "Travel & Hospitality",
    slug: "travel-hospitality",
    icon: "plane",
    blurb:
      "Booking engines, property management and guest-experience platforms — real-time availability, dynamic pricing and one dashboard for front desk, housekeeping and owners.",
    overview: [
      "Every empty room and idle slot is margin gone. We build booking engines, property-management and guest-experience platforms with real-time availability across counters and channels, dynamic pricing you control, and one dashboard where front desk, housekeeping and owners see the same truth.",
      "Availability that's out of sync between the OTA, the website and the front desk produces double bookings patched by apology and a refund, guest history trapped in a PMS nobody opens means a returning guest is treated like a stranger, and OTA commission reconciliation left to pile up at month-end quietly erodes a margin nobody's actually measuring.",
      "One shared availability ledger across every channel ends the double-booking problem outright, and dynamic pricing plus a guest app for pre-arrival check-in and WhatsApp concierge lift direct bookings. Our own turf-booking network runs 1,800 paid bookings a month on exactly this engine.",
    ],
    challenges: [
      "Availability out of sync between OTA, website and front desk",
      "Double bookings patched by apology",
      "Guest history trapped in a PMS nobody opens",
      "OTA commission reconciliation piling up at month-end",
    ],
    compliance: [
      "GST room-tariff & invoice rules",
      "Foreigner guest reporting (C-Form)",
      "Gateway settlement reconciliation",
    ],
    outcomes: ["Booking engines", "Property management", "Channel sync", "Guest experience"],
    deliverables: [
      { title: "Booking engines", desc: "Real-time availability, dynamic pricing and UPI-first checkout for rooms, slots and packages." },
      { title: "Property & venue management", desc: "Front desk, housekeeping, maintenance and owner dashboards in one system." },
      { title: "Channel management", desc: "OTA and website availability kept in sync with commission reconciliation at month-end." },
      { title: "Guest experience apps", desc: "Pre-arrival check-in, WhatsApp concierge, feedback and loyalty for repeat guests." },
    ],
    faqs: [
      { q: "Can you sync availability with OTAs?", a: "Yes — website, front desk and OTA channels read one availability ledger, so double bookings stop and commission reconciliation becomes a report." },
      { q: "Do you build for sports venues and turfs too?", a: "Yes — our turf-booking platform runs 1,800 paid bookings a month across a venue network with dynamic peak pricing and WhatsApp reminders." },
      { q: "Does it handle GST and C-Form requirements?", a: "Yes — room-tariff GST rules, invoice formats and foreign-guest reporting are built into our hospitality work." },
    ],
    proof: [
      { value: "25%", label: "More direct bookings" },
      { value: "0", label: "Double bookings" },
      { value: "Live", label: "Availability sync" },
    ],
    featuredCase: {
      title: "Sports-turf network: bookings scaled to 1,800 a month",
      href: "/case-studies/turf-booking-network-scale",
    },
  },
  {
    name: "Media & Entertainment",
    slug: "media-entertainment",
    icon: "clapperboard",
    blurb:
      "Streaming, publishing and creator platforms built for traffic spikes — CDN-backed video, subscription billing, content workflows and analytics that hold up on release day.",
    overview: [
      "Release day is a load test you get one shot at. We build streaming, publishing and creator platforms on CDN-backed delivery with adaptive bitrate, subscription billing that survives card failures gracefully, and content workflows that keep schedules honest as the catalogue grows.",
      "Playback that buffers exactly when traffic peaks is the moment a subscriber decides the service isn't worth it, a silently failed card renewal is churn nobody notices until the retention report runs, and rights and licensing tracked in spreadsheets means a royalty dispute takes days just to locate the paperwork for.",
      "We load-test before launch and build in a rollback path as standard, with retry logic and WhatsApp dunning that recovers a real share of failed renewals automatically. The platforms we've shipped hold 99.9% uptime through release-day traffic peaks.",
    ],
    challenges: [
      "Playback buffering exactly when traffic peaks",
      "Subscription churn from silently failed renewals",
      "Rights and licensing tracked in spreadsheets",
      "Audience data too coarse to program against",
    ],
    compliance: [
      "DPDP-compliant viewer consent",
      "Content-rights & royalty record keeping",
      "IT-rules-aligned grievance metadata",
    ],
    outcomes: ["Streaming & VOD", "Subscription billing", "Content workflows", "Audience analytics"],
    deliverables: [
      { title: "Streaming & video-on-demand", desc: "CDN-backed delivery with adaptive bitrate, DRM options and playback that holds up on release day." },
      { title: "Subscription & billing", desc: "Plans, trials, UPI autopay and card renewals with graceful failure handling to cut silent churn." },
      { title: "Content & rights workflows", desc: "Editorial calendars, approvals, metadata and licensing records instead of spreadsheets." },
      { title: "Creator & audience platforms", desc: "Creator dashboards, engagement products around live events and audience analytics you can programme against." },
    ],
    faqs: [
      { q: "Can the platform handle a release-day traffic spike?", a: "Yes — CDN-backed delivery, load-tested launches and autoscaling are standard, with a rollback plan in place before go-live." },
      { q: "How do you reduce subscription churn?", a: "UPI autopay, retry logic on failed renewals, dunning messages on WhatsApp and clear plan management typically recover a large share of silent cancellations." },
      { q: "Do you support DRM and content protection?", a: "Yes — DRM-protected playback, signed URLs and watermarking are available depending on the content's licensing requirements." },
    ],
    proof: [
      { value: "99.9%", label: "Uptime on peaks" },
      { value: "4K", label: "Adaptive streaming" },
      { value: "1 dashboard", label: "All content" },
    ],
  },
  {
    name: "Energy & Utilities",
    slug: "energy-utilities",
    icon: "zap",
    blurb:
      "Metering, billing and field-service platforms for distribution and solar operators — consumption analytics, outage tracking and consumer portals that cut billing disputes.",
    overview: [
      "Distribution losses hide in unmetered corners. We build metering, billing and field-service platforms that stream consumption readings, flag outage and tamper events in real time, and give consumers a portal that answers its own questions — so your call centre stops being the billing department.",
      "Manual meter reading delays entire billing cycles, AT&C losses stay unmapped by feeder and consumer until the annual audit forces the question, and field crews dispatched without job context waste a truck roll on a job they arrive unprepared for — while every consumer dispute gets settled on paper-trail memory instead of shared data.",
      "We ingest readings from smart meters or legacy sources via mobile capture, and give consumers the same consumption and tariff breakdown your team sees — most disputes end the moment both sides look at the same numbers. Utilities running this model report 18% lower AT&C losses and 30% fewer billing disputes.",
    ],
    challenges: [
      "Billing cycles delayed by manual meter reading",
      "AT&C losses unmapped by feeder and consumer",
      "Field crews dispatched without job context",
      "Consumer disputes settled on paper-trail memories",
    ],
    compliance: [
      "Tariff & billing regulation formats",
      "Meter-data standards (DLMS / AMI)",
      "Renewable-purchase obligation reporting",
    ],
    outcomes: ["Smart metering", "Billing & payments", "Field service", "Consumer portals"],
    deliverables: [
      { title: "Metering & billing platforms", desc: "Consumption ingestion from smart meters, tariff engines and billing cycles that close on time." },
      { title: "Field-service management", desc: "Work orders, crew dispatch with job context, and mobile completion with photo proof." },
      { title: "Consumer portals & apps", desc: "Bills, payments, usage history, outage reporting and complaint tracking for consumers." },
      { title: "Solar & renewable operations", desc: "Plant monitoring, generation reports and obligation reporting for solar operators." },
    ],
    faqs: [
      { q: "Can you integrate with our existing meters?", a: "Yes — we work with DLMS and AMI meter data standards and can ingest legacy meter readings via mobile capture where smart meters are not yet deployed." },
      { q: "How do consumer portals reduce disputes?", a: "By showing consumption history, tariff breakdown and payment records the consumer can verify — most disputes end when both sides see the same data." },
      { q: "Do you handle regulatory reporting formats?", a: "Yes — tariff and billing formats, and renewable-purchase obligation reports, are mapped during scoping and generated from the same data." },
    ],
    proof: [
      { value: "30%", label: "Fewer billing disputes" },
      { value: "18%", label: "Lower AT&C losses" },
      { value: "Real-time", label: "Consumption data" },
    ],
  },
  {
    name: "Non-profit & NGO",
    slug: "non-profit",
    icon: "heartHandshake",
    blurb:
      "Donor, beneficiary and program-impact platforms that make every rupee traceable — donation flows, beneficiary registries and impact dashboards your funders can trust.",
    overview: [
      "Funders fund what they can trace. We build donor, beneficiary and program platforms where every rupee maps to an activity, beneficiary registries dedupe across programs, and impact dashboards export in the exact format your next proposal — or your FCRA audit — asks for.",
      "Program data trapped in offline spreadsheets per field office means head office reports last quarter's reality at best, donation receipts and 80G records compiled by hand at year-end invite exactly the kind of error an FCRA audit flags, and beneficiary duplication across programs quietly overstates the reach a funder was promised.",
      "Field staff capture activities and beneficiary updates offline on mobile, synced the moment connectivity returns, so head office works from the same data the field just recorded. Fund traceability reaches 100%, and impact reporting that used to take weeks becomes a same-day export.",
    ],
    challenges: [
      "Program data in offline spreadsheets per field office",
      "Donation receipts and 80G records compiled manually",
      "Beneficiary duplication across programs",
      "Impact reporting rebuilt from memory every quarter",
    ],
    compliance: [
      "FCRA & FEMA reporting readiness",
      "80G / 12A receipt compliance",
      "CSR-1 & donor reporting formats",
      "Audit-ready fund-utilisation trails",
    ],
    outcomes: ["Donor management", "Beneficiary registry", "Impact dashboards", "FCRA-ready reports"],
    deliverables: [
      { title: "Donor management & receipts", desc: "Donation flows, 80G receipts, recurring giving and donor communication in one system." },
      { title: "Beneficiary registries", desc: "Deduplicated beneficiary records across programmes with consent and field-office access." },
      { title: "Programme & impact tracking", desc: "Activities, outputs and outcomes captured in the field and rolled up into funder dashboards." },
      { title: "Compliance reporting", desc: "FCRA, CSR-1 and fund-utilisation reports exported in the formats funders and auditors ask for." },
    ],
    faqs: [
      { q: "Can field staff capture data offline?", a: "Yes — programme activities and beneficiary updates are captured on mobile offline and synced later, which is essential for rural field offices." },
      { q: "Do you support 80G receipts and FCRA reporting?", a: "Yes — receipt generation, donor records and fund-utilisation trails are structured so FCRA and 80G reporting becomes an export rather than a reconstruction." },
      { q: "Is there NGO-friendly pricing?", a: "We scope non-profit work carefully to the essentials, and phase builds so the highest-value module lands first within the budget you have." },
    ],
    proof: [
      { value: "100%", label: "Fund traceability" },
      { value: "2×", label: "Faster reporting" },
      { value: "80/12", label: "G / B tax-ready" },
    ],
  },
  {
    name: "Professional Services",
    slug: "professional-services",
    icon: "briefcase",
    blurb:
      "Practice management for CA firms, law offices and consultancies — engagement tracking, document vaults, billing and compliance calendars in one accountable system.",
    overview: [
      "A practice sells time and judgment; both leak without a system. We build practice-management platforms for CA, law and consulting firms — engagement and deadline tracking, document vaults with version control, and time-and-billing that captures work where it happens instead of reconstructing it at invoice time.",
      "Billable time reconstructed from calendar memory at month-end is billable time quietly under-invoiced, deadlines tracked per partner rather than per firm mean a missed statutory date is discovered by the client instead of the practice, and client documents scattered across email and personal drives are a confidentiality incident waiting to happen.",
      "Compliance calendars generate due dates per client and engagement type automatically, with ownership and completion evidence recorded as work happens rather than reconstructed later. Practices running this system report realisation rates they can see in real time and roughly 15 hours saved per week that used to go to admin.",
    ],
    challenges: [
      "Billable time reconstructed from calendar memory",
      "Deadlines tracked per partner, not per firm",
      "Client documents scattered across email and personal drives",
      "Realisation rates known only at year-end",
    ],
    compliance: [
      "ICAI / Bar council record norms",
      "TDS & GST-compliant invoicing",
      "Client-conflict & confidentiality controls",
    ],
    outcomes: ["Practice management", "Document vaults", "Time & billing", "Compliance calendars"],
    deliverables: [
      { title: "Practice management", desc: "Engagements, tasks, deadlines and client communication tracked per firm, not per partner." },
      { title: "Document vaults", desc: "Version-controlled client documents with access controls and client-facing sharing portals." },
      { title: "Time, billing & realisation", desc: "Time captured where work happens, invoicing with TDS and GST, and realisation reports." },
      { title: "Compliance calendars", desc: "Statutory due dates per client with reminders, ownership and completion evidence." },
    ],
    faqs: [
      { q: "Can it track statutory deadlines across all clients?", a: "Yes — compliance calendars generate due dates per client and engagement type, assign owners and record completion evidence for the firm." },
      { q: "Do you handle confidentiality and conflict checks?", a: "Yes — role-scoped access, matter-level permissions and conflict-check workflows are built in for law and audit practices." },
      { q: "Can clients access their own documents?", a: "Yes — a client portal shares approved documents, invoices and status updates, which reduces email traffic and phone calls." },
    ],
    proof: [
      { value: "15 hrs", label: "Saved per week" },
      { value: "100%", label: "Deadline tracking" },
      { value: "1 vault", label: "All client docs" },
    ],
  },
];


export const engagementModels = [
  {
    name: "Fixed-bid project",
    desc: "A defined scope, a fixed price, a fixed timeline. Best when you know exactly what you want to ship.",
    best: "Well-defined scope",
    bullets: ["Agreed scope & timeline", "Fixed cost, no surprises", "Milestone-based delivery", "Full handover with docs"],
  },
  {
    name: "Dedicated team",
    desc: "A cross-functional team embedded in your roadmap, working in your tools, billed monthly. Best for ongoing product work.",
    best: "Ongoing product",
    bullets: ["Monthly billing", "Your tools & processes", "Scrum/Kanban sprints", "Direct engineer access"],
  },
  {
    name: "Monthly retainer",
    desc: "A set number of hours each month for new features, fixes and support — predictable spend, flexible priorities.",
    best: "Maintain & grow",
    bullets: ["Predictable monthly cost", "Flexible priorities", "Bug fixes included", "Priority response SLA"],
  },
  {
    name: "Staff augmentation",
    desc: "Skilled engineers integrated into your existing team and process, with Ukvalley handling HR and retention.",
    best: "Scale your team",
    bullets: ["Seamless integration", "No recruitment overhead", "Skill-specific hires", "Scale up or down fast"],
  },
];


export type Testimonial = {
  quote: string;
  name: string;
  title: string;
  company: string;
};

export const testimonials: Testimonial[] = [
  {
    quote:
      "Ukvalley replaced three spreadsheets and a WhatsApp group with one CRM that actually mirrors our sales process. Demo starts are up and we finally have an audit trail.",
    name: "Rohit Sharma",
    title: "VP Sales",
    company: "Industrial supplies, Pune",
  },
  {
    quote:
      "They shipped our loan platform in eight weeks. The code is ours, the documentation is real, and the team responds within hours — not days.",
    name: "Anita Desai",
    title: "Founder",
    company: "NBFC, Mumbai",
  },
  {
    quote:
      "TeleValley cut our telephony bill by more than half without losing any tracking. The ROI was visible in the first month.",
    name: "Karan Mehta",
    title: "Head of Growth",
    company: "B2B SaaS, India",
  },
  {
    quote:
      "They migrated our platform to the cloud and set up CI/CD without a single weekend of downtime. Deploys that used to be a fire drill are now a non-event.",
    name: "Priya Nair",
    title: "CTO",
    company: "Logistics, India",
  },
];

export type Insight = {
  slug: string;
  category: string;
  title: string;
  excerpt: string;
  readTime: string;
  date: string;
  body: string[];
};

export const insights: Insight[] = [
  {
    slug: "crm-vs-erp-indian-sme",
    category: "Buyer's guide",
    title: "CRM vs ERP: which does your Indian SME actually need?",
    excerpt:
      "Most small businesses buy the wrong one first. A plain-English framework for choosing based on your real bottleneck.",
    readTime: "6 min read",
    date: "2026-07-18",
    body: [
      "Most SMEs we meet bought a CRM when they actually needed an ERP, or an ERP when their real bottleneck was sales follow-up. The confusion is understandable — both store customer data, both have dashboards, and vendors happily sell either as the answer to everything.",
      "A simple rule: if your pain is losing deals in the pipeline, you need a CRM. If your pain is not knowing what stock, cash or orders you have across the business, you need an ERP. If the answer is both, you need them integrated — not one bloated tool trying to do both badly.",
      "Start from the bottleneck, not the brand. List the three most frequent operational mistakes you make in a month. If two of three are about sales follow-up, start with a CRM. If two of three are about inventory, accounting or order accuracy, start with an ERP.",
      "Finally, budget for adoption, not just licensing. The cheapest software is the one your team actually uses. A ₹50,000 system everyone logs into beats a ₹5,00,000 system no one touches.",
    ],
  },
  {
    slug: "excel-to-production-8-weeks",
    category: "Engineering",
    title: "From Excel to a production system in 8 weeks — how we do it",
    excerpt:
      "Our thin-slice approach: ship real software in week three, not slides. A look at the process behind Dream Loans.",
    readTime: "5 min read",
    date: "2026-05-14",
    body: [
      "The most common failure mode we see in custom software is the six-month build with a big-bang launch that misses the mark. By the time anyone sees working software, the requirements have drifted and the budget is gone.",
      "Our answer is the thin slice: in week three we ship one end-to-end flow — for Dream Loans, that was application to KYC to decision. It's not the whole product, but it's real software running against a real database, not a slide deck.",
      "This works because working software settles arguments. Stakeholders who disagree on requirements instantly agree once they can click through the actual flow. The feedback loop collapses from months to a weekly demo.",
      "From there we build outward in two-week sprints, demoing every week. By week eight the core system is in production, and the remaining weeks are about hardening, integrations and scale — not discovering what to build.",
    ],
  },
  {
    slug: "custom-software-cost-india-2026",
    category: "Buyer's guide",
    title: "What does custom software cost in India in 2026? An honest breakdown",
    excerpt:
      "Why quotes range from ₹2 lakh to ₹2 crore for 'the same app' — and how to know which band your project actually falls in.",
    readTime: "7 min read",
    date: "2026-08-20",
    body: [
      "Ask five vendors what a custom CRM costs and you'll get five answers between ₹2 lakh and ₹2 crore. Everyone is quoting honestly — they're just quoting different things. The price is driven by three variables: how many distinct user roles need different screens, how many external systems must be integrated, and how much of the workflow is genuinely custom versus standard.",
      "A useful rule of thumb: a single-workflow tool with one admin role and no integrations lives in the ₹2–6 lakh band. A departmental system — say a CRM with Tally sync and role-based access — typically lands in ₹8–20 lakh. A multi-department ERP or a customer-facing platform with payments, mobile apps and audit requirements starts around ₹25 lakh and scales with integrations, not with screens.",
      "The most expensive line item is almost never the coding — it's the ambiguity. Every 'we'll figure it out later' is a change request waiting to happen. That's why we push for a written scope and a thin-slice prototype before full build: the prototype prices out the unknowns while they're still cheap to change.",
      "Beware the per-developer-month quote without a scope behind it. 4 engineers × 6 months tells you nothing about what you'll receive. Ask instead for the deliverable list at each milestone, who signs off, and what happens to the price when scope changes — in writing.",
      "Finally, budget 15–20% of the build cost per year for hosting, maintenance and small improvements. Software is a living system; the cheapest project is the one that's still worth using in year three.",
    ],
  },
  {
    slug: "flutter-vs-react-native-2026",
    category: "Engineering",
    title: "Flutter vs React Native in 2026: what we actually choose and why",
    excerpt:
      "Both frameworks are mature now. Here's the decision framework we use on real client projects — and when neither is the answer.",
    readTime: "6 min read",
    date: "2026-08-05",
    body: [
      "We ship both Flutter and React Native in production, so this isn't a fan war. The honest answer is that in 2026 the two are closer than ever — and the decision matters less than the team and the architecture around them. But there are still real differences that show up in specific projects.",
      "Flutter wins when visual consistency and animation-heavy UI matter: custom-drawn interfaces, offline-first field apps with dense forms, or products that must look identical on Android and iOS. Its rendering engine doesn't lean on platform widgets, which is a strength for brand-heavy apps and occasionally a liability when you want a platform-native feel.",
      "React Native wins when your team already knows React, when the app lives beside a large web codebase, or when you want native modules and hot updates with a mature JS ecosystem. For apps that are mostly lists, forms and API calls — which is most business software — the difference in day-to-day development is small.",
      "Where neither is the answer: hardware-heavy apps (camera pipelines, BLE with strict timing, background processing) and apps that must squeeze every millisecond of launch time. There we go native — Kotlin or Swift — and accept two codebases as the price of doing it properly.",
      "Our default for business apps in 2026: Flutter when the UI is custom and design-led, React Native when the team and surrounding ecosystem are React-shaped. Write down why you chose — because in three years, that reasoning matters more than the framework name.",
    ],
  },
  {
    slug: "fixed-bid-vs-dedicated-team",
    category: "Buyer's guide",
    title: "Fixed-bid vs dedicated team: choosing the engagement model honestly",
    excerpt:
      "Vendors push the model that suits their cash flow. Here's what each model is actually good for — and the hybrid we recommend most.",
    readTime: "5 min read",
    date: "2026-07-02",
    body: [
      "Fixed-bid and dedicated-team are both legitimate models — the trick is matching them to how well you know what you want. Fixed-bid works when the scope is genuinely defined: you can describe every screen, every rule and every integration in writing, and you're buying execution, not discovery.",
      "The dedicated-team model works when the product is still being discovered: priorities shift monthly, the backlog is fed by user feedback, and what you're really buying is a team's capacity, not a feature list. Trying to run discovery work on a fixed bid produces either padded prices or change-request fights — usually both.",
      "The model we recommend most often is a hybrid: a fixed-bid phase one that delivers a thin slice to production, followed by a dedicated team working from a prioritized backlog. The fixed phase prices out the unknowns and proves the vendor can ship; the ongoing phase keeps incentives aligned with outcomes instead of change orders.",
      "Whichever model you choose, insist on two things in the contract: you own all code and credentials from day one, and there's a stated response SLA. Those two clauses protect you in every model — their absence is the actual risk, not the billing structure.",
    ],
  },
  {
    slug: "cloud-migration-checklist-sme",
    category: "Engineering",
    title: "A cloud-migration checklist for SMEs (that doesn't require downtime)",
    excerpt:
      "The 12 things we check before moving any SME workload to AWS or Azure — learned from migrations that went well and a few that didn't.",
    readTime: "6 min read",
    date: "2026-06-11",
    body: [
      "Most cloud migrations fail in boring ways: nobody inventoried the cron jobs, the DNS TTL was a week long, or the database was bigger than anyone had measured. Before touching a single server, we produce three documents — a complete asset inventory, a dependency map, and a rollback plan. If any of the three can't be written, the migration isn't ready to start.",
      "Inventory means everything: servers, cron jobs, scheduled tasks, that one PowerShell script on someone's desktop, and the SMTP credentials nobody remembers setting up. Dependencies matter more than assets — the app often survives a move, but the hard-coded internal IP in its config file doesn't.",
      "For the cutover itself, the pattern that works is parallel running: replicate data to the new environment, keep both in sync, switch traffic in small percentages with a DNS change whose TTL you lowered days earlier. Rollback is then a one-line DNS revert, not a restore-from-backup prayer.",
      "Post-migration is where the savings are won or lost. Right-size instances against real utilization after two weeks, set up budget alerts on day one, and turn on autoscaling only after you've watched real traffic patterns. A migration that ends at 'it works' usually leaves 30–40% of the cost savings on the table.",
    ],
  },
  {
    slug: "seo-technical-foundation-sme",
    category: "Growth",
    title: "Your SEO problem might be your website's foundation",
    excerpt:
      "Content gets the blame, but slow server-rendered pages and missing schema quietly cap rankings. The technical fixes that come before any content strategy.",
    readTime: "5 min read",
    date: "2026-05-28",
    body: [
      "SMEs often invest in SEO content while the site itself is quietly unrankable: client-rendered pages that search engines partially see, LCP above four seconds on mobile, and no structured data at all. Content published on that foundation underperforms no matter how good it is.",
      "Three technical fixes come first. Server-side rendering or static generation so every page is fully visible to crawlers. Core Web Vitals in the green — LCP under 2.5 seconds on a mid-range Android, not on your office laptop. And structured data (Organization, Service, FAQ, Article schema) so search engines can understand what you actually offer.",
      "After the foundation, the content strategy is simpler than most agencies make it: one page per service, one per industry you serve, and answers to the questions your sales team hears weekly. Each page targets a real search query, links to its neighbours, and has one clear next step.",
      "Then measure honestly: rankings are a vanity number until they produce enquiries. Track form submissions and calls per landing page per month. The pages that produce enquiries get improved; the pages that don't get rewritten or retired. That feedback loop is the entire SEO strategy.",
    ],
  },
  {
    slug: "rescue-failing-software-project",
    category: "Engineering",
    title: "How to rescue a failing software project (before you rewrite it)",
    excerpt:
      "The vendor disappeared, the code is undocumented, and every change breaks something. The audit-first sequence we use to stabilise inherited codebases.",
    readTime: "6 min read",
    date: "2026-04-16",
    body: [
      "The instinct when a project is failing is to rewrite it from scratch. Sometimes that's right — but more often the rewrite takes longer than expected, loses business logic nobody documented, and lands in the same place eighteen months later. The rescue sequence we use starts with an audit, not a rebuild.",
      "Week one: get the code, the database and every credential under your ownership. We've seen rescues stall for weeks because the old vendor held the deployment access. Ownership first, always — and it should have been yours from day one.",
      "Weeks two and three: a written audit. What the system actually does, which parts are load-bearing, where the tests are (usually: nowhere), and which three changes would stabilise it most. The output is a ranked list, not a 60-page report nobody reads.",
      "Then stabilise before you extend: automated backups you've actually restored, monitoring with alerts, a deploy process that doesn't require heroics, and regression tests on the flows that make you money. New features come only after the floor stops moving.",
      "The rewrite question gets re-asked after stabilisation, with real information. Roughly a third of the time the answer is still yes — but now it's a planned rewrite with a migration path, not an escape from a fire. The other two-thirds of systems turn out to be worth keeping.",
    ],
  },
  {
    slug: "pos-system-buyers-guide-india",
    category: "Buyer's guide",
    title: "Choosing a POS for your Indian store: the questions vendors hope you skip",
    excerpt:
      "Offline billing, GST receipts, RTO of trust: the five questions that separate a POS that survives peak hours from one your staff bypass with paper bills.",
    readTime: "6 min read",
    date: "2026-09-22",
    body: [
      "A POS demo always looks perfect — the vendor's machine, their network, their happy path. The failures start on your shop floor: a billing rush when the internet drops, a return without the original bill, a weighing-scale item at the vegetable counter, and a cashier who discovers the discount button needs four taps.",
      "Ask the offline question first and make them prove it: pull the network cable during the demo. If billing stops, the system is cloud-dependent and your shop goes dark exactly when it's busiest. Offline-first terminals that sync on reconnect are the difference between an outage being a non-event and a revenue leak.",
      "Second: how does it handle GST on mixed carts — HSN-wise items, tax slabs per category, and a printed or WhatsApp receipt your CA can reconcile? If the demo glosses over tax setup, month-end reconciliation will be your problem, not theirs.",
      "Third, ask who owns the data and where it lives. Cloud POS that holds your sales history hostage at cancellation is more common than anyone admits. Fourth, check multi-store reality: live consolidation across branches with per-store stock and day-close reporting — not a nightly CSV export someone emails you.",
      "Finally, count the taps. The staff at your counter will make 200+ bills a day at peak. Watch them use the vendor's system at demo speed, not leisurely showroom speed. The POS your team bypasses with paper bills is worse than no POS at all — it just costs more.",
    ],
  },
  {
    slug: "hrms-payroll-guide-india",
    category: "Buyer's guide",
    title: "HRMS in India: what actually breaks at month-end (and how to avoid it)",
    excerpt:
      "Payroll is only as good as its attendance inputs. Where Indian HRMS implementations really fail — and the parallel-run test that catches it before go-live.",
    readTime: "7 min read",
    date: "2026-09-18",
    body: [
      "Every HRMS demos beautifully. The failure arrives at month-end, when attendance data from three biometric devices, a WhatsApp leave group and a manual shift roster has to become compliant payslips — with PF, ESI, professional tax and TDS computed correctly, for every state you employ in.",
      "The root cause is almost always inputs, not the payroll engine. Attendance that needs manual consolidation, leave policies that live in someone's memory, and shift rules that vary by unit — these turn the payroll run into a two-day Excel reconciliation. Fix the inputs first: biometric and mobile capture integrated directly, leave and shift policies configured as rules, and reconciliation automated.",
      "Insist on a parallel run before cutover: one full payroll computed in both your existing process and the new system, compared line by line. Any vendor unwilling to do this is asking you to trust their demo instead of your numbers. We run the parallel as standard — it's the fastest way to build (or lose) trust.",
      "Check the statutory layer against your actual filings: PT slabs per state of employment, LWF, gratuity and bonus act treatment, and whether registers and challans are generated ready-to-file or as screenshots you re-type. And budget for the employee side: self-service payslips, leave requests and reimbursements on their phones is what actually frees your HR team from data entry.",
    ],
  },
  {
    slug: "custom-crm-vs-off-the-shelf",
    category: "Buyer's guide",
    title: "Custom CRM vs off-the-shelf: the decision framework (and the hybrid)",
    excerpt:
      "Off-the-shelf wins on speed and price; custom wins on fit and ownership. The three tests that decide which side you're on — and the hybrid most SMEs should choose.",
    readTime: "6 min read",
    date: "2026-09-15",
    body: [
      "Off-the-shelf CRMs are right when your sales process is close to the standard funnel: leads in, stages, follow-ups, close. If your team can adopt the tool's workflow without fighting it daily, the subscription is cheaper than any build and the integrations already exist.",
      "The case for custom appears when your process is genuinely different: quotation-heavy industrial sales, broker and channel-partner networks, site-visit scheduling, or regulatory capture steps that no template anticipates. The test isn't 'do we want custom fields' — every CRM has those. It's: when our process and the tool disagree, who changes?",
      "Run three tests before deciding. First, the adoption test: if your team won't follow the tool's process, no feature list saves it. Second, the integration test: does it connect to Tally, your WhatsApp, your portals — natively or with glue you'll maintain? Third, the ownership test: who holds your lead history if you leave?",
      "The hybrid we recommend most often: start on the shelf, but only after mapping your process honestly. If within a quarter you're maintaining spreadsheets beside the CRM — the classic signal — the fit has failed, and a custom build starts from a process you now understand well. The expensive mistake is buying custom before you've documented the process, or fighting shelf software for two years out of sunk cost.",
    ],
  },
  {
    slug: "cod-rto-reduction-d2c",
    category: "Growth",
    title: "Cutting COD RTO without killing your COD revenue",
    excerpt:
      "Cash on delivery is a third of Indian e-commerce and most of its risk. The levers that reduce return-to-origin — and the one metric to watch instead of return rate.",
    readTime: "6 min read",
    date: "2026-09-12",
    body: [
      "Every D2C founder learns the same arithmetic: COD orders convert 2–3× better than prepaid, and return to origin 2–3× more often. The naive responses — disabling COD or charging blanket COD fees — trade a real revenue stream for a small risk reduction. The better play is risk-segmentation.",
      "The levers that actually move RTO: order confirmation before dispatch (a WhatsApp confirm beats a robocall), pincode-level risk rules learned from your own courier data, repeat-refuser flags with prepaid nudges, partial COD fees for high-risk pincodes only, and address validation at checkout. Each is small; stacked, they typically cut RTO by a third without touching conversion much.",
      "Track net revenue per order, not return rate. A store with 25% RTO but strong confirmation discipline often nets more than a store with 15% RTO and depressed prepaid conversion. The metric tells you whether a lever is working — return rate alone just tells you the weather.",
      "Finally, give customers a reason to prepay: UPI-first checkout makes prepaid painless, small prepaid discounts funded by saved RTO costs, and wallet cashback for repeat prepaid buyers. The goal isn't eliminating COD — it's shifting the margin distribution so COD orders you do accept are the profitable ones.",
    ],
  },
  {
    slug: "whatsapp-business-api-sme-ops",
    category: "Growth",
    title: "WhatsApp Business API: the ops channel Indian SMEs underuse",
    excerpt:
      "Beyond marketing broadcasts: order capture, booking confirmations, payment links and support — what the API can legally do and how to wire it into real systems.",
    readTime: "5 min read",
    date: "2026-09-08",
    body: [
      "Most SMEs use WhatsApp as a document graveyard: order screenshots, address changes and payment confirmations living in a chat nobody can search. The WhatsApp Business API turns that same channel into structured data — inbound messages become leads and orders; outbound becomes confirmations, payment links and delivery updates.",
      "The compliant pattern matters. Marketing broadcasts need opt-in and template approval; transactional messages (order confirmations, OTPs, receipts) have their own templates and are far easier to keep approved. Build the flow so that customer replies land in your CRM with source attribution — that's the structured-data win, not the broadcast blast.",
      "The integrations that pay off first for most businesses: enquiry capture into the CRM, booking confirmations with reschedule links, COD order confirmations that cut RTO, payment links with payment-verified status, and delivery notifications with tracking. Each replaces a phone-call workflow — measurable in staff minutes and drop-off rates.",
    ],
  },
  {
    slug: "dpdp-privacy-engineering-india",
    category: "Engineering",
    title: "India's DPDP Act is now real: engineering privacy before the audit",
    excerpt:
      "The Digital Personal Data Protection Act changed what 'we take privacy seriously' has to mean in code. The six practices that make your system audit-ready by design.",
    readTime: "7 min read",
    date: "2026-09-05",
    body: [
      "India's Digital Personal Data Protection Act moved privacy from a policy page to an engineering requirement: consent that's specific and logged, purpose limitation, data minimisation, breach notification and deletion rights. For SMEs, the practical question is what these change in the codebase.",
      "Six practices carry most of the weight. Consent captured per purpose with a timestamped log. Role-scoped access so employees see only the data their function needs. Audit logs on sensitive record views, not just edits. Encryption at rest and in transit as defaults. A deletion workflow that actually purges on request. And data inventory — you can't protect what no one has listed.",
      "None of these require enterprise budgets; they require decisions made early. Retrofitting audit logging after a breach is archaeology; building it in is one middleware layer. The same is true for consent records — retrofitting consent is legally awkward; capturing it at intake is trivial.",
      "Where we see SMEs exposed most: shared admin logins, exported Excel reports circulating on personal WhatsApp, and test environments loaded with production customer data. All three are cheap to fix and are exactly what an auditor (or a breach) will find first. Privacy architecture is cheaper than privacy incidents — always has been.",
    ],
  },
  {
    slug: "offline-first-apps-field-teams",
    category: "Engineering",
    title: "Offline-first apps: designing for the India your field team actually works in",
    excerpt:
      "Basements, highways and factory floors have no signal. The sync patterns, conflict rules and storage choices that make field apps survive week one.",
    readTime: "6 min read",
    date: "2026-09-01",
    body: [
      "An app that works on the office Wi-Fi and fails in the field isn't finished — it's untested. Field teams work in basements and highway dead zones, on mid-range Androids with 40% battery. Offline-first isn't a feature you add; it's the architecture you start with.",
      "The pattern that works: a local database (SQLite/Hive/Drift) as the primary read and write surface, with a background sync layer that queues changes and reconciles when connectivity returns. Every write gets a client ID and timestamp; the server, not the client, resolves conflicts by rule — last-write-wins is only safe when you've decided which fields it's safe for.",
      "Design the sync for partial failure: a day of offline work syncing over 2 bars of signal means chunked uploads, resumable transfers and idempotent operations — the same record syncing twice must not double-count. This is unglamorous engineering that determines whether field staff trust the app in month two.",
      "Test like the field: airplane-mode mid-form, kill the app mid-sync, let a 4-hour queue drain on a 2G connection. If your demo can't survive those three, your delivery app is a demo. The teams that do this testing ship apps field staff actually use — the others get screenshots instead of data.",
    ],
  },
  {
    slug: "webhooks-integrations-that-dont-break",
    category: "Engineering",
    title: "Integrations that don't break: engineering the glue, not just the call",
    excerpt:
      "Payment gateways change payloads, vendors throttle you, webhooks get dropped. The retry, idempotency and observability patterns that keep integrations boring.",
    readTime: "6 min read",
    date: "2026-08-28",
    body: [
      "Integrations fail in boring, predictable ways: a webhook that never arrived, a payload field that changed shape, a rate limit hit during your busiest hour. The systems that survive treat every external call as if it will fail — because eventually it will.",
      "Four patterns carry the load. Idempotency: attach a request ID so a retried payment or webhook can't double-charge or double-count. Retries with backoff and a dead-letter queue: failures get stored, not lost, and a human inspects them. Contract tests: when a vendor changes a payload, your test suite — not your customers — finds out. And reconciliation jobs that compare your records against the vendor's daily, catching silent drift.",
      "Webhooks specifically deserve distrust: they're dropped, duplicated and delivered out of order. The robust pattern is treating webhooks as hints and pulling the authoritative state on receipt — a small API cost that eliminates a whole class of missing-event bugs.",
      "Finally, observability: every integration gets structured logs, a latency metric and an alert when its error rate moves. When Razorpay changes something at 11 a.m. on your biggest sale day, the difference between a two-minute fix and a two-day apology is whether your monitoring spoke first.",
    ],
  },
  {
    slug: "audit-trails-sme-competitive-advantage",
    category: "Engineering",
    title: "Audit trails: the boring feature that wins enterprise deals",
    excerpt:
      "Who changed what, when and why — the ledger most SMEs skip until a client, auditor or dispute demands it. How to build it without drowning in noise.",
    readTime: "5 min read",
    date: "2026-08-24",
    body: [
      "An SME wins its first enterprise contract and immediately meets the requirement nobody scoped: the client's procurement team wants to know who changed the price, when, and who approved it. Systems without audit trails answer that question with a shrug — and lose the deal.",
      "A useful audit trail is three things, no more: who, what changed (before and after), and when — plus a reason field where approvals matter. Append-only, never editable, with the same retention as your business records. It sounds heavy; it's actually one table, one middleware layer and the discipline of writing events instead of mutating silently.",
      "The design mistake is logging everything: every read, every hover, every list view. That's noise nobody reads and storage you pay for. Log state changes on entities that matter — orders, approvals, prices, permissions — and skip the noise. The test: if a dispute arrived tomorrow, could you answer 'what happened' from the log alone?",
      "In regulated work — lending, healthcare, payroll — the trail is also your inspection armour: maker-checker approvals, immutable timestamps and exportable trails turn an audit from archaeology into a query. We build it into every business system we ship, because the enterprise deal you don't know you're pursuing yet is the one it wins.",
    ],
  },
  {
    slug: "mongodb-vs-postgresql-2026",
    category: "Engineering",
    title: "MongoDB or PostgreSQL in 2026: choose by access pattern, not fashion",
    excerpt:
      "The database war ended years ago — both are excellent. What actually decides it: your query shapes, your consistency needs and your team's fluency.",
    readTime: "6 min read",
    date: "2026-08-22",
    body: [
      "Picking between MongoDB and PostgreSQL isn't a religion question anymore — both are mature, both scale, both have healthy ecosystems. The real question is narrower: what shape are your reads and writes, and who maintains this after launch?",
      "PostgreSQL wins on relational truth: invoices that must balance, ledgers that must reconcile, joins across well-modelled entities, and the decade of tooling around it (migrations, analytics, extensions). If your domain has entities with invariants — most business software does — Postgres is the safe default.",
      "MongoDB wins when the data is genuinely document-shaped and schema-flexible: event logs, content with varying fields, ingest-heavy pipelines, or early-stage products whose data model is still being discovered. Aggregation pipelines cover most analytics; change streams cover most realtime needs.",
      "The tiebreakers in practice: your team's fluency (a team that knows Postgres will build better on Postgres than on MongoDB they're learning under deadline), transactional needs across documents, and the operational tooling you'll rely on at 2 a.m. We use both in production — the choice is documented per project, because in year three the reasoning matters more than the name.",
    ],
  },
  {
    slug: "lms-design-low-bandwidth",
    category: "Engineering",
    title: "Building an LMS for Bharat: engineering for 4G, mid-range Androids and real learners",
    excerpt:
      "Video that adapts, downloads that resume, apps that survive 2GB RAM. The technical decisions that separate LMS platforms learners finish from ones they abandon.",
    readTime: "6 min read",
    date: "2026-08-19",
    body: [
      "Most LMS platforms are built on campus fibre and tested on laptops. Indian learners are on mid-range Androids, intermittent 4G and monthly data caps — and they abandon platforms that don't respect those constraints, no matter how good the content is.",
      "Three engineering decisions carry most of the outcome. Adaptive bitrate video with 360p-first defaults, because smooth beats sharp on a patchy connection. Downloadable lessons with resumable transfers, because a commute shouldn't cost a full re-download. And a UI that stays responsive on 2GB RAM devices — which in practice means lean bundles, cached lists and discipline over animation.",
      "The product decisions matter as much: WhatsApp-friendly notifications instead of email dependency, offline-first attendance and homework for teachers in low-connectivity schools, and assessments that tolerate a dropped connection mid-test without losing answers.",
      "The proof is in completion rates: platforms engineered this way routinely see 2–3× course completion versus generic LMS deployments with identical content. The lesson generalises beyond education: in India, the low-end device is the median user, and designing for it is not charity — it's just correct engineering for the actual audience.",
    ],
  },
  {
    slug: "technical-debt-sme-explained",
    category: "Engineering",
    title: "Technical debt for non-engineers: what it is and when it's actually fine",
    excerpt:
      "Debt isn't dirt — it's borrowed speed. The kinds that compound, the kinds that never matter, and the conversation to have with your dev team about it.",
    readTime: "5 min read",
    date: "2026-08-14",
    body: [
      "Every software decision trades speed now against ease later. Ship fast with shortcuts and you've borrowed time — that's technical debt. Debt isn't automatically bad: the loan that carried your product to its first paying customers was worth it. The trouble is debt nobody tracked.",
      "Debt that compounds: missing tests on money flows, undocumented business logic that lives in one person's head, hand-configured servers nobody can reproduce, and copy-pasted modules that fix one bug in five places. These get more expensive every month, invisibly — until a launch or an audit surfaces the bill.",
      "Debt that never matters: the ugly naming in a module you'll delete, the slightly hacky one-off report, the 'temporary' script that's run twice a year for three years. Chasing perfection here is spending real money to feel tidy.",
      "The conversation to have with your team is simple: which parts of the system make money, and what's their debt? For revenue-critical flows, schedule repayment deliberately — tests, docs, refactors as line items, not favours. For the rest, leave it alone. And when you inherit a codebase, an audit that separates the compounding debt from the cosmetic kind is the first £/₹ you should spend on it.",
    ],
  },
  {
    slug: "cloud-cost-audit-sme",
    category: "Engineering",
    title: "Your cloud bill doubled and nobody knows why: an SME cost-audit playbook",
    excerpt:
      "The four places cloud money hides — forgotten environments, oversized instances, egress and logs — and the one-day audit that usually recovers 20–40%.",
    readTime: "6 min read",
    date: "2026-08-11",
    body: [
      "Cloud bills grow the way unused gym memberships do: slowly, invisibly, and with excellent explanations available for every line item. The four usual suspects, in order of size: forgotten environments (the staging setup from a finished project), oversized instances provisioned for a traffic spike that never repeated, storage nobody lifecycle-managed, and data-transfer patterns that charge you for architecture decisions made years ago.",
      "The audit takes a day. Inventory every resource against its owner and purpose — anything with neither gets flagged. Check instance utilisation over 30 days; anything under 20% average is a right-sizing candidate. Apply lifecycle rules to storage (hot → cool → archive). And trace your transfer charges: cross-region chatter between services is often the single biggest fixable line.",
      "Then make the savings structural, not a one-time cleanup: budget alerts at 80% of plan, tagging enforced in CI so every resource is born owned, and a monthly cost review with one owner. Autoscaling comes last — after you've watched real traffic patterns, not before.",
      "We run this audit as a standard first step on managed engagements, and it typically recovers 20–40% on overspend accounts. The savings fund the monitoring and backup work that actually keeps the system safe — which is the correct order of operations.",
    ],
  },
  {
    slug: "mvp-scope-slicing",
    category: "Process",
    title: "MVP scope slicing: how to cut a 6-month plan into a 6-week launch",
    excerpt:
      "Every MVP plan contains one slice that proves the idea and ten that don't. The exercise that finds it — and what to do with everything you cut.",
    readTime: "5 min read",
    date: "2026-08-07",
    body: [
      "Write down your six-month feature list. Now answer one question: which single feature, if it worked, would make a real user come back a second time? Not the admin panel. Not the settings page. The one loop that delivers the promise. That's your thin slice — and it's usually 15% of the plan.",
      "The resistance to slicing is emotional, not technical: nobody wants to ship 'the product without the features'. But scope-cut MVPs have a track record — they reach users early, and users tell you which of the cut features actually mattered, in order, with their behaviour instead of their opinions.",
      "The discipline that makes it work: every cut feature goes on a visible backlog with a one-line hypothesis of why it matters. When the data proves a cut feature matters, it comes back into a sprint with its priority earned, not assumed. Half the time it never comes back — which is the whole saving.",
      "The second-order benefit is honesty: a thin slice in production by week three means the conversation about what to build next happens with real users and real data — which is a fundamentally better meeting than the one where six stakeholders argue about wireframes.",
    ],
  },
  {
    slug: "weekly-demos-build-trust",
    category: "Process",
    title: "Why we demo every Friday (and you should demand it from any vendor)",
    excerpt:
      "The weekly demo is the cheapest trust technology in software delivery. What it catches, what it prevents, and the one question that exposes vendors who can't do it.",
    readTime: "4 min read",
    date: "2026-08-03",
    body: [
      "A demo every week changes the physics of a software project. Requirements arguments that would have consumed a week of email resolve in ten minutes once both sides can click the actual thing. Misunderstandings surface in week two instead of month four. And the client's confidence stops being an act of faith.",
      "The demo also disciplines the vendor in ways status reports can't. You can't demo slides you already shipped; you can only demo software that actually runs. A team that demos weekly is structurally incapable of disappearing for two months — the rhythm makes silence impossible.",
      "It's also the cheapest possible course-correction mechanism. Every change caught in a Friday demo costs hours; the same change caught at launch costs weeks and a change-request invoice. The demo isn't ceremony — it's the steering wheel.",
      "The question to ask any vendor you're evaluating: 'Can you show me working software every week, and what happens in a week where there's nothing to show?' Vendors with real delivery discipline say yes easily. Vendors with waterfall habits will explain why demos don't suit agile. That answer tells you everything.",
    ],
  },
  {
    slug: "fintech-lending-tech-stack-2026",
    category: "FinTech",
    title: "Inside a lending platform's stack: what NBFC-grade software actually requires",
    excerpt:
      "Bureau integrations, maker-checker controls, audit logs and NPA classification — the requirements that separate lending software from a pretty form.",
    readTime: "7 min read",
    date: "2026-07-29",
    body: [
      "Lending software looks like forms. It isn't. The moment an NBFC signs up, the requirements multiply: bureau pulls with consent logs, KYC verification with document trails, configurable credit policies, maker-checker approvals, immutable audit logs, disbursal controls and repayment schedules that classify NPA automatically. Miss any of these and the platform fails at its first inspection, not its first demo.",
      "The architectural decisions follow from the regulatory shape. Every state change gets an append-only log entry — user, time, before, after. Approval chains are configuration, not code, because credit policy changes quarterly. And the data model separates the application (what was true at decision time) from the customer (what is true now) — a distinction auditors probe and lazy schemas blur.",
      "Integration depth is where most builds underestimate: CIBIL and Experian pulls, Aadhaar/PAN verification, e-sign, payment and NACH flows, SMS/WhatsApp customer communication — each with retries, reconciliation jobs and consent records. A lending MVP that ignores reconciliation is a demo with a database.",
      "We know this stack intimately because we built and run our own lending product. That's the practical advantage we offer fintech clients: the edge cases — part disbursements, deviation approvals, foreclosure math, co-lending splits — are already solved, so your build starts at 'customise' rather than 'discover'.",
    ],
  },
  {
    slug: "erp-implementation-failure-modes",
    category: "Buyer's guide",
    title: "Why ERP projects fail (and the rollout order that prevents it)",
    excerpt:
      "The ERP failure pattern is boring and consistent: too much scope on day one, no parallel run, and training after go-live. The staged rollout that flips the odds.",
    readTime: "6 min read",
    date: "2026-07-25",
    body: [
      "The failed ERP follows a script: a big-bang go-live covering everything at once, master data migrated in a weekend, users trained in a two-hour session, and a floor that responds by keeping the spreadsheets running in parallel — unofficially, forever. The ERP becomes the system of record for nobody.",
      "The rollout order that works is deliberately boring. Inventory and invoicing first — the daily-use path where value is immediate. Purchase and approvals second. Production or job-work third. Reports and dashboards once the data underneath them is clean enough to trust. Each stage stabilises before the next begins.",
      "The non-negotiables: master data cleaned before migration (garbage in, garbage forever), a parallel-run window where old and new systems are compared line by line, and training delivered role-by-role on the company's real data — not a demo company's fake data.",
      "One more thing buyers underweight: the floor supervisor's opinion is the adoption truth. If the people entering the data prefer the old way, no dashboard will save the project. Build with them in the room from scoping week — the software that survives is the one they helped design.",
    ],
  },
  {
    slug: "dedicated-developers-hiring-guide",
    category: "Buyer's guide",
    title: "Hiring dedicated developers: the questions that separate vendors from body shops",
    excerpt:
      "Everyone promises 'dedicated developers'. Six questions that reveal whether you're getting a verified engineer with backup — or a CV that visited the interview.",
    readTime: "6 min read",
    date: "2026-07-21",
    body: [
      "'Dedicated developer' has become a pricing label, not a delivery guarantee. The difference between a vendor and a body shop shows up in six questions — ask all six, and listen for what they can't answer.",
      "First: 'Can I see apps this engineer has shipped?' — live store links, not portfolios. Second: 'Who reviews their code?' — a named senior architect, or 'we have quality processes'. Third: 'What happens if they resign or underperform?' — a replace-in-days guarantee in writing, or a shrug.",
      "Fourth: 'Who owns the repositories?' — your org from day one, or 'we'll discuss handover later'. Fifth: 'What's the notice period to scale or pause?' — a week is reasonable; six months is a lease. Sixth: 'What happens in week one?' — a documented onboarding with access, context and a first task, or 'they're great, you'll see'.",
      "The pattern behind all six: vendors with an engineering culture can answer specifically because the mechanisms exist. Body shops answer generally because the mechanisms don't. And when the answers are specific, verify them — ask for the store link, the SLA clause, the replacement guarantee in the draft contract before you sign anything.",
    ],
  },
  {
    slug: "data-migration-without-downtime",
    category: "Engineering",
    title: "Migrating live data without downtime: the parallel-run pattern",
    excerpt:
      "Every business system eventually needs a migration under load. The pattern we use: replicate, reconcile, cut traffic in slices, and keep the rollback one command away.",
    readTime: "6 min read",
    date: "2026-07-16",
    body: [
      "The scary part of any migration isn't moving the data — it's that the business keeps operating while you do. The pattern that works is parallel running: replicate data to the new system, keep both in sync, and move traffic in small slices with a rollback that's one command, not a restore-from-backup prayer.",
      "The setup matters more than the cutover. Dual writes (or a change-data-capture stream) keep both systems current; a reconciliation job compares records hourly and reports drift; and the DNS TTL gets lowered days before cutover so traffic shifts are minutes, not days. If any of these three can't be built, the migration isn't ready.",
      "Cutover by slice: internal users first, then one region or one store, then the rest — with a checkpoint after each slice. Every slice has a defined rollback: flip the flag back, and the old system picks up exactly where it left off. Practice the rollback in staging until it's boring.",
      "The last mile is the honest one: freeze a write window only for the final delta (usually minutes), reconcile one last time, and run both systems read-only in parallel for a week as insurance. Migrations fail from impatience far more often than from technology — the parallel run is how you buy the patience.",
    ],
  },
];

export const faqs = [
  {
    q: "Do we own the code?",
    a: "Yes — from day one. All source code, documentation and credentials are handed over and belong to you. We work under a signed NDA and IP assignment before any work begins, and you retain access to your own repositories throughout.",
  },
  {
    q: "How much does a custom software project cost?",
    a: "It depends on scope, complexity and timeline. After a free 30-minute scoping call we send a rough estimate within three business days and a fixed proposal within seven. We offer fixed-bid, dedicated-team, retainer and staff-augmentation models so you can pick the one that fits.",
  },
  {
    q: "How fast will you respond?",
    a: "We commit to a 24-hour response SLA on all active projects, stated publicly in every contract. For production incidents on managed-services engagements we target a one-hour first response.",
  },
  {
    q: "Are you based in India? Can you work with overseas clients?",
    a: "We're headquartered in India, with offices in Pune and Nagpur and a presence in the United States. Our cost base is typically 30–40% below metro agencies, and we routinely work across time zones with US and Gulf clients.",
  },
  {
    q: "Can you take over a project from another vendor?",
    a: "Yes. We regularly inherit codebases — we start with a code audit and a written assessment, then propose a stabilization plan before any new feature work. You keep ownership throughout and can exit cleanly at any point.",
  },
  {
    q: "What technologies do you work with?",
    a: "React, Next.js, Angular, Vue, Flutter, Kotlin, Node, Laravel, Django, Python, PHP, Java, MongoDB and PostgreSQL, deployed on AWS and Azure. We recommend the stack that fits your team and constraints — not the one we happen to prefer.",
  },
];

// ----- Per-service detail content (for /services/[slug] pages) -----
export type ServiceDetail = {
  slug: string;
  longDescription: string;
  capabilities: { title: string; desc: string }[];
  deliverables: string[];
  process: string[];
  // Keep serviceFaqs at 2 or 4 entries per service so the
  // "Common questions" grid always fills its 2 columns.
  serviceFaqs: { q: string; a: string }[];
  relatedIndustries: string[];
  /** Three proof figures shown under the hero. */
  metrics: { value: string; label: string }[];
  /** Why clients pick us for this line of work. */
  whyUs: { title: string; desc: string }[];
  /** Long-form overview: the problem, how we approach it, what changes. */
  overview: string[];
  /** The situations clients arrive with. */
  painPoints: { title: string; desc: string }[];
  /** Typical engagements under this service line. */
  useCases: { title: string; desc: string }[];
  /** Measurable outcomes clients see after delivery. */
  outcomes: string[];
  /** Before/after per task — where the client's team gets time back. */
  timeSavings: { task: string; before: string; after: string }[];
  /** Technologies used on this service line. */
  techs: string[];
  /** At-a-glance facts: timeline, team, investment, first demo, support. */
  quickFacts: { label: string; value: string; sub?: string }[];
  /** What we need from the client to start well. */
  youProvide: string[];
  /** One-line "best for" summary used in comparison tables. */
  bestFor: string;
};

export const serviceDetails: Record<string, ServiceDetail> = {
  "web-development": {
    slug: "web-development",
    metrics: [
      { value: "<2.5s", label: "LCP on 4G, every build" },
      { value: "Wk 3", label: "Working prototype" },
      { value: "100%", label: "Code you own" },
    ],
    whyUs: [
      { title: "SEO is a build requirement", desc: "Server rendering, schema, sitemaps and Core Web Vitals are part of the definition of done, not a later audit." },
      { title: "Built for Indian users", desc: "Tested on mid-range Android over 4G, with UPI-first checkout and WhatsApp flows where they matter." },
      { title: "Design system included", desc: "Every build ships with a component library your team can extend without us." },
      { title: "Current stack, current patterns", desc: "This site runs on the latest Next.js release line — the patterns we use are the ones we ship." },
    ],
    overview: [
      "Most business websites in India are built twice: once by an agency that ships a template, and again eighteen months later when the owner discovers it does not rank, loads in six seconds on a phone, and cannot be changed without calling the agency. Web apps follow the same script — a dashboard that worked for ten users falls over at two hundred, and nobody can explain why because nobody owns the code.",
      "We approach web work as engineering, not decoration. Every build starts with the questions that decide whether it survives: who will maintain this, what traffic must it carry, which search queries must it win, and which systems must it talk to. From there we choose React, Next.js, Angular or Vue for reasons we write down, render on the server so search engines and slow phones both get fast pages, and ship a design system your own team can extend.",
      "What changes for you is control. Your marketing team edits content without a developer. Your sales team gets enquiries from pages that actually rank. Your operations team gets an admin that matches how work happens rather than a generic template. And when you want to change vendors, you hand the next team a documented codebase, not a hostage situation.",
      "Consider what the current site is costing you today, not what a new one would cost. Every second of load time on a mobile phone loses a measurable share of visitors before they read a word. Every service you offer without a page of its own is a search your competitor wins. Every content change routed through an agency ticket is a campaign that launches a week late. Add those up over a year and the 'cheap' website is usually the most expensive asset the business owns.",
    ],
    painPoints: [
      { title: "The site is invisible on Google", desc: "Client-rendered pages, no structured data and a four-second mobile load mean content published on the site never ranks, however good it is." },
      { title: "Every change needs the agency", desc: "No CMS, no design system and no documentation — a heading change is a ticket, a wait and an invoice." },
      { title: "The web app buckles under real load", desc: "Unindexed queries, a shared hosting plan and no caching worked in the demo and fail at the first busy Monday." },
      { title: "The storefront loses Indian shoppers", desc: "No UPI-first checkout, no COD confirmation, slow product pages on mid-range Android — the traffic arrives and leaves." },
    ],
    useCases: [
      { title: "Marketing sites that rank", desc: "Server-rendered, schema-marked, sub-2.5-second sites with a CMS your team runs — built to win the searches your sales team hears daily." },
      { title: "SaaS dashboards and portals", desc: "Role-based web apps with real-time data, audit trails and server components, engineered for the load you will have in year two." },
      { title: "E-commerce storefronts", desc: "Next.js storefronts with UPI-first checkout, COD confirmation, Shiprocket and Razorpay integration and RTO analytics." },
      { title: "Legacy rebuilds and migrations", desc: "WordPress, CRA or PHP sites moved to a typed, fast codebase with SEO parity — redirects, schema and rankings carried over." },
    ],
    outcomes: [
      "Largest Contentful Paint under 2.5 seconds on a mid-range Android over 4G, on every page",
      "Every page fully visible to search engines with structured data for Organization, Service, FAQ and Article",
      "A design system and CMS your own team uses daily without a developer",
      "Load-tested before launch, with monitoring and a rollback path from day one",
      "Complete source, documentation and a recorded handover walkthrough in your repositories",
    ],
    timeSavings: [
      { task: "Publishing a content change", before: "Agency ticket, 2–5 days", after: "Your team, 5 minutes" },
      { task: "Launching a new landing page", before: "Designer + developer, 2 weeks", after: "Design system, same day" },
      { task: "Diagnosing a slow page", before: "Guesswork and a hosting upgrade", after: "Monitoring dashboard, minutes" },
      { task: "Answering 'why don't we rank?'", before: "Another SEO audit, 3 weeks", after: "Foundation already in place" },
    ],
    techs: ["React 19", "Next.js", "Angular", "Vue", "TypeScript", "Tailwind CSS", "Node.js", "PostgreSQL", "Vercel / AWS", "Playwright"],
    quickFacts: [
      { label: "Typical timeline", value: "4–12 wks", sub: "Site 4–6 · web app 8–12" },
      { label: "Team on it", value: "2–4", sub: "Architect, engineers, QA" },
      { label: "Starting investment", value: "₹2 lakh", sub: "Single-workflow band" },
      { label: "First working demo", value: "Week 3", sub: "Thin slice, live URL" },
      { label: "After launch", value: "24h SLA", sub: "Support plans from month 1" },
    ],
    youProvide: [
      "Your current site or app access, analytics and any brand files",
      "One decision-maker for the weekly demo",
      "The search queries and enquiries your sales team hears most",
      "Access to the systems the site must talk to (CRM, payments, mail)",
    ],
    bestFor: "Sites that must rank, storefronts and SaaS dashboards",
    longDescription:
      "We build web apps that are fast, SEO-ready and scalable — from marketing sites to full SaaS platforms. Every project ships with code you own, semantic HTML, Core Web Vitals tuned for LCP under 2.5s, and a stack chosen to fit your team rather than ours.",
    capabilities: [
      { title: "Custom web applications", desc: "React, Next.js, Angular and Vue apps built around your real workflow — not a template." },
      { title: "E-commerce", desc: "Storefronts, carts, payments and admin with inventory, tax and shipping that fit Indian operations." },
      { title: "Progressive web apps", desc: "Installable, offline-capable web apps that work like native on low-end Android devices." },
      { title: "Headless & API-first", desc: "Decoupled frontends against your existing APIs, CMS or backend so you can iterate independently." },
    ],
    deliverables: [
      "Production source code, fully owned by you",
      "Design system and component library",
      "SSR/SSG with Core Web Vitals tuned",
      "SEO foundation: sitemap, schema, meta",
      "Documentation and a handover walkthrough",
    ],
    process: [
      "Discovery call and a written scope with rough timeline",
      "Architecture and a thin-slice prototype by week three",
      "Two-week build sprints with weekly live demos",
      "Launch, handover and ongoing support with a 24-hour SLA",
    ],
    serviceFaqs: [
      { q: "Do you build SEO-friendly sites?", a: "Yes — server-side rendering or static generation by default, semantic HTML, schema markup, sitemaps and tuned Core Web Vitals. We treat SEO as a build requirement, not an afterthought." },
      { q: "Can you rebuild our existing site?", a: "Yes. We start with a code and content audit, propose a migration plan, and can run the old and new sites in parallel during cutover to avoid downtime." },
      { q: "Which framework will you use for our project?", a: "The one that fits your team and constraints. Next.js is our default for sites and SaaS where SEO and speed pay the bills; Angular where an enterprise team already runs it; Vue where a lightweight embed is needed. The choice comes with a written reason." },
      { q: "How long does a typical website or web app take?", a: "A marketing site with a CMS typically ships in 4–6 weeks; a departmental web app in 8–12. In every case a working thin slice is live by week three so you can judge progress on real software." },
    ],
    relatedIndustries: ["retail-ecommerce", "real-estate", "fintech-lending", "construction", "healthcare", "manufacturing"],
  },
  "mobile-app-development": {
    slug: "mobile-app-development",
    metrics: [
      { value: "2 stores", label: "One codebase, both shipped" },
      { value: "5", label: "Own products in production" },
      { value: "Offline", label: "First, for field teams" },
    ],
    whyUs: [
      { title: "Our own apps are in the stores", desc: "TeleValley, Finvalley and BBNPlay are live products — we ship and maintain apps for ourselves, not just for clients." },
      { title: "Low-end device discipline", desc: "Launch time, jank-free lists and battery use are tested on ₹10,000 Android phones, not flagship demo devices." },
      { title: "Release craft handled", desc: "Signing, listings, review responses and phased rollouts on both stores are part of delivery." },
      { title: "Written native-vs-cross-platform advice", desc: "We recommend Flutter, React Native or native in writing, with reasons — even when it costs us the engagement." },
    ],
    overview: [
      "Mobile apps fail quietly. The demo on the founder's iPhone looks perfect; the field team's ₹10,000 Android takes eight seconds to open it, loses a form when the signal drops in the basement, and drains the battery by lunch. Six months after launch the app is uninstalled and the team is back on WhatsApp — and the store listing still says 4.5 stars because nobody updated it.",
      "We build mobile apps for the devices your users actually own and the networks they actually have. That means launch-time and jank budgets tested on low-end Android, offline-first data layers that queue writes and sync when connectivity returns, and release engineering — signing, store listings, review responses, phased rollouts — treated as part of the job rather than an afterthought. Our own products, TeleValley, Finvalley and BBNPlay, are shipped and maintained the same way.",
      "The result is an app that survives week one on the shop floor, the delivery route or the customer's commute. You get both store builds, the source, the signing keys and the analytics wired in, and a recommendation in writing on whether Flutter, React Native or native was the right call for your case — even when the honest answer costs us the bigger build.",
      "The cost of a mobile app that fails quietly is rarely the build fee. It is the field data that never reaches the office because the form failed offline, the customer who uninstalled after the second crash and never came back, the release that slipped a month because a certificate expired, and the sales team that went back to WhatsApp because the app was slower than a message. Those costs do not appear on an invoice, which is exactly why they compound unnoticed.",
    ],
    painPoints: [
      { title: "Field staff stop using the app", desc: "It assumes connectivity and a fast phone. In a basement, a factory or a highway dead zone, forms fail and the team goes back to WhatsApp." },
      { title: "Two codebases, twice the bill", desc: "Separate iOS and Android teams double every feature's cost and drift apart in behaviour." },
      { title: "Store releases are a monthly crisis", desc: "Signing certificates expire, review rejections stall launches and nobody owns the listing." },
      { title: "The vendor holds the keys", desc: "Keystores, developer accounts and source live with the agency — switching vendors means starting over." },
    ],
    useCases: [
      { title: "Field-force and delivery apps", desc: "Offline-first capture with GPS, photos and signatures that sync in the background — for sales reps, drivers and site engineers." },
      { title: "Customer-facing consumer apps", desc: "Booking, ordering, fintech and learning apps with UPI payments, push notifications and analytics on both stores." },
      { title: "Enterprise companion apps", desc: "Mobile front-ends for your CRM, ERP or HRMS — approvals, payslips, attendance and dashboards on the phone." },
      { title: "App rescue and upgrades", desc: "Legacy React Native or Flutter apps brought to current versions, store-compliant and performant, without a rewrite." },
    ],
    outcomes: [
      "Cold launch under two seconds and jank-free lists on a ₹10,000 Android phone",
      "Forms and captures that survive lost signal and background kills, syncing when the network returns",
      "Both store builds signed, listed and released — with the keys and accounts in your ownership",
      "Crash reporting, analytics and push wired in before launch, not after the first complaint",
      "A written native-vs-cross-platform recommendation with reasons, before any code",
    ],
    timeSavings: [
      { task: "Field data reaching the office", before: "Photographed forms, days later", after: "Synced within minutes of signal" },
      { task: "Shipping a feature to both platforms", before: "Two teams, two sprints", after: "One codebase, one sprint" },
      { task: "A store release", before: "A week of certificate and review drama", after: "A scheduled, phased rollout" },
      { task: "Finding out the app crashed", before: "A customer complaint", after: "Crash report the same minute" },
    ],
    techs: ["Flutter 3", "Dart", "React Native", "Kotlin", "Swift", "Bloc / Riverpod", "SQLite / Drift", "Firebase", "Fastlane", "Play & App Store"],
    quickFacts: [
      { label: "Typical timeline", value: "8–14 wks", sub: "To both stores" },
      { label: "Team on it", value: "3–5", sub: "Architect, mobile, backend, QA" },
      { label: "Starting investment", value: "₹6 lakh", sub: "Single-purpose app" },
      { label: "First working demo", value: "Week 3", sub: "Clickable build on a real device" },
      { label: "After launch", value: "Both stores", sub: "Releases and crash triage handled" },
    ],
    youProvide: [
      "Developer accounts on Play Store and App Store in your name (we help set them up)",
      "A few real users and their real devices for testing",
      "Backend or API access, or a decision to have us build it",
      "One decision-maker for the weekly device demo",
    ],
    bestFor: "Field apps, consumer apps and mobile front-ends for your systems",
    longDescription:
      "Native iOS and Android plus cross-platform Flutter and React Native apps — engineered for performance, battery life and a polished UX. We handle store submission, signing and the fiddly release process end to end.",
    capabilities: [
      { title: "Native iOS & Android", desc: "Kotlin and Swift for performance-critical apps where every millisecond and megabyte matter." },
      { title: "Cross-platform", desc: "Flutter and React Native for one codebase on both stores — faster to ship and maintain." },
      { title: "App store delivery", desc: "Signing, listings, review handling and phased rollout on the Play Store and App Store." },
      { title: "Offline-first", desc: "Sync-on-reconnect architectures for field teams on unreliable connectivity." },
    ],
    deliverables: [
      "iOS and Android builds, signed and store-ready",
      "Source code and build pipelines",
      "Design assets and app store listings",
      "Analytics and crash reporting wired in",
      "Handover and a maintenance plan",
    ],
    process: [
      "Scoping call and platform recommendation (native vs cross-platform)",
      "UX prototype and a clickable build by week three",
      "Two-week sprints with weekly demos on real devices",
      "Store submission, handover and support",
    ],
    serviceFaqs: [
      { q: "Native or cross-platform — how do you decide?", a: "We recommend based on your budget, timeline, team and performance needs. Cross-platform is right for most business apps; native makes sense for graphics-heavy or hardware-intensive apps. We'll give you a written recommendation, not a preference." },
      { q: "Do you handle app store submission?", a: "Yes — signing, listings, screenshots, review responses and phased rollout on both stores are part of delivery, not billed separately." },
      { q: "Will the app work without internet?", a: "If your users need it to, yes. We build offline-first data layers that store captures locally and sync in the background with conflict-safe rules — the pattern behind our cold-chain and field-service apps." },
      { q: "Can you take over an app another team built?", a: "Yes. We start with a code and store audit, secure the signing keys and accounts in your name, stabilise crashes and then plan features — the same rescue sequence we use for web systems." },
    ],
    // Keep relatedIndustries at 3 or 6 entries per service so the
    // "Industries we serve with this" grid always fills its 3 columns.
    relatedIndustries: ["fintech-lending", "retail-ecommerce", "logistics"],
  },
  "custom-software": {
    slug: "custom-software",
    metrics: [
      { value: "12", label: "Proven solution patterns" },
      { value: "1 day", label: "Payroll cycle after HRMS rollout" },
      { value: "0", label: "Leads dropped after CRM go-live" },
    ],
    whyUs: [
      { title: "We shadow your team first", desc: "The scoping week maps how work actually happens — lead sources, approvals, exceptions — before a single screen is designed." },
      { title: "Indian compliance built in", desc: "GST, e-invoice, Tally sync, PF/ESI/PT and DPDP consent handling are standard modules, not custom requests." },
      { title: "Parallel runs before cutover", desc: "Payroll, inventory and billing go live only after a reconciled parallel run on your real data." },
      { title: "Audit trails by default", desc: "Every business system we ship logs who changed what, when and why — the feature that wins enterprise contracts." },
    ],
    overview: [
      "Every growing Indian business hits the same wall. The spreadsheet that ran the company at ten people has forty tabs at fifty people; leads live in a WhatsApp group, stock in a register, payroll in an Excel file only one person understands, and the owner learns about problems at month-end. Off-the-shelf software promises to fix it and usually adds a second system the team works around.",
      "We build custom CRM, ERP, HRMS and workflow systems the other way round: we shadow your team for a week, trace one real order or one real lead or one real payroll run from start to finish, and model the software on that — exceptions included. Indian compliance is not a custom request: GST and e-invoicing, Tally sync, PF, ESI and professional tax, DPDP consent and audit trails are standard modules. A thin slice is live on your real data by week three, and nothing goes live without a reconciled parallel run.",
      "What you get is one accountable system your team actually opens: role-based dashboards for the owner, the floor and the accountant, a full audit trail on every change, and integrations with the tools you keep. Month-end becomes a review rather than a fire drill, and when you outgrow the system it is your code to extend — not a licence to renew.",
      "The spreadsheet economy has a price the accounts never show. Two days of every month spent reconciling attendance, stock and invoices by hand. A quotation that took forty-five minutes to type and quoted last quarter's price. A lead that was never called a second time because nobody owned it. A payroll dispute because the overtime rule was applied from memory. And the question no one can answer when a client, an auditor or a dispute asks it: who changed this, and when? Each of these is small. Together they are the reason the business stops growing at the size the spreadsheet can carry.",
    ],
    painPoints: [
      { title: "The business runs on WhatsApp and Excel", desc: "Leads, stock, approvals and payroll live in chats and sheets that nobody can audit and everybody can overwrite." },
      { title: "Off-the-shelf software fights the process", desc: "The CRM forces a funnel your team does not use; the ERP runs the accounts while operations happen beside it." },
      { title: "Month-end is a two-day scramble", desc: "Attendance, stock and invoices are reconciled by hand every month, with errors discovered after the fact." },
      { title: "No one can answer 'who changed this?'", desc: "Prices, approvals and payouts change without a trail — a problem the day a client, auditor or dispute asks." },
    ],
    useCases: [
      { title: "CRM built on your sales process", desc: "Lead capture from portals, WhatsApp and walk-ins, mandatory next actions, quotations from the deal record and role-based dashboards." },
      { title: "ERP for trading and manufacturing", desc: "Multi-godown inventory, purchase automation, GST-ready invoicing, job cards and Tally sync — with a parallel run before cutover." },
      { title: "HRMS with Indian payroll", desc: "Biometric attendance, unit-wise shift rules, PF/ESI/PT/TDS payroll, statutory outputs and employee self-service on mobile." },
      { title: "Workflow and approval engines", desc: "Indents, expense claims, discounts and document approvals with maker-checker controls and a full audit log." },
    ],
    outcomes: [
      "One system of record replacing the spreadsheets and chat groups, with every change logged",
      "Month-end closing in a day, with GST, PF and ESI outputs generated ready to file",
      "Role-based dashboards that show the owner, the floor and the accountant the same truth",
      "Migration of historical data reconciled before go-live — nothing lost, nothing duplicated",
      "A parallel-run verified cutover and role-wise training on your own data",
    ],
    timeSavings: [
      { task: "Month-end reconciliation", before: "2–3 days across teams", after: "Same-day dashboard" },
      { task: "Answering a 'where is this?' question", before: "Three phone calls and a search", after: "One screen, live" },
      { task: "Raising and approving a purchase", before: "Email chain, days", after: "Workflow with alerts, minutes" },
      { task: "Preparing for an audit", before: "Weeks of reconstruction", after: "Export the trail" },
    ],
    techs: ["Next.js", "Node.js / Laravel", "PostgreSQL", "Flutter", "Tally integration", "GST e-invoice API", "WhatsApp Business API", "Razorpay", "AWS"],
    quickFacts: [
      { label: "Typical timeline", value: "8–16 wks", sub: "CRM 8 · ERP/HRMS 12–16" },
      { label: "Team on it", value: "4–6", sub: "Architect, full-stack, mobile, QA" },
      { label: "Starting investment", value: "₹8 lakh", sub: "Departmental band" },
      { label: "First working demo", value: "Week 3", sub: "On your real data" },
      { label: "After launch", value: "1 quarter", sub: "Support and training included" },
    ],
    youProvide: [
      "A week of access to shadow the people who do the work",
      "Your current spreadsheets, registers and Tally data for migration",
      "One owner per department for sign-offs and the parallel run",
      "Statutory details: GST, PF/ESI registrations, salary structures",
    ],
    bestFor: "Replacing spreadsheets and WhatsApp with one accountable system",
    longDescription:
      "CRM, ERP, HRMS and business-automation systems built around how your operations actually run — replacing spreadsheets and WhatsApp with one accountable platform. We map your real workflow to software, not the other way around.",
    capabilities: [
      { title: "CRM", desc: "Pipeline, lead capture, follow-ups and reporting that mirror your actual sales process." },
      { title: "ERP", desc: "Inventory, orders, accounting and procurement in one system with role-based access." },
      { title: "HRMS & payroll", desc: "Attendance, leave, payroll and compliance built for Indian labour and tax rules." },
      { title: "Business automation", desc: "Workflows that remove manual hand-offs and create a full audit trail." },
    ],
    deliverables: [
      "Custom system mapped to your real workflow",
      "Role-based access and a full audit trail",
      "Migration of existing data",
      "Integrations with your tools (accounting, mail, SMS)",
      "Training, documentation and support",
    ],
    process: [
      "Workflow discovery — we shadow your team and map the real process",
      "Architecture and a thin-slice prototype by week three",
      "Two-week sprints with weekly demos against real data",
      "Migration, training, launch and support",
    ],
    serviceFaqs: [
      { q: "Can you integrate with our existing accounting or mail tools?", a: "Yes — we routinely integrate Tally, QuickBooks, GST portals, SMTP, SMS gateways and CRMs. Integration scope is defined up front so there are no surprises." },
      { q: "We have messy data in spreadsheets — can you migrate it?", a: "Yes. We audit and clean your source data, map it to the new schema, and reconcile before go-live so nothing is lost or duplicated." },
      { q: "Custom or off-the-shelf — how do we decide?", a: "Run three tests: will your team follow the tool's process, does it connect to Tally and WhatsApp natively, and who holds your data if you leave? If the shelf tool passes all three, buy it. If your process is genuinely different, custom wins on fit and ownership — and we will say which in writing." },
      { q: "How do you make sure staff actually use it?", a: "By building with the people who enter the data in the room from scoping week, going live on the daily-use path first, training role by role on real data, and staying on call through the first month. Adoption is designed, not hoped for." },
    ],
    relatedIndustries: ["manufacturing", "real-estate", "logistics", "construction", "retail-ecommerce", "fintech-lending"],
  },
  "digital-marketing": {
    slug: "digital-marketing",
    metrics: [
      { value: "CPL", label: "Reported per qualified lead" },
      { value: "Monthly", label: "Budget re-allocation reviews" },
      { value: "SSR", label: "Technical SEO foundation first" },
    ],
    whyUs: [
      { title: "Engineers fix the foundation", desc: "We are a software company first — slow pages, missing schema and broken tracking get fixed in code, not worked around." },
      { title: "Lead quality, not impressions", desc: "Campaigns are measured against cost per qualified lead and enquiries per landing page, reviewed monthly." },
      { title: "Local SEO for Indian markets", desc: "Google Business Profile, citations and city-level landing pages for businesses that sell locally." },
      { title: "No ranking guarantees", desc: "We promise a sound foundation, a clear strategy and transparent reporting — and we say so in writing." },
    ],
    overview: [
      "Most SME marketing budgets leak in two places: money spent driving traffic to a website that cannot convert it, and money spent on content published on a site that cannot rank. The agency reports impressions and clicks; the owner sees no enquiries and cancels after three months. Neither side is lying — they are measuring the wrong thing.",
      "We start from the foundation because we are engineers first. Slow pages, missing schema, broken tracking and client-rendered content get fixed in code before a rupee goes to ads. Then the strategy is simple and measurable: one page per service and per city you serve, answers to the questions your sales team hears weekly, Google Business Profile and citations for local search, and campaigns on Google and Meta measured against cost per qualified lead, not impressions.",
      "Every month you get a report tied to enquiries and calls per landing page, and budget moves toward what is producing them. Pages that convert get improved; pages that do not get rewritten or retired. That feedback loop, run honestly, is the whole strategy — and it is why we will never guarantee a ranking, only a foundation, a plan and transparent numbers.",
      "Marketing without a measured foundation costs more than the retainer. Ad spend lands on pages that take four seconds to load, so a third of the clicks you paid for leave before the page appears. Blog posts are written for keywords the site cannot rank for, because the technical base was never fixed. A Google Business Profile left unclaimed sends the 'near me' searches — the highest-intent traffic a local business gets — to whoever claimed theirs. And a monthly report of impressions tells you the campaign is busy, not that it is working.",
    ],
    painPoints: [
      { title: "Traffic that never becomes enquiries", desc: "Ads drive clicks to slow pages with no clear next step, and the budget is spent before anyone notices." },
      { title: "Content that never ranks", desc: "Blog posts published on a client-rendered site with no schema and a four-second mobile load are invisible to search." },
      { title: "Reports full of vanity numbers", desc: "Impressions and reach look healthy while calls and form submissions stay flat — nobody is tracking the number that matters." },
      { title: "Local customers cannot find you", desc: "An unclaimed or thin Google Business Profile and no city pages mean the 'near me' searches go to a competitor." },
    ],
    useCases: [
      { title: "Technical SEO foundation", desc: "Core Web Vitals, server rendering, schema, sitemaps and analytics fixed in code — the work every campaign depends on." },
      { title: "Local SEO for multi-branch businesses", desc: "Google Business Profile, citations and per-city landing pages for clinics, showrooms, institutes and service businesses." },
      { title: "Performance ads measured on leads", desc: "Google and Meta campaigns with conversion tracking to calls and forms, reported and re-allocated on cost per qualified lead." },
      { title: "Content that answers buyer questions", desc: "Service and industry pages plus articles written from the questions your sales team hears — targeting real searches, linked, with one next step." },
    ],
    outcomes: [
      "A technically sound site: green Core Web Vitals, structured data and tracking that reaches the CRM",
      "Enquiries and calls attributed per landing page, per channel, per month",
      "Budget re-allocated monthly toward the channels producing qualified leads",
      "Local visibility for every branch or city you serve",
      "A content plan tied to real search queries, not a posting calendar",
    ],
    timeSavings: [
      { task: "Knowing which campaign produced a lead", before: "Guesswork at month-end", after: "Attributed in the CRM, live" },
      { task: "Publishing a new city page", before: "Agency brief, 2 weeks", after: "Template, same day" },
      { task: "Fixing a technical SEO issue", before: "Ticket to a separate web vendor", after: "Same team, same sprint" },
      { task: "Monthly reporting review", before: "A 40-slide deck to decode", after: "One page: leads, cost, next moves" },
    ],
    techs: ["Google Analytics 4", "Google Search Console", "Google Ads", "Meta Ads", "Google Business Profile", "Tag Manager", "Next.js SEO tooling", "Schema.org"],
    quickFacts: [
      { label: "Typical timeline", value: "Monthly", sub: "Audit in week 1, campaigns by week 3" },
      { label: "Team on it", value: "2–3", sub: "Strategist, engineer, content" },
      { label: "Starting investment", value: "₹40k / mo", sub: "Plus ad spend, quoted after audit" },
      { label: "First results", value: "30 days", sub: "Technical fixes and first leads" },
      { label: "Reporting", value: "Monthly", sub: "Leads and cost per lead, one page" },
    ],
    youProvide: [
      "Access to analytics, Search Console, ads accounts and Google Business Profile",
      "The enquiries and objections your sales team hears every week",
      "Someone who can approve landing-page copy within two days",
      "A clear definition of a qualified lead, agreed in the audit",
    ],
    bestFor: "Turning a technically sound site into a measurable lead engine",
    longDescription:
      "SEO, performance marketing, social and content that turn your website into a lead engine — not a brochure no one visits. We pair the technical SEO foundation with campaigns measured against lead quality, not vanity metrics.",
    capabilities: [
      { title: "SEO & local SEO", desc: "Technical, on-page and local SEO — including Google Business Profile and citation building for Indian markets." },
      { title: "Performance ads", desc: "Google and Meta campaigns set up, managed and reported against cost-per-qualified-lead." },
      { title: "Content & social", desc: "Articles, landing pages and social cadence that build authority and feed the funnel." },
      { title: "Analytics & reporting", desc: "Clear dashboards tied to revenue, not impressions, with monthly reviews." },
    ],
    deliverables: [
      "Technical SEO audit and fixes",
      "Keyword and content strategy",
      "Campaign setup with conversion tracking",
      "Monthly performance reports against lead quality",
      "Landing pages wired to your forms",
    ],
    process: [
      "Audit of current SEO, analytics and pipeline",
      "Keyword and channel strategy with targets",
      "Execution sprints with weekly check-ins",
      "Monthly reviews and re-allocation toward what works",
    ],
    serviceFaqs: [
      { q: "Do you guarantee rankings?", a: "No reputable agency guarantees specific rankings, and we won't either. We guarantee a technical SEO foundation, a clear strategy, transparent reporting and continuous re-allocation toward channels that produce qualified leads." },
      { q: "Can you work with the site you built for us?", a: "Yes — and it's an advantage. We build SEO in at the foundation (SSR, schema, sitemaps), so campaigns start from a technically sound base rather than fighting the site." },
      { q: "How soon will we see results?", a: "Technical fixes and ads produce measurable enquiries within the first month. Organic rankings for competitive terms typically take three to six months to move — we say so up front and report progress against enquiries, not positions." },
      { q: "What is the minimum monthly budget?", a: "It depends on your market and goals, and we quote it in writing after the audit. We would rather run a focused local campaign well than spread a small budget across every channel." },
    ],
    relatedIndustries: ["real-estate", "retail-ecommerce", "fintech-lending"],
  },
  "managed-it": {
    slug: "managed-it",
    metrics: [
      { value: "1 hr", label: "Incident first response" },
      { value: "24×7", label: "Monitoring & on-call" },
      { value: "100%", label: "Backups restore-tested" },
    ],
    whyUs: [
      { title: "SLA in the contract", desc: "One-hour incident response and 24-hour non-urgent response are written into every managed engagement." },
      { title: "Backups that restore", desc: "Scheduled restore drills with documented recovery times — an untested backup is a hope, not a plan." },
      { title: "Infrastructure as code", desc: "Runbooks and Terraform in your repos, so nothing depends on one engineer's memory or on staying with us." },
      { title: "Monthly reports you can read", desc: "Uptime, incidents, cost and patch status in one written report, every month." },
    ],
    overview: [
      "For most SMEs, IT is a person: the one engineer who knows the server password, the vendor who set up the office network in 2019, the cousin who 'does the cloud'. It works until the day it does not — a ransomware email opened on a Friday, a disk that fills at 2 a.m., a backup that turns out never to have been tested. The cost of that day is usually higher than a decade of doing it properly.",
      "Managed IT with us means the boring discipline is done on a schedule and reported in writing. Servers and cloud accounts are monitored around the clock with alerts that reach a named human; patches, access reviews and secret rotation happen on a calendar; backups are restore-tested, not assumed; and a one-hour first response on production incidents is written into the contract. Where you are still on-premise or on an expensive legacy host, we migrate you to AWS or Azure with a runbook and a rollback plan, without a weekend of downtime.",
      "The outcome is that your business stops depending on one person's memory. Every environment is documented, every credential is in a vault you own, and every month you get a report of uptime, incidents, cost and what was patched — one page your finance head can read. If you ever leave, everything is already yours.",
      "The price of unmanaged IT is paid all at once. A ransomware email opened on a Friday afternoon costs a week of downtime and a ransom note, or a rebuild from backups nobody has tested. A disk that fills at two in the morning takes the billing system down until someone notices at nine. A departed engineer takes the only copy of the server password with them. And a client's security questionnaire, unanswered because there is no written baseline, quietly costs the contract. None of these are rare; every one of them is avoidable on a calendar.",
    ],
    painPoints: [
      { title: "One person holds every password", desc: "When they are on leave, or gone, nobody can deploy, restore or even log in — and that is the moment something breaks." },
      { title: "Backups nobody has ever restored", desc: "A backup that has never been restore-tested is a hope, not a plan. The first test is usually the real emergency." },
      { title: "Security is a hope, not a posture", desc: "Shared admin logins, unpatched servers and secrets in code — exactly what a breach or a DPDP audit finds first." },
      { title: "Outages are discovered by customers", desc: "No monitoring, no alerting and no on-call means the first sign of a problem is an angry phone call." },
    ],
    useCases: [
      { title: "Managed cloud operations", desc: "24×7 monitoring, patching, backups with restore drills, cost reviews and a one-hour incident response — for systems we built and ones we did not." },
      { title: "Cloud migration from on-premise or legacy hosts", desc: "Inventory, dependency map, parallel running and a rollback plan — moved to AWS or Azure without a downtime window." },
      { title: "Security hardening and audit readiness", desc: "Least-privilege access, secret vaulting, encryption, audit logging and a written baseline for DPDP or client security questionnaires." },
      { title: "Takeover from a previous vendor", desc: "Audit first, document everything, transition with parallel running — so no knowledge and no uptime is lost." },
    ],
    outcomes: [
      "Every production system monitored with alerts routed to a named on-call engineer",
      "Backups restore-tested on a schedule, with documented recovery times per data store",
      "Patch, access-review and secret-rotation calendars followed and reported monthly",
      "A one-hour first response on production incidents, written into the contract",
      "Credentials, runbooks and infrastructure documentation in your ownership",
    ],
    timeSavings: [
      { task: "Finding out a service is down", before: "A customer call, hours later", after: "Alert within a minute" },
      { task: "Restoring from backup", before: "Unknown — never tested", after: "Documented, drilled, minutes" },
      { task: "Answering a client security questionnaire", before: "A week of scrambling", after: "Export the written baseline" },
      { task: "Monthly IT review", before: "None — problems surface at month-end", after: "One-page report, every month" },
    ],
    techs: ["AWS", "Azure", "Cloudflare", "Grafana / Prometheus", "Terraform", "Docker", "Vault-style secret management", "Endpoint & patch tooling", "PagerDuty-style on-call"],
    quickFacts: [
      { label: "Typical timeline", value: "2–4 wks", sub: "Audit to stabilised baseline" },
      { label: "Team on it", value: "1–2", sub: "Named engineer plus on-call rota" },
      { label: "Starting investment", value: "₹25k / mo", sub: "Essential care plan" },
      { label: "Incident response", value: "1 hour", sub: "First response, in the contract" },
      { label: "Reporting", value: "Monthly", sub: "Uptime, incidents, cost, patches" },
    ],
    youProvide: [
      "Current access to servers, cloud accounts and domain registrar",
      "A list of the systems that must never go down, in priority order",
      "An escalation contact on your side for incidents",
      "Any compliance requirements your clients or auditors ask for",
    ],
    bestFor: "Businesses whose IT depends on one person or one vendor",
    longDescription:
      "Cloud migration on AWS and Azure, 24×7 monitoring, security hardening and incident response — secure infrastructure your business can rely on. We treat operations as a service with a publicly stated response SLA.",
    capabilities: [
      { title: "Cloud migration", desc: "Lift-and-shift or re-architecture to AWS and Azure with minimal downtime." },
      { title: "24×7 monitoring", desc: "Alerting, on-call and runbooks so issues are caught before users notice." },
      { title: "Security hardening", desc: "Patch management, least-privilege access, secrets and vulnerability remediation." },
      { title: "Incident response", desc: "A one-hour first-response target for production incidents on managed engagements." },
    ],
    deliverables: [
      "Infrastructure-as-code and runbooks",
      "Monitoring, alerting and on-call coverage",
      "Security baseline and patch schedule",
      "Monthly uptime and incident reports",
      "A documented disaster-recovery plan",
    ],
    process: [
      "Infrastructure audit and risk assessment",
      "Migration or hardening plan with timelines",
      "Execution with change windows and rollback plans",
      "Ongoing monitoring, patching and incident response",
    ],
    serviceFaqs: [
      { q: "What's your response time for incidents?", a: "For managed-services engagements we target a one-hour first response for production incidents and a 24-hour response for non-urgent work. The SLA is stated in every contract." },
      { q: "Can you take over infrastructure from our current vendor?", a: "Yes. We audit the current setup, document it, and transition with parallel running where possible so there's no downtime or lost knowledge." },
      { q: "Do you support systems you did not build?", a: "Yes — most managed engagements begin on inherited systems. We start with a written audit, stabilise backups, monitoring and access, and then run operations on the same plan as everything else." },
      { q: "How is managed IT priced?", a: "A monthly plan scoped to the number of systems and the response tier you need, quoted in writing after the audit. Month-to-month after the first quarter, with no lock-in — nothing in the setup depends on staying with us." },
    ],
    relatedIndustries: ["fintech-lending", "manufacturing", "logistics", "construction", "healthcare", "retail-ecommerce"],
  },
  "blockchain": {
    slug: "blockchain",
    metrics: [
      { value: "Audited", label: "Before every deploy" },
      { value: "EVM", label: "Ethereum, Polygon & more" },
      { value: "Tested", label: "Economic guardrails" },
    ],
    whyUs: [
      { title: "Security first, not last", desc: "Threat modelling before architecture, test suites on every contract and an audit before mainnet." },
      { title: "Independent audit recommended", desc: "For high-value contracts we recommend a third-party audit in addition to ours, and say so up front." },
      { title: "Real transaction volume", desc: "Gas-efficient contracts and monitoring for on-chain anomalies, built for production load rather than demos." },
      { title: "Wallet UX that keeps users", desc: "Key management and wallet flows designed so users do not lose funds or abandon onboarding." },
    ],
    overview: [
      "Blockchain projects fail in two opposite ways. Some are built by enthusiasts who ship an unaudited contract to mainnet and lose users' funds to a bug that a test suite would have caught. Others are built by consultants who wrap a normal database in a whitepaper and call it decentralised. In both cases the business ends up with something it cannot trust and cannot explain to a regulator, an investor or a customer.",
      "We treat blockchain as engineering with unusually high stakes. It starts with an honest question — does this need a chain at all, or would a well-audited ledger do? — answered in writing. Where a chain is the right answer, we threat-model before we architect, write Solidity for auditability and gas efficiency, test every contract path, monitor on-chain anomalies after launch, and recommend an independent third-party audit in addition to ours for anything holding real value. The wallet and custody experience gets the same care, because a platform that loses users' keys loses users.",
      "You end up with a system whose behaviour is provable: audited contracts with test coverage, a front-end that integrates cleanly with wallets, deployment scripts and monitoring you own, and a written audit report with remediation notes you can hand to anyone who asks how the platform is secured.",
      "Getting blockchain wrong is expensive in a way most software is not, because mistakes are public and permanent. An unaudited contract that holds user funds is a bounty waiting to be claimed, and there is no rollback. A chain chosen for the pitch deck rather than the workload adds transaction fees and latency to every action forever. A wallet flow that confuses users loses them at signup, before the product has a chance. And a platform that cannot explain its own compliance posture to a bank, an exchange or a regulator cannot grow past the founders' network.",
    ],
    painPoints: [
      { title: "A contract nobody has audited", desc: "Code holding real value is deployed on trust. The first exploit is the first audit — and it is public." },
      { title: "Blockchain where a database would do", desc: "A chain adds cost and complexity without a benefit. The honest question was never asked." },
      { title: "Users locked out or drained", desc: "Poor wallet and key-management UX loses funds and users faster than any contract bug." },
      { title: "No monitoring after launch", desc: "On-chain anomalies, failed transactions and gas spikes go unnoticed until the community notices first." },
    ],
    useCases: [
      { title: "Smart contracts and token systems", desc: "Solidity contracts for EVM chains — tokens, vesting, staking and governance — written for auditability and gas efficiency, with full test coverage." },
      { title: "DeFi platforms", desc: "Lending, swapping and staking with tested economic guardrails, oracle handling and monitoring for the exploits that matter." },
      { title: "Supply-chain and traceability ledgers", desc: "Tamper-evident records for provenance, batch tracking and multi-party workflows where an immutable trail is the product." },
      { title: "Audits and remediation", desc: "Pre-deploy reviews of existing contracts with a written report, prioritised findings and remediation support." },
    ],
    outcomes: [
      "A written recommendation on whether a chain is needed at all, before any build",
      "Audited contracts with test coverage, deployed with scripts you own",
      "On-chain monitoring and alerting for anomalies from day one",
      "A wallet and custody experience that does not lose users or funds",
      "An audit report and remediation notes you can share with investors and regulators",
    ],
    timeSavings: [
      { task: "Answering 'is this secure?'", before: "A whitepaper and a hope", after: "Audit report and test coverage" },
      { task: "Deploying a contract change", before: "Manual, risky, undocumented", after: "Scripted, tested, reviewable" },
      { task: "Spotting an on-chain anomaly", before: "Community reports it on social media", after: "Alert within minutes" },
      { task: "Deciding chain vs database", before: "Months of debate", after: "A written recommendation in a week" },
    ],
    techs: ["Solidity", "Hardhat / Foundry", "Ethereum", "Polygon", "ethers.js / viem", "OpenZeppelin", "IPFS", "The Graph", "Next.js dApp front-ends"],
    quickFacts: [
      { label: "Typical timeline", value: "10–20 wks", sub: "Including audit window" },
      { label: "Team on it", value: "3–4", sub: "Architect, contract engineers, front-end" },
      { label: "Starting investment", value: "₹12 lakh", sub: "Audited contract set plus dApp" },
      { label: "First working demo", value: "Week 3", sub: "Contracts on testnet" },
      { label: "Before mainnet", value: "Audit", sub: "Ours plus a recommended third party" },
    ],
    youProvide: [
      "A clear description of who the parties are and what must be tamper-proof",
      "Legal counsel on token classification, if tokens are involved",
      "Budget for an independent audit on anything holding real value",
      "A decision-maker for the threat-model review in week one",
    ],
    bestFor: "Multi-party records and DeFi where trust must be provable",
    longDescription:
      "Smart contracts, decentralized ledgers and secure DeFi platforms — audited, tested and built for real transactional volume. We treat security as the first requirement, not a final checkpoint.",
    capabilities: [
      { title: "Smart contracts", desc: "Solidity contracts for EVM chains, written for auditability and gas efficiency." },
      { title: "DeFi platforms", desc: "Lending, swapping and staking platforms with tested economic guardrails." },
      { title: "Security audits", desc: "Pre-deploy audits, test suites and monitoring for on-chain anomalies." },
      { title: "Wallet & custody UX", desc: "Wallet integration and key-management UX that doesn't lose users' funds." },
    ],
    deliverables: [
      "Audited smart contracts with test coverage",
      "Frontend dApp with wallet integration",
      "Deployment scripts and monitoring",
      "Audit report and remediation notes",
      "Documentation and a handover",
    ],
    process: [
      "Requirements and threat modelling",
      "Contract architecture and a tested prototype",
      "Two-week sprints with weekly reviews",
      "Audit, test, deploy and monitor",
    ],
    serviceFaqs: [
      { q: "Do you do security audits?", a: "Yes — pre-deploy audits with remediation, plus test suites and on-chain monitoring. For high-value contracts we recommend an independent third-party audit in addition to ours." },
      { q: "Which chains do you build on?", a: "Primarily EVM-compatible chains (Ethereum, Polygon, others). We'll recommend the chain that fits your throughput, cost and audience needs, not the one we happen to prefer." },
      { q: "Do we really need a blockchain?", a: "Often not — and we will say so. If a single trusted operator can hold the ledger, an audited database is cheaper and faster. A chain earns its place when multiple parties need a tamper-evident record none of them controls." },
      { q: "How do you handle Indian regulatory questions?", a: "We build with KYC gating, transaction logging and exportable records so the platform can answer compliance questions, and we recommend legal counsel on token classification before launch. We engineer for auditability; we do not give legal advice." },
    ],
    relatedIndustries: ["fintech-lending", "logistics", "agriculture"],
  },
  "graphic-design": {
    slug: "graphic-design",
    metrics: [
      { value: "Source", label: "Files, not flattened exports" },
      { value: "1 system", label: "Brand guide + components" },
      { value: "Dev-ready", label: "Figma handoff" },
    ],
    whyUs: [
      { title: "Design that ships", desc: "Our designers sit beside engineers, so systems are built to be implemented — not admired on a slide." },
      { title: "You own the brand", desc: "Editable source files and a guidelines document you can hand to any vendor." },
      { title: "Consistent across touchpoints", desc: "Web, app, collateral and ads drawn from one component library and token set." },
      { title: "Extend, don't impose", desc: "We start from the brand you have and document it, rather than forcing a new look." },
    ],
    overview: [
      "A business is judged in the first three seconds of every touchpoint — the logo on the visiting card, the pitch deck, the app icon, the invoice. Most SMEs assemble these one at a time from different freelancers, and the result is a brand that looks slightly different everywhere and slightly amateur overall. Worse, the source files live on a designer's laptop, so every new asset means starting again.",
      "We build brand identity as a system, not a logo file. Discovery aligns on who you sell to and what you want them to feel; concept directions give you real choices; and the chosen route becomes a full kit — logo variants, colour, type, spacing, iconography and templates — documented in guidelines any vendor can follow. Because our designers sit beside our engineers, the same tokens flow straight into your website, app and product UI, so what the customer sees on screen matches what they hold in their hand.",
      "You leave with editable source files in every format, a guidelines document, collateral templates your team can reuse, and a design system that makes the next landing page, deck or ad a matter of minutes rather than a new project. The brand is yours, and it stays consistent as you grow.",
      "An inconsistent brand costs more than a redesign ever will, because it is paid in every interaction. A proposal that looks less polished than a competitor's loses the deal before the pricing page. A website and an app that look like two different companies make customers doubt both. A logo that exists only as a low-resolution JPEG cannot go on a hoarding, a trade-show stand or an app icon without embarrassment. And every new asset commissioned from a different freelancer drifts the identity a little further, until nobody remembers what it was meant to be.",
    ],
    painPoints: [
      { title: "The brand looks different everywhere", desc: "Website, app, deck and packaging were made by different people at different times — customers notice, even if they cannot say why." },
      { title: "The designer has the source files", desc: "A logo change, a new size or a new colour means finding the original freelancer or starting from scratch." },
      { title: "Design that engineers cannot build", desc: "Beautiful mockups that ignore real content, real screens and real constraints — rebuilt from guesswork during development." },
      { title: "Every new asset is a new project", desc: "No templates, no system, no tokens — a simple social post or one-pager takes a week and a quote." },
    ],
    useCases: [
      { title: "Logo and brand identity", desc: "Logo systems, colour, type and guidelines for new businesses and for rebrands that need to carry existing equity forward." },
      { title: "UI/UX and product design systems", desc: "Dev-ready Figma systems with components and tokens that ship into your web and mobile products unchanged." },
      { title: "Marketing collateral", desc: "Pitch decks, brochures, one-pagers, trade-show material and ad creative sets that match the product quality." },
      { title: "Brand refresh and consolidation", desc: "Auditing what exists, documenting it and extending it consistently across every touchpoint — without a disruptive rebrand." },
    ],
    outcomes: [
      "One identity across website, app, collateral and packaging",
      "Editable source files and a guidelines document you own outright",
      "A component library and templates that make new assets a matter of minutes",
      "Design handed to engineers as tokens and components, not screenshots",
      "A brand that looks established to customers, partners and investors",
    ],
    timeSavings: [
      { task: "A new landing page or social set", before: "Brief a freelancer, 1–2 weeks", after: "From templates, same day" },
      { task: "Getting the logo in the right format", before: "Chase the original designer", after: "Open the brand kit" },
      { task: "Design to development handoff", before: "Rebuilt from mockups, days of back-and-forth", after: "Tokens and components, direct" },
      { task: "Keeping vendors on-brand", before: "Reviewing every draft", after: "Send the guidelines" },
    ],
    techs: ["Figma", "Adobe Illustrator", "Adobe Photoshop", "Design tokens", "Storybook", "Tailwind CSS", "Lottie / motion", "Print-ready PDF"],
    quickFacts: [
      { label: "Typical timeline", value: "3–6 wks", sub: "Identity 3 · full system 6" },
      { label: "Team on it", value: "1–2", sub: "Designer plus front-end engineer" },
      { label: "Starting investment", value: "₹1.5 lakh", sub: "Logo and identity kit" },
      { label: "First directions", value: "Week 2", sub: "Three concepts on real touchpoints" },
      { label: "Handover", value: "Source files", sub: "Every format, plus guidelines" },
    ],
    youProvide: [
      "Existing logos, brand files and examples you like and dislike",
      "A short brief on who you sell to and how you want to be seen",
      "One decision-maker to choose a concept direction",
      "Access to the website or product the system will feed into",
    ],
    bestFor: "New brands, rebrands and product design systems",
    longDescription:
      "Logos, brand identity and visual marketing assets that make your business look established before you say a word. We pair design with the systems and files your team can actually reuse.",
    capabilities: [
      { title: "Logo & identity", desc: "Logo systems, colour, type and brand guidelines you can hand to any vendor." },
      { title: "Marketing collateral", desc: "Decks, one-pagers, brochures and ads that match the brand." },
      { title: "Brand systems", desc: "Component libraries and templates so your team stays on-brand at scale." },
      { title: "Digital assets", desc: "Social, ad and web visuals in the right formats and sizes." },
    ],
    deliverables: [
      "Logo files in every format you need",
      "Brand guidelines document",
      "Marketing collateral templates",
      "Social and ad creative sets",
      "Source files, not just flattened exports",
    ],
    process: [
      "Brand discovery and reference alignment",
      "Concept directions and a chosen route",
      "Refinement and asset production",
      "Guidelines, handover and templates",
    ],
    serviceFaqs: [
      { q: "Do we get the source files?", a: "Yes — you receive editable source files and a guidelines document, not just flattened exports. You own the brand and can hand it to any vendor." },
      { q: "Can you match our existing brand?", a: "Yes. We start from your existing brand, document what's there, and extend it consistently rather than imposing a new look." },
      { q: "How many concept directions do we see?", a: "Typically three distinct directions after discovery, each shown across real touchpoints — a card, a screen, a deck — so you choose on how it works, not just how it looks. One route is then refined to completion." },
      { q: "Can the design system feed our app and website directly?", a: "Yes — that is the point of pairing designers with engineers. Tokens and components go from Figma into the codebase, so the product matches the brand without a rebuild." },
    ],
    relatedIndustries: ["retail-ecommerce", "real-estate", "construction"],
  },
  "cloud-devops": {
    slug: "cloud-devops",
    metrics: [
      { value: "-34%", label: "Cloud spend in one audit week" },
      { value: "0", label: "Downtime on migrations" },
      { value: "IaC", label: "Infrastructure as code" },
    ],
    whyUs: [
      { title: "Cost baseline first", desc: "Every engagement starts with a measured spend baseline; savings are reported against it monthly." },
      { title: "Zero-downtime cutovers", desc: "Parallel running, lowered DNS TTLs and one-command rollbacks — migrations without a weekend outage." },
      { title: "Pipelines with gates", desc: "Staging environments, preview deploys and rollback paths before anything touches production." },
      { title: "Nothing depends on us", desc: "Terraform in your repos, credentials in your vault, runbooks your team can follow." },
    ],
    overview: [
      "Deploys should be boring. In most growing companies they are the opposite: a Friday-night ritual with a shared checklist, a prayer and a rollback that means restoring from last week's backup. Meanwhile the cloud bill has doubled in a year, nobody owns it, and every explanation for every line item is plausible. The engineering team spends its best hours on toil instead of features.",
      "Cloud and DevOps with us starts from a measured baseline: what runs where, what it costs, what is fragile. Then we codify the environment in Terraform without breaking it, build pipelines with staging gates, preview deployments and one-command rollback, containerise workloads with sane limits, and wire observability — logs, metrics, traces and alerts that reach a human. Cost engineering is structural, not a one-off cleanup: tagging enforced in CI, budget alerts, right-sizing against real utilisation and reserved capacity where it pays.",
      "The result is a platform that ships daily without drama and a bill that stops surprising finance. Migrations happen with parallel running and lowered DNS TTLs rather than a downtime window. And because everything lives as code in your repositories with runbooks your team can follow, nothing depends on us — which is exactly why clients stay.",
      "Slow, manual operations tax every feature you ship. When a release takes half a day and carries real risk, teams batch changes into large, infrequent deploys — and large deploys are exactly the ones that break. When environments are configured by hand, a new developer takes a week to be productive and a staging bug cannot be reproduced. When the cloud bill has no owner, forgotten environments and oversized instances quietly double it in a year, and the money that should have funded monitoring pays for idle servers instead.",
    ],
    painPoints: [
      { title: "Deploys are a weekend event", desc: "Manual steps, no staging gate and no rollback path turn every release into a risk the team avoids for as long as it can." },
      { title: "The cloud bill doubled and nobody knows why", desc: "Forgotten environments, oversized instances and cross-region chatter grow quietly with a good excuse for every line." },
      { title: "Servers configured by hand, years ago", desc: "Nothing is reproducible, nothing is documented, and the person who set it up has left." },
      { title: "Incidents found by customers", desc: "No metrics, no alerting and no on-call — the first sign of an outage is a support ticket." },
    ],
    useCases: [
      { title: "CI/CD and release engineering", desc: "GitHub Actions or GitLab pipelines with test gates, preview environments, staged rollouts and one-command rollback." },
      { title: "Cloud migration and re-platforming", desc: "On-premise or legacy hosting to AWS, GCP or Azure with inventory, dependency mapping, parallel running and zero-downtime cutover." },
      { title: "Cloud cost audits", desc: "A one-week audit that typically recovers 20–40% on overspend accounts, followed by structural controls so it stays recovered." },
      { title: "Kubernetes and container platforms", desc: "Docker images, Kubernetes or managed containers with resource limits, autoscaling and observability built in." },
    ],
    outcomes: [
      "Production deploys that take minutes, run daily and roll back with one command",
      "Every environment defined in Terraform in your repositories, reproducible on demand",
      "Cloud spend measured against a baseline and reported monthly, with budget alerts",
      "Logs, metrics, traces and alerts routed to a named on-call engineer",
      "Zero-downtime migrations with parallel running and a rehearsed rollback",
    ],
    timeSavings: [
      { task: "A production release", before: "Half a day, after hours", after: "Minutes, during the day" },
      { task: "Spinning up a new environment", before: "Days of hand configuration", after: "One Terraform apply" },
      { task: "Explaining the cloud bill", before: "Nobody can", after: "Tagged, owned, one dashboard" },
      { task: "Recovering from a bad deploy", before: "Restore from backup, hours", after: "Rollback, one command" },
    ],
    techs: ["AWS", "Azure", "GCP", "Terraform / Pulumi", "Kubernetes", "Docker", "GitHub Actions", "GitLab CI", "Grafana / Prometheus", "OpenTelemetry"],
    quickFacts: [
      { label: "Typical timeline", value: "3–8 wks", sub: "Audit 1 · pipelines 3 · migration 8" },
      { label: "Team on it", value: "1–3", sub: "DevOps engineers plus architect" },
      { label: "Starting investment", value: "₹3 lakh", sub: "Cost audit and CI/CD setup" },
      { label: "First result", value: "Week 1", sub: "Cost baseline and quick wins" },
      { label: "Typical savings", value: "20–40%", sub: "On overspend cloud accounts" },
    ],
    youProvide: [
      "Read access to cloud accounts, billing and current repositories",
      "The release process as it happens today, warts and all",
      "A list of environments and who owns each",
      "A maintenance window preference for the cutover, if any",
    ],
    bestFor: "Teams shipping slowly or paying too much to run their platform",
    longDescription:
      "Cloud and DevOps engineering that makes your platform faster to ship and cheaper to run — migration to AWS, GCP or Azure, CI/CD pipelines, container orchestration, infrastructure-as-code and observability. We reduce deploy risk and toil so your team can release daily without 2 a.m. incidents.",
    capabilities: [
      { title: "Cloud migration", desc: "Assessment, re-platforming and migration to AWS, GCP or Azure with minimal downtime and right-sized cost." },
      { title: "CI/CD & containers", desc: "Build pipelines, Docker images and Kubernetes orchestration for repeatable, one-click deployments." },
      { title: "Infrastructure as code", desc: "Terraform/Pulumi-managed environments that are versioned, reviewable and reproducible." },
      { title: "Observability", desc: "Logging, metrics, tracing and alerting so failures are caught before users notice them." },
    ],
    deliverables: [
      "Cloud architecture and migration runbook",
      "CI/CD pipelines with staging and production gates",
      "Containerised workloads on Kubernetes or managed containers",
      "Infrastructure-as-code repo (Terraform/Pulumi)",
      "Monitoring, logging and alerting dashboards",
    ],
    process: [
      "Cloud readiness and cost baseline assessment",
      "Architecture, migration plan and IaC scaffolding",
      "Pipeline and container platform build-out",
      "Cutover, observability handover and runbooks",
    ],
    serviceFaqs: [
      { q: "Do you work with our existing cloud provider?", a: "Yes. We work across AWS, GCP and Azure and meet you where you are — whether that means migrating from on-prem, consolidating providers, or optimising an existing cloud setup that has grown expensive." },
      { q: "Can you set up CI/CD without disrupting releases?", a: "Yes. We introduce pipelines with staging gates and rollback, shadow-deploy risky changes, and run releases alongside your current process until the new pipeline is proven." },
      { q: "Will we own the infrastructure code?", a: "Yes — all infrastructure is delivered as code in your repos. Your team can review, reproduce and change every environment without being locked in to us." },
      { q: "Will this lower our cloud bill?", a: "In most engagements, yes. We baseline your current spend, right-size instances, add auto-scaling and reserved-capacity plans, and report savings against that baseline every month." },
    ],
    relatedIndustries: ["fintech-lending", "manufacturing", "logistics", "construction", "retail-ecommerce", "healthcare"],
  },
};

export function getServiceDetail(slug: string): ServiceDetail | undefined {
  return serviceDetails[slug];
}

// ----- Leadership / team -----
export type TeamMember = {
  name: string;
  role: string;
  bio: string;
  focus: string;
};

export const team: TeamMember[] = [
  { name: "Dr. Mahendra J", role: "Director", bio: "Sets the company's technical and strategic direction, with a research-led approach to product and delivery.", focus: "Strategy & R&D" },
  { name: "Umesh K", role: "Chief Executive Officer", bio: "Owns growth, client relationships and the operating model that keeps delivery accountable.", focus: "Growth & Operations" },
  { name: "Shital Jain", role: "COO / Managing Director", bio: "Runs day-to-day operations and the processes that keep projects on scope, on budget and on time.", focus: "Delivery & Process" },
  { name: "Ashish Shinde", role: "CTO / Technical Head", bio: "Leads architecture decisions across the stack and owns code quality and engineering standards.", focus: "Architecture & Engineering" },
  { name: "Mohit Dhadiwal", role: "Chief Marketing Officer", bio: "Drives brand, demand and the market positioning that turns capability into pipeline.", focus: "Brand & Demand" },
  { name: "Saish B", role: "Lead Frontend / Jr. SDE", bio: "Owns frontend quality and the design-system practice across our web and product work.", focus: "Frontend & Design Systems" },
];

export const principles = [
  { title: "Code you own from day one", desc: "All source, credentials and repos are yours before any work begins. We work under NDA and IP assignment, and you can exit cleanly at any point." },
  { title: "A 24-hour response SLA", desc: "Stated publicly in every contract. For production incidents on managed engagements we target a one-hour first response." },
  { title: "Ship real software early", desc: "A thin-slice prototype by week three, not slides. Working software settles arguments that documents never will." },
  { title: "The engineers who scope it build it", desc: "No hand-offs to a faceless offshoring pool. The architect on the scoping call is the architect on the build." },
];

export const values = [
  { title: "Outcomes over hours", desc: "We're paid for the result, not the time spent. Fixed-bid and retainer models keep our incentives aligned with yours." },
  { title: "Radical transparency", desc: "Shared Jira, a Slack channel, weekly demos and a written scope. You always know where your project stands." },
  { title: "Engineering rigour", desc: "Code reviews, tests, documentation and a 24-hour SLA — the unglamorous discipline that keeps systems live for years." },
];

// ----- Offices (Contact) -----
export const offices = [
  {
    country: "India",
    lines: [
      "Plot No 10, Ukvalley Technologies,",
      "Near Samraat Nucleus,",
      "Dr. Homi Bhabha Nagar,",
      "Mumbai Naka, Nashik",
    ],
  },
  {
    country: "USA",
    lines: [
      "Ukvalley Technologies,",
      "413 Summit Ave, Apt 1503,",
      "Jersey City,",
      "New Jersey – 07306",
    ],
  },
];

// ----- Careers -----
export type Career = {
  slug: string;
  role: string;
  location: string;
  type: string;
  summary: string;
  responsibilities: string[];
  requirements: string[];
  perks: string[];
};

export const careers: Career[] = [
  {
    slug: "senior-react-nextjs-engineer",
    role: "Senior React / Next.js Engineer",
    location: "Remote (India)",
    type: "Full-time",
    summary: "Own complex web apps end to end — architecture, performance and delivery — for Indian SMEs and global startups.",
    responsibilities: [
      "Architect and ship Next.js applications end to end, from data model to deployment",
      "Own Core Web Vitals and SEO foundations on client-facing builds",
      "Review code, mentor mid-level engineers and hold the quality bar",
      "Work directly with clients in scoping calls and weekly demos",
    ],
    requirements: [
      "4+ years with React, 2+ with Next.js in production",
      "Strong TypeScript and Tailwind CSS skills",
      "Comfort with REST/GraphQL APIs and PostgreSQL or MongoDB",
      "Written and spoken English clear enough for client calls",
    ],
    perks: [
      "Fully remote with flexible hours",
      "Direct client exposure — no invisible-engineer roles",
      "Learning budget for courses and conferences",
      "Annual offsite with the full team",
    ],
  },
  {
    slug: "flutter-mobile-engineer",
    role: "Flutter Mobile Engineer",
    location: "Remote (India)",
    type: "Full-time",
    summary: "Build and ship cross-platform iOS & Android apps, including store submission and post-launch support.",
    responsibilities: [
      "Build Flutter apps from prototype to Play Store and App Store release",
      "Handle signing, store listings, review responses and phased rollouts",
      "Profile and fix performance, battery and offline-sync issues on real devices",
      "Integrate push, analytics, crash reporting and native modules",
    ],
    requirements: [
      "2+ years shipping Flutter apps to both stores",
      "Solid Dart fundamentals and state-management experience (Bloc, Riverpod or similar)",
      "Comfort reading Kotlin or Swift when native modules are needed",
      "Care about pixel-perfect UI on low-end Android devices",
    ],
    perks: [
      "Fully remote with flexible hours",
      "Ship apps used by thousands of daily users",
      "Learning budget and device allowance",
      "Annual offsite with the full team",
    ],
  },
  {
    slug: "backend-engineer-laravel-node",
    role: "Backend Engineer (Laravel / Node)",
    location: "Remote (India)",
    type: "Full-time",
    summary: "Design and build the APIs and data layers behind our CRM, ERP and fintech platforms.",
    responsibilities: [
      "Design APIs and data models for transactional business systems",
      "Build integrations with Tally, GST, payment gateways and SMS providers",
      "Own query performance, queues, migrations and data integrity",
      "Write the documentation other engineers build on",
    ],
    requirements: [
      "3+ years with Laravel or Node.js in production",
      "Strong SQL — schema design, indexing and migration discipline",
      "Experience with Redis, queues and background jobs",
      "Security-minded: auth, role-based access and audit trails by default",
    ],
    perks: [
      "Fully remote with flexible hours",
      "Fintech-grade engineering practice and mentorship",
      "Learning budget for courses and certifications",
      "Annual offsite with the full team",
    ],
  },
  {
    slug: "ui-ux-brand-designer",
    role: "UI/UX & Brand Designer",
    location: "Hybrid (India)",
    type: "Full-time",
    summary: "Own product design and brand systems across web, mobile and marketing for our clients and products.",
    responsibilities: [
      "Own design from wireframes to dev-ready Figma systems",
      "Build and maintain component libraries and brand guidelines",
      "Run quick user tests and turn feedback into design decisions",
      "Design marketing collateral that matches the product quality",
    ],
    requirements: [
      "3+ years in product design with a strong portfolio",
      "Expert Figma skills with component and token discipline",
      "Understand what engineers need from a handoff — you'll sit next to them",
      "Bonus: motion design or brand-identity experience",
    ],
    perks: [
      "Hybrid — studio days in Pune, rest remote",
      "Your design system ships to real products, not Dribbble",
      "Learning budget and design-conference allowance",
      "Annual offsite with the full team",
    ],
  },
];

// ----- Time savers: how the delivery model gives clients hours back -----
export type TimeSaver = {
  icon: string; // lucide key mapped in the component
  title: string;
  desc: string;
  saved: string; // the headline figure
  savedLabel: string;
};

export const timeSavers: TimeSaver[] = [
  {
    icon: "fileText",
    title: "Written scope before code",
    desc: "A scoping call, a written scope and a rough estimate in 3 business days replace the weeks of proposal ping-pong most projects start with.",
    saved: "2–3 wks",
    savedLabel: "Cut from procurement",
  },
  {
    icon: "rocket",
    title: "Thin slice in week three",
    desc: "Working software settles requirement arguments in minutes that documents take months to resolve.",
    saved: "6–10 wks",
    savedLabel: "Earlier first release",
  },
  {
    icon: "calendarCheck",
    title: "Friday demos, not status meetings",
    desc: "One 30-minute live demo a week replaces the daily check-ins, status decks and 'quick calls' that eat your calendar.",
    saved: "4 hrs/wk",
    savedLabel: "Of your team's time",
  },
  {
    icon: "clock",
    title: "24-hour response SLA",
    desc: "Questions get a written answer inside a business day, so decisions never wait on a vendor who has gone quiet.",
    saved: "3–5 days",
    savedLabel: "Cut from typical reply time",
  },
  {
    icon: "gitBranch",
    title: "Parallel runs before cutover",
    desc: "Payroll, inventory and billing go live only after a reconciled run on your real data — no month-end firefight after launch.",
    saved: "1–2 days",
    savedLabel: "Saved every month-end",
  },
  {
    icon: "keyRound",
    title: "Code and credentials from day one",
    desc: "No handover negotiations, no hostage code, no rebuild when you change vendors. Everything is already yours.",
    saved: "2–4 wks",
    savedLabel: "Saved at every vendor transition",
  },
];

// ----- Delivery scoreboard: operating figures, refreshed each quarter -----
export const deliveryStats = {
  updated: "September 2026",
  cadence: "Refreshed every quarter from our delivery tracker",
  items: [
    { value: "3h 40m", label: "Average first reply", sub: "Against a 24-hour SLA" },
    { value: "94%", label: "Milestones on time", sub: "Last four quarters" },
    { value: "99.96%", label: "Uptime, managed systems", sub: "Trailing 12 months" },
    { value: "38", label: "Active engagements", sub: "Across 9 sectors" },
    { value: "310+", label: "Live demos last quarter", sub: "Every Friday, every project" },
    { value: "19 days", label: "Average thin-slice", sub: "Scope sign-off to working software" },
    { value: "220+", label: "Production deploys / month", sub: "With rollback on every one" },
    { value: "0", label: "SLA breaches", sub: "Since the SLA went into contracts" },
  ],
};

// ----- Engagement models already defined above; nav below -----


// ============================================================
// UKVALLEY TECHNOLOGIES — /hire/[slug] content
// One entry per "hire dedicated developers" page.
// ============================================================

export type HireRole = {
  slug: string;
  title: string; // e.g. "React Developers"
  shortLabel: string; // e.g. "React"
  icon: string; // lucide icon key, mapped in the page template
  tagline: string;
  description: string; // hero + meta description
  longDescription: string[];
  metrics: { value: string; label: string }[];
  skills: { title: string; desc: string }[];
  engagement: { name: string; desc: string }[];
  process: { title: string; desc: string }[];
  techs: string[];
  faqs: { q: string; a: string }[];
  /** What to call the people on the page — defaults to "engineers". */
  noun?: string;
};

export const hireRoles: HireRole[] = [
  {
    slug: "react-developers",
    title: "React Developers",
    shortLabel: "React",
    icon: "atom",
    tagline: "Component-driven UIs with production discipline",
    description:
      "Hire dedicated React developers from Ukvalley — component-driven UIs, state management done right and code reviews on every merge. Monthly or hourly engagement, code you own.",
    longDescription: [
      "React is easy to start and easy to ruin. The difference between a prototype and a production app is discipline: predictable state management, typed components, real error boundaries, tested data flows and performance budgets. Our React engineers bring that discipline to your codebase from week one.",
      "Every engineer you hire works inside our delivery system — architecture reviews, pull-request culture, lint and test gates on every merge, and Core Web Vitals tracked as a requirement, not a hope. You get their CV verified by the architects who work with them daily, not by a résumé keyword match.",
      "Engage them your way: a full-time dedicated developer who becomes part of your team, a part-time capacity, or hourly for audits and small builds. In every model, you own the code and repositories from day one, and the engagement can scale up or pause with a week's notice.",
    ],
    metrics: [
      { value: "48h", label: "Typical time to start" },
      { value: "4+ yrs", label: "Average experience" },
      { value: "100%", label: "Code you own" },
    ],
    skills: [
      { title: "Modern React & hooks", desc: "Function components, hooks done right, suspense-ready data fetching and render-safe patterns." },
      { title: "State management", desc: "Zustand, Redux Toolkit or React Query chosen for the problem — not habit." },
      { title: "TypeScript", desc: "Strict typing across components, API contracts and shared models — refactors that don't break." },
      { title: "Next.js & SSR", desc: "Server rendering, static generation, routing and caching — the SEO and speed layer." },
      { title: "Testing", desc: "Vitest/Jest unit tests, React Testing Library and Playwright end-to-end coverage." },
      { title: "Performance", desc: "Bundle budgets, code splitting, memoisation where it matters and LCP under 2.5s on 4G." },
    ],
    engagement: [
      { name: "Full-time dedicated", desc: "One engineer, 160 hrs/month, working your roadmap in your tools — the closest thing to hiring without the hiring." },
      { name: "Part-time capacity", desc: "80 hrs/month for steady features and maintenance when full-time is more than the backlog needs." },
      { name: "Hourly / task-based", desc: "Audits, migrations, component libraries or a specific feature — scoped, quoted and delivered." },
    ],
    process: [
      { title: "Tell us the work", desc: "A 30-minute call on your stack, codebase and goals — no sales script." },
      { title: "Meet the engineer", desc: "We shortlist 1–2 engineers with verified production React work; you interview them directly." },
      { title: "Start with a trial slice", desc: "A paid first task on your real codebase proves the fit before any long commitment." },
      { title: "Scale or pause freely", desc: "Add engineers, change the mix or pause with a week's notice — no lock-ins." },
    ],
    techs: ["React 19", "TypeScript", "Next.js", "Redux Toolkit", "Zustand", "TanStack Query", "Vite", "Tailwind CSS", "Playwright"],
    faqs: [
      { q: "How quickly can a developer start?", a: "Typically within 48 hours of the scoping call. The engineer is on our payroll already — no recruitment lead time — and we match by stack and domain, not just availability." },
      { q: "Do we interview the developer first?", a: "Yes, always. We shortlist engineers with verified production work and you interview them directly. If the fit isn't right, we re-present — no obligation." },
      { q: "Who owns the code and repositories?", a: "You do, from day one. Work happens in your repos (or ones we set up and hand over), under NDA and IP assignment signed before anything starts." },
      { q: "What if the developer doesn't work out?", a: "Tell us — we replace them within a week at no extra cost, with a documented handover so context isn't lost. That guarantee is written into the agreement." },
    ],
  },
  {
    slug: "nextjs-developers",
    title: "Next.js Developers",
    shortLabel: "Next.js",
    icon: "triangle",
    tagline: "Server-rendered, SEO-ready, fast by default",
    description:
      "Hire dedicated Next.js developers — App Router, server components, ISR/SSG and Core Web Vitals in the green. Production-grade sites and SaaS frontends, code you own.",
    longDescription: [
      "Next.js is where web performance, SEO and developer experience meet — and where version churn burns unprepared teams. Our Next.js engineers work on the current release line daily (this site is Next.js), so App Router, server components, caching semantics and streaming are working knowledge, not documentation trips.",
      "Typical engagements: marketing sites and storefronts where rankings and LCP pay the bills, SaaS dashboards with server components and edge-cached data, and migrations off legacy React or WordPress onto a typed, fast, maintainable codebase.",
      "Each engineer ships with our delivery system behind them — code review on every PR, CI with test gates, preview deployments for your review and a named architect one call away. You get the engineer plus the engineering culture around them.",
    ],
    metrics: [
      { value: "Green", label: "Core Web Vitals" },
      { value: "App Router", label: "Current patterns" },
      { value: "48h", label: "Typical time to start" },
    ],
    skills: [
      { title: "App Router & RSC", desc: "Server components, streaming, route handlers and cache semantics used correctly." },
      { title: "Rendering strategy", desc: "SSG, ISR, SSR and client boundaries chosen per route for speed and freshness." },
      { title: "Data layer", desc: "Typed API routes, tRPC/REST integration, caching and revalidation done deliberately." },
      { title: "SEO engineering", desc: "Metadata, structured data, sitemaps and canonical handling built in, not bolted on." },
      { title: "Performance", desc: "Image and font optimisation, bundle budgets, streaming UI and sub-2.5s LCP on 4G." },
      { title: "Deployments", desc: "Vercel, Docker or self-hosted on your cloud — with CI/CD and preview environments." },
    ],
    engagement: [
      { name: "Full-time dedicated", desc: "One Next.js engineer, 160 hrs/month, embedded in your sprint process and tools." },
      { name: "Part-time capacity", desc: "80 hrs/month — ideal for steady feature work, SEO rebuilds or maintenance." },
      { name: "Project-based", desc: "A defined build — site, storefront or migration — with a fixed scope and milestones." },
    ],
    process: [
      { title: "Scoping call", desc: "Your product, current stack and goals — 30 minutes with an architect." },
      { title: "Engineer shortlist", desc: "Meet 1–2 engineers with live Next.js production work; you make the call." },
      { title: "Paid trial slice", desc: "A real first task on your repo proves speed and fit before longer terms." },
      { title: "Ongoing delivery", desc: "Weekly demos, shared board and a replace-anytime guarantee in writing." },
    ],
    techs: ["Next.js 15/16", "React 19", "TypeScript", "Tailwind CSS", "tRPC", "PostgreSQL", "Vercel / Docker", "Playwright"],
    faqs: [
      { q: "Are you current on the App Router?", a: "Yes — we build production sites on the latest Next.js release line (this site is one), including server components, streaming and current caching behaviour." },
      { q: "Can you migrate us from WordPress or CRA?", a: "Yes — content migration, SEO parity (redirects, schema, sitemaps) and a staged cutover so rankings carry over. It's one of our most common engagements." },
      { q: "Do you host it for us?", a: "Your choice: Vercel for simplicity, or self-hosted on your AWS/Azure with Docker and CI/CD — we set up either and hand over every credential." },
      { q: "What if we need design too?", a: "We can pair the engineer with our UI/UX designers so you get dev-ready Figma systems and a finished site, not just code." },
    ],
  },
  {
    slug: "nodejs-developers",
    title: "Node.js Developers",
    shortLabel: "Node.js",
    icon: "server",
    tagline: "APIs and real-time systems that hold under load",
    description:
      "Hire dedicated Node.js developers — REST/GraphQL APIs, queues, WebSockets and performance-tuned services built for real transactional volume.",
    longDescription: [
      "Node.js backends fail in predictable ways: unindexed queries discovered at 10× traffic, unbounded queues, and endpoints that work in demos and fall over in production. Our Node engineers design for the load before it arrives — connection pooling, caching layers, backpressure and load tests as standard practice.",
      "They build the services behind real systems: REST and GraphQL APIs with documented contracts, background job queues with retries and dead-letter handling, WebSocket layers for live dashboards and chat, and integrations with payment, SMS and Indian compliance stacks (Tally, GST, e-invoice).",
      "Working with them you get more than a coder: schema reviews, contract-first API design, structured logging, and dashboards that show latency and error rates — so you know the system is healthy without opening a database client.",
    ],
    metrics: [
      { value: "p95", label: "Latency tracked" },
      { value: "Queues", label: "Retries built-in" },
      { value: "48h", label: "Typical time to start" },
    ],
    skills: [
      { title: "API design", desc: "REST and GraphQL with contract-first schemas, versioning and documentation." },
      { title: "Databases", desc: "PostgreSQL and MongoDB with schema design, indexing and migration discipline." },
      { title: "Queues & jobs", desc: "BullMQ/Redis pipelines with retries, backoff and dead-letter handling." },
      { title: "Real-time", desc: "WebSockets and SSE for live dashboards, chat and presence at scale." },
      { title: "Auth & security", desc: "JWT/session patterns, RBAC, rate limiting and audit logging by default." },
      { title: "Observability", desc: "Structured logs, metrics and tracing wired before production, not after an incident." },
    ],
    engagement: [
      { name: "Full-time dedicated", desc: "160 hrs/month on your backend roadmap, in your repos and standups." },
      { name: "Part-time capacity", desc: "80 hrs/month for feature work, integration builds or performance tuning." },
      { name: "Hourly / task-based", desc: "API builds, performance rescues or specific integrations, scoped and quoted." },
    ],
    process: [
      { title: "Architecture call", desc: "Your system, pain points and scale target — with an architect on the call." },
      { title: "Meet the engineer", desc: "Shortlisted engineers with relevant production systems; you interview." },
      { title: "Trial task", desc: "A paid slice on your real codebase before any long-term commitment." },
      { title: "Steady delivery", desc: "Weekly updates, PR-based work and a one-week scale/pause guarantee." },
    ],
    techs: ["Node.js", "TypeScript", "Express / Fastify", "NestJS", "PostgreSQL", "MongoDB", "Redis", "BullMQ", "Docker"],
    faqs: [
      { q: "Can they work with our existing codebase?", a: "Yes — most engagements start on inherited code. We begin with a read-through and a short written assessment before changing anything." },
      { q: "Do they handle database work too?", a: "Yes — schema design, migrations and query tuning are part of the skill set; you don't need a separate DBA for typical SME-scale systems." },
      { q: "Can they integrate with Tally or GST systems?", a: "Yes — Tally sync, e-invoice and payment gateway integrations are routine work in our fintech and ERP projects." },
      { q: "How do you guarantee quality?", a: "Code review by a senior architect on every PR, CI test gates, and a written handover. If quality dips, we replace the engineer — that's in the contract." },
    ],
  },
  {
    slug: "flutter-developers",
    title: "Flutter Developers",
    shortLabel: "Flutter",
    icon: "smartphone",
    tagline: "One codebase, both stores, native-grade polish",
    description:
      "Hire dedicated Flutter developers — iOS & Android from one codebase, store submission handled, offline-first sync and pixel-perfect UI on low-end devices.",
    longDescription: [
      "Flutter apps live or die on details your users notice instantly: launch time on a ₹10,000 Android, list scrolling without jank, forms that survive flaky networks, and state that survives a background kill. Our Flutter engineers sweat exactly those details — it's why our own products (TeleValley, Finvalley) are Flutter.",
      "They cover the full lifecycle: architecture (Bloc/Riverpod), API and offline-sync layers, push and analytics integration, native modules via platform channels when needed, and the unglamorous release craft — signing, store listings, review responses and phased rollouts.",
      "You get an engineer verified on real shipped apps, backed by our review culture and device lab. Full-time, part-time or hourly — with code and signing keys in your hands from day one.",
    ],
    metrics: [
      { value: "2", label: "Stores, one codebase" },
      { value: "Shipped", label: "Our own products too" },
      { value: "48h", label: "Typical time to start" },
    ],
    skills: [
      { title: "Flutter architecture", desc: "Bloc, Riverpod or Provider chosen deliberately; feature-first folder structures that scale." },
      { title: "Offline-first sync", desc: "Local databases (SQLite/Hive/Drift) with conflict-safe sync for field conditions." },
      { title: "Native integration", desc: "Platform channels to Kotlin/Swift for camera, Bluetooth and background work." },
      { title: "UI craft", desc: "Custom animations and pixel-accurate screens tested on low-end Android devices." },
      { title: "Release craft", desc: "Signing, flavours, store listings, review handling and phased rollouts on both stores." },
      { title: "Performance", desc: "Jank-free 60fps lists, launch-time budgets and battery-conscious background work." },
    ],
    engagement: [
      { name: "Full-time dedicated", desc: "160 hrs/month building your app end to end, demoing on real devices weekly." },
      { name: "Part-time capacity", desc: "80 hrs/month — steady feature velocity or release support between sprints." },
      { name: "Hourly / task-based", desc: "Audits, performance rescues, store-submission help or specific features." },
    ],
    process: [
      { title: "Scope the app", desc: "Platforms, features and store strategy agreed in a 30-minute architect call." },
      { title: "Meet the engineer", desc: "Shortlists backed by live Play Store/App Store work you can download." },
      { title: "Trial on your app", desc: "A paid first build slice — judge the work, not the interview." },
      { title: "Ship & iterate", desc: "Weekly device demos, store releases handled, scale or pause anytime." },
    ],
    techs: ["Flutter 3", "Dart", "Bloc / Riverpod", "Drift / SQLite", "Firebase", "Platform channels", "Fastlane", "Play & App Store"],
    faqs: [
      { q: "Can I see apps they've shipped?", a: "Yes — we shortlist by live store presence. You download the apps and judge the quality before you interview anyone." },
      { q: "Do they handle store submission?", a: "Yes — signing, listings, screenshots, privacy declarations and review responses are part of the craft, on both Play Store and App Store." },
      { q: "Flutter or native — what do you recommend?", a: "For most business apps, Flutter. Native makes sense for graphics-heavy or hardware-tight apps — and we'll tell you in writing when that's your case, even if it costs us the engagement." },
      { q: "Do they work with our backend team?", a: "Yes — API contract-first development with typed clients, or they build the backend too if you'd rather have one team own the stack." },
    ],
  },
  {
    slug: "react-native-developers",
    title: "React Native Developers",
    shortLabel: "React Native",
    icon: "smartphone",
    tagline: "Apps that share a brain with your React web team",
    description:
      "Hire dedicated React Native developers — cross-platform iOS & Android with a JS/React ecosystem your web team already understands. Store-ready releases.",
    longDescription: [
      "React Native is the right call when your web team already thinks in React: shared patterns, shared state models and often shared business logic between app and web. Our React Native engineers build with that synergy in mind — monorepo-friendly structures and types shared across platforms.",
      "They handle the reality of the platform: native modules when Expo's boundaries run out, OTA updates with proper rollout control, navigation and deep links, push pipelines, and the store-submission grind that quietly eats unprepared teams alive at every release.",
      "Expect the same production discipline as everywhere else at Ukvalley: typed codebases, PR reviews, test gates and demos on real devices — with engineers whose shipped apps you can download and judge before you hire them.",
    ],
    metrics: [
      { value: "1", label: "Language across app+web" },
      { value: "OTA", label: "Update capability" },
      { value: "48h", label: "Typical time to start" },
    ],
    skills: [
      { title: "Modern RN architecture", desc: "Hermes, Fabric-era patterns, navigation (expo-router/react-navigation) and clean module boundaries." },
      { title: "Expo & bare workflow", desc: "EAS builds and OTA updates with rollout control — or bare workflow when native modules demand it." },
      { title: "Native modules", desc: "Kotlin/Swift bridges for camera, BLE and background tasks when JS isn't enough." },
      { title: "State & data", desc: "Redux Toolkit, Zustand and TanStack Query — consistent with your web stack's choices." },
      { title: "Release engineering", desc: "Code signing, store listings, review handling and phased rollouts on both platforms." },
      { title: "Performance", desc: "Flat lists done right, image pipelines and startup-time budgets on low-end Android." },
    ],
    engagement: [
      { name: "Full-time dedicated", desc: "160 hrs/month on your app roadmap, syncing with your React web team's patterns." },
      { name: "Part-time capacity", desc: "80 hrs/month for maintenance, features and release support." },
      { name: "Hourly / task-based", desc: "Upgrades (legacy RN → current), native module work or specific features." },
    ],
    process: [
      { title: "Stack call", desc: "Expo vs bare, upgrade state and store history reviewed with an architect." },
      { title: "Meet the engineer", desc: "Candidates with shipped RN apps on the stores — you interview and choose." },
      { title: "Trial task", desc: "A paid slice on your real app before committing longer-term." },
      { title: "Delivery rhythm", desc: "Weekly demos, OTA/store releases handled, scale or pause with notice." },
    ],
    techs: ["React Native", "TypeScript", "Expo / EAS", "Redux Toolkit", "Zustand", "React Navigation", "Fastlane", "Kotlin/Swift bridges"],
    faqs: [
      { q: "React Native or Flutter for our app?", a: "If your team knows React or the app lives beside a React web codebase, React Native usually wins on synergy. If the UI is highly custom and design-led, Flutter often fits better. We'll recommend in writing based on your case." },
      { q: "Can you upgrade our old React Native app?", a: "Yes — legacy RN upgrades (0.6x era to current) are a common engagement: dependency surgery, native module rewrites and a regression-tested cutover." },
      { q: "Do you use Expo?", a: "When it fits. Expo with EAS speeds up builds and OTA updates dramatically; we drop to bare workflow when native modules or store requirements demand it." },
      { q: "Who owns the signing keys and stores?", a: "You do. Keystores, certificates and store accounts are set up in your ownership from the start — vendor lock-in on signing keys is a real risk we design out." },
    ],
  },
  {
    slug: "python-developers",
    title: "Python Developers",
    shortLabel: "Python",
    icon: "braces",
    tagline: "Django backends, data pipelines and automation",
    description:
      "Hire dedicated Python developers — Django/FastAPI backends, data pipelines, scraping and automation tooling, engineered for production rather than scripts.",
    longDescription: [
      "Python wins wherever the work is data-shaped: analytics pipelines, integrations, document processing, ML prototypes and back-office automation. Our Python engineers turn those jobs from fragile scripts into owned, monitored, production systems.",
      "On the web side they build with Django and FastAPI — admin-heavy business systems, REST APIs and the kind of CRUD-plus-workflow platforms where Django's batteries genuinely accelerate delivery. TeleValley's backend is Python/Django, so this is home ground.",
      "They also handle the unglamorous infrastructure of data: scraping with respect for rate limits, ETL pipelines with checkpointing, scheduled jobs with alerting, and integrations that survive API changes — with tests and logs, not print statements.",
    ],
    metrics: [
      { value: "Prod", label: "Not scripts" },
      { value: "Django", label: "Our own stack too" },
      { value: "48h", label: "Typical time to start" },
    ],
    skills: [
      { title: "Django & DRF", desc: "Business systems with admin, ORM mastery, migrations and permission layers." },
      { title: "FastAPI", desc: "High-throughput typed APIs with async I/O, pydantic validation and OpenAPI docs." },
      { title: "Data pipelines", desc: "ETL with checkpointing, scheduling and alerting — pandas, Airflow-style orchestration." },
      { title: "Scraping & integrations", desc: "Respectful scraping, API integrations and webhooks with retry and monitoring." },
      { title: "Task automation", desc: "Document processing, Excel/PDF workflows and RPA-style back-office automation." },
      { title: "Testing & packaging", desc: "pytest suites, type hints, linting and Dockerised deployment pipelines." },
    ],
    engagement: [
      { name: "Full-time dedicated", desc: "160 hrs/month on your backend, data or automation roadmap." },
      { name: "Part-time capacity", desc: "80 hrs/month for pipeline maintenance, features and integration upkeep." },
      { name: "Hourly / task-based", desc: "Scrapers, one-off pipelines, API builds or automation projects, scoped and quoted." },
    ],
    process: [
      { title: "Scope call", desc: "Your data, systems and goals — mapped by an architect in 30 minutes." },
      { title: "Meet the engineer", desc: "Candidates matched by domain (fintech, ops, data) for you to interview." },
      { title: "Trial task", desc: "A paid, real slice of work on your stack before any longer term." },
      { title: "Steady delivery", desc: "Weekly demos, monitored deployments and a one-week scale/pause guarantee." },
    ],
    techs: ["Python 3", "Django / DRF", "FastAPI", "Celery", "PostgreSQL", "MongoDB", "pandas", "Docker", "pytest"],
    faqs: [
      { q: "Django or FastAPI — which do your engineers use?", a: "Both, by fit: Django for admin-heavy business systems and batteries-included delivery; FastAPI for lean async APIs and microservices. We recommend per project, and the reasoning is documented." },
      { q: "Can they handle ML or data science work?", a: "Prototyping and pipeline engineering, yes — including serving models behind APIs. For research-heavy modelling we partner with specialists and own the engineering around it." },
      { q: "Can you automate our Excel-based back office?", a: "Yes — that's a sweet spot. We convert spreadsheet workflows into audited systems with the same inputs your team knows, minus the manual errors." },
      { q: "Do they write tests?", a: "Always — pytest suites with CI gates are part of our merge process on every project, not an optional extra." },
    ],
  },
  {
    slug: "angular-developers",
    title: "Angular Developers",
    shortLabel: "Angular",
    icon: "component",
    tagline: "Enterprise UIs with structure that survives years",
    description:
      "Hire dedicated Angular developers — typed, structured enterprise frontends with RxJS discipline, modern signals and upgrade paths from legacy versions.",
    longDescription: [
      "Angular remains the backbone of enterprise UI in India — banking portals, insurance consoles, internal ERPs — and it rewards teams who follow its structure and punishes teams who don't. Our Angular engineers build with the framework's grain: typed forms, layered services, and module/signal architecture that stays maintainable for years.",
      "They're equally valuable on the legacy side: upgrading Angular 8–12 apps to current versions without the big-bang rewrite — dependency surgery, RxJS modernisation, and staged cutover with regression tests so the business keeps running while the codebase modernises.",
      "Every engineer works with our review culture: strict TypeScript, lint gates, component testing and a shared pattern library — so when they eventually roll off, the codebase reads like one author wrote it.",
    ],
    metrics: [
      { value: "Typed", label: "Strict TypeScript" },
      { value: "v17+", label: "Modern Angular" },
      { value: "48h", label: "Typical time to start" },
    ],
    skills: [
      { title: "Modern Angular", desc: "Standalone components, signals, new control flow and typed reactive forms." },
      { title: "RxJS discipline", desc: "Streams handled with intent — cancellation, error paths and no memory-leak folklore." },
      { title: "Enterprise patterns", desc: "Feature modules done well, interceptors, guards and layered API services." },
      { title: "Legacy upgrades", desc: "Staged migrations from Angular 8–12 to current with regression coverage." },
      { title: "Testing", desc: "Component and integration tests with Jasmine/Karma or Jest, plus e2e where warranted." },
      { title: "Design systems", desc: "Shared component libraries with theming that multiple teams can consume." },
    ],
    engagement: [
      { name: "Full-time dedicated", desc: "160 hrs/month embedded in your sprint process and codebase." },
      { name: "Part-time capacity", desc: "80 hrs/month for features, upgrades and maintenance." },
      { name: "Hourly / task-based", desc: "Upgrade projects, audits or specific feature builds, fixed scope." },
    ],
    process: [
      { title: "Codebase review call", desc: "Your Angular version, patterns and goals discussed with an architect." },
      { title: "Meet the engineer", desc: "Shortlisted candidates with enterprise Angular work; you interview." },
      { title: "Trial task", desc: "A paid slice in your repo — real code, real proof." },
      { title: "Delivery rhythm", desc: "Sprint participation, PR reviews and a one-week scale/pause guarantee." },
    ],
    techs: ["Angular 17+", "TypeScript", "RxJS", "Signals", "NgRx", "Jest", "Component CDK"],
    faqs: [
      { q: "Our app is on Angular 9 — can you help?", a: "Yes. We plan a staged upgrade path (usually 9 → 12 → 15 → current), modernise RxJS and dependencies incrementally, and keep regression tests green at each step." },
      { q: "Do your engineers know signals, or just old Angular?", a: "Both. We build on current Angular (standalone, signals, new control flow) and can migrate existing patterns incrementally rather than forcing a rewrite." },
      { q: "Can they work with our design system?", a: "Yes — they can consume, extend or build component libraries, including packaging one for reuse across teams." },
      { q: "How do you protect against knowledge loss?", a: "Documented patterns, PR-based work and a named architect overseeing the engagement — so replacing or adding an engineer is a handover, not a restart." },
    ],
  },
  {
    slug: "laravel-developers",
    title: "Laravel / PHP Developers",
    shortLabel: "Laravel",
    icon: "database",
    tagline: "Rapid, audited business systems on Laravel",
    description:
      "Hire dedicated Laravel developers — APIs, admin systems, payments and Tally integrations built fast without skipping the engineering rigour.",
    longDescription: [
      "Laravel is the fastest route from requirement to working business system in PHP — and our own products (BBNPlay, Dream Loans) run Laravel APIs in production. Our Laravel engineers build the classic SME stack: admin panels, APIs, billing, queues and reports, delivered quickly without sacrificing structure.",
      "They cover the full surface: Eloquent schema design and migrations, queue workers and schedulers, payment gateways (Razorpay, Cashfree), Tally and GST integrations, role-based permissions with spatie, and test suites that keep refactors safe.",
      "They also rescue legacy PHP: CodeIgniter and raw-PHP systems moved onto modern Laravel with data migration and staged cutover — turning 'nobody wants to touch that codebase' into a maintainable asset.",
    ],
    metrics: [
      { value: "Fast", label: "Requirement→MVP" },
      { value: "Tally", label: "Integrations done" },
      { value: "48h", label: "Typical time to start" },
    ],
    skills: [
      { title: "Eloquent & schema", desc: "Modelling, indexing and migration discipline — data layers that don't fight you." },
      { title: "APIs & auth", desc: "REST APIs with Sanctum/Passport, RBAC and versioned contracts." },
      { title: "Queues & jobs", desc: "Horizon-managed workers, schedulers and failure handling for background work." },
      { title: "Payments & GST", desc: "Razorpay/Cashfree flows, invoicing and Indian tax-ready records." },
      { title: "Tally integration", desc: "Voucher sync and reconciliation between operations and accounting." },
      { title: "Testing", desc: "Feature and unit tests (Pest/PHPUnit) wired into CI on every project." },
    ],
    engagement: [
      { name: "Full-time dedicated", desc: "160 hrs/month on your Laravel roadmap, in your repos." },
      { name: "Part-time capacity", desc: "80 hrs/month — steady features, integrations and maintenance." },
      { name: "Hourly / task-based", desc: "Upgrades (legacy PHP → Laravel), specific integrations or fixes." },
    ],
    process: [
      { title: "Scoping call", desc: "Your system, integrations and goals — 30 minutes with an architect." },
      { title: "Meet the engineer", desc: "Candidates with live Laravel production work for you to interview." },
      { title: "Trial task", desc: "A paid first slice on your actual codebase." },
      { title: "Ongoing delivery", desc: "Weekly demos, PR reviews and a one-week scale/pause guarantee." },
    ],
    techs: ["Laravel 11", "PHP 8.3", "MySQL / PostgreSQL", "Redis", "Horizon", "Livewire", "Razorpay", "Docker"],
    faqs: [
      { q: "Can you migrate our old CodeIgniter or raw-PHP app?", a: "Yes — we map the legacy data model, build the Laravel equivalent, migrate data with reconciliation and cut over in stages so nothing breaks mid-month." },
      { q: "Can they integrate with Tally?", a: "Yes — Tally sync (vouchers, ledgers, reconciliation) is standard work in our ERP and billing projects." },
      { q: "Laravel or Node for our backend?", a: "Both are excellent; Laravel often ships admin-heavy business systems faster, Node wins on real-time workloads and JS-team continuity. We recommend per project, in writing." },
      { q: "Do you follow Laravel's own conventions?", a: "Yes — idiomatic Laravel (eloquent, form requests, policies, actions) so any future Laravel developer can pick the codebase up immediately." },
    ],
  },
  {
    slug: "devops-engineers",
    title: "DevOps Engineers",
    shortLabel: "DevOps",
    icon: "cloud",
    tagline: "Infra as code, CI/CD and 2 a.m. incidents that aren't",
    description:
      "Hire dedicated DevOps engineers — AWS/Azure infrastructure as code, CI/CD pipelines, Kubernetes and observability that turns deploy drama into a non-event.",
    longDescription: [
      "A good DevOps engineer is measured in avoided fires: deploys that don't need heroics, alerts that fire before customers notice, and a cloud bill that stops surprising the finance team. Our DevOps engineers deliver those outcomes with infrastructure as code, not tribal knowledge.",
      "They work across AWS and Azure on the patterns SMEs actually need: Docker/Kubernetes or managed containers, Terraform-managed environments, GitHub Actions/GitLab CI pipelines with staging gates, secret management, backups you've actually tested restoring, and cost dashboards with budget alerts.",
      "They're also calm hands in incidents: runbooks written before they're needed, postmortems without blame, and monthly reports that show uptime, cost and drift. When they roll off, the Terraform repo speaks for itself — nothing depends on one person's memory.",
    ],
    metrics: [
      { value: "IaC", label: "100% as code" },
      { value: "Tested", label: "Restore drills" },
      { value: "48h", label: "Typical time to start" },
    ],
    skills: [
      { title: "Infrastructure as code", desc: "Terraform-managed AWS/Azure environments, reviewable and reproducible." },
      { title: "CI/CD pipelines", desc: "GitHub Actions/GitLab CI with staging gates, previews and one-click rollback." },
      { title: "Containers", desc: "Docker images and Kubernetes/ECS workloads with sane resource limits." },
      { title: "Observability", desc: "Metrics, logs, tracing and alert routes that reach a human, not a void." },
      { title: "Security baseline", desc: "Least-privilege IAM, secret rotation, patching schedules and audit trails." },
      { title: "Cost engineering", desc: "Right-sizing, autoscaling, reserved capacity and budget alerts that stop bill shocks." },
    ],
    engagement: [
      { name: "Full-time dedicated", desc: "160 hrs/month owning infra and pipelines alongside your team." },
      { name: "Part-time capacity", desc: "80 hrs/month — setup, hardening and monthly upkeep for lean teams." },
      { name: "Hourly / task-based", desc: "Audits, migrations, pipeline builds or incident-response retainers." },
    ],
    process: [
      { title: "Infrastructure audit", desc: "A written baseline: what runs where, what's fragile and what it costs." },
      { title: "Meet the engineer", desc: "Candidates matched to your cloud and stack; you interview." },
      { title: "Stabilise first", desc: "Backups, alerts and rollback paths proven before optimisation." },
      { title: "Steady operations", desc: "Runbooks, monthly reports and a one-week scale/pause guarantee." },
    ],
    techs: ["AWS", "Azure", "Terraform", "Kubernetes", "Docker", "GitHub Actions", "Grafana / Prometheus", "Cloudflare"],
    faqs: [
      { q: "We're on AWS with everything hand-configured — can you help?", a: "Yes. We codify the existing setup into Terraform incrementally (so nothing breaks), then improve from a reviewable baseline instead of a risky rebuild." },
      { q: "Can you reduce our cloud bill?", a: "Usually, yes — right-sizing, storage lifecycle policies, autoscaling and reserved capacity typically recover 20–40% on overspend accounts. Savings are reported against a measured baseline." },
      { q: "What happens during an incident?", a: "On managed retainers: a one-hour first-response target, your named engineer paged, and a written postmortem after. The SLA is contractual, not aspirational." },
      { q: "Do we keep access to everything?", a: "Always — infrastructure lives as code in your repos, credentials in your vault, and nothing in the setup depends on staying with us." },
    ],
  },
  {
    slug: "qa-engineers",
    title: "QA Engineers",
    shortLabel: "QA",
    icon: "flaskConical",
    tagline: "Releases with proof they work",
    description:
      "Hire dedicated QA engineers — automated and manual testing, regression suites, API and e2e coverage, and release sign-offs your team can trust.",
    longDescription: [
      "QA that only clicks around after development is QA that finds bugs at the worst possible time. Our QA engineers embed earlier: they write test plans from requirements, automate the regression suite while features are being built, and gate every release on evidence — not vibes.",
      "Automation covers the layer that matters per project: Playwright/Cypress e2e journeys for user-facing flows, API contract tests with Postman/Newman, and data-driven checks for the calculations that make you money (payroll, invoicing, scoring). Manual exploratory testing covers what scripts can't.",
      "You get more than bug reports: coverage mapped to real user journeys, release sign-off checklists, environment and test-data management, and a regression suite that makes future deploys faster instead of scarier.",
    ],
    metrics: [
      { value: "Auto", label: "Regression suites" },
      { value: "API", label: "Contract tests" },
      { value: "48h", label: "Typical time to start" },
    ],
    skills: [
      { title: "Test planning", desc: "Risk-based plans and traceable coverage from requirements — not ad-hoc clicking." },
      { title: "Playwright & Cypress", desc: "Stable e2e suites that run in CI and catch real regressions, not flakes." },
      { title: "API testing", desc: "Contract and integration tests with Postman/Newman and schema validation." },
      { title: "Mobile testing", desc: "Real-device testing across Android tiers, plus store-release checklists." },
      { title: "Exploratory & UAT", desc: "Skilled manual testing for edge cases, usability and release sign-offs." },
      { title: "Performance basics", desc: "Load tests on critical flows with k6/JMeter and interpreted, actionable results." },
    ],
    engagement: [
      { name: "Full-time dedicated", desc: "160 hrs/month embedded in your sprints, testing as features land." },
      { name: "Part-time capacity", desc: "80 hrs/month for release cycles, regressions and suite upkeep." },
      { name: "Hourly / task-based", desc: "Release testing, audits, suite rescue or a specific launch's QA." },
    ],
    process: [
      { title: "Coverage audit", desc: "What's tested, what's not and where the real risks live — in writing." },
      { title: "Meet the engineer", desc: "Candidates with domain-relevant testing experience; you interview." },
      { title: "Trial cycle", desc: "A paid first release cycle to prove the catch rate and reporting quality." },
      { title: "Steady quality gate", desc: "Suites wired into CI, sign-off checklists and a scale/pause guarantee." },
    ],
    techs: ["Playwright", "Cypress", "Postman / Newman", "Selenium", "Jira / TestRail", "JMeter", "BrowserStack"],
    faqs: [
      { q: "Manual, automated or both?", a: "Both, deliberately: automation protects the flows you repeat every release; manual exploratory testing catches what scripts never will. The mix is decided by your release cadence and budget." },
      { q: "Can they test our mobile apps?", a: "Yes — real-device testing across Android tiers and iOS, store-release checklists and crash-report triage included." },
      { q: "We have no test documentation — is that a problem?", a: "It's the normal starting point. The coverage audit produces the first test plan from how your software is actually used, then automation grows from there." },
      { q: "Do they write the automation or just run it?", a: "They write and maintain it — suites live in your repos, run in your CI, and stay yours when the engagement ends." },
    ],
  },
  {
    slug: "sales-executives",
    title: "Sales Executives",
    shortLabel: "Sales",
    icon: "headset",
    noun: "professionals",
    tagline: "Pipeline builders who work your CRM, not around it",
    description:
      "Hire dedicated sales executives from Ukvalley — inside sales, business development and telecalling professionals trained on CRM discipline, call tracking and follow-up cadences. Monthly engagement, your pipeline, your data.",
    longDescription: [
      "Most sales hires fail for the same reason: no process around them. Leads arrive, calls happen, and nothing is logged — so the manager cannot coach, the pipeline cannot be forecast, and when the executive leaves, the relationships leave too. Our sales professionals work inside a system built to prevent exactly that.",
      "Every executive we place runs on our own sales stack: TeleValley logs and records every call, follow-up cadences live in the CRM with mandatory next actions, and a weekly pipeline review with a named team lead keeps the funnel honest. You see calls made, connects, demos booked and deals moved — as data, every week, not as a story at month-end.",
      "Engage them the way your pipeline needs: a full-time executive dedicated to your accounts, part-time capacity for a steady outbound cadence, or a campaign-based team for a product launch or a target list. In every model the leads, call records and CRM data are yours from day one, and the engagement can scale or pause with a week's notice.",
    ],
    metrics: [
      { value: "48h", label: "Typical time to start" },
      { value: "100%", label: "Calls logged & recorded" },
      { value: "Weekly", label: "Pipeline reviews" },
    ],
    skills: [
      { title: "Lead qualification", desc: "BANT and ICP-based qualification so demos go to buyers, not browsers." },
      { title: "Outbound calling & email", desc: "Scripted openers, objection handling and multi-touch sequences over call, email and WhatsApp." },
      { title: "CRM discipline", desc: "Every conversation logged with a next action and due date — HubSpot, Zoho or your own CRM." },
      { title: "Demos & product walkthroughs", desc: "Trained on your product to run first-level demos and hand qualified deals to closers." },
      { title: "Follow-up cadences", desc: "Structured sequences that keep every lead moving until it converts or is disqualified on record." },
      { title: "Reporting & forecasting", desc: "Weekly activity, conversion and pipeline reports your management can act on." },
    ],
    engagement: [
      { name: "Full-time dedicated", desc: "One executive, 160 hrs/month, working your accounts in your CRM with our call tracking and coaching." },
      { name: "Part-time capacity", desc: "80 hrs/month for a steady outbound cadence or inbound lead follow-up." },
      { name: "Campaign-based team", desc: "A defined outbound campaign — target list, script, duration and a booked-demo goal — staffed and reported end to end." },
    ],
    process: [
      { title: "Define the target", desc: "A 30-minute call to map your ideal customer, offer, script and the metric that matters." },
      { title: "Meet the executive", desc: "We shortlist 1–2 professionals with verified call recordings and conversion history; you interview them." },
      { title: "Paid pilot campaign", desc: "A two-week pilot on your real leads proves the connect rate and demo bookings before any long commitment." },
      { title: "Scale the team", desc: "Add executives, change the mix or pause with a week's notice — the pipeline data stays yours." },
    ],
    techs: ["TeleValley call tracking", "HubSpot / Zoho CRM", "WhatsApp Business", "LinkedIn Sales Navigator", "Apollo / Lusha", "Google Workspace", "Calendly"],
    faqs: [
      { q: "Do they close deals or only generate leads?", a: "Both models are available. Most clients use our executives for outbound prospecting, qualification and first-level demos, handing qualified deals to their own closers. Where the deal size suits it, they can run the full cycle to close." },
      { q: "Which industries do they know?", a: "Our sales professionals have worked pipelines in SaaS, fintech, real estate, education, healthcare and manufacturing supplies. We match by sector and train them on your product before the pilot starts." },
      { q: "How do we know the work is actually happening?", a: "Every call is logged and recorded through TeleValley, every lead carries a next action in the CRM, and you receive a weekly report of calls, connects, demos and pipeline movement. You can listen to any call at any time." },
      { q: "Do they work in our CRM or yours?", a: "Yours, always — HubSpot, Zoho, Salesforce or a custom CRM. Leads, notes and call records live in your system from day one, so nothing leaves when the engagement ends." },
    ],
  },
  {
    slug: "ui-ux-designers",
    title: "UI/UX Designers",
    shortLabel: "UI/UX",
    icon: "palette",
    noun: "designers",
    tagline: "Interfaces users don't have to think about",
    description:
      "Hire dedicated UI/UX designers from Ukvalley — research-backed flows, design systems and pixel-accurate handoff for web and mobile. Monthly or hourly engagement, files you own.",
    longDescription: [
      "A UI that looks good in Figma and a UI that survives real users are different things. Most design work ships as static mockups that a frontend team reinterprets — spacing drifts, edge cases get invented on the fly, and the 'design system' becomes three components everyone copies and quietly diverges from. Our designers work the other way: research first, then interface, then a build-ready component library engineering can implement without guessing.",
      "They cover the full surface: user research and flows, wireframes and prototypes, visual design and a documented design system, and handoff specs precise enough that a developer doesn't need to ping them for every spacing value. Paired with our engineering teams, design and build move in the same sprint instead of a queue.",
      "Engage them your way: a dedicated designer embedded in your product team, a part-time capacity for steady feature design, or a project-based engagement for a full redesign or a new design system. In every model, source files, tokens and documentation are yours from day one.",
    ],
    metrics: [
      { value: "48h", label: "Typical time to start" },
      { value: "100%", label: "Files you own" },
      { value: "Design system", label: "Delivered, not just screens" },
    ],
    skills: [
      { title: "User research & flows", desc: "Interviews, journey maps and flow diagrams that ground design decisions in real behaviour, not opinion." },
      { title: "Wireframing & prototyping", desc: "Low- to high-fidelity prototypes in Figma, tested before a single pixel is finalised." },
      { title: "Design systems", desc: "Reusable component libraries with documented tokens — spacing, colour, type — that engineering can implement directly." },
      { title: "Visual & brand design", desc: "Interfaces that carry your brand consistently across web, mobile and marketing surfaces." },
      { title: "Handoff & specs", desc: "Dev-ready specs, redlines and Storybook-ready component docs that cut back-and-forth to near zero." },
      { title: "Accessibility", desc: "WCAG-aware contrast, focus states and touch targets built in, not retrofitted after an audit." },
    ],
    engagement: [
      { name: "Full-time dedicated", desc: "One designer, 160 hrs/month, embedded in your product team and sprint process." },
      { name: "Part-time capacity", desc: "80 hrs/month for steady feature design and design-system upkeep." },
      { name: "Project-based", desc: "A defined redesign or new design system with fixed scope and milestones." },
    ],
    process: [
      { title: "Discovery call", desc: "Your product, users and current design maturity — 30 minutes with a design lead." },
      { title: "Meet the designer", desc: "Shortlisted candidates with a live portfolio you can pressure-test." },
      { title: "Paid trial screen", desc: "A real screen or flow redesigned on your product before any long-term commitment." },
      { title: "Ship & iterate", desc: "Weekly reviews, a growing design system, and a scale-or-pause option anytime." },
    ],
    techs: ["Figma", "FigJam", "Adobe Creative Suite", "Framer", "Design tokens", "Storybook", "Zeroheight", "Maze"],
    faqs: [
      { q: "Do we own the Figma files and design system?", a: "Yes — all source files, components and documentation transfer to your workspace from day one, under NDA and IP assignment signed before work starts." },
      { q: "Can they work directly with our engineers?", a: "Yes — that's the default. Designers hand off through documented specs and pair with engineering during implementation to keep design and build in sync." },
      { q: "Do you do user research, or just visual design?", a: "Both. Research and flows come first so visual design solves a validated problem, not a guess — though we can scope visual-only work if research is already done." },
      { q: "What if the designer isn't the right fit?", a: "Tell us — we replace them within a week at no extra cost, with a documented handover so the project's context and files stay intact." },
    ],
  },
];
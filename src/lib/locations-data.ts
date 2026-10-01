// ============================================================
// UKVALLEY TECHNOLOGIES — /locations/[slug] content
// One entry per location page.
// ============================================================

export type Location = {
  slug: string;
  city: string;
  region: string;
  country: string;
  type: "HQ" | "Office" | "Delivery" | "Presence";
  icon: string;
  blurb: string; // hero description + meta
  paragraphs: string[];
  services: string[];
  proof: { value: string; label: string }[];
  timezone: string;
  languages: string[];
  address?: string;
  faqs: { q: string; a: string }[];
};

export const locations: Location[] = [
  {
    slug: "maharashtra",
    city: "Maharashtra HQ",
    region: "Maharashtra",
    country: "India",
    type: "HQ",
    icon: "mapPin",
    blurb:
      "Ukvalley's headquarters in Maharashtra — where engineering, delivery management and our own product development happen, with an India cost base that runs 30–40% below metro agencies.",
    paragraphs: [
      "Maharashtra is where Ukvalley is built. Our headquarters here houses the engineering core — architects, full-stack teams, mobile and QA — alongside delivery management and leadership. The registered entity, CIN and GSTIN all trace to Maharashtra, and this is where the scoping calls happen before any code is written.",
      "Choosing a base outside the metros was deliberate: an India-tier-2 cost structure lets us charge 30–40% below metro agencies without the overhead showing up as compromise. The engineers who scope your project in a call from our head office are the engineers who build it — no brokers, no offshoring pools between you and the work.",
      "The office also anchors our product portfolio — TeleValley, Finvalley, BBNPlay, Dream Loans and Turf Booking are all built and run from here, which means the same engineers who maintain production systems for ourselves are the ones maintaining yours.",
    ],
    services: ["Custom software & ERP", "Mobile app development", "Web & web app development", "Cloud & DevOps", "QA & support (24-hour SLA)"],
    proof: [
      { value: "HQ", label: "Registered entity here" },
      { value: "30–40%", label: "Below metro agency rates" },
      { value: "24h", label: "Response SLA" },
    ],
    timezone: "IST (UTC+5:30)",
    languages: ["English", "Hindi", "Marathi"],
    address: "Roongta Business Centre, Maharashtra 422002, India",
    faqs: [
      { q: "Can we visit the head office?", a: "Yes — clients visit regularly for scoping workshops and sprint reviews. Email us in advance and we'll set an agenda with the architects on your project." },
      { q: "Is the whole team at the head office?", a: "The engineering core is here, with a Pune office and remote engineers across India. Your project team is introduced by name before the first sprint." },
      { q: "Do you serve clients outside Maharashtra?", a: "Yes — most of our work is for clients across India and overseas; the location of our desks matters far less than the response SLA, which applies everywhere." },
    ],
  },
  {
    slug: "pune",
    city: "Pune",
    region: "Maharashtra",
    country: "India",
    type: "Office",
    icon: "building",
    blurb:
      "Our Pune office — client engagement hub and second delivery centre, close to Maharashtra's enterprise corridor of manufacturing, IT and fintech clients.",
    paragraphs: [
      "Pune is our second office and the hub for client engagement across western India. It puts us an hour's drive from Mumbai's financial firms and at the centre of Maharashtra's manufacturing belt — the clients who need ERP, POS and HRMS systems built around real shop-floor operations.",
      "The office hosts client workshops, sprint reviews and the leadership team's client-facing work. Delivery teams in Pune and at our head office work as one pool, so projects get staffed by fit — the architect who scopes a manufacturing ERP in Pune works alongside engineers from both offices.",
      "For Pune-based businesses, this means something practical: an accountable team you can meet in person, in your time zone, with an escalation path that doesn't cross an ocean or a time zone.",
    ],
    services: ["ERP & POS systems", "HRMS & payroll", "Mobile app development", "Digital marketing", "Managed IT"],
    proof: [
      { value: "2nd", label: "Office in Maharashtra" },
      { value: "Client", label: "Engagement hub" },
      { value: "1 hr", label: "From Mumbai by expressway" },
    ],
    timezone: "IST (UTC+5:30)",
    languages: ["English", "Hindi", "Marathi"],
    address: "Pune, Maharashtra, India",
    faqs: [
      { q: "What happens at the Pune office?", a: "Client workshops, scoping sessions and sprint reviews happen here, alongside a delivery team working on ERP, POS and mobile projects." },
      { q: "Can we start with an in-person meeting in Pune?", a: "Yes — request a scoping call and we'll arrange it at the Pune office or at your premises, whichever suits the workflow audit better." },
      { q: "Do the Pune and head-office teams work together?", a: "Yes — one engineering pool across both offices, so projects get the right specialists rather than whoever sits in the nearest building." },
    ],
  },
  {
    slug: "nagpur",
    city: "Nagpur",
    region: "Maharashtra",
    country: "India",
    type: "Office",
    icon: "building",
    blurb:
      "Our Nagpur office — a growing delivery base in central India serving Vidarbha's manufacturing, logistics and trading businesses alongside our Maharashtra and Pune teams.",
    paragraphs: [
      "Nagpur sits at India's geographic centre and at the heart of Vidarbha's manufacturing and logistics belt — orange and cotton trade, textile mills, and a fast-growing warehousing corridor built around the Mihan logistics hub. Our third Maharashtra office puts delivery closer to these clients without adding a time zone or a layer of account management.",
      "The office runs as part of the same engineering pool as our head office and Pune — projects are staffed by fit, not by which building is closest, so a Nagpur client gets the same architects and the same review culture as anywhere else in Maharashtra.",
      "For manufacturers and traders based in and around Nagpur, the practical difference is proximity: in-person scoping workshops without a flight, and a team that already understands the region's freight, warehousing and mandi realities.",
    ],
    services: ["Manufacturing ERP", "Logistics & warehousing systems", "Trading & distribution CRM", "Mobile apps", "Managed IT"],
    proof: [
      { value: "3rd", label: "Office in Maharashtra" },
      { value: "Mihan", label: "Logistics corridor coverage" },
      { value: "24h", label: "Response SLA" },
    ],
    timezone: "IST (UTC+5:30)",
    languages: ["English", "Hindi", "Marathi"],
    address: "Nagpur, Maharashtra, India",
    faqs: [
      { q: "Do you have engineers based in Nagpur?", a: "Yes — a delivery team is based here, working as part of the same pool as our head office and Pune, so staffing follows project fit rather than location." },
      { q: "Can you build for the Mihan logistics corridor?", a: "Yes — warehousing, freight and multi-tenant logistics systems are familiar ground, including integrations with transporters and customs-linked documentation." },
      { q: "Do you serve manufacturers across Vidarbha, not just Nagpur city?", a: "Yes — most of our manufacturing ERP clients in the region are outside the city itself; remote delivery with periodic on-site visits is our normal mode." },
    ],
  },
  {
    slug: "mumbai",
    city: "Mumbai",
    region: "Maharashtra",
    country: "India",
    type: "Delivery",
    icon: "landmark",
    blurb:
      "Delivery coverage for Mumbai and the Mumbai Metropolitan Region — fintech, NBFC, trading and retail clients served by our Maharashtra engineering teams.",
    paragraphs: [
      "Mumbai is India's financial capital, and much of our fintech and lending work serves clients here — NBFCs running loan origination platforms, trading businesses on custom ERPs, and retail chains on POS systems. Our Maharashtra teams deliver these projects with the regulatory seriousness Mumbai's industry demands.",
      "The delivery model is engineered for the city: audit-ready systems with maker-checker controls for regulated lending, Tally and GST integrations for trading businesses, and multi-store POS for retail chains. Client meetings happen in Mumbai; the engineering happens across our Maharashtra centres an hour away.",
      "For MMR businesses, the practical proposition is simple: enterprise-grade engineering discipline — audit trails, load-tested launches, documented handovers — at an India-tier-2 cost base, with Maharashtra proximity meaning same-day in-person meetings when a project needs them.",
    ],
    services: ["Loan origination & fintech systems", "ERP for trading businesses", "Multi-store POS", "CRM systems", "Cloud & managed IT"],
    proof: [
      { value: "Same day", label: "In-person meetings" },
      { value: "Audit", label: "Ready systems" },
      { value: "IST", label: "Working hours overlap" },
    ],
    timezone: "IST (UTC+5:30)",
    languages: ["English", "Hindi", "Marathi", "Gujarati"],
    faqs: [
      { q: "Do you have a Mumbai office?", a: "We serve Mumbai from our Maharashtra delivery centres with in-person meetings arranged at your offices. For regulated fintech work, the architect who scopes your system runs the build — same team, start to finish." },
      { q: "Can you handle RBI-audited NBFC requirements?", a: "Yes — our loan origination platform work is built audit-first: maker-checker approvals, immutable logs and exportable trails mapped during scoping." },
      { q: "How fast can a Mumbai project start?", a: "A scoping call within 24 hours of your enquiry, a written estimate in 3 business days, and a thin-slice prototype in production by week three." },
    ],
  },
  {
    slug: "delhi-ncr",
    city: "Delhi NCR",
    region: "Delhi · NCR",
    country: "India",
    type: "Delivery",
    icon: "flag",
    blurb:
      "Delivery coverage across Delhi NCR — ecommerce, D2C brands, logistics and professional-services clients served remotely with a 24-hour SLA.",
    paragraphs: [
      "Delhi NCR is India's densest market for D2C commerce and logistics — and both are software-heavy businesses. We serve NCR clients with custom e-commerce platforms built for COD realities, logistics and fleet-tracking systems, and the CRM and ERP backbones that keep multi-channel operations sane.",
      "Working across geographies is our normal mode: shared Jira, a Slack channel, weekly video demos and a 24-hour response SLA make distance a non-factor. NCR clients get the same named architect and the same code-ownership terms as clients we see in person.",
      "For professional-services firms — the CA firms, law offices and consultancies that cluster in the capital — we build practice-management systems: engagement tracking, document vaults, billing and compliance calendars in one accountable platform.",
    ],
    services: ["E-commerce platforms", "Logistics & fleet tracking", "CRM systems", "Practice management", "Digital marketing"],
    proof: [
      { value: "Remote", label: "First-class delivery" },
      { value: "24h", label: "Response SLA" },
      { value: "Weekly", label: "Live demos" },
    ],
    timezone: "IST (UTC+5:30)",
    languages: ["English", "Hindi"],
    faqs: [
      { q: "Can you work with us without a local office?", a: "Yes — remote-first delivery is our standard: shared boards, weekly demos and a 24-hour SLA. We visit in person for major scoping workshops and launches when needed." },
      { q: "Do you understand Indian COD ecommerce?", a: "Deeply — COD confirmation workflows, pincode rules, RTO analytics and UPI-first checkout are standard modules in our e-commerce builds." },
      { q: "How do we track progress remotely?", a: "You see everything: shared Jira, a dedicated Slack channel, a live demo every week and monthly written reports against the agreed scope." },
    ],
  },
  {
    slug: "bengaluru",
    city: "Bengaluru",
    region: "Karnataka",
    country: "India",
    type: "Delivery",
    icon: "cpu",
    blurb:
      "Delivery coverage for Bengaluru — SaaS products, startups and product engineering engagements with startup-speed delivery discipline.",
    paragraphs: [
      "Bengaluru builds products — and product engineering is a different discipline from project delivery: short loops, honest estimates, thin slices in production early, and the humility to let user feedback change the roadmap. Our delivery process was built for exactly that rhythm.",
      "We serve Bengaluru startups and SaaS teams with dedicated engineers (React, Next.js, Node, Flutter), MVP builds that reach real users in weeks, and the product-engineering partnership of a team that ships and runs its own products — TeleValley and Finvalley are live software, not case studies.",
      "The engagement models are startup-shaped too: dedicated engineers who slot into your standups, MVP fixed-bids with a defined first release, and fractional CTO-style architecture guidance when the founding team needs a senior second opinion without a senior salary line.",
    ],
    services: ["Dedicated engineers", "MVP & product builds", "SaaS platform engineering", "Cloud & DevOps", "QA automation"],
    proof: [
      { value: "Wk 3", label: "Thin slice in production" },
      { value: "Own", label: "Products we run ourselves" },
      { value: "48h", label: "To a dedicated engineer" },
    ],
    timezone: "IST (UTC+5:30)",
    languages: ["English", "Hindi", "Kannada"],
    faqs: [
      { q: "Can you build our MVP in weeks?", a: "Yes — our thin-slice method ships a working core in three weeks and the production build in 6–10, with weekly demos keeping you in control of the roadmap." },
      { q: "Can engineers join our existing team?", a: "That's the dedicated model — your repos, your standups, your tools. Our engineers integrate with your process and our architects stay on call for reviews." },
      { q: "Do you do fractional CTO work?", a: "Yes — architecture reviews, hiring plans, stack decisions and build-versus-buy guidance on a retainer, for founding teams that need senior judgment without a full-time hire." },
    ],
  },
  {
    slug: "hyderabad",
    city: "Hyderabad",
    region: "Telangana",
    country: "India",
    type: "Delivery",
    icon: "briefcase",
    blurb:
      "Delivery coverage for Hyderabad — healthcare, pharma-adjacent and enterprise back-office systems served with IST-hour engineering teams.",
    paragraphs: [
      "Hyderabad's economy pairs healthcare and pharma with a deep enterprise-services base — and both run on back-office software. We serve the city with clinic and hospital platforms, HRMS and payroll systems built for Indian compliance, and the ERP integrations that connect operations to accounting.",
      "Healthcare work is a specialty: appointment and EMR systems with role-scoped access and audit logs, lab workflows, and telemedicine platforms — engineered so patient data privacy is architectural, not a policy document.",
      "Delivery runs IST-first with overlap hours for US-adjacent enterprise clients, on the same disciplined process everywhere: written scope, weekly demos, code you own and a 24-hour response SLA.",
    ],
    services: ["Healthcare platforms", "HRMS & payroll", "ERP integrations", "Custom software", "Managed IT"],
    proof: [
      { value: "IST", label: "First working hours" },
      { value: "Audit", label: "Logged patient records" },
      { value: "24h", label: "Response SLA" },
    ],
    timezone: "IST (UTC+5:30)",
    languages: ["English", "Hindi", "Telugu"],
    faqs: [
      { q: "Do you build clinic management systems?", a: "Yes — appointments, EMR, labs, pharmacy and billing with role-scoped access and audit logs on every patient record. Multi-branch setups are standard." },
      { q: "Can you integrate with pharma or distribution ERPs?", a: "Yes — batch tracking, expiry workflows and GST-grade invoicing are familiar ground from our manufacturing and retail engagements." },
      { q: "What about data residency?", a: "Your systems run on cloud accounts you own, in regions you choose — we configure and hand over, never pool or hold your data." },
    ],
  },
  {
    slug: "ahmedabad",
    city: "Ahmedabad",
    region: "Gujarat",
    country: "India",
    type: "Delivery",
    icon: "factory",
    blurb:
      "Delivery coverage for Ahmedabad and Gujarat — manufacturing ERPs, textile and chemical industry systems, and B2B commerce platforms.",
    paragraphs: [
      "Gujarat's manufacturing base — textiles, chemicals, pharma, engineering goods — runs on margins that punish manual paperwork. We serve Ahmedabad clients with production-tracking ERPs, BOM-level traceability, job-work management and the B2B commerce platforms that move their goods.",
      "The manufacturing ERP pattern is proven in our work: machine-wise output, quality gates supervisors actually use, inventory across godowns, GST-ready invoicing and Tally reconciliation — built around how the floor works rather than how a vendor's template works.",
      "For traders and distributors, we build the order-to-cash backbone: quotations, credit limits, dispatch tracking and outstanding reports — with WhatsApp-order capture that meets customers where they already are.",
    ],
    services: ["Manufacturing ERP", "B2B commerce portals", "Inventory & godown systems", "Custom CRM", "Mobile apps"],
    proof: [
      { value: "25%", label: "Lower inventory cost typical" },
      { value: "BOM", label: "Level traceability" },
      { value: "GST", label: "Ready invoicing" },
    ],
    timezone: "IST (UTC+5:30)",
    languages: ["English", "Hindi", "Gujarati"],
    faqs: [
      { q: "Can you handle BOM and job-work flows?", a: "Yes — production tracking with BOM traceability, job-work issuing and reconciliation against vendors, and quality gates are core modules in our manufacturing builds." },
      { q: "We work partly on WhatsApp — can the system fit that?", a: "Yes — WhatsApp order and enquiry capture flows into the system, and confirmations go back out. The software joins your habits instead of replacing them overnight." },
      { q: "How do you handle our CA's Tally workflow?", a: "The ERP runs operations and syncs vouchers to Tally, or we can go fully off Tally — your CA's preference decides, and either works." },
    ],
  },
  {
    slug: "chennai",
    city: "Chennai",
    region: "Tamil Nadu",
    country: "India",
    type: "Delivery",
    icon: "factory",
    blurb:
      "Delivery coverage for Chennai — automotive and auto-components manufacturing, healthcare and medical-device makers, and port-linked logistics served by our Maharashtra engineering teams.",
    paragraphs: [
      "Chennai is India's automotive manufacturing capital and a major healthcare and medical-device hub, with a port-driven logistics economy running alongside both. We serve Chennai clients with production and quality-tracking ERPs for auto-component makers, clinic and diagnostic platforms for the city's hospital chains, and warehousing systems tied to the port and its feeder network.",
      "The manufacturing pattern here mirrors our Gujarat work but with a harder edge on quality traceability — automotive OEM audits expect batch and component-level tracking that a generic ERP was never built for, so we model the system on the vendor's actual QA process from week one.",
      "Delivery runs fully remote from our Maharashtra centres, with the same weekly demo, shared board and 24-hour SLA as clients we see in person — and in-person scoping visits arranged whenever a project needs eyes on the shop floor.",
    ],
    services: ["Automotive & manufacturing ERP", "Healthcare platforms", "Port & warehouse logistics", "Quality & compliance tracking", "Custom CRM"],
    proof: [
      { value: "OEM", label: "Audit-ready traceability" },
      { value: "Remote", label: "First-class delivery" },
      { value: "24h", label: "Response SLA" },
    ],
    timezone: "IST (UTC+5:30)",
    languages: ["English", "Hindi", "Tamil"],
    faqs: [
      { q: "Can you meet automotive OEM quality and traceability audits?", a: "Yes — batch and component-level traceability, quality gates and inspection records are built into our manufacturing ERP work, mapped to the OEM's specific audit format during scoping." },
      { q: "Do you build for hospital and diagnostic chains?", a: "Yes — appointments, EMR, labs and billing across multiple branches, with role-scoped access and audit logs on every patient record." },
      { q: "Can you integrate with port and customs documentation?", a: "Yes — warehousing and freight systems we've built include customs-linked documentation and transporter integrations for port-driven logistics." },
    ],
  },
  {
    slug: "dubai",
    city: "Dubai",
    region: "UAE",
    country: "United Arab Emirates",
    type: "Presence",
    icon: "building2",
    blurb:
      "Our Dubai presence — serving UAE and Gulf clients across time zones with India-based engineering teams, for fintech, retail, real estate and logistics businesses.",
    paragraphs: [
      "The Gulf is a natural market for Ukvalley: same working window as India, and the same mix of ambition and pragmatism we build for. Our Dubai presence exists for client engagement — meetings, scoping and relationship management — while engineering runs from our Maharashtra centres.",
      "UAE clients typically engage us for e-commerce platforms with regional payment and shipping realities, real-estate CRMs built for brokerage-led sales, retail POS across multi-branch operations, and fintech or lending systems where audit discipline matters.",
      "Working across Dubai and India is seamless by design: a shared or overlapping work day, English-first communication, and contracts with clear IP assignment — the same code-you-own-from-day-one principle we apply everywhere.",
    ],
    services: ["E-commerce platforms", "Real estate CRM", "Multi-branch POS", "Custom software", "Mobile apps"],
    proof: [
      { value: "1.5h", label: "Time-zone gap" },
      { value: "Same day", label: "Overlap for calls" },
      { value: "100%", label: "Code you own" },
    ],
    timezone: "GST (UTC+4)",
    languages: ["English", "Hindi"],
    faqs: [
      { q: "How do meetings work across Dubai and India?", a: "Comfortably — UAE and India are 1.5 hours apart, so morning Dubai calls land in mid-morning India. Weekly demos and scoping calls fit a shared working day." },
      { q: "Do you understand UAE payment and shipping stacks?", a: "Yes — regional gateways (Telr, Network International, Stripe), courier integrations and VAT-ready invoicing are covered in our Gulf e-commerce work." },
      { q: "Can we sign under UAE jurisdiction?", a: "Engagement contracts are flexible on jurisdiction; IP assignment and NDA terms are standard and apply before any work begins, regardless." },
    ],
  },
  {
    slug: "toronto",
    city: "Toronto",
    region: "Ontario",
    country: "Canada",
    type: "Presence",
    icon: "globe",
    blurb:
      "North-American delivery coverage through our Toronto presence — SaaS and product engineering for Canadian and US clients, with overlap-hours collaboration.",
    paragraphs: [
      "North America is where most of our SaaS and product-engineering work originates — and Toronto anchors it. Canadian and US clients engage dedicated engineers, MVP builds and cloud/DevOps work with teams in India, at rates that typically run well below local agency or in-house costs.",
      "The collaboration model is built for the distance: morning-overlap hours, asynchronous-first communication, shared boards and a weekly demo that lands on your calendar at a sane hour. Code reviews and CI keep quality independent of geography.",
      "For Canadian startups and scale-ups specifically: we slot dedicated React, Next.js and Node engineers into your team, or take on product builds end to end — with IP assignment, NDA and code ownership settled in the first documents you sign, not the last.",
    ],
    services: ["Dedicated engineers", "MVP & product builds", "Cloud & DevOps", "SaaS engineering", "QA automation"],
    proof: [
      { value: "EST", label: "Overlap hours daily" },
      { value: "30–40%", label: "Below metro agency rates" },
      { value: "Day 1", label: "Code ownership" },
    ],
    timezone: "EST (UTC−5)",
    languages: ["English"],
    faqs: [
      { q: "Will the time difference be a problem?", a: "We plan around it: engineers shift hours for overlap windows, communication is async-first with written updates, and the weekly demo is scheduled in your morning — never at your dinner." },
      { q: "How do rates compare to Canadian agencies?", a: "Typically 30–40% below Toronto/Vancouver agency rates at equal seniority, because our engineering base is in India — with the same code-review and SLA discipline." },
      { q: "Who owns the IP and code?", a: "You do, from day one — NDA and IP assignment are signed before work starts, and all code lives in repositories you control." },
    ],
  },
  {
    slug: "new-york",
    city: "New York",
    region: "New York",
    country: "USA",
    type: "Presence",
    icon: "flag",
    blurb:
      "US client engagement through our New York presence — fintech, SaaS and enterprise teams served by India-based engineering with US-hours overlap.",
    paragraphs: [
      "New York anchors our US engagement: fintech and lending platforms where audit trails aren't optional, SaaS products that need shipping velocity, and enterprise back-office systems that must integrate with legacy stacks gracefully. The engineering runs from India; the accountability is structured to feel local.",
      "The model that works for US clients: a named architect on every scoping call, overlap-hours for meetings, async-first written communication, and the same contractual spine as everywhere — 24-hour response SLA, full code ownership from day one, and clean exit rights.",
      "For US startups and SMBs, the value is concrete: senior-verified engineers at 30–40% below metro agency rates, thin-slice delivery that shows working software in week three, and a partner that runs its own products in production — we're not just selling the discipline, we live it.",
    ],
    services: ["Fintech engineering", "SaaS platforms", "Dedicated teams", "Cloud & DevOps", "Project rescue"],
    proof: [
      { value: "US", label: "Overlap hours" },
      { value: "Wk 3", label: "Working prototype" },
      { value: "24h", label: "Response SLA" },
    ],
    timezone: "EST (UTC−5)",
    languages: ["English"],
    faqs: [
      { q: "Can you take over a failed US vendor engagement?", a: "Yes — project rescue is a defined service: secure the code and credentials first, audit in writing, stabilise, then extend. You keep ownership throughout and can exit cleanly at any point." },
      { q: "How do security and compliance work?", a: "SOC-style discipline: least-privilege access, encrypted secrets, audit logging and infrastructure as code — with your compliance requirements mapped explicitly during scoping." },
      { q: "What does an engagement cost?", a: "Dedicated engineers bill monthly, projects are fixed-bid after scoping. Either way you get a written estimate in 3 business days and a fixed proposal in 7 — no discovery-loop billing." },
    ],
  },
];
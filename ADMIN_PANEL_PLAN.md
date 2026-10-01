# Ukvalley Admin Panel — Plan (for approval)

Status: **DRAFT — no code has been written for the admin panel yet.**

## 1. Goal
Make the website content-driven. Today all copy lives in `src/lib/*.ts`
(`site-data.ts`, `solutions-data.ts`, `hire-data.ts`, `locations-data.ts`,
`reports.json`). Editing anything needs a developer and a redeploy.
The admin panel lets the team add / edit / delete that content from a browser,
and the public site reads it from a database.

## 2. Ground rules
- Same theme as the website: same colour tokens (`--uk-*`, light + dark), same
  fonts (Plus Jakarta Sans body, Space Grotesk headings, Sora display), same
  shadcn/ui components in `src/components/ui`. No new design language.
- Lives inside this project at `/admin` (route group `src/app/(admin)/admin`),
  separate layout: sidebar + top bar. No public header/footer, no aurora, loader
  or smooth-scroll (keeps it fast).
- Not indexed (`noindex`, disallowed in `robots.ts`).
- **One page at a time.** I build a page, you review it, and only after you say
  "done" do I start the next one.

## 3. Proposed tech (please confirm — see section 8)
| Concern | Choice | Why |
|---|---|---|
| Database | MongoDB (Atlas free tier) | Works on Vercel; matches the content-shaped (nested) data in `src/lib` |
| Driver | Official `mongodb` driver (typed collections) | Light, no schema/migration step |
| Auth | Auth.js (NextAuth) credentials login, hashed passwords (argon2/bcrypt), httpOnly session cookie | Simple single-team login; roles `admin` and `editor` |
| Forms | Server Actions + zod validation | No separate API needed |
| Images | Vercel Blob or Cloudinary (your choice) | Uploads for hero images / logos / team photos |
| Public-site freshness | `revalidateTag` after each save | Pages stay static-fast but update instantly when content changes |
| Rich text | Simple markdown/rich editor for blog + long copy | Blog posts and service details are long text |

## 4. What becomes editable (content model)
Mapped from the current data files:

| Admin section | Source today | Public pages affected |
|---|---|---|
| Site settings (company, contact, socials, nav) | `company`, `nav` | header, footer, contact |
| Home page (hero, stats, trust logos, FAQs) | `heroStats`, `stats`, `trustedBy`, `faqs` | `/`, `/faq` |
| Services (+ detail) | `services`, `serviceDetails` | `/services`, `/services/[slug]` |
| Solutions | `solutions-data.ts` | `/solutions/[slug]` |
| Products | `products` | `/products/[slug]` |
| Case studies | `caseStudies` | `/case-studies/[slug]` |
| Industries | `industries` | `/industries/[slug]` |
| Blog / insights | `insights` | `/blog/[slug]` |
| Hire roles | `hire-data.ts` | `/hire/[slug]` |
| Locations | `locations-data.ts` | `/locations/[slug]` |
| Team & careers | `team`, `careers` | `/team`, `/careers` |
| Testimonials, tech stack, process, engagement | matching arrays | home + inner pages |
| Reports | `reports.json` | reports section |
| Leads / enquiries | contact + scoping forms (currently not stored) | inbox in admin |
| Users | new | who can log in |

## 5. Admin page order (one by one)
Each step = one deliverable, reviewed before the next.

1. **Foundation** — DB connection, schema for step 1–2 only, login page,
   admin shell (sidebar, top bar, theme toggle, breadcrumbs, empty states).
2. **Dashboard** — counts (services, posts, leads…), recent leads, quick links.
3. **Site settings** — company info, contact details, social links, navigation.
4. **Services** — list, search, add, edit, delete, reorder, publish/draft.
5. **Blog / Insights**
6. **Case studies**
7. **Products**
8. **Solutions**
9. **Industries**
10. **Hire roles**
11. **Locations**
12. **Team & careers**
13. **Testimonials, FAQs, tech stack, process, engagement**
14. **Leads / enquiries inbox** (+ hook the public forms to save here)
15. **Media library**
16. **Users & roles**
17. **Migration** — import all current `src/lib` data into the database so the
    site looks identical on day one, then switch public pages to read from the DB.

Note: to keep the public site working at every step, the public pages keep
using the current files until step 17, per-section: when a section's admin page
is approved I also switch that section's public pages to the database.

## 6. Standard layout of every admin page
- Page title + short help text + primary action button (top right).
- List view: search, filter (status), sortable table, pagination, row actions.
- Create / edit view: form grouped into cards, live validation, autosave-free
  explicit **Save draft / Publish**, unsaved-changes warning.
- Delete requires a confirm dialog. Success / error toasts.
- Responsive down to phone width; keyboard accessible; light + dark mode.

## 7. Folder structure (proposed)
```
src/app/(admin)/admin/
  layout.tsx            # shell: sidebar + topbar
  login/page.tsx
  page.tsx              # dashboard
  services/ page.tsx, new/page.tsx, [id]/page.tsx
  ...one folder per section
src/components/admin/   # sidebar, data-table, form fields, confirm dialog…
src/lib/db/             # client.ts, queries per section
src/lib/auth.ts
src/lib/actions/        # server actions per section
```

## 8. Decisions I need from you
1. **Hosting** — where will the site be deployed (Vercel, VPS, cPanel/shared)?
   This decides the database and image storage.
2. **Database** — **MongoDB chosen** (Atlas).
3. **Login** — one shared admin, or several users with roles (admin / editor)?
4. **Start point** — approve the order in section 5, or reorder (e.g. do Blog
   first)?

## 9. Risks / notes
- Content is large (`site-data.ts` alone is ~250 KB); the migration step (17)
  is scripted, not typed by hand.
- Moving to a DB needs environment variables (DB URL, auth secret) — I will
  provide a `.env.example`, never commit real secrets.
- Public pages currently prerender at build time; with revalidation they keep
  the same speed.

**Approve this plan (or tell me what to change) and answer section 8, and I will start with Step 1 — Foundation.**

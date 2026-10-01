"use client";

import { useEffect, useState, useCallback } from "react";
import {
  LayoutDashboard, Users, ShoppingCart, BarChart3,
  TrendingUp, Bell, Search, ChevronRight,
  ArrowUpRight, ArrowDownRight,
  Package, DollarSign,
  Settings, Megaphone, Shield, PanelLeftClose, PanelLeftOpen,
  FileText, CheckCircle2, AlertTriangle,
  Server, CreditCard, Mail,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ── Sidebar items ── */
const sidebarItems = [
  { icon: LayoutDashboard, label: "Dashboard" },
  { icon: Users, label: "CRM" },
  { icon: ShoppingCart, label: "Orders" },
  { icon: BarChart3, label: "Reports" },
  { icon: Megaphone, label: "Marketing" },
  { icon: Shield, label: "Security" },
  { icon: Settings, label: "Settings" },
];

/* ═══════════════════════════════════════════
   7 COMPLETELY DIFFERENT SCREEN LAYOUTS
   ═══════════════════════════════════════════ */

/* ── 1. Dashboard — KPI row + pipeline + deals ── */
const dashboardScreen = {
  type: "dashboard" as const,
  title: "Dashboard",
  subtitle: "Business overview",
  kpis: [
    { label: "Revenue", value: "₹24.8L", change: "+12.4%", up: true, icon: DollarSign },
    { label: "Leads", value: "1,247", change: "+8.2%", up: true, icon: TrendingUp },
    { label: "Conversion", value: "32.6%", change: "+2.1%", up: true, icon: ArrowUpRight },
    { label: "Avg. Ticket", value: "₹18.4K", change: "-3.1%", up: false, icon: Package },
  ],
  pipeline: [
    { label: "Discovery", count: 12, pct: 18 },
    { label: "Proposal", count: 8, pct: 30 },
    { label: "Negotiation", count: 5, pct: 52 },
    { label: "Closed Won", count: 14, pct: 85 },
  ],
  listTitle: "Recent Deals",
  items: [
    { name: "Acme Corp", value: "₹4.2L", badge: "Closed Won", badgeColor: "bg-emerald-500" },
    { name: "Zenith Ltd", value: "₹2.8L", badge: "Negotiation", badgeColor: "bg-uk-yellow" },
    { name: "Prima Industries", value: "₹6.1L", badge: "Proposal", badgeColor: "bg-uk-blue" },
    { name: "Orbit Systems", value: "₹1.9L", badge: "Discovery", badgeColor: "bg-gray-400" },
  ],
};

/* ── 2. CRM — Contact cards with avatars ── */
const crmScreen = {
  type: "crm" as const,
  title: "CRM",
  subtitle: "Contact & deals",
  stats: [
    { label: "Total Contacts", value: "3,842", change: "+127 this week", icon: Users },
    { label: "Active Deals", value: "67", change: "₹18.4L pipeline", icon: DollarSign },
    { label: "Win Rate", value: "41%", change: "+3.2% vs last month", icon: TrendingUp },
  ],
  contacts: [
    { initials: "RK", name: "Rajesh Kumar", company: "Acme Corp", role: "VP Sales", stage: "Negotiation", stageColor: "bg-uk-yellow", value: "₹4.2L" },
    { initials: "PS", name: "Priya Sharma", company: "Zenith Ltd", role: "CTO", stage: "Proposal", stageColor: "bg-uk-blue", value: "₹2.8L" },
    { initials: "AM", name: "Amit Mehta", company: "Prima Ind.", role: "Director", stage: "Won", stageColor: "bg-emerald-500", value: "₹6.1L" },
    { initials: "NV", name: "Neha Verma", company: "Orbit Sys.", role: "Product Lead", stage: "Lead", stageColor: "bg-gray-400", value: "₹1.9L" },
  ],
};

/* ── 3. Orders — Order tracking table ── */
const ordersScreen = {
  type: "orders" as const,
  title: "Orders",
  subtitle: "Fulfillment",
  summary: [
    { label: "Pending", value: "23", color: "bg-uk-yellow" },
    { label: "Processing", value: "15", color: "bg-uk-blue" },
    { label: "Shipped", value: "42", color: "bg-uk-blue" },
    { label: "Delivered", value: "504", color: "bg-emerald-500" },
  ],
  orders: [
    { id: "#4821", customer: "Sunrise Pharma", amount: "₹32,400", status: "Delivered", date: "2d ago", statusColor: "text-emerald-600 dark:text-emerald-400" },
    { id: "#4820", customer: "Metro Logistics", amount: "₹18,200", status: "Shipped", date: "3d ago", statusColor: "text-uk-blue" },
    { id: "#4819", customer: "Peak Fitness", amount: "₹9,500", status: "Processing", date: "4d ago", statusColor: "text-yellow-600 dark:text-uk-yellow" },
    { id: "#4818", customer: "NewAge Retail", amount: "₹45,000", status: "Pending", date: "5d ago", statusColor: "text-gray-500 dark:text-gray-400" },
  ],
};

/* ── 4. Reports — Charts (bar + donut) ── */
const reportsScreen = {
  type: "reports" as const,
  title: "Reports",
  subtitle: "Analytics & insights",
  kpis: [
    { label: "MRR", value: "₹12.4L", change: "+18%", up: true, icon: DollarSign },
    { label: "Churn", value: "2.1%", change: "-0.4%", up: true, icon: ArrowDownRight },
    { label: "LTV", value: "₹4.2L", change: "+9%", up: true, icon: TrendingUp },
    { label: "CAC", value: "₹8.2K", change: "-11%", up: true, icon: ArrowUpRight },
  ],
  bars: [
    { label: "Jan", value: 65 },
    { label: "Feb", value: 78 },
    { label: "Mar", value: 52 },
    { label: "Apr", value: 90 },
    { label: "May", value: 72 },
    { label: "Jun", value: 95 },
  ],
  donut: [
    { label: "Product", pct: 45, color: "bg-uk-blue" },
    { label: "Services", pct: 30, color: "bg-uk-yellow" },
    { label: "Support", pct: 15, color: "bg-emerald-500" },
    { label: "Other", pct: 10, color: "bg-gray-300 dark:bg-gray-600" },
  ],
};

/* ── 5. Marketing — Campaign cards ── */
const marketingScreen = {
  type: "marketing" as const,
  title: "Marketing",
  subtitle: "Campaigns",
  campaigns: [
    { name: "Google Ads Q3", channel: "Paid", spend: "₹1.8L", leads: 234, cpl: "₹770", status: "Active", statusColor: "bg-emerald-500" },
    { name: "SEO Content Hub", channel: "Organic", spend: "₹42K", leads: 89, cpl: "₹472", status: "Growing", statusColor: "bg-uk-blue" },
    { name: "Social Blitz", channel: "Social", spend: "₹68K", leads: 156, cpl: "₹436", status: "Scaling", statusColor: "bg-uk-yellow" },
    { name: "Email Drip Series", channel: "Email", spend: "₹12K", leads: 67, cpl: "₹179", status: "Paused", statusColor: "bg-gray-400" },
  ],
};

/* ── 6. Security — Status cards ── */
const securityScreen = {
  type: "security" as const,
  title: "Security",
  subtitle: "Infrastructure",
  statuses: [
    { label: "SSL Certificate", detail: "Valid until Dec 2027", icon: CheckCircle2, color: "text-emerald-600 dark:text-emerald-400" },
    { label: "DDoS Protection", detail: "Active — 0 attacks this week", icon: Shield, color: "text-uk-blue" },
    { label: "2FA Enforcement", detail: "All 14 team members enabled", icon: Users, color: "text-uk-blue" },
    { label: "Audit Logging", detail: "Last reviewed 2 hours ago", icon: FileText, color: "text-uk-yellow" },
  ],
  alerts: [
    { severity: "high", msg: "3 failed login attempts from 192.168.1.45", time: "12 min ago" },
    { severity: "low", msg: "SSL certificate auto-renewal scheduled", time: "2 days ago" },
    { severity: "info", msg: "System backup completed successfully", time: "6 hours ago" },
  ],
};

/* ── 7. Settings — Integration cards ── */
const settingsScreen = {
  type: "settings" as const,
  title: "Settings",
  subtitle: "Configuration",
  team: { total: 14, active: 12, roles: "4 Admins · 6 Editors · 4 Viewers" },
  integrations: [
    { name: "Slack", desc: "Team notifications", icon: Mail, connected: true },
    { name: "AWS S3", desc: "File storage", icon: Server, connected: true },
    { name: "Stripe", desc: "Payment gateway", icon: CreditCard, connected: true },
    { name: "Jira", desc: "Issue tracking", icon: FileText, connected: false },
  ],
  usage: { apiCalls: "1.2M", storage: "2.4 TB", uptime: "99.97%" },
};

type ScreenData = typeof dashboardScreen | typeof crmScreen | typeof ordersScreen | typeof reportsScreen | typeof marketingScreen | typeof securityScreen | typeof settingsScreen;
const allScreens: ScreenData[] = [dashboardScreen, crmScreen, ordersScreen, reportsScreen, marketingScreen, securityScreen, settingsScreen];

/* ═══════════════════════════════════════════
   ANIMATED SUB-COMPONENTS
   ═══════════════════════════════════════════ */

function PipelineBar({ pct, count, label, delay }: { pct: number; count: number; label: string; delay: number }) {
  const [width, setWidth] = useState(0);
  const [visible, setVisible] = useState(false);
  // The parent remounts each screen via contentKey, so useState(0/false) already
  // handles the reset — this effect only animates in (async callbacks only).
  useEffect(() => {
    const t1 = setTimeout(() => setVisible(true), delay);
    const t2 = setTimeout(() => setWidth(pct), delay + 100);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [pct, delay]);
  return (
    <div className={cn("flex items-center gap-3 transition-all duration-300", visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1")}>
      <span className="w-[68px] text-[0.7rem] text-uk-body/60 dark:text-white/50">{label}</span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-uk-line/50 dark:bg-white/[0.06]">
        <div className="h-full rounded-full bg-gradient-to-r from-uk-blue to-uk-blue-bright transition-all duration-700 ease-out" style={{ width: `${width}%` }} />
      </div>
      <span className="text-[0.7rem] font-semibold tabular-nums text-uk-body/70 dark:text-white/70">{count}</span>
    </div>
  );
}

function KpiCard({ kpi, delay }: { kpi: { label: string; value: string; change: string; up: boolean; icon: LucideIcon }; delay: number }) {
  const [visible, setVisible] = useState(false);
  const Icon = kpi.icon;
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  return (
    <div className={cn("rounded-lg border border-uk-line bg-white dark:border-white/[0.06] dark:bg-white/[0.04] p-2.5 shadow-float dark:shadow-none lg:p-3 transition-all duration-300", visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2")}>
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className="h-3 w-3 text-uk-blue" />
        <p className="text-[0.65rem] uppercase tracking-wider text-uk-muted dark:text-white/40">{kpi.label}</p>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="font-heading text-lg font-bold text-uk-heading dark:text-white/90 lg:text-xl">{kpi.value}</span>
        <span className={cn("inline-flex items-center gap-0.5 text-[0.65rem] font-semibold", kpi.up ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400")}>
          {kpi.up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}{kpi.change}
        </span>
      </div>
    </div>
  );
}

function AnimatedItem({ children, delay }: { children: React.ReactNode; delay: number }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  return <div className={cn("transition-all duration-300", visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2")}>{children}</div>;
}

/* ═══════════════════════════════════════════
   7 DIFFERENT SCREEN RENDERERS
   ═══════════════════════════════════════════ */

function DashboardView({ data, ck }: { data: typeof dashboardScreen; ck: number }) {
  return (
    <>
      <div key={`dk-${ck}`} className="grid grid-cols-2 gap-2.5 border-b border-uk-line dark:border-white/[0.06] p-3 sm:grid-cols-4 lg:gap-3 lg:p-4">
        {data.kpis.map((k, i) => <KpiCard key={k.label} kpi={k} delay={i * 80} />)}
      </div>
      <div key={`db-${ck}`} className="flex flex-1 flex-col gap-2.5 p-3 sm:flex-row lg:gap-3 lg:p-4">
        <div className="flex-1 rounded-lg border border-uk-line bg-white dark:border-white/[0.06] dark:bg-white/[0.04] p-3 shadow-float dark:shadow-none lg:p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-heading text-xs font-semibold uppercase tracking-wider text-uk-muted dark:text-white/60">Pipeline</h3>
            <TrendingUp className="h-3.5 w-3.5 text-uk-blue" />
          </div>
          <div className="flex flex-col gap-2.5">
            {data.pipeline.map((s, i) => <PipelineBar key={s.label} pct={s.pct} count={s.count} label={s.label} delay={i * 120 + 200} />)}
          </div>
        </div>
        <div className="flex-1 rounded-lg border border-uk-line bg-white dark:border-white/[0.06] dark:bg-white/[0.04] p-3 shadow-float dark:shadow-none lg:p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-heading text-xs font-semibold uppercase tracking-wider text-uk-muted dark:text-white/60">{data.listTitle}</h3>
            <ChevronRight className="h-3.5 w-3.5 text-uk-muted/50 dark:text-white/30" />
          </div>
          <div className="flex flex-col gap-2">
            {data.items.map((d, i) => (
              <AnimatedItem key={d.name} delay={i * 100 + 300}>
                <div className="flex items-center justify-between rounded-md bg-uk-surface/60 dark:bg-white/[0.03] px-2.5 py-2">
                  <div className="flex items-center gap-2">
                    <span className={cn("h-2 w-2 rounded-full", d.badgeColor)} />
                    <span className="text-[0.75rem] font-medium text-uk-heading dark:text-white/80">{d.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[0.7rem] font-semibold text-uk-muted dark:text-white/60">{d.value}</span>
                    <span className="rounded-full bg-uk-surface dark:bg-white/[0.06] px-1.5 py-0.5 text-[0.6rem] text-uk-body dark:text-white/50">{d.badge}</span>
                  </div>
                </div>
              </AnimatedItem>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function CrmView({ data, ck }: { data: typeof crmScreen; ck: number }) {
  return (
    <>
      {/* Stats row */}
      <div key={`cs-${ck}`} className="grid grid-cols-3 gap-2.5 border-b border-uk-line dark:border-white/[0.06] p-3 lg:gap-3 lg:p-4">
        {data.stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <AnimatedItem key={s.label} delay={i * 100}>
              <div className="rounded-lg border border-uk-line bg-white dark:border-white/[0.06] dark:bg-white/[0.04] p-2.5 shadow-float dark:shadow-none lg:p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Icon className="h-4 w-4 text-uk-blue" />
                  <span className="text-[0.65rem] uppercase tracking-wider text-uk-muted dark:text-white/40">{s.label}</span>
                </div>
                <span className="font-heading text-xl font-bold text-uk-heading dark:text-white/90">{s.value}</span>
                <p className="text-[0.6rem] text-emerald-600 dark:text-emerald-400 mt-0.5">{s.change}</p>
              </div>
            </AnimatedItem>
          );
        })}
      </div>
      {/* Contact cards */}
      <div key={`cc-${ck}`} className="flex flex-1 flex-col gap-2.5 p-3 lg:gap-3 lg:p-4">
        <h3 className="font-heading text-xs font-semibold uppercase tracking-wider text-uk-muted dark:text-white/60">Recent Contacts</h3>
        {data.contacts.map((c, i) => (
          <AnimatedItem key={c.name} delay={i * 100 + 200}>
            <div className="flex items-center gap-3 rounded-lg border border-uk-line bg-white dark:border-white/[0.06] dark:bg-white/[0.04] p-3 shadow-float dark:shadow-none">
              <div className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-uk-blue/12 text-uk-blue font-heading text-sm font-bold">{c.initials}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-uk-heading dark:text-white/90 truncate">{c.name}</p>
                <p className="text-[0.7rem] text-uk-muted dark:text-white/50">{c.role} · {c.company}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className={cn("rounded-full px-2 py-0.5 text-[0.6rem] font-semibold text-white", c.stageColor)}>{c.stage}</span>
                <span className="text-[0.7rem] font-semibold text-uk-heading dark:text-white/80">{c.value}</span>
              </div>
            </div>
          </AnimatedItem>
        ))}
      </div>
    </>
  );
}

function OrdersView({ data, ck }: { data: typeof ordersScreen; ck: number }) {
  return (
    <>
      {/* Status pills */}
      <div key={`os-${ck}`} className="flex flex-wrap gap-2.5 border-b border-uk-line dark:border-white/[0.06] p-3 lg:gap-3 lg:p-4">
        {data.summary.map((s, i) => (
          <AnimatedItem key={s.label} delay={i * 80}>
            <div className="flex items-center gap-2 rounded-lg border border-uk-line dark:border-white/[0.06] bg-white dark:bg-white/[0.04] px-3 py-2 shadow-float dark:shadow-none">
              <span className={cn("h-2.5 w-2.5 rounded-full", s.color)} />
              <div>
                <p className="font-heading text-lg font-bold text-uk-heading dark:text-white/90">{s.value}</p>
                <p className="text-[0.6rem] uppercase tracking-wider text-uk-muted dark:text-white/40">{s.label}</p>
              </div>
            </div>
          </AnimatedItem>
        ))}
      </div>
      {/* Order table */}
      <div key={`ot-${ck}`} className="flex-1 p-3 lg:p-4">
        <h3 className="font-heading text-xs font-semibold uppercase tracking-wider text-uk-muted dark:text-white/60 mb-2.5">Recent Orders</h3>
        {/* Header */}
        <div className="hidden sm:grid grid-cols-[1fr_1fr_0.8fr_0.8fr_0.7fr] gap-2 text-[0.65rem] uppercase tracking-wider text-uk-muted dark:text-white/40 px-2.5 pb-1.5">
          <span>Order</span><span>Customer</span><span>Amount</span><span>Status</span><span>Date</span>
        </div>
        <div className="flex flex-col gap-1.5">
          {data.orders.map((o, i) => (
            <AnimatedItem key={o.id} delay={i * 100 + 200}>
              <div className="grid grid-cols-2 sm:grid-cols-[1fr_1fr_0.8fr_0.8fr_0.7fr] gap-2 items-center rounded-lg bg-uk-surface/60 dark:bg-white/[0.03] px-2.5 py-2">
                <span className="text-[0.75rem] font-semibold text-uk-heading dark:text-white/90">{o.id}</span>
                <span className="text-[0.7rem] text-uk-body dark:text-white/70 truncate">{o.customer}</span>
                <span className="text-[0.7rem] font-semibold text-uk-heading dark:text-white/80">{o.amount}</span>
                <span className={cn("text-[0.7rem] font-semibold", o.statusColor)}>{o.status}</span>
                <span className="text-[0.65rem] text-uk-muted dark:text-white/40">{o.date}</span>
              </div>
            </AnimatedItem>
          ))}
        </div>
      </div>
    </>
  );
}

function ReportsView({ data, ck }: { data: typeof reportsScreen; ck: number }) {
  return (
    <>
      <div key={`rk-${ck}`} className="grid grid-cols-2 gap-2.5 border-b border-uk-line dark:border-white/[0.06] p-3 sm:grid-cols-4 lg:gap-3 lg:p-4">
        {data.kpis.map((k, i) => <KpiCard key={k.label} kpi={k} delay={i * 80} />)}
      </div>
      <div key={`rb-${ck}`} className="flex flex-1 flex-col gap-2.5 p-3 sm:flex-row lg:gap-3 lg:p-4">
        {/* Bar chart */}
        <div className="flex-1 rounded-lg border border-uk-line bg-white dark:border-white/[0.06] dark:bg-white/[0.04] p-3 shadow-float dark:shadow-none lg:p-4">
          <h3 className="font-heading text-xs font-semibold uppercase tracking-wider text-uk-muted dark:text-white/60 mb-3">Monthly Revenue</h3>
          <div className="flex items-end gap-2 h-[120px]">
            {data.bars.map((b, i) => (
              <AnimatedItem key={b.label} delay={i * 80 + 200}>
                <div className="flex flex-1 flex-col items-center gap-1">
                  <span className="text-[0.6rem] font-semibold text-uk-heading dark:text-white/70">{b.value}%</span>
                  <div className="w-full rounded-t bg-gradient-to-t from-uk-blue to-uk-blue-bright transition-all duration-700" style={{ height: `${b.value}%` }} />
                  <span className="text-[0.6rem] text-uk-muted dark:text-white/40">{b.label}</span>
                </div>
              </AnimatedItem>
            ))}
          </div>
        </div>
        {/* Donut */}
        <div className="flex-1 rounded-lg border border-uk-line bg-white dark:border-white/[0.06] dark:bg-white/[0.04] p-3 shadow-float dark:shadow-none lg:p-4">
          <h3 className="font-heading text-xs font-semibold uppercase tracking-wider text-uk-muted dark:text-white/60 mb-3">Revenue Split</h3>
          <div className="flex items-center gap-4">
            {/* Stacked bar as donut proxy */}
            <div className="flex flex-col gap-1.5 flex-1">
              {data.donut.map((d, i) => (
                <AnimatedItem key={d.label} delay={i * 100 + 300}>
                  <div className="flex items-center gap-2">
                    <span className={cn("h-3 w-3 rounded-sm flex-none", d.color)} />
                    <span className="text-[0.75rem] font-medium text-uk-heading dark:text-white/80 flex-1">{d.label}</span>
                    <span className="text-[0.75rem] font-semibold text-uk-body dark:text-white/60">{d.pct}%</span>
                  </div>
                </AnimatedItem>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function MarketingView({ data, ck }: { data: typeof marketingScreen; ck: number }) {
  return (
    <div key={`mc-${ck}`} className="flex-1 flex flex-col gap-2.5 p-3 lg:gap-3 lg:p-4">
      <h3 className="font-heading text-xs font-semibold uppercase tracking-wider text-uk-muted dark:text-white/60">Active Campaigns</h3>
      {data.campaigns.map((c, i) => (
        <AnimatedItem key={c.name} delay={i * 100 + 100}>
          <div className="rounded-lg border border-uk-line bg-white dark:border-white/[0.06] dark:bg-white/[0.04] p-3 shadow-float dark:shadow-none">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <p className="text-sm font-semibold text-uk-heading dark:text-white/90">{c.name}</p>
                <p className="text-[0.7rem] text-uk-muted dark:text-white/50">{c.channel}</p>
              </div>
              <span className={cn("rounded-full px-2 py-0.5 text-[0.6rem] font-semibold text-white flex-none", c.statusColor)}>{c.status}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 border-t border-uk-line dark:border-white/[0.06] pt-2">
              <div>
                <p className="text-[0.6rem] uppercase tracking-wider text-uk-muted dark:text-white/40">Spend</p>
                <p className="text-sm font-semibold text-uk-heading dark:text-white/90">{c.spend}</p>
              </div>
              <div>
                <p className="text-[0.6rem] uppercase tracking-wider text-uk-muted dark:text-white/40">Leads</p>
                <p className="text-sm font-semibold text-uk-heading dark:text-white/90">{c.leads}</p>
              </div>
              <div>
                <p className="text-[0.6rem] uppercase tracking-wider text-uk-muted dark:text-white/40">CPL</p>
                <p className="text-sm font-semibold text-uk-heading dark:text-white/90">{c.cpl}</p>
              </div>
            </div>
          </div>
        </AnimatedItem>
      ))}
    </div>
  );
}

function SecurityView({ data, ck }: { data: typeof securityScreen; ck: number }) {
  return (
    <>
      {/* Status cards */}
      <div key={`ss-${ck}`} className="grid grid-cols-2 gap-2.5 border-b border-uk-line dark:border-white/[0.06] p-3 lg:gap-3 lg:p-4">
        {data.statuses.map((s, i) => {
          const Icon = s.icon;
          return (
            <AnimatedItem key={s.label} delay={i * 100}>
              <div className="rounded-lg border border-uk-line bg-white dark:border-white/[0.06] dark:bg-white/[0.04] p-3 shadow-float dark:shadow-none">
                <div className="flex items-center gap-2 mb-1">
                  <Icon className={cn("h-4 w-4", s.color)} />
                  <span className="text-sm font-semibold text-uk-heading dark:text-white/90">{s.label}</span>
                </div>
                <p className="text-[0.7rem] text-uk-muted dark:text-white/50">{s.detail}</p>
              </div>
            </AnimatedItem>
          );
        })}
      </div>
      {/* Alerts */}
      <div key={`sa-${ck}`} className="flex-1 flex flex-col gap-2.5 p-3 lg:gap-3 lg:p-4">
        <h3 className="font-heading text-xs font-semibold uppercase tracking-wider text-uk-muted dark:text-white/60">Recent Alerts</h3>
        {data.alerts.map((a, i) => (
          <AnimatedItem key={a.msg} delay={i * 100 + 300}>
            <div className="flex items-start gap-2.5 rounded-lg border border-uk-line dark:border-white/[0.06] bg-white dark:bg-white/[0.04] p-3 shadow-float dark:shadow-none">
              <AlertTriangle className={cn("h-4 w-4 flex-none mt-0.5", a.severity === "high" ? "text-red-500" : a.severity === "low" ? "text-uk-yellow" : "text-uk-blue")} />
              <div className="flex-1 min-w-0">
                <p className="text-[0.75rem] font-medium text-uk-heading dark:text-white/80">{a.msg}</p>
                <p className="text-[0.65rem] text-uk-muted dark:text-white/40">{a.time}</p>
              </div>
            </div>
          </AnimatedItem>
        ))}
      </div>
    </>
  );
}

function SettingsView({ data, ck }: { data: typeof settingsScreen; ck: number }) {
  return (
    <>
      {/* Team summary */}
      <div key={`st-${ck}`} className="grid grid-cols-3 gap-2.5 border-b border-uk-line dark:border-white/[0.06] p-3 lg:gap-3 lg:p-4">
        <AnimatedItem delay={80}>
          <div className="rounded-lg border border-uk-line bg-white dark:border-white/[0.06] dark:bg-white/[0.04] p-2.5 shadow-float dark:shadow-none text-center lg:p-3">
            <p className="text-[0.65rem] uppercase tracking-wider text-uk-muted dark:text-white/40">Team</p>
            <p className="font-heading text-xl font-bold text-uk-heading dark:text-white/90">{data.team.total}</p>
            <p className="text-[0.6rem] text-emerald-600 dark:text-emerald-400">{data.team.active} active</p>
          </div>
        </AnimatedItem>
        <AnimatedItem delay={160}>
          <div className="rounded-lg border border-uk-line bg-white dark:border-white/[0.06] dark:bg-white/[0.04] p-2.5 shadow-float dark:shadow-none text-center lg:p-3">
            <p className="text-[0.65rem] uppercase tracking-wider text-uk-muted dark:text-white/40">API Calls</p>
            <p className="font-heading text-xl font-bold text-uk-heading dark:text-white/90">{data.usage.apiCalls}</p>
            <p className="text-[0.6rem] text-uk-muted dark:text-white/40">this month</p>
          </div>
        </AnimatedItem>
        <AnimatedItem delay={240}>
          <div className="rounded-lg border border-uk-line bg-white dark:border-white/[0.06] dark:bg-white/[0.04] p-2.5 shadow-float dark:shadow-none text-center lg:p-3">
            <p className="text-[0.65rem] uppercase tracking-wider text-uk-muted dark:text-white/40">Uptime</p>
            <p className="font-heading text-xl font-bold text-uk-heading dark:text-white/90">{data.usage.uptime}</p>
            <p className="text-[0.6rem] text-emerald-600 dark:text-emerald-400">30-day avg</p>
          </div>
        </AnimatedItem>
      </div>
      {/* Integrations */}
      <div key={`si-${ck}`} className="flex-1 flex flex-col gap-2.5 p-3 lg:gap-3 lg:p-4">
        <h3 className="font-heading text-xs font-semibold uppercase tracking-wider text-uk-muted dark:text-white/60">Integrations</h3>
        <p className="text-[0.7rem] text-uk-muted dark:text-white/40 -mt-1">{data.team.roles}</p>
        {data.integrations.map((ig, i) => {
          const Icon = ig.icon;
          return (
            <AnimatedItem key={ig.name} delay={i * 100 + 200}>
              <div className="flex items-center gap-3 rounded-lg border border-uk-line dark:border-white/[0.06] bg-white dark:bg-white/[0.04] p-3 shadow-float dark:shadow-none">
                <div className="flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-uk-blue/10 dark:bg-uk-blue/20">
                  <Icon className="h-4 w-4 text-uk-blue" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-uk-heading dark:text-white/90">{ig.name}</p>
                  <p className="text-[0.7rem] text-uk-muted dark:text-white/50">{ig.desc}</p>
                </div>
                <span className={cn("rounded-full px-2.5 py-1 text-[0.6rem] font-semibold", ig.connected ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-gray-500/10 text-gray-500 dark:text-gray-400")}>
                  {ig.connected ? "Connected" : "Setup"}
                </span>
              </div>
            </AnimatedItem>
          );
        })}
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════ */

export function DashboardShowcase() {
  const [activeTab, setActiveTab] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [contentKey, setContentKey] = useState(0);
  const screen = allScreens[activeTab];

  const handleTabClick = useCallback((i: number) => {
    if (i === activeTab) return;
    setActiveTab(i);
    setContentKey((k) => k + 1);
  }, [activeTab]);

  return (
    <div className="flex h-full w-full overflow-hidden rounded-xl bg-uk-surface-3 dark:bg-[#0d091c] lg:rounded-2xl">
      {/* ── Sidebar ── */}
      <div className={cn(
        "hidden sm:flex flex-col border-r border-uk-line dark:border-white/[0.06] bg-uk-surface dark:bg-[#0d091c] transition-all duration-300",
        sidebarOpen ? "w-[170px]" : "w-[52px] lg:w-[56px]"
      )}>
        <div className="flex h-12 items-center justify-between border-b border-uk-line dark:border-white/[0.06] px-3">
          <span className={cn("font-heading text-sm font-bold text-uk-blue transition-all duration-300 overflow-hidden", sidebarOpen ? "opacity-100 w-auto" : "opacity-0 w-0")}>Ukvalley</span>
          <button onClick={() => setSidebarOpen((o) => !o)} className="flex h-7 w-7 flex-none items-center justify-center rounded-md text-uk-muted hover:bg-uk-surface-2 hover:text-uk-heading dark:text-white/40 dark:hover:bg-white/[0.04] dark:hover:text-white/70 transition-colors" aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}>
            {sidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
          </button>
        </div>
        <div className="flex flex-1 flex-col gap-1 py-2 px-1.5">
          {sidebarItems.map((item, i) => {
            const Icon = item.icon;
            return (
              <button key={item.label} onClick={() => handleTabClick(i)} className={cn("flex items-center gap-2.5 rounded-lg transition-all duration-200", sidebarOpen ? "h-9 px-2.5" : "h-9 w-9 justify-center", i === activeTab ? "bg-uk-blue/12 text-uk-blue dark:bg-uk-blue/20" : "text-uk-muted hover:bg-uk-surface-2 dark:text-white/40 dark:hover:bg-white/[0.04] dark:hover:text-white/70")} aria-label={item.label}>
                <Icon className="h-[18px] w-[18px] flex-none" />
                <span className={cn("text-sm font-medium transition-all duration-300 whitespace-nowrap overflow-hidden", sidebarOpen ? "opacity-100" : "opacity-0 w-0")}>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar — stays fixed */}
        <div className="flex h-12 items-center justify-between border-b border-uk-line dark:border-white/[0.06] px-4 flex-none">
          <div className="flex items-center gap-2">
            <span className="font-heading text-sm font-semibold text-uk-heading dark:text-white/90">{screen.title}</span>
            <span className="rounded-full bg-uk-blue/12 px-2 py-0.5 text-[0.65rem] font-semibold text-uk-blue dark:bg-uk-blue/20">{screen.subtitle}</span>
          </div>
          {/* Decorative mock-up icons — not real controls, so not buttons */}
          <div className="flex items-center gap-3 text-uk-muted dark:text-white/30" aria-hidden>
            <Search className="h-4 w-4" />
            <span className="relative"><Bell className="h-4 w-4" /><span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-uk-yellow" /></span>
          </div>
        </div>

        {/* Scrollable content area — top bar and sidebar stay fixed.
            Desktop only: on phones this preview covers much of the screen,
            and an inner scroller swallowed swipes meant for the page. The
            mock-up is decorative there, so it simply clips. */}
        <div key={`screen-${contentKey}`} className="flex flex-1 flex-col overflow-hidden lg:overflow-y-auto lg:overscroll-contain">
          {screen.type === "dashboard" && <DashboardView data={screen as typeof dashboardScreen} ck={contentKey} />}
          {screen.type === "crm" && <CrmView data={screen as typeof crmScreen} ck={contentKey} />}
          {screen.type === "orders" && <OrdersView data={screen as typeof ordersScreen} ck={contentKey} />}
          {screen.type === "reports" && <ReportsView data={screen as typeof reportsScreen} ck={contentKey} />}
          {screen.type === "marketing" && <MarketingView data={screen as typeof marketingScreen} ck={contentKey} />}
          {screen.type === "security" && <SecurityView data={screen as typeof securityScreen} ck={contentKey} />}
          {screen.type === "settings" && <SettingsView data={screen as typeof settingsScreen} ck={contentKey} />}
        </div>
      </div>
    </div>
  );
}
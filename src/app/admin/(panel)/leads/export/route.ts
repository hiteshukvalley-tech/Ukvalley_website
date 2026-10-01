import { getSession } from "@/lib/admin-session";
import { hasDatabaseUrl } from "@/lib/db/client";
import { leadStatusLabel, listAllLeads } from "@/lib/leads-store";

export const dynamic = "force-dynamic";

// Spreadsheet apps run text starting with = + - @ as a formula. Prefix those
// so a hostile enquiry can't execute anything when an admin opens the export.
function cell(value: string): string {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${safe.replace(/"/g, '""')}"`;
}

export async function GET() {
  // The proxy already gates /admin, but a file download deserves its own check.
  if (!(await getSession())) {
    return new Response("Unauthorized", { status: 401 });
  }
  if (!hasDatabaseUrl()) {
    return new Response("Database is not connected.", { status: 503 });
  }

  let leads;
  try {
    leads = await listAllLeads();
  } catch (e) {
    return new Response(`Could not read leads: ${e instanceof Error ? e.message : "database error"}`, { status: 500 });
  }

  const header = ["Received (IST)", "Name", "Email", "Mobile", "Company", "Service", "Budget", "Message", "Source", "Status", "Note"];
  const rows = leads.map((l) =>
    [
      l.createdAt.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" }),
      l.name, l.email, l.phone, l.company, l.service, l.budget, l.message, l.source,
      leadStatusLabel[l.status], l.note,
    ].map(cell).join(",")
  );
  // BOM so Excel reads the ₹ and other non-ASCII characters correctly.
  const csv = "﻿" + [header.map(cell).join(","), ...rows].join("\r\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="ukvalley-leads-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}

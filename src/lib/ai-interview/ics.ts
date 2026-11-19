// A calendar file (.ics, RFC 5545) attached to the invitation emails, so the
// candidate can add the interview to any calendar even when Google Calendar
// isn't connected. Pure functions (unit-tested).

const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

/** Escapes text for an iCalendar value. */
export const icsEscape = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
/** A parameter value (CN=…): quoted, as names can hold ";", ":" or ","; quotes and line breaks can't appear in one. */
export const icsParam = (s: string) => `"${s.replace(/["\r\n]/g, " ").trim()}"`;
/** An address for mailto: without anything that could end the line or the property. */
export const icsMail = (s: string) => s.replace(/[^\w.!#$%&'*+/=?^`{|}~@-]/g, "");

/** Folds lines longer than 75 octets, as the format requires. */
function fold(line: string): string {
  const out: string[] = [];
  let rest = line;
  while (Buffer.byteLength(rest, "utf8") > 75) {
    let cut = 75;
    while (Buffer.byteLength(rest.slice(0, cut), "utf8") > 75) cut--;
    out.push(rest.slice(0, cut));
    rest = ` ${rest.slice(cut)}`;
  }
  out.push(rest);
  return out.join("\r\n");
}

export function buildIcs(e: {
  uid: string;
  /** increases with every change, so calendars replace the old event */
  sequence: number;
  method: "REQUEST" | "CANCEL";
  start: Date;
  end: Date;
  summary: string;
  description: string;
  url: string;
  organizer: { name: string; email: string };
  attendee: { name: string; email: string };
}): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "PRODID:-//Ukvalley//AI Interviews//EN",
    "VERSION:2.0",
    "CALSCALE:GREGORIAN",
    `METHOD:${e.method}`,
    "BEGIN:VEVENT",
    `UID:${e.uid}`,
    `SEQUENCE:${e.sequence}`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(e.start)}`,
    `DTEND:${stamp(e.end)}`,
    `SUMMARY:${icsEscape(e.summary)}`,
    `DESCRIPTION:${icsEscape(e.description)}`,
    `URL:${e.url}`,
    `ORGANIZER;CN=${icsParam(e.organizer.name)}:mailto:${icsMail(e.organizer.email)}`,
    `ATTENDEE;CN=${icsParam(e.attendee.name)};ROLE=REQ-PARTICIPANT;RSVP=FALSE:mailto:${icsMail(e.attendee.email)}`,
    `STATUS:${e.method === "CANCEL" ? "CANCELLED" : "CONFIRMED"}`,
    ...(e.method === "REQUEST"
      ? ["BEGIN:VALARM", "ACTION:DISPLAY", "DESCRIPTION:Interview reminder", "TRIGGER:-PT15M", "END:VALARM"]
      : []),
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.map(fold).join("\r\n") + "\r\n";
}

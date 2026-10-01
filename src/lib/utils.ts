import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Characters that must not appear raw inside an inline <script>: "<", ">",
// "&", and the U+2028 / U+2029 line separators.
const SCRIPT_UNSAFE = new Set([0x3c, 0x3e, 0x26, 0x2028, 0x2029])
const BACKSLASH = String.fromCharCode(0x5c)

/**
 * Serialise structured data for a <script type="application/ld+json"> tag.
 * JSON.stringify leaves "<" intact, so admin-entered text like "</script>"
 * would close the tag and inject HTML. Unsafe characters are written as JSON
 * unicode escapes, which parse back to the same text.
 */
export function jsonLd(data: unknown): string {
  let out = ""
  for (const ch of JSON.stringify(data) ?? "null") {
    const code = ch.charCodeAt(0)
    out += SCRIPT_UNSAFE.has(code) ? BACKSLASH + "u" + code.toString(16).padStart(4, "0") : ch
  }
  return out
}

// Runs once when the server starts. Loads the admin's text overrides
// (Admin → All page text) so pages render them, and keeps them fresh: a
// second instance, or an edit made elsewhere, shows up within 30 seconds.
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { refreshTexts } = await import("@/lib/texts-store");
  await refreshTexts();
  const timer = setInterval(() => void refreshTexts(), 30_000);
  timer.unref?.();
}

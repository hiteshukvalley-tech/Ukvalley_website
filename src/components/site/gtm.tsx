import { GTM_ID } from "@/lib/analytics";

export { GtmNoscript, GtmTracker } from "./gtm-client";

/** Without a scroll, tap or key press, GTM starts this long after the page has loaded. */
const GTM_DELAY_MS = 3500;

/**
 * Google Tag Manager, installed once in the root layout:
 *   <GtmScript />   first thing in <head>
 *   <GtmNoscript /> first thing in <body>
 *   <GtmTracker />  attribution cookie + a page_view on every route change
 * All three render nothing when NEXT_PUBLIC_GTM_ID is empty or tracking is off,
 * and GTM never loads on /admin (its URLs carry applicant emails) or /interview
 * (its URLs carry the candidate's private interview link).
 */
export function GtmScript() {
  if (!GTM_ID) return null;
  // Google's standard snippet plus the /admin guard, with one change: gtm.js
  // (~100 KB, plus the tags inside it: GA4 and the Meta Pixel cost ~2-3 s of
  // main-thread time on a phone) is fetched on the visitor's first scroll,
  // tap, click or key press, or GTM_DELAY_MS after the page has loaded,
  // whichever comes first, and then when the browser is idle. Loaded any
  // sooner, it ran while the page was still starting up and made the first
  // seconds feel stuck (Safari and phones most of all). dataLayer is created
  // at once, so events pushed before then (page_view, utm_captured,
  // form_submit) are queued and sent when GTM starts. A server component, so
  // the browser runs it straight from the HTML. GTM_ID is validated
  // (GTM-[A-Z0-9]) in lib/analytics, so it is safe to inline.
  const snippet = `window.dataLayer=window.dataLayer||[];if(!/^\\/(admin|interview)(\\/|$)/i.test(location.pathname)){(function(w,d,s,l,i){w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var done=false,ev=['scroll','pointerdown','keydown','touchstart','wheel'];var go=function(){if(done)return;done=true;ev.forEach(function(e){w.removeEventListener(e,soon,{passive:true})});var f=d.getElementsByTagName(s)[0],j=d.createElement(s);j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i;f.parentNode.insertBefore(j,f);};var soon=function(){(w.requestIdleCallback||function(c){setTimeout(c,1)})(go,{timeout:1500});};ev.forEach(function(e){w.addEventListener(e,soon,{passive:true,once:true})});var later=function(){setTimeout(soon,${GTM_DELAY_MS});};if(d.readyState==='complete')later();else w.addEventListener('load',later,{once:true});})(window,document,'script','dataLayer','${GTM_ID}');}`;
  return <script id="gtm-init" dangerouslySetInnerHTML={{ __html: snippet }} />;
}

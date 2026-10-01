import puppeteer from "puppeteer-core";
const base = process.env.BASE;
const b = await puppeteer.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: true });
const p = await b.newPage();
await p.setViewport({ width: 1366, height: 900 });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const clear = async (sel) => { await p.click(sel, { clickCount: 3 }); await p.keyboard.press("Backspace"); };
await p.goto(base + "/admin/login", { waitUntil: "networkidle0" });
await p.type("#email", process.env.ADMIN_EMAIL); await p.type("#password", process.env.ADMIN_PASSWORD);
await p.click("button[type=submit]"); await sleep(9000);
await p.goto(base + "/admin/settings", { waitUntil: "networkidle0" });
await p.screenshot({ path: ".shots/admin/settings.png" });
console.log("title:", await p.$eval("h1", (e) => e.textContent));

// 1) validation error
await clear("#f-email"); await p.type("#f-email", "not-an-email");
await p.click("button[type=submit]"); await sleep(3000);
console.log("validation ->", await p.$eval("[role=alert]", (e) => e.textContent));
await p.screenshot({ path: ".shots/admin/settings-error.png" });

// 2) real save
await clear("#f-email"); await p.type("#f-email", "hello@ukvalley.com");
await clear("#f-tagline"); await p.type("#f-tagline", "TEST tagline saved from admin");
await p.type("#f-social-twitter", "https://x.com/ukvalley");
await p.click("button[type=submit]"); await sleep(4000);
console.log("save ->", await p.$eval("[role=status]", (e) => e.textContent));
await p.screenshot({ path: ".shots/admin/settings-saved.png" });
console.log("reloaded tagline ->", await (async () => { await p.reload({ waitUntil: "networkidle0" }); return p.$eval("#f-tagline", (e) => e.value); })());

// 3) public site reflects it
await sleep(1500);
const contact = await b.newPage();
await contact.goto(base + "/contact", { waitUntil: "networkidle0" });
const html = await contact.content();
console.log("contact shows hello@ukvalley.com ->", html.includes("hello@ukvalley.com"));
console.log("footer has x.com link ->", html.includes("https://x.com/ukvalley"));

// 4) reset
p.on("dialog", (d) => d.accept());
await p.click("button[type=button]"); await sleep(4000);
console.log("reset ->", await p.$eval("[role=status]", (e) => e.textContent));
await sleep(1500);
await contact.reload({ waitUntil: "networkidle0" });
const html2 = await contact.content();
console.log("after reset x.com gone ->", !html2.includes("https://x.com/ukvalley"));
await b.close();

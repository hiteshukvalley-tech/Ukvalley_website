import puppeteer from "puppeteer-core";
const b = await puppeteer.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: true });
const p = await b.newPage();
await p.goto(process.env.BASE + "/admin/login", { waitUntil: "networkidle0" });
await p.type("#email", process.env.ADMIN_EMAIL); await p.type("#password", process.env.ADMIN_PASSWORD);
await p.click("button[type=submit]"); await new Promise(r => setTimeout(r, 10000));
const t = await p.evaluate(() => document.body.innerText);
console.log(t.slice(t.indexOf("System status"), t.indexOf("Admin roadmap")));
await b.close();

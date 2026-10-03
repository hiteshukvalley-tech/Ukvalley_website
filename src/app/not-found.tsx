import Link from "@/components/site/intent-link";
import { ArrowRight, Home, Compass } from "lucide-react";
import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { Container } from "@/components/site/container";
import { Reveal } from "@/components/site/reveal";
import { getServices } from "@/lib/services-store";
import { ukText } from "@/lib/texts";

export default async function NotFound() {
  const services = await getServices();
  return (
    <>
      <Header />
      <main id="main">
        <section className="relative overflow-hidden bg-uk-surface-blue pt-40 pb-16 lg:pt-48 lg:pb-20">
          <div
            className="page-hero-gradient absolute inset-0"
            aria-hidden
          />
          <div className="absolute inset-0 bg-grid bg-grid-fade opacity-70" aria-hidden />
          <div className="absolute -left-32 top-24 h-96 w-96 rounded-full bg-uk-blue/15 blur-[120px]" aria-hidden />

          <Container className="relative text-center">
            <Reveal className="mx-auto flex max-w-2xl flex-col items-center gap-6">
              <span className="font-heading text-7xl font-bold text-gradient-blue sm:text-8xl">{ukText("404")}</span>
              <h1 className="font-heading text-3xl font-bold text-uk-heading sm:text-4xl">{ukText("This page took a different route.")}</h1>
              <p className="text-lg text-uk-gray">{ukText("The page you're looking for moved, was renamed, or never existed. Here are a few places worth going instead.")}</p>
              <div className="mt-2 flex flex-col gap-3 sm:flex-row">
                <Link
                  href={ukText("/")}
                  className="btn-sheen btn-lift group inline-flex h-13 items-center gap-2 rounded-full bg-uk-blue px-7 font-heading text-base font-bold text-uk-white shadow-glow-blue-sm hover:bg-uk-blue-bright"
                >
                  <Home className="h-5 w-5" />{ukText("Back to home")}</Link>
                <Link
                  href={ukText("/contact")}
                  className="btn-lift inline-flex h-13 items-center gap-2 rounded-full border border-uk-line bg-white dark:bg-uk-card px-7 font-heading text-base font-semibold text-uk-heading backdrop-blur hover:bg-uk-surface-2"
                >{ukText("Talk to us")}<ArrowRight className="h-5 w-5" />
                </Link>
              </div>
            </Reveal>
          </Container>
        </section>

        <section className="relative bg-uk-surface section-py">
          <Container>
            <Reveal className="text-center">
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-uk-blue/30 bg-uk-blue/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-uk-blue">
                <Compass className="h-3.5 w-3.5" />{ukText("Try one of these")}</span>
              <h2 className="mt-5 font-heading text-2xl font-bold text-uk-heading sm:text-3xl">{ukText("Where you probably meant to go")}</h2>
            </Reveal>
            <Reveal staggerChildren className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {services.slice(0, 4).map((s) => (
                <Link
                  key={s.href}
                  href={ukText(s.href)}
                  className="group rounded-2xl border border-uk-line bg-uk-card p-5 transition-all duration-300 hover:-translate-y-1 hover:border-uk-blue/40"
                >
                  <h3 className="font-heading text-base font-bold text-uk-heading">{ukText(s.title)}</h3>
                  <p className="mt-1 text-sm text-uk-gray line-clamp-2">{ukText(s.blurb)}</p>
                  <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-uk-blue opacity-0 transition-opacity group-hover:opacity-100">{ukText("View ")}<ArrowRight className="h-3 w-3" />
                  </span>
                </Link>
              ))}
            </Reveal>
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}
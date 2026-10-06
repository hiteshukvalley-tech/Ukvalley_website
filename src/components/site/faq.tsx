import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { SectionHeading } from "./section-heading";
import { Reveal } from "./reveal";
import { Marked } from "./marked";
import { getFaqs } from "@/lib/faqs-store";
import type { HomeContent } from "@/lib/home-defaults";
import { ukText } from "@/lib/texts";

/** Questions come from Admin → FAQs; heading from Admin → Home page → FAQ. */
export async function Faq({ content: c }: { content: HomeContent["faq"] }) {
  const faqs = await getFaqs();
  return (
    <section id="faq" className="relative bg-uk-surface section-py">
      <div className="relative mx-auto max-w-5xl px-5 lg:px-8">
        <SectionHeading
          align="center"
          eyebrow={ukText(c.eyebrow)}
          title={<Marked text={ukText(c.title)} />}
          description={ukText(c.description || undefined)}
        />

        <Reveal className="mt-12">
          <Accordion
            multiple={false}
            defaultValue={["item-0"]}
            // Keep collapsed answers in the DOM (hidden) so every question's
            // button can point at its panel via aria-controls — Base UI only
            // sets it on the open one, so the ids are wired up explicitly.
            keepMounted
            className="flex flex-col gap-3"
          >
            {faqs.map((f, i) => (
              <AccordionItem
                key={f.q}
                value={`item-${i}`}
                className="overflow-hidden rounded-2xl border border-uk-line bg-uk-card px-5 transition-colors hover:border-uk-blue/40 data-open:border-uk-blue/40"
              >
                <AccordionTrigger
                  aria-controls={`faq-panel-${i}`}
                  className="py-5 text-left font-heading text-base font-semibold text-uk-heading hover:no-underline"
                >
                  {ukText(f.q)}
                </AccordionTrigger>
                <AccordionContent
                  id={`faq-panel-${i}`}
                  className="pb-5 text-sm leading-relaxed text-uk-gray"
                >
                  {ukText(f.a)}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Reveal>
      </div>
    </section>
  );
}
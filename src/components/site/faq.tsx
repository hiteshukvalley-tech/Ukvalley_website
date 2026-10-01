import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { SectionHeading } from "./section-heading";
import { Reveal } from "./reveal";
import { getFaqs } from "@/lib/faqs-store";

export async function Faq() {
  const faqs = await getFaqs();
  return (
    <section id="faq" className="relative bg-uk-surface section-py">
      <div className="relative mx-auto max-w-5xl px-5 lg:px-8">
        <SectionHeading
          align="center"
          eyebrow="FAQ"
          title={
            <>
              Questions buyers{" "}
              <span className="text-uk-blue">actually ask.</span>
            </>
          }
          description="Straight answers on IP, pricing, speed and what happens when things go wrong."
        />

        <Reveal className="mt-12">
          <Accordion
            multiple={false}
            defaultValue={["item-0"]}
            className="flex flex-col gap-3"
          >
            {faqs.map((f, i) => (
              <AccordionItem
                key={f.q}
                value={`item-${i}`}
                className="overflow-hidden rounded-2xl border border-uk-line bg-uk-card px-5 transition-colors hover:border-uk-blue/40 data-[state=open]:border-uk-blue/40"
              >
                <AccordionTrigger className="py-5 text-left font-heading text-base font-semibold text-uk-heading hover:no-underline">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="pb-5 text-sm leading-relaxed text-uk-gray">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Reveal>
      </div>
    </section>
  );
}
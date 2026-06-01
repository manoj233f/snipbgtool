import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  { q: "What image formats are supported?", a: "JPG, PNG, and WEBP. We recommend PNG for highest quality, but everything is exported as a PNG." },
  { q: "Is there a file size limit?", a: "There's no hard limit, but extremely large images (over ~25MP) may be slow since processing runs in your browser." },
  { q: "Are my images stored on your servers?", a: "No. snipbgtool runs the AI model locally in your browser. Your images never leave your device." },
  { q: "Can I process multiple images at once?", a: "Yes. Drop in as many as you like and click \u201CGenerate\u201D. You can download the results individually or as a ZIP." },
  { q: "What does \u201CIsolated\u201D mode do differently?", a: "Isolated places the cutout subject onto a clean, neutral (white by default) background — perfect for product shots and catalog-style images." },
];

export function FAQ() {
  return (
    <section id="faq" className="py-24 bg-white">
      <div className="mx-auto max-w-3xl px-6">
        <div className="text-center">
          <p className="text-sm font-semibold text-brand-teal uppercase tracking-wider">FAQ</p>
          <h2 className="mt-3 text-4xl md:text-5xl font-bold text-brand-dark tracking-tight">
            Questions, answered.
          </h2>
        </div>
        <Accordion type="single" collapsible className="mt-10 space-y-3">
          {faqs.map((f, i) => (
            <AccordionItem
              key={i}
              value={`item-${i}`}
              className="rounded-2xl bg-brand-cream border border-brand-light/60 px-5 data-[state=open]:bg-white data-[state=open]:shadow-card transition"
            >
              <AccordionTrigger className="text-left font-semibold text-brand-dark hover:no-underline py-5">
                {f.q}
              </AccordionTrigger>
              <AccordionContent className="text-brand-dark/70 leading-relaxed pb-5">
                {f.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
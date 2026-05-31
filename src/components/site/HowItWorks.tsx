import { Upload, Settings2, Download } from "lucide-react";

const steps = [
  {
    icon: Upload,
    title: "Upload your image",
    desc: "Drag-and-drop or browse. JPG, PNG, or WEBP — single file or batch.",
  },
  {
    icon: Settings2,
    title: "Choose your output",
    desc: "Transparent PNG, crisp cutout, or subject isolated on a clean background.",
  },
  {
    icon: Download,
    title: "Download your result",
    desc: "Get a high-quality PNG in seconds. Batch? Download all as a ZIP.",
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="py-24 bg-brand-cream">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-sm font-semibold text-brand-teal uppercase tracking-wider">How it works</p>
          <h2 className="mt-3 text-4xl md:text-5xl font-bold text-brand-dark tracking-tight">
            Three steps. Zero friction.
          </h2>
        </div>
        <div className="mt-14 grid md:grid-cols-3 gap-6">
          {steps.map((s, i) => (
            <div
              key={s.title}
              className="relative rounded-2xl bg-white p-7 shadow-card hover:shadow-card-hover transition-all duration-200 hover:-translate-y-1"
            >
              <span className="absolute top-5 right-6 text-7xl font-extrabold text-brand-light/60 leading-none">
                {i + 1}
              </span>
              <div className="w-12 h-12 rounded-xl bg-brand-light/60 text-brand-teal grid place-items-center">
                <s.icon className="w-6 h-6" />
              </div>
              <h3 className="mt-5 text-xl font-bold text-brand-dark">{s.title}</h3>
              <p className="mt-2 text-brand-dark/70 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
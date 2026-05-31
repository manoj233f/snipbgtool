import { Zap, Sparkles, Layers, Palette, Download, Lock } from "lucide-react";

const features = [
  { Icon: Zap, title: "Instant processing", desc: "AI cutouts in seconds, right in your browser." },
  { Icon: Sparkles, title: "High-quality edges", desc: "Smooth, accurate edges — even on hair and fur." },
  { Icon: Layers, title: "Batch upload", desc: "Process dozens of images and download as ZIP." },
  { Icon: Palette, title: "Custom backgrounds", desc: "Drop in a solid color or your own image." },
  { Icon: Download, title: "Free PNG downloads", desc: "No watermarks. No sign-up. No limits." },
  { Icon: Lock, title: "Fully private", desc: "Everything runs locally. We never see your files." },
];

export function Features() {
  return (
    <section id="features" className="py-24 bg-brand-cream">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-sm font-semibold text-brand-teal uppercase tracking-wider">Why Crispr</p>
          <h2 className="mt-3 text-4xl md:text-5xl font-bold text-brand-dark tracking-tight">
            Built to feel effortless.
          </h2>
        </div>
        <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl bg-white p-6 shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-200"
            >
              <div className="w-11 h-11 rounded-xl bg-brand-light/60 text-brand-teal grid place-items-center">
                <f.Icon className="w-5 h-5" />
              </div>
              <h3 className="mt-4 font-bold text-brand-dark text-lg">{f.title}</h3>
              <p className="mt-1.5 text-brand-dark/70 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
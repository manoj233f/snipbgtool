import { ArrowRight, Sparkles } from "lucide-react";

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden bg-hero">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-32 -left-32 w-[480px] h-[480px] rounded-full bg-[#C8D9E6] opacity-40 blur-3xl animate-pulse" />
        <div className="absolute top-40 -right-20 w-[420px] h-[420px] rounded-full bg-[#567C8D] opacity-20 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 pt-20 pb-24 md:pt-28 md:pb-32 text-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-white/70 backdrop-blur px-4 py-1.5 text-xs font-medium text-brand-teal border border-[rgba(86,124,141,0.2)]">
          <Sparkles className="w-3.5 h-3.5" /> Runs 100% in your browser — your images stay private
        </span>
        <h1 className="mt-6 text-5xl md:text-7xl font-extrabold tracking-tight text-brand-dark leading-[1.05]">
          Remove Backgrounds
          <br />
          <span className="text-brand-teal">Instantly.</span>
        </h1>
        <p className="mt-6 mx-auto max-w-2xl text-lg text-brand-dark/70">
          Upload your image and get a clean, transparent cutout in seconds. No sign-up, no watermarks, no servers.
        </p>
        <div className="mt-9 flex items-center justify-center gap-3 flex-wrap">
          <a
            href="#tool"
            className="group inline-flex items-center gap-2 rounded-xl bg-brand-teal text-white px-7 py-4 text-base font-semibold shadow-card hover:shadow-card-hover hover:brightness-110 transition-all duration-200"
          >
            Get Started — It's Free
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </a>
          <a
            href="#how"
            className="inline-flex items-center rounded-xl bg-white text-brand-dark px-7 py-4 text-base font-semibold border border-[rgba(47,65,86,0.12)] hover:bg-brand-light/50 transition"
          >
            See how it works
          </a>
        </div>

      </div>
    </section>
  );
}

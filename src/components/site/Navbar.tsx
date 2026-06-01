import { Scissors } from "lucide-react";

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-[rgba(245,239,235,0.75)] border-b border-[rgba(47,65,86,0.08)]">
      <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
        <a href="#top" className="flex items-center gap-2 text-brand-dark font-bold text-lg tracking-tight">
          <span className="w-9 h-9 rounded-xl bg-brand-dark text-white grid place-items-center">
            <Scissors className="w-4 h-4" />
          </span>
          snipbgtool
        </a>
        <nav className="hidden md:flex items-center gap-8 text-sm text-brand-dark/80">
          <a href="#tool" className="hover:text-brand-dark transition-colors">Tool</a>
          <a href="#how" className="hover:text-brand-dark transition-colors">How it works</a>
          <a href="#faq" className="hover:text-brand-dark transition-colors">FAQ</a>
        </nav>
        <a
          href="#tool"
          className="inline-flex items-center rounded-xl bg-brand-teal text-white px-4 py-2 text-sm font-medium hover:brightness-110 transition"
        >
          Try it free
        </a>
      </div>
    </header>
  );
}
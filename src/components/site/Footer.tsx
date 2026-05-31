import { Scissors } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-brand-dark text-white">
      <div className="mx-auto max-w-7xl px-6 py-14">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div>
            <div className="flex items-center gap-2 font-bold text-xl">
              <span className="w-9 h-9 rounded-xl bg-brand-teal grid place-items-center">
                <Scissors className="w-4 h-4" />
              </span>
              Crispr
            </div>
            <p className="mt-3 text-[color:var(--brand-light)] max-w-md">
              Crisp cutouts. Zero clutter.
            </p>
          </div>
          <nav className="flex flex-wrap gap-x-8 gap-y-2 text-sm text-[color:var(--brand-light)]">
            <a href="#" className="hover:text-white transition">About</a>
            <a href="#" className="hover:text-white transition">Privacy Policy</a>
            <a href="#" className="hover:text-white transition">Contact</a>
            <a href="#faq" className="hover:text-white transition">FAQ</a>
          </nav>
        </div>
        <div className="mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row justify-between text-xs text-[color:var(--brand-light)]/80 gap-2">
          <span>© {new Date().getFullYear()} Crispr. All rights reserved.</span>
          <span>Made with care — processed entirely in your browser.</span>
        </div>
      </div>
    </footer>
  );
}
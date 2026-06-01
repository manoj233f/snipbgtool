import logoAsset from "@/assets/snipbgtool-logo.png.asset.json";

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-[rgba(245,239,235,0.75)] border-b border-[rgba(47,65,86,0.08)]">
      <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
        <a href="#top" className="flex items-center gap-2 text-brand-dark font-bold text-lg tracking-tight">
          <img src={logoAsset.url} alt="snipbgtool logo" className="w-9 h-9 rounded-xl object-contain" />
          snipbgtool
        </a>
        <nav className="hidden md:flex items-center gap-8 text-sm text-brand-dark/80">
          <a href="#tool" className="hover:text-brand-dark transition-colors">Tool</a>
          <a href="#how" className="hover:text-brand-dark transition-colors">How it works</a>
          <a href="#faq" className="hover:text-brand-dark transition-colors">FAQ</a>
        </nav>
      </div>
    </header>
  );
}
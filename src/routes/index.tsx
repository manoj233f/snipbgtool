import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/site/Navbar";
import { Hero } from "@/components/site/Hero";
import { HowItWorks } from "@/components/site/HowItWorks";
import { Tool } from "@/components/site/Tool";
import { Features } from "@/components/site/Features";
import { FAQ } from "@/components/site/FAQ";
import { Footer } from "@/components/site/Footer";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Crispr — Remove Backgrounds Instantly" },
      { name: "description", content: "Upload an image and get a clean, transparent cutout in seconds. Free, private, runs entirely in your browser." },
      { property: "og:title", content: "Crispr — Remove Backgrounds Instantly" },
      { property: "og:description", content: "Free, private, AI-powered background removal." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <Hero />
        <HowItWorks />
        <Tool />
        <Features />
        <FAQ />
      </main>
      <Footer />
    </div>
  );
}

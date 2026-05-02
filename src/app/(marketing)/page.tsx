import Hero from "@/components/marketing/Hero";
import HowItWorks from "@/components/marketing/HowItWorks";
import Features from "@/components/marketing/Features";
import Cases from "@/components/marketing/Cases";
import Pricing from "@/components/marketing/Pricing";
import Link from "next/link";
import { ArrowRight, Phone } from "lucide-react";

export default function HomePage() {
  return (
    <>
      <Hero />
      <HowItWorks />
      <Features />
      <Cases />
      <Pricing />

      {/* CTA sectie */}
      <section className="py-24 bg-navy-700 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -right-20 w-96 h-96 bg-gold-500/8 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-navy-500/30 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-3xl mx-auto text-center px-4">
          <span className="text-gold-400 font-semibold text-sm uppercase tracking-widest mb-4 block">
            Klaar voor de volgende stap?
          </span>
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-5 leading-tight">
            Uw data werkt voor u.<br />
            <span className="text-gold-400">Niet andersom.</span>
          </h2>
          <p className="text-navy-200 text-lg mb-10 leading-relaxed">
            Vraag een gratis demo aan. Wij laten u zien hoe uw dashboard
            eruitziet — op basis van uw eigen cijfers. Geen verplichtingen.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/contact"
              className="btn-primary inline-flex items-center gap-2 text-lg px-8 py-4 shadow-lg shadow-gold-500/20"
            >
              Gratis demo aanvragen
              <ArrowRight size={20} />
            </Link>
            <Link
              href="tel:+31612345678"
              className="inline-flex items-center gap-2 text-white border border-white/30 hover:bg-white/10 transition-colors rounded-xl text-lg px-8 py-4 font-semibold"
            >
              <Phone size={18} />
              Bel direct
            </Link>
          </div>
          <p className="text-navy-400 text-sm mt-6">
            Binnen 48 uur live · Geen technische kennis nodig · Opzegging altijd mogelijk
          </p>
        </div>
      </section>
    </>
  );
}

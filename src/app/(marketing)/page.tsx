import Hero from "@/components/marketing/Hero";
import Features from "@/components/marketing/Features";
import Cases from "@/components/marketing/Cases";
import Pricing from "@/components/marketing/Pricing";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function HomePage() {
  return (
    <>
      <Hero />
      <Features />
      <Cases />
      <Pricing />

      {/* CTA sectie */}
      <section className="py-24 bg-navy-700">
        <div className="max-w-3xl mx-auto text-center px-4">
          <h2 className="text-4xl font-bold text-white mb-4">
            Klaar om datagedreven te sturen?
          </h2>
          <p className="text-navy-200 text-lg mb-8">
            Vraag een gratis demo aan. Binnen 48 uur nemen wij contact met u op
            voor een kennismaking op maat.
          </p>
          <Link href="/contact" className="btn-primary inline-flex items-center gap-2 text-lg px-8 py-4">
            Gratis demo aanvragen
            <ArrowRight size={20} />
          </Link>
        </div>
      </section>
    </>
  );
}

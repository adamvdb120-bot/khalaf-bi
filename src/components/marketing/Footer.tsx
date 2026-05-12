import Link from "next/link";
import { Linkedin, Mail, Phone } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-navy-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-4 gap-10 mb-12">
          {/* Branding */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gold-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">K</span>
              </div>
              <div>
                <div className="font-bold text-white text-lg leading-none">KHALAF BI</div>
                <div className="text-gold-400 text-[10px] font-medium tracking-widest uppercase leading-none">
                  Driven by data
                </div>
              </div>
            </div>
            <p className="text-navy-300 text-sm leading-relaxed max-w-xs">
              Geïntegreerde BI-oplossingen voor MKB-ondernemers. Jouw data
              bestaat al. Wij maken het zichtbaar.
            </p>
            <div className="flex gap-3 mt-5">
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 bg-navy-700 hover:bg-gold-500 rounded-lg flex items-center justify-center transition-colors"
              >
                <Linkedin size={16} />
              </a>
              <a
                href="mailto:info@khalafbi.nl"
                className="w-9 h-9 bg-navy-700 hover:bg-gold-500 rounded-lg flex items-center justify-center transition-colors"
              >
                <Mail size={16} />
              </a>
              <a
                href="tel:+31612345678"
                className="w-9 h-9 bg-navy-700 hover:bg-gold-500 rounded-lg flex items-center justify-center transition-colors"
              >
                <Phone size={16} />
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold text-white mb-4">Navigatie</h4>
            <ul className="space-y-2 text-sm text-navy-300">
              {[
                { href: "/", label: "Home" },
                { href: "/diensten", label: "Diensten" },
                { href: "/klanten", label: "Klanten" },
                { href: "/over-ons", label: "Over ons" },
                { href: "/contact", label: "Contact" },
                { href: "/login", label: "Klantportaal" },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="hover:text-gold-400 transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-white mb-4">Contact</h4>
            <ul className="space-y-2 text-sm text-navy-300">
              <li>info@khalafbi.nl</li>
              <li>+31 6 12 34 56 78</li>
              <li>KvK: 00000000</li>
              <li className="pt-2">
                <Link
                  href="/contact"
                  className="inline-block bg-gold-500 hover:bg-gold-400 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
                >
                  Demo aanvragen
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-navy-700 pt-6 flex flex-col md:flex-row items-center justify-between gap-2 text-xs text-navy-400">
          <span>© {new Date().getFullYear()} Khalaf BI – In Business! Eenmanszaak</span>
          <span>Alle rechten voorbehouden</span>
        </div>
      </div>
    </footer>
  );
}

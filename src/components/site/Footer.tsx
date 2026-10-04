import { Link } from "@tanstack/react-router";
import { MapPin, Mail, MessageCircle } from "lucide-react";
import logoAsset from "@/assets/buruj-logo.png.asset.json";
import { SITE, waLink } from "@/lib/site";

export function Footer() {
  return (
    <footer className="bg-navy text-navy-foreground">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-3">
            <img src={logoAsset.url} alt="Buruj Sports Academy" className="h-16 w-auto rounded bg-white/95 px-3 py-2" />
          </div>
          <p className="mt-4 max-w-md text-navy-foreground/70">
            Elite football development and residential Play & Study in Ikorodu, Lagos — shaping disciplined athletes and scholars since 2013.
          </p>
        </div>
        <div>
          <p className="font-display text-lg font-bold uppercase text-gold">Explore</p>
          <ul className="mt-3 space-y-2 text-navy-foreground/80">
            <li><Link to="/about" className="hover:text-gold">About the academy</Link></li>
            <li><Link to="/admissions" className="hover:text-gold">Admissions & trials</Link></li>
            <li><Link to="/gallery" className="hover:text-gold">Media & news</Link></li>
            <li><Link to="/contact" className="hover:text-gold">Contact & campus</Link></li>
          </ul>
        </div>
        <div>
          <p className="font-display text-lg font-bold uppercase text-gold">Campus</p>
          <ul className="mt-3 space-y-3 text-navy-foreground/80">
            <li className="flex gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-sky" />{SITE.address}</li>
            <li className="flex gap-2"><MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-sky" /><a href={waLink()} target="_blank" rel="noreferrer" className="hover:text-gold">Chat on WhatsApp</a></li>
            <li className="flex gap-2"><Mail className="mt-0.5 h-4 w-4 shrink-0 text-sky" /><a href={`mailto:${SITE.email}`} className="hover:text-gold">{SITE.email}</a></li>
            <li className="flex gap-4 pt-1">
              <a href={SITE.facebook} target="_blank" rel="noreferrer" className="hover:text-gold">Facebook</a>
              <a href={SITE.instagram} target="_blank" rel="noreferrer" className="hover:text-gold">Instagram</a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-navy-foreground/10 py-5 text-center text-sm text-navy-foreground/60">
        © {new Date().getFullYear()} Buruj FC & Sports Academy. All rights reserved.
      </div>
    </footer>
  );
}

import { Link } from "@tanstack/react-router";
import { MapPin, Mail, MessageCircle } from "lucide-react";
import logoAssetSrc from "@/assets/buruj-logo-full.jpeg";
const logoAsset = { url: logoAssetSrc };
import { SITE } from "@/lib/site";
import { useSiteSettings, waLinkFor } from "@/lib/use-site-settings";

export function Footer() {
  const s = useSiteSettings();
  const socials = [["Facebook", s.facebook], ["Instagram", s.instagram], ["TikTok", s.tiktok], ["X", s.x_url], ["YouTube", s.youtube]].filter(([, u]) => u) as [string, string][];
  return (
    <footer style={{ backgroundColor: s.footer_bg, color: s.footer_fg }}>
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-3">
            <img src={logoAsset.url} alt="Buruj Sports Academy" className="h-16 w-auto object-contain" />
          </div>
          <p className="mt-4 max-w-md opacity-75">
            Elite football development and residential Play & Study in Ikorodu, Lagos — shaping disciplined athletes and scholars since 2013.
          </p>
        </div>
        <div>
          <p className="font-display text-lg font-bold uppercase text-gold">Explore</p>
          <ul className="mt-3 space-y-2 opacity-85">
            <li><Link to="/about" className="hover:text-gold">About the academy</Link></li>
            <li><Link to="/admissions" className="hover:text-gold">Admissions & trials</Link></li>
            <li><Link to="/programmes" className="hover:text-gold">Programmes</Link></li>
            <li><Link to="/news" className="hover:text-gold">News</Link></li>
            <li><Link to="/gallery" className="hover:text-gold">Media gallery</Link></li>
            <li><Link to="/contact" className="hover:text-gold">Contact & campus</Link></li>
            <li><Link to="/privacy-policy" className="hover:text-gold">Privacy policy</Link></li>
          </ul>
        </div>
        <div>
          <p className="font-display text-lg font-bold uppercase text-gold">Campus</p>
          <ul className="mt-3 space-y-3 opacity-85">
            <li className="flex gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-sky" />{SITE.address}</li>
            <li className="flex gap-2"><MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-sky" /><a href={waLinkFor(s.whatsapp)} target="_blank" rel="noreferrer" className="hover:text-gold">Chat on WhatsApp</a></li>
            <li className="flex gap-2"><Mail className="mt-0.5 h-4 w-4 shrink-0 text-sky" /><a href={`mailto:${s.email}`} className="hover:text-gold">{s.email}</a></li>
            {s.phone && <li className="flex gap-2"><MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-sky" /><a href={`tel:${s.phone}`} className="hover:text-gold">{s.phone}</a></li>}
            <li className="flex gap-4 pt-1">
              {socials.map(([label, url]) => <a key={label} href={url} target="_blank" rel="noreferrer" className="hover:text-gold">{label}</a>)}
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-current/10 py-5 text-center text-sm opacity-70">
        © {new Date().getFullYear()} Buruj FC & Sports Academy. All rights reserved.
      </div>
    </footer>
  );
}

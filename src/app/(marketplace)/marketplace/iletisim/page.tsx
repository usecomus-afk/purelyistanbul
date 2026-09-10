import { LegalPageShell } from "@/components/marketplace/LegalPageShell";
import { Phone, Mail, Clock, MapPin, ShieldAlert } from "lucide-react";

const CHANNELS = [
  { icon: Phone, label: "Canlı Destek & WhatsApp", value: "+90 (212) [İletişim Numarası] / WhatsApp Destek Hattı" },
  { icon: Mail, label: "E-posta", value: "destek@purelyistanbul.com" },
  { icon: Clock, label: "Çalışma Saatleri", value: "Haftanın 7 günü, 08:30 – 23:00 (GMT+3)" },
  { icon: MapPin, label: "Yerel İrtibat", value: "Beyoğlu, İstanbul" },
  { icon: ShieldAlert, label: "Mağduriyet Bildirim Masası", value: "Fahiş fiyat veya esnaf şikayetleri için: kalkan@purelyistanbul.com" },
];

export default function IletisimPage() {
  return (
    <LegalPageShell
      eyebrow="Destek"
      title="Müşteri Hizmetleriyle İletişime Geçin"
      intro="İstanbul'daki seyahatinizin her adımında yanınızdayız. comus AI yapay zeka rehberinizin yanı sıra kenti sokak sokak bilen yerel operasyon ekibimize anında ulaşabilirsiniz."
    >
      <ul className="!mt-0 space-y-5">
        {CHANNELS.map(({ icon: Icon, label, value }) => (
          <li key={label} className="!pl-0 flex items-start gap-4 before:content-none">
            <span className="w-9 h-9 rounded-full border border-sand-border bg-white flex items-center justify-center shrink-0">
              <Icon className="w-4 h-4 text-terracotta" strokeWidth={1.75} />
            </span>
            <span>
              <span className="block text-[13px] font-semibold text-ink">{label}</span>
              <span className="block text-ink-muted">{value}</span>
            </span>
          </li>
        ))}
      </ul>
    </LegalPageShell>
  );
}

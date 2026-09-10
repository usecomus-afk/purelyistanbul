import { LegalPageShell } from "@/components/marketplace/LegalPageShell";

export default function CalismaSeklimizPage() {
  return (
    <LegalPageShell eyebrow="Şartlar ve Ayarlar" title="Çalışma Şeklimiz">
      <p className="text-ink-muted">
        purelyistanbul.com, global seyahat portallarının algoritmaya dayalı, komisyonu en yüksek
        vereni öne çıkaran yapısını reddeder; tamamen İstanbul'a adanmış, küratörlü bir seçki
        sunar.
      </p>

      <section>
        <h2>10 Kategoride Doğrulanmış Seçki</h2>
        <p>
          Platformda yer alan hamamlardan restoranlara, fotoğraf atölyelerinden VIP transfer
          sağlayıcılarına kadar her işletme yerinde denetlenir, fiyat/hizmet dengesi ve esnaf
          etiği onaylandıktan sonra listelenir.
        </p>
      </section>

      <section>
        <h2>comus AI Akıllı Asistanı</h2>
        <p>
          purelyistanbul.com ile çalışan host'ların evlerinde ve anlaşmalı butik otellerde
          konaklayan misafirlerimiz, sadece İstanbul için eğitilmiş comus AI ile kendi ana
          dillerinde 7/24 konuşabilir. Misafirler, dilerlerse "Beni Tanı" butonundaki seyahat
          tarzı, bütçe, özel ilgi alanları ve sağlık/alerji notlarını doldurarak tamamen
          kendilerine özel rota, güvenli restoran ve nokta atışı mekan tavsiyeleri alırlar.
        </p>
      </section>

      <section>
        <h2>Objektif Sıralama</h2>
        <p>
          purelyistanbul.com üzerindeki öneri ve listelemeler reklam bütçelerine göre değil,
          gerçek misafir deneyimlerine, puanlamalara ve güvenlik karnelerine göre şekillenir.
        </p>
      </section>
    </LegalPageShell>
  );
}

"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Calendar,
  Clock,
  Users,
  Lock,
  PlusCircle,
  RefreshCw,
  X,
  ExternalLink,
  Copy,
  AlertTriangle,
  CheckCircle2,
  Ban,
  ShieldCheck,
} from "lucide-react";
import type { Experience } from "@/lib/types";
import type { ListingSlot } from "@/types/inventory";
import { authFetch } from "@/lib/auth-fetch";

interface ListingSlotManagerProps {
  experience: Experience;
  onClose: () => void;
}

export function ListingSlotManager({ experience, onClose }: ListingSlotManagerProps) {
  const [slots, setSlots] = useState<ListingSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"slots" | "bulk" | "channels">("slots");

  // Bulk generator state
  const [bulkStartDate, setBulkStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [bulkDays, setBulkDays] = useState(7);
  const [bulkTimes, setBulkTimes] = useState("10:00, 14:00, 18:00");
  const [bulkCapacity, setBulkCapacity] = useState(experience.capacity || 10);
  const [isGenerating, setIsGenerating] = useState(false);

  // External iCal sync state
  const [externalIcalUrl, setExternalIcalUrl] = useState("");
  const [isSyncingIcal, setIsSyncingIcal] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<any>(null);

  const fetchSlots = async () => {
    setLoading(true);
    try {
      const res = await authFetch(`/api/admin/inventory/slots?listingId=${encodeURIComponent(experience.id)}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.slots)) {
        setSlots(data.slots);
      } else {
        setSlots([]);
      }
    } catch (e: any) {
      toast.error("Seanslar yüklenemedi: " + (e.message || "Bilinmeyen hata"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlots();
  }, [experience.id]);

  const handleToggleSlotStatus = async (slot: ListingSlot) => {
    const newStatus = slot.status === "closed" ? "open" : "closed";
    const closedReason = newStatus === "closed" ? "Yönetici tarafından kapatıldı / Özel Tahsis" : undefined;

    try {
      const res = await authFetch("/api/admin/inventory/slots", {
        method: "PATCH",
        body: JSON.stringify({
          slotId: slot.slot_id,
          status: newStatus,
          closedReason,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Güncelleme başarısız");

      toast.success(newStatus === "closed" ? "Seans kapatıldı (satışa kapalı)." : "Seans yeniden açıldı.");
      setSlots((prev) =>
        prev.map((s) =>
          s.slot_id === slot.slot_id
            ? { ...s, status: newStatus, closed_reason: closedReason, available_spots: newStatus === "closed" ? 0 : s.capacity - s.booked_count }
            : s
        )
      );
    } catch (e: any) {
      toast.error(e.message || "İşlem tamamlanamadı");
    }
  };

  const handleBulkGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);

    try {
      const times = bulkTimes
        .split(",")
        .map((t) => t.trim())
        .filter((t) => /^\d{1,2}:\d{2}$/.test(t));

      if (times.length === 0) {
        toast.error("Lütfen geçerli saat formatı girin (Örn: 10:00, 14:00, 18:00)");
        setIsGenerating(false);
        return;
      }

      const dates: string[] = [];
      const start = new Date(bulkStartDate);
      for (let i = 0; i < Math.min(bulkDays, 60); i++) {
        const cur = new Date(start);
        cur.setDate(cur.getDate() + i);
        dates.push(cur.toISOString().slice(0, 10));
      }

      const res = await authFetch("/api/admin/inventory/slots", {
        method: "POST",
        body: JSON.stringify({
          listingId: experience.id,
          dates,
          timeSlots: times,
          capacity: Number(bulkCapacity) || 10,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Toplu seans oluşturulamadı");

      toast.success(`${data.count || dates.length * times.length} adet seans oluşturuldu!`);
      setActiveTab("slots");
      fetchSlots();
    } catch (e: any) {
      toast.error(e.message || "Hata oluştu");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSyncExternalIcal = async () => {
    if (!externalIcalUrl.trim()) {
      toast.error("Lütfen harici bir .ics takvim bağlantısı yapıştırın.");
      return;
    }
    setIsSyncingIcal(true);
    try {
      const res = await authFetch(`/api/channels/ical/${encodeURIComponent(experience.id)}/export.ics`, {
        method: "POST",
        body: JSON.stringify({ feedUrl: externalIcalUrl.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Takvim senkronize edilemedi");

      setLastSyncResult(data);
      toast.success(`Dış takvimden ${data.eventsCount} etkinlik okundu (${data.blockedDates?.length || 0} gün bloke edildi).`);
    } catch (e: any) {
      toast.error(e.message || "Senkronizasyon hatası");
    } finally {
      setIsSyncingIcal(false);
    }
  };

  const icalFeedUrl = typeof window !== "undefined"
    ? `${window.location.origin}/api/channels/ical/${experience.id}/export.ics`
    : `/api/channels/ical/${experience.id}/export.ics`;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto">
      <div className="comus-card w-full max-w-4xl max-h-[92dvh] overflow-y-auto space-y-5 border-2 border-[#3B6D11]">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-[#C8C4B0]/60 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#EAF3DE] text-[#3B6D11]">
                Envanter &amp; Çifte Rezervasyon Önleme
              </span>
              <span className="text-xs text-[#6B6B55]">#{experience.id}</span>
            </div>
            <h3 className="comus-serif text-2xl font-normal text-[#2C2C1A] mt-1">
              {experience.title}
            </h3>
            <p className="text-xs text-[#6B6B55]">
              Sağlayıcı: <strong>{experience.provider}</strong> • Varsayılan Kapasite: {experience.capacity || 10} Kişi
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-[#EDE8DE] text-[#6B6B55] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="flex border-b border-[#C8C4B0]/60 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("slots")}
            className={`pb-2 text-xs font-semibold px-3 cursor-pointer transition ${
              activeTab === "slots"
                ? "border-b-2 border-[#3B6D11] text-[#3B6D11]"
                : "text-[#6B6B55] hover:text-[#2C2C1A]"
            }`}
          >
            Mevcut Seanslar ({slots.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("bulk")}
            className={`pb-2 text-xs font-semibold px-3 cursor-pointer transition ${
              activeTab === "bulk"
                ? "border-b-2 border-[#3B6D11] text-[#3B6D11]"
                : "text-[#6B6B55] hover:text-[#2C2C1A]"
            }`}
          >
            Toplu Seans Üretici
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("channels")}
            className={`pb-2 text-xs font-semibold px-3 cursor-pointer transition ${
              activeTab === "channels"
                ? "border-b-2 border-[#3B6D11] text-[#3B6D11]"
                : "text-[#6B6B55] hover:text-[#2C2C1A]"
            }`}
          >
            Kanal Entegrasyonu (iCal / OTA)
          </button>
        </div>

        {/* TAB 1: Mevcut Seanslar */}
        {activeTab === "slots" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-[#6B6B55]">
                Firestore ACID transactional motoru, misafir rezervasyonlarında koltukları gerçek zamanlı düşürür.
              </p>
              <button
                type="button"
                onClick={fetchSlots}
                disabled={loading}
                className="comus-btn-ghost text-xs px-2.5 py-1"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                Yenile
              </button>
            </div>

            {loading ? (
              <div className="py-12 text-center text-xs text-[#6B6B55]">Seanslar taranıyor...</div>
            ) : slots.length === 0 ? (
              <div className="p-8 text-center rounded-xl bg-[#F6F1E8] border border-dashed border-[#C8C4B0] space-y-3">
                <Calendar className="w-8 h-8 mx-auto text-[#6B6B55]" />
                <p className="text-sm font-medium text-[#2C2C1A]">Henüz seans tanımlanmamış</p>
                <p className="text-xs text-[#6B6B55] max-w-md mx-auto">
                  Misafirler doğrudan tarih ve saat seçtiğinde seanslar otomatik oluşturulur veya &ldquo;Toplu Seans Üretici&rdquo; sekmesinden önceden kota belirleyebilirsiniz.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab("bulk")}
                  className="comus-btn-primary text-xs mx-auto"
                >
                  <PlusCircle className="w-4 h-4" /> Toplu Seans Oluştur
                </button>
              </div>
            ) : (
              <div className="divide-y divide-[#C8C4B0]/40 border border-[#C8C4B0] rounded-xl overflow-hidden bg-white">
                {slots.map((slot) => {
                  const isClosed = slot.status === "closed";
                  const isSoldOut = slot.status === "sold_out" || slot.available_spots <= 0;
                  const isOverbooked = slot.booked_count > slot.capacity;

                  return (
                    <div
                      key={slot.slot_id}
                      className={`p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition ${
                        isClosed
                          ? "bg-red-50/50"
                          : isOverbooked
                          ? "bg-amber-50/70"
                          : "hover:bg-[#FAF8F5]"
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-[#3B6D11]" />
                          <span className="text-xs font-semibold text-[#2C2C1A]">
                            {slot.date || slot.start_time.slice(0, 10)} • {slot.time_slot || slot.start_time.slice(11, 16)}
                          </span>
                          {isClosed ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-red-100 text-red-700">
                              KAPALI / BLOKE
                            </span>
                          ) : isSoldOut ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-700">
                              TÜKENDİ
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#EAF3DE] text-[#3B6D11]">
                              AÇIK ({slot.available_spots} Koltuk Boş)
                            </span>
                          )}
                          {isOverbooked && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-600 text-white flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" /> ÇİFTE REZERVASYON UYARISI
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-[11px] text-[#6B6B55]">
                          <span>Kapasite: <strong>{slot.capacity}</strong></span>
                          <span>Kesinleşen: <strong>{slot.booked_count}</strong></span>
                          <span>Ödeme Aşamasında Kilitli: <strong>{slot.locked_count || 0}</strong></span>
                          {slot.closed_reason && (
                            <span className="text-red-600">Neden: {slot.closed_reason}</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleToggleSlotStatus(slot)}
                          className={`text-xs px-2.5 py-1 rounded-lg border font-medium cursor-pointer transition ${
                            isClosed
                              ? "bg-white text-[#3B6D11] border-[#3B6D11] hover:bg-[#EAF3DE]"
                              : "bg-white text-red-700 border-red-300 hover:bg-red-50"
                          }`}
                        >
                          {isClosed ? "Seansı Yeniden Aç" : "Seansı Kapat / Bloke Et"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Toplu Seans Üretici */}
        {activeTab === "bulk" && (
          <form onSubmit={handleBulkGenerate} className="space-y-4 p-4 rounded-xl bg-[#F6F1E8] border border-[#C8C4B0]">
            <div>
              <h4 className="text-sm font-semibold text-[#2C2C1A]">Toplu Seans &amp; Kota Üretimi</h4>
              <p className="text-xs text-[#6B6B55]">
                Belirlenen tarih aralığında her gün için belirtilen saatlerde ve kontenjanda seans belgeleri oluşturur.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="comus-label">Başlangıç Tarihi</label>
                <input
                  type="date"
                  value={bulkStartDate}
                  onChange={(e) => setBulkStartDate(e.target.value)}
                  className="comus-input"
                  required
                />
              </div>
              <div>
                <label className="comus-label">Kaç Günlük Oluşturulsun?</label>
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={bulkDays}
                  onChange={(e) => setBulkDays(Number(e.target.value) || 1)}
                  className="comus-input"
                  required
                />
              </div>
              <div>
                <label className="comus-label">Seans Saatleri (virgülle)</label>
                <input
                  type="text"
                  value={bulkTimes}
                  onChange={(e) => setBulkTimes(e.target.value)}
                  placeholder="10:00, 14:00, 18:00"
                  className="comus-input"
                  required
                />
              </div>
              <div>
                <label className="comus-label">Seans Başı Kapasite</label>
                <input
                  type="number"
                  min={1}
                  max={500}
                  value={bulkCapacity}
                  onChange={(e) => setBulkCapacity(Number(e.target.value) || 10)}
                  className="comus-input"
                  required
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={isGenerating}
                className="comus-btn-primary text-xs"
              >
                {isGenerating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <PlusCircle className="w-3.5 h-3.5" />}
                Seansları Toplu Oluştur ve Kaydet
              </button>
            </div>
          </form>
        )}

        {/* TAB 3: Kanal Entegrasyonu (iCal & OTA) */}
        {activeTab === "channels" && (
          <div className="space-y-4">
            {/* Export Feed */}
            <div className="p-4 rounded-xl bg-white border border-[#C8C4B0] space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#3B6D11]">
                <ShieldCheck className="w-4 h-4" />
                <span>Dışarıya iCal Takvim Akışı (Export Feed)</span>
              </div>
              <p className="text-xs text-[#6B6B55]">
                Bu bağlantıyı Airbnb, Booking.com veya Google Takvim&apos;e ekleyin. Purely Istanbul&apos;da yapılan kesinleşmiş rezervasyonlar ve bloke edilen seanslar otomatik olarak dış platformlara bildirilir ve çifte rezervasyon engellenir.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  readOnly
                  value={icalFeedUrl}
                  className="comus-input text-xs font-mono select-all bg-[#FAF8F5]"
                />
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(icalFeedUrl);
                    toast.success("iCal bağlantısı panoya kopyalandı!");
                  }}
                  className="comus-btn-ghost text-xs shrink-0"
                >
                  <Copy className="w-3.5 h-3.5" /> Kopyala
                </button>
                <a
                  href={icalFeedUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="comus-btn-ghost text-xs shrink-0"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> İndir (.ics)
                </a>
              </div>
            </div>

            {/* Import External Feed */}
            <div className="p-4 rounded-xl bg-[#F6F1E8] border border-[#C8C4B0] space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#2C2C1A]">
                <Calendar className="w-4 h-4 text-[#3B6D11]" />
                <span>Harici Platformdan Takvim İçe Aktar (Import Feed)</span>
              </div>
              <p className="text-xs text-[#6B6B55]">
                Tedarikçinizin Airbnb, Booking.com, Viator veya Google Calendar dış takvim URL&apos;sini (.ics) yapıştırarak doluluk durumlarını Purely Istanbul envanterine anında yansıtabilirsiniz.
              </p>

              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://www.airbnb.com/calendar/ical/...ics"
                  value={externalIcalUrl}
                  onChange={(e) => setExternalIcalUrl(e.target.value)}
                  className="comus-input text-xs flex-1 bg-white"
                />
                <button
                  type="button"
                  onClick={handleSyncExternalIcal}
                  disabled={isSyncingIcal}
                  className="comus-btn-primary text-xs shrink-0"
                >
                  {isSyncingIcal ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                  Senkronize Et
                </button>
              </div>

              {lastSyncResult && (
                <div className="p-3 rounded-lg bg-white border border-[#C8C4B0] text-xs space-y-1">
                  <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Takvim Başarıyla Okundu</span>
                  </div>
                  <p className="text-[#6B6B55]">
                    Bulunan Etkinlik Sayısı: <strong>{lastSyncResult.eventsCount}</strong> • Bloke Edilen Gün Sayısı: <strong>{lastSyncResult.blockedDates?.length || 0}</strong>
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-3 border-t border-[#C8C4B0]/60 flex justify-end">
          <button type="button" onClick={onClose} className="comus-btn-primary text-xs">
            Tamam
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from 'react';
import { XeniosStore } from '@/lib/store';
import { Hotel, HotelPartnerApplication, Room } from '@/lib/types';
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Globe,
  Users,
  UserCheck,
  CheckCircle2,
  XCircle,
  Trash2,
  RefreshCw,
  Clock,
  MessageCircle
} from 'lucide-react';
import { toast } from 'sonner';

export function PartnerApplicationsPanel() {
  const [applications, setApplications] = useState<HotelPartnerApplication[]>(() =>
    XeniosStore.getHotelPartnerApplications()
  );
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadApplications = async (showSpinner = false) => {
    if (showSpinner) setIsRefreshing(true);
    setApplications(XeniosStore.getHotelPartnerApplications());
    const synced = await XeniosStore.syncHotelPartnerApplicationsFromServer();
    setApplications(synced);
    if (showSpinner) setIsRefreshing(false);
  };

  useEffect(() => {
    loadApplications(false);
    const handleLocalUpdate = () => {
      setApplications(XeniosStore.getHotelPartnerApplications());
    };
    window.addEventListener('xenios_partner_applications_updated', handleLocalUpdate);
    return () => window.removeEventListener('xenios_partner_applications_updated', handleLocalUpdate);
  }, []);

  const handleApproveAndCreateHotel = async (app: HotelPartnerApplication) => {
    setBusyId(app.id);
    try {
      const roomCount = Math.max(1, Math.min(200, Number(app.capacity) || 10));
      const generatedRooms: Room[] = Array.from({ length: roomCount }, (_, idx) => {
        const floorNum = Math.floor(idx / 5) + 1;
        const roomNo = String(floorNum * 100 + ((idx % 5) + 1));
        return {
          id: `rm-${Date.now()}-${idx}`,
          number: roomNo,
          type: idx % 3 === 0 ? 'Bosphorus Suite' : 'Deluxe Birim',
          floor: `${floorNum}. Kat`,
          wifiSsid: 'Purely_Guest_WiFi',
          wifiPass: 'Purely2026!',
          locationAddress: app.locationAddress,
        };
      });

      const newHotel: Hotel = {
        id: `hotel-${Date.now()}`,
        name: app.propertyName,
        district: app.locationDistrict,
        type: app.businessType,
        address: app.locationAddress,
        phone: app.phone,
        website: app.website || 'https://',
        ratingStr: '4.9 (Yeni Partner)',
        targetReason: 'Purelyİstanbul anlaşmalı konaklama ve dijital konsiyerj partneri.',
        coords: { lat: 41.0082, lng: 28.9784 },
        rooms: generatedRooms,
        breakfastHours: '07:30 - 10:30',
        checkoutTime: '12:00',
        receptionExt: '0',
        status: 'active',
        commissionRate: 15,
        managerName: app.authorizedPerson,
        managerPhone: app.phone,
        whatsappPhone: app.phone,
        contactEmail: app.email,
        publishToWeb: true,
        publishToMobile: true,
      };

      XeniosStore.addHotel(newHotel);
      await XeniosStore.updateHotelPartnerApplicationStatus(app.id, 'approved');
      toast.success(
        `"${app.propertyName}" başvurusu onaylandı ve ${generatedRooms.length} birim ile Partner Oteller listesine eklendi!`
      );
      setApplications(XeniosStore.getHotelPartnerApplications());
    } catch (e: any) {
      toast.error(e?.message || 'Onaylama sırasında hata oluştu.');
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async (app: HotelPartnerApplication) => {
    setBusyId(app.id);
    try {
      await XeniosStore.updateHotelPartnerApplicationStatus(app.id, 'rejected');
      toast.info(`"${app.propertyName}" başvurusu reddedildi olarak işaretlendi.`);
      setApplications(XeniosStore.getHotelPartnerApplications());
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (app: HotelPartnerApplication) => {
    setBusyId(app.id);
    try {
      await XeniosStore.deleteHotelPartnerApplication(app.id);
      toast.info(`"${app.propertyName}" başvuru kaydı silindi.`);
      setApplications(XeniosStore.getHotelPartnerApplications());
    } finally {
      setBusyId(null);
    }
  };

  const pendingCount = applications.filter((a) => a.status === 'pending').length;
  const approvedCount = applications.filter((a) => a.status === 'approved').length;
  const rejectedCount = applications.filter((a) => a.status === 'rejected').length;

  const filtered = applications.filter((a) =>
    statusFilter === 'all' ? true : a.status === statusFilter
  );

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-[#FFFCFA] border-2 border-[#C0DD97] shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#C8C4B0]/60 pb-3.5">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-[#EAF3DE] text-[#3B6D11] border border-[#C0DD97]">
              App Yönetim Girişi • Üye Ol Başvuruları
            </span>
            {pendingCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#C1622F] text-white animate-pulse">
                {pendingCount} Yeni Başvuru Bekliyor
              </span>
            )}
          </div>
          <h3 className="comus-serif text-xl sm:text-2xl font-medium text-[#2C2C1A]">
            Konaklama Partneri Kayıt &amp; Üyelik Başvuruları
          </h3>
          <p className="text-xs text-[#6B6B55]">
            Yönetim paneli giriş ekranındaki <strong>&ldquo;Üye Ol&rdquo;</strong> formundan gönderilen konaklama işletmesi başvuruları burada listelenir.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              { id: 'all', label: `Tümü (${applications.length})` },
              { id: 'pending', label: `Bekleyen (${pendingCount})` },
              { id: 'approved', label: `Onaylanan (${approvedCount})` },
              { id: 'rejected', label: `Reddedilen (${rejectedCount})` },
            ] as const
          ).map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setStatusFilter(f.id)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition cursor-pointer ${
                statusFilter === f.id
                  ? 'bg-[#3B6D11] text-white border-[#3B6D11]'
                  : 'bg-[#F6F1E8] text-[#4A4A38] border-[#C8C4B0] hover:bg-[#EDE8DE]'
              }`}
            >
              {f.label}
            </button>
          ))}

          <button
            type="button"
            onClick={() => loadApplications(true)}
            className="p-2 rounded-lg bg-[#F6F1E8] hover:bg-[#EDE8DE] text-[#3B6D11] border border-[#C8C4B0] transition cursor-pointer"
            title="Başvuruları Yenile"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="p-6 rounded-xl bg-[#F6F1E8]/60 border border-[#C8C4B0]/60 text-center text-xs text-[#6B6B55]">
          {applications.length === 0
            ? 'Henüz App Yönetim Girişi üzerinden gönderilmiş bir konaklama partneri üyelik başvurusu bulunmuyor.'
            : 'Seçili filtreye uygun başvuru bulunamadı.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
          {filtered.map((app) => {
            const cleanWa = (app.phone || '').replace(/\D/g, '');
            return (
              <div
                key={app.id}
                className="p-4 rounded-xl bg-[#F6F1E8]/90 border border-[#C8C4B0] space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <h4 className="text-sm font-bold text-[#2C2C1A] flex items-center gap-1.5">
                          <Building2 className="w-4 h-4 text-[#3B6D11] shrink-0" />
                          <span>{app.propertyName}</span>
                        </h4>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[#EAF3DE] text-[#3B6D11] border border-[#C0DD97]">
                          {app.businessType}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-[#6B6B55] mt-0.5">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(app.createdAt).toLocaleString('tr-TR', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        <span>•</span>
                        <span className="text-[#3B6D11] font-semibold">
                          ✓ PurelyIstanbul Partneri Olmak İstiyor
                        </span>
                      </div>
                    </div>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                        app.status === 'approved'
                          ? 'bg-[#EAF3DE] text-[#3B6D11] border border-[#C0DD97]'
                          : app.status === 'rejected'
                          ? 'bg-red-100 text-red-700 border border-red-200'
                          : 'bg-[#F3E3D8] text-[#9C4E24] border border-[#E5C4B0]'
                      }`}
                    >
                      {app.status === 'pending'
                        ? 'İnceleme Bekliyor'
                        : app.status === 'approved'
                        ? 'Onaylandı'
                        : 'Reddedildi'}
                    </span>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 rounded-xl bg-white border border-[#C8C4B0]/70 text-xs">
                    <div className="flex items-start gap-1.5">
                      <Users className="w-3.5 h-3.5 text-[#3B6D11] shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[10px] uppercase text-[#6B6B55] block font-semibold">
                          Kapasite
                        </span>
                        <strong className="text-[#2C2C1A]">{app.capacity} Oda / Birim</strong>
                      </div>
                    </div>

                    <div className="flex items-start gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-[#3B6D11] shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[10px] uppercase text-[#6B6B55] block font-semibold">
                          Yetkili Kişi
                        </span>
                        <strong className="text-[#2C2C1A]">{app.authorizedPerson}</strong>
                      </div>
                    </div>

                    <div className="sm:col-span-2 flex items-start gap-1.5 pt-1 border-t border-[#C8C4B0]/40">
                      <MapPin className="w-3.5 h-3.5 text-[#C1622F] shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[10px] uppercase text-[#6B6B55] block font-semibold">
                          Tesisin Yeri ({app.locationDistrict})
                        </span>
                        <span className="text-[#2C2C1A] font-medium">{app.locationAddress}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 pt-1 border-t border-[#C8C4B0]/40">
                      <Phone className="w-3.5 h-3.5 text-[#3B6D11] shrink-0" />
                      <a
                        href={`tel:${app.phone}`}
                        className="text-[#2C2C1A] font-semibold hover:underline truncate"
                      >
                        {app.phone}
                      </a>
                    </div>

                    <div className="flex items-center gap-1.5 pt-1 border-t border-[#C8C4B0]/40">
                      <Mail className="w-3.5 h-3.5 text-[#3B6D11] shrink-0" />
                      <a
                        href={`mailto:${app.email}`}
                        className="text-[#2C2C1A] font-medium hover:underline truncate"
                      >
                        {app.email}
                      </a>
                    </div>

                    {app.website && (
                      <div className="sm:col-span-2 flex items-center gap-1.5 pt-1 border-t border-[#C8C4B0]/40">
                        <Globe className="w-3.5 h-3.5 text-[#6B6B55] shrink-0" />
                        <span className="text-[#6B6B55] truncate">{app.website}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#C8C4B0]/60">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {app.status !== 'approved' && (
                      <button
                        type="button"
                        disabled={busyId === app.id}
                        onClick={() => handleApproveAndCreateHotel(app)}
                        className="px-3 py-1.5 rounded-lg bg-[#3B6D11] hover:bg-[#27500A] text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Onayla &amp; Partner Otel Ekle</span>
                      </button>
                    )}

                    {app.status === 'pending' && (
                      <button
                        type="button"
                        disabled={busyId === app.id}
                        onClick={() => handleReject(app)}
                        className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-red-50 text-red-700 border border-red-200 text-xs font-medium inline-flex items-center gap-1 cursor-pointer transition disabled:opacity-50"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Reddet</span>
                      </button>
                    )}

                    {cleanWa && (
                      <a
                        href={`https://wa.me/${cleanWa}?text=${encodeURIComponent(
                          `Merhaba ${app.authorizedPerson}, ${app.propertyName} için PurelyIstanbul Partnerlik başvurunuzu aldık.`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1.5 rounded-lg bg-[#EAF3DE] hover:bg-[#dcebc9] text-[#3B6D11] border border-[#C0DD97] text-xs font-semibold inline-flex items-center gap-1 transition"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>WhatsApp</span>
                      </a>
                    )}
                  </div>

                  <button
                    type="button"
                    disabled={busyId === app.id}
                    onClick={() => handleDelete(app)}
                    className="p-1.5 rounded-lg text-[#6B6B55] hover:text-red-700 hover:bg-red-50 transition cursor-pointer"
                    title="Başvuruyu Sil"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

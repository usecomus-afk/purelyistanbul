"use client";

import { useState, useEffect } from 'react';
import { XeniosStore } from '@/lib/store';
import { Hotel, HotelStaffMember, StaffDepartmentKey } from '@/lib/types';
import { FirestoreService } from '@/lib/firestore-service';
import { authFetch } from '@/lib/auth-fetch';
import {
  Users,
  Phone,
  Plus,
  Trash2,
  Send,
  ChevronDown,
  ChevronUp,
  UserCheck,
  RotateCcw,
} from 'lucide-react';
import { toast } from 'sonner';

export const STAFF_DEPARTMENTS: Array<{
  key: StaffDepartmentKey;
  label: string;
  desc: string;
}> = [
  {
    key: 'Housekeeping',
    label: 'Kat Hizmetleri & Temizlik',
    desc: 'Oda/daire temizliği, havlu, çarşaf, yastık ve buklet talepleri',
  },
  {
    key: 'Mutfak',
    label: 'Kahvaltı & Yeme-İçme (Mutfak)',
    desc: 'Oda servisi, kahvaltı paketi, minibar ve F&B siparişleri',
  },
  {
    key: 'Teknik',
    label: 'Teknik Servis & Arıza',
    desc: 'Klima, kombi, sıcak su, Wi-Fi, TV ve elektrik/tesisat talepleri',
  },
  {
    key: 'Resepsiyon',
    label: 'Danışma / Ön Büro & Konaklama',
    desc: 'Geç çıkış (late check-out), konaklama uzatma, kasa ve genel danışma',
  },
  {
    key: 'Concierge',
    label: 'Concierge & VIP Transfer / Taksi',
    desc: 'Havalimanı transferi, taksi çağrısı ve şehir içi rezervasyonlar',
  },
  {
    key: 'Çamaşırhane',
    label: 'Çamaşırhane & Kuru Temizleme',
    desc: 'Yıkama, ütü ve kuru temizleme talepleri',
  },
];

interface StaffWhatsappRoutingPanelProps {
  hotel: Hotel;
  defaultExpanded?: boolean;
  onUpdated?: () => void;
}

export function StaffWhatsappRoutingPanel({
  hotel,
  defaultExpanded = true,
  onUpdated,
}: StaffWhatsappRoutingPanelProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [staffList, setStaffList] = useState<HotelStaffMember[]>([]);
  const [routingMap, setRoutingMap] = useState<Record<string, string>>({});
  const [hiddenDepts, setHiddenDepts] = useState<string[]>([]);
  const [hideDefaultManager, setHideDefaultManager] = useState<boolean>(false);

  // New staff form
  const [newName, setNewName] = useState('');
  const [newRoleTitle, setNewRoleTitle] = useState('Kat Hizmetleri Sorumlusu');
  const [newPhone, setNewPhone] = useState('');
  const [newDepts, setNewDepts] = useState<StaffDepartmentKey[]>(['Housekeeping']);
  const [newReceiveAll, setNewReceiveAll] = useState(false);
  const [testingStaffId, setTestingStaffId] = useState<string | null>(null);

  useEffect(() => {
    const freshHotel = XeniosStore.getHotelById(hotel.id) || hotel;
    const existingStaff = Array.isArray(freshHotel.staffMembers)
      ? freshHotel.staffMembers
      : [];
    setStaffList(existingStaff);
    setRoutingMap(
      freshHotel.departmentStaffRouting &&
        typeof freshHotel.departmentStaffRouting === 'object'
        ? freshHotel.departmentStaffRouting
        : {}
    );
    setHiddenDepts(
      Array.isArray(freshHotel.modules?.hiddenStaffDepartments)
        ? freshHotel.modules!.hiddenStaffDepartments
        : []
    );
    setHideDefaultManager(Boolean(freshHotel.modules?.hideDefaultManager));
  }, [hotel.id, hotel.updatedAt]);

  const persistAll = (
    nextStaff: HotelStaffMember[],
    nextRouting: Record<string, string>,
    nextHiddenDepts: string[] = hiddenDepts,
    nextHideDefaultManager: boolean = hideDefaultManager,
    extraHotelPatch?: Partial<Hotel>
  ) => {
    setStaffList(nextStaff);
    setRoutingMap(nextRouting);
    setHiddenDepts(nextHiddenDepts);
    setHideDefaultManager(nextHideDefaultManager);

    const freshHotel = XeniosStore.getHotelById(hotel.id) || hotel;
    const updatedModules = {
      ...(freshHotel.modules || {}),
      hiddenStaffDepartments: nextHiddenDepts,
      hideDefaultManager: nextHideDefaultManager,
    };

    const patch: Partial<Hotel> = {
      staffMembers: nextStaff,
      departmentStaffRouting: nextRouting,
      modules: updatedModules,
      ...(extraHotelPatch || {}),
    };

    XeniosStore.updateHotel(hotel.id, patch);

    if (typeof window !== 'undefined') {
      const merged = XeniosStore.getHotelById(hotel.id);
      if (merged) {
        FirestoreService.upsertHotel({
          ...merged,
          ...patch,
        }).catch(() => {});
      }
    }

    onUpdated?.();
  };

  const toggleDeptSelection = (dept: StaffDepartmentKey) => {
    setNewDepts((prev) =>
      prev.includes(dept) ? prev.filter((d) => d !== dept) : [...prev, dept]
    );
  };

  const handleAddStaff = (e?: React.MouseEvent | React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newName.trim()) {
      toast.error('Lütfen sorumlu personelin adını ve soyadını girin.');
      return;
    }
    if (!newPhone.trim()) {
      toast.error('Lütfen personelin WhatsApp telefon numarasını girin.');
      return;
    }

    const created: HotelStaffMember = {
      id: `staff-${Date.now()}`,
      name: newName.trim(),
      roleTitle: newRoleTitle.trim() || 'Operasyon Sorumlusu',
      whatsappPhone: newPhone.trim(),
      departments: newReceiveAll ? ['all'] : newDepts.length > 0 ? newDepts : ['Housekeeping'],
      receiveAllAlerts: newReceiveAll,
      active: true,
      createdAt: new Date().toISOString(),
    };

    const nextStaff = [...staffList, created];
    const nextRouting = { ...routingMap };

    // Seçilen departmanları yeni eklenen personele bağla
    if (!newReceiveAll) {
      for (const d of created.departments) {
        if (d !== 'all' && (!nextRouting[d] || nextRouting[d] === 'none' || nextRouting[d] === 'default_manager')) {
          nextRouting[d] = created.id;
        }
      }
    }

    persistAll(nextStaff, nextRouting);
    setNewName('');
    setNewPhone('');
    setNewReceiveAll(false);
    toast.success(
      `${created.name} sorumlu personel olarak kaydedildi ve WhatsApp yönlendirmesine bağlandı.`
    );
  };

  const handleDeleteStaff = (staffId: string, staffName: string) => {
    const nextStaff = staffList.filter((s) => s.id !== staffId);
    const nextRouting = { ...routingMap };
    for (const k of Object.keys(nextRouting)) {
      if (nextRouting[k] === staffId) {
        nextRouting[k] = 'none';
      }
    }
    persistAll(nextStaff, nextRouting);
    toast.success(`${staffName} kaydı silindi.`);
  };

  const handleDeleteDefaultManager = () => {
    const nextRouting = { ...routingMap };
    for (const dept of STAFF_DEPARTMENTS) {
      if (!nextRouting[dept.key] || nextRouting[dept.key] === 'default_manager') {
        nextRouting[dept.key] = 'none';
      }
    }
    persistAll(staffList, nextRouting, hiddenDepts, true, {
      whatsappPhone: '',
      managerPhone: '',
    });
    toast.success('Varsayılan Ana Sorumlu / Genel Yönetici numarası listeden silindi.');
  };

  const handleDeleteDepartmentCard = (deptKey: string, deptLabel: string) => {
    const nextHidden = Array.from(new Set([...hiddenDepts, deptKey]));
    const nextRouting = { ...routingMap, [deptKey]: 'none' };
    persistAll(staffList, nextRouting, nextHidden, hideDefaultManager);
    toast.success(`"${deptLabel}" departmanı listeden silindi.`);
  };

  const handleClearDepartmentAssignment = (deptKey: string, deptLabel: string) => {
    const currentAssignedId = routingMap[deptKey];
    // Eğer özel bir personel seçiliyse atamasını kaldır, varsayılan yönetici seçiliyse 'none' yap
    const nextRouting = { ...routingMap, [deptKey]: 'none' };
    if (currentAssignedId && currentAssignedId !== 'default_manager' && currentAssignedId !== 'none') {
      const matched = staffList.find((s) => s.id === currentAssignedId);
      persistAll(staffList, nextRouting);
      toast.success(
        `${deptLabel} departmanındaki ${matched?.name || 'personel'} ataması silindi.`
      );
    } else {
      persistAll(staffList, nextRouting, hiddenDepts, true);
      toast.success(`${deptLabel} departmanındaki sorumlu ataması silindi.`);
    }
  };

  const handleRestoreDepartments = () => {
    persistAll(staffList, routingMap, [], hideDefaultManager);
    toast.success('Silinen departmanlar geri yüklendi.');
  };

  const handleToggleStaffActive = (staffId: string) => {
    const nextStaff = staffList.map((s) =>
      s.id === staffId ? { ...s, active: !s.active } : s
    );
    persistAll(nextStaff, routingMap);
  };

  const handleChangeDepartmentRoute = (deptKey: string, staffId: string) => {
    const nextRouting = { ...routingMap };
    if (staffId === 'none') {
      nextRouting[deptKey] = 'none';
      persistAll(staffList, nextRouting);
      toast.info(`${deptKey} için otomatik WhatsApp yönlendirmesi kaldırıldı.`);
      return;
    }
    if (!staffId || staffId === 'default_manager') {
      delete nextRouting[deptKey];
    } else {
      nextRouting[deptKey] = staffId;
    }
    persistAll(staffList, nextRouting);
    const matched = staffList.find((s) => s.id === staffId);
    toast.success(
      matched
        ? `${deptKey} talepleri otomatik olarak ${matched.name} (${matched.whatsappPhone}) WhatsApp hattına yönlendirilecek.`
        : `${deptKey} talepleri genel sorumlu yöneticiye yönlendirilecek.`
    );
  };

  const handleSendTestToStaff = async (staff: HotelStaffMember) => {
    setTestingStaffId(staff.id);
    try {
      const res = await authFetch('/api/notifications/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'TEST_ALERT',
          phone: staff.whatsappPhone,
          requestAlert: {
            requestId: `staff-test-${Date.now()}`,
            hotelId: hotel.id,
            hotelName: hotel.name,
            roomNumber: '101',
            serviceKey: 'staff_routing_test',
            serviceTitle: `Sorumlu Personel Atama Testi (${staff.roleTitle})`,
            notes: `Sayın ${staff.name}, ${hotel.name} bünyesinde sorumlu olduğunuz departman talepleri bu WhatsApp hattınıza otomatik iletilecektir.`,
            department: staff.departments.join(', '),
            priority: 'standart',
          },
        }),
      });
      const data = await res.json();
      if (data?.success) {
        toast.success(`📲 ${staff.name} (${staff.whatsappPhone}) numarasına WhatsApp test bildirimi iletildi!`);
      } else {
        toast.error('WhatsApp mesajı gönderilemedi. Numarayı kontrol edin.');
      }
    } catch {
      toast.error('WhatsApp bağlantı hatası oluştu.');
    } finally {
      setTestingStaffId(null);
    }
  };

  const visibleDepartments = STAFF_DEPARTMENTS.filter(
    (d) => !hiddenDepts.includes(d.key)
  );

  const defaultManagerPhone = !hideDefaultManager
    ? hotel.whatsappPhone || hotel.managerPhone || ''
    : '';

  return (
    <div className="luxury-service-card p-4 sm:p-5 rounded-3xl space-y-4 w-full box-border">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-200/80 pb-3">
        <div className="flex items-start sm:items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/50 text-emerald-900 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <h2 className="text-sm sm:text-base font-bold font-serif text-zinc-900">
                Sorumlu Personel Kaydı & Otomatik WhatsApp Yönlendirme Masası
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-bold">
                {staffList.filter((s) => s.active).length} Aktif Personel
              </span>
            </div>
            <p className="text-[11px] text-zinc-600 mt-0.5">
              QR okutarak PWA menüye giren misafirlerin talep ve siparişlerinin doğru kişilere WhatsApp&apos;tan otomatik iletilmesi için sorumlu personelleri kaydedin ve departman eşleştirmesini seçin.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded((v) => !v)}
          className="self-start sm:self-center px-3 py-1.5 rounded-xl bg-white/80 hover:bg-white border border-amber-300 text-xs font-bold text-zinc-800 flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          <span>{isExpanded ? 'Paneli Daralt' : 'Personel & Yönlendirme Ayarları'}</span>
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {isExpanded && (
        <div className="space-y-5 text-xs">
          {/* 1. OTOMATİK YÖNLENDİRME MATRİSİ (Departman -> Sorumlu Personel Seçimi & Silme) */}
          <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/90 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-amber-700" />
                  <span>Departman Bazlı Otomatik WhatsApp Yönlendirme Seçimi</span>
                </h3>
                <p className="text-[11px] text-zinc-600">
                  Yönetim panelini kullanan ana sorumlu tüm talep ve siparişleri görür; ayrıca aşağıdan seçtiğiniz departman sorumlularına ilgili talep geldiği anda otomatik WhatsApp mesajı gider. İstemediğiniz departmanı veya sorumlu atamasını <strong>Sil</strong> butonuyla kaldırabilirsiniz.
                </p>
              </div>

              {!hideDefaultManager && (
                <div className="inline-flex items-center justify-between sm:justify-start gap-2 px-2.5 py-1.5 rounded-xl bg-white border border-amber-300 text-amber-900 shrink-0">
                  <span className="text-[10.5px] font-bold">
                    Ana Sorumlu: {hotel.managerName || 'İşletme Yöneticisi'}
                    {defaultManagerPhone ? ` (${defaultManagerPhone})` : ''}
                  </span>
                  <button
                    type="button"
                    onClick={handleDeleteDefaultManager}
                    className="px-2 py-0.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[10px] font-bold inline-flex items-center gap-1 cursor-pointer transition"
                    title="Ana Sorumlu Numarasını / Atamasını Sil"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Sil</span>
                  </button>
                </div>
              )}
            </div>

            {visibleDepartments.length === 0 ? (
              <div className="p-4 rounded-xl bg-white border border-amber-200 text-center space-y-2">
                <p className="text-xs text-zinc-600">
                  Listedeki tüm departmanlar silindi.
                </p>
                <button
                  type="button"
                  onClick={handleRestoreDepartments}
                  className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Varsayılan Departmanları Geri Yükle</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {visibleDepartments.map((dept) => {
                  const rawRoute = routingMap[dept.key];
                  const selectedStaffId =
                    rawRoute === 'none'
                      ? 'none'
                      : rawRoute
                      ? rawRoute
                      : hideDefaultManager
                      ? 'none'
                      : 'default_manager';

                  return (
                    <div
                      key={dept.key}
                      className="p-3 rounded-xl bg-white border border-amber-200 flex flex-col justify-between gap-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <span className="font-bold text-zinc-900 block text-xs">
                            {dept.label}
                          </span>
                          <span className="text-[10px] text-zinc-500 block leading-snug mt-0.5">
                            {dept.desc}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteDepartmentCard(dept.key, dept.label)}
                          className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[10px] font-bold inline-flex items-center gap-1 shrink-0 cursor-pointer transition"
                          title="Bu Departmanı Listeden Sil"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Sil</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <select
                          value={selectedStaffId}
                          onChange={(e) => handleChangeDepartmentRoute(dept.key, e.target.value)}
                          className="flex-1 min-w-0 p-2 rounded-lg bg-amber-50/50 border border-amber-300 text-[11px] font-bold text-zinc-900 cursor-pointer focus:outline-none"
                        >
                          <option value="none">
                            — Sorumlu Atanmadı (Seçiniz) —
                          </option>
                          {!hideDefaultManager && (
                            <option value="default_manager">
                              Genel Sorumlu Yönetici{defaultManagerPhone ? ` (${defaultManagerPhone})` : ''}
                            </option>
                          )}
                          {staffList
                            .filter((s) => s.active)
                            .map((st) => (
                              <option key={st.id} value={st.id}>
                                {st.name} — {st.roleTitle} ({st.whatsappPhone})
                              </option>
                            ))}
                        </select>

                        {selectedStaffId !== 'none' && (
                          <button
                            type="button"
                            onClick={() => handleClearDepartmentAssignment(dept.key, dept.label)}
                            className="p-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 shrink-0 cursor-pointer transition"
                            title="Seçili Sorumlu Atamasını Kaldır / Sil"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {hiddenDepts.length > 0 && visibleDepartments.length > 0 && (
              <div className="flex items-center justify-end pt-1">
                <button
                  type="button"
                  onClick={handleRestoreDepartments}
                  className="text-[11px] font-bold text-amber-900 hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Silinen Departmanları Geri Yükle ({hiddenDepts.length})</span>
                </button>
              </div>
            )}
          </div>

          {/* 2. KAYITLI SORUMLU PERSONELLER LİSTESİ (Silme Seçenekli) */}
          {staffList.length > 0 && (
            <div className="p-4 rounded-2xl bg-white/90 border border-amber-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-900">
                  Kayıtlı Sorumlu Personeller ({staffList.length})
                </span>
                <span className="text-[10px] text-zinc-500">
                  Personeli silmek için sağdaki <strong>Sil</strong> butonunu kullanın
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {staffList.map((st) => (
                  <div
                    key={st.id}
                    className={`p-3 rounded-2xl border flex items-center justify-between gap-3 ${
                      st.active
                        ? 'bg-amber-50/30 border-amber-200'
                        : 'bg-zinc-100/80 border-zinc-300 opacity-70'
                    }`}
                  >
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <strong className="text-xs font-bold text-zinc-900">
                          {st.name}
                        </strong>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-semibold">
                          {st.roleTitle}
                        </span>
                        {st.receiveAllAlerts && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                            Tüm Talepler
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] font-mono text-emerald-800 font-bold flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        <span>{st.whatsappPhone}</span>
                      </div>
                      <div className="text-[10px] text-zinc-500">
                        Departmanlar:{' '}
                        {st.receiveAllAlerts || st.departments.includes('all')
                          ? 'Tüm Departmanlar'
                          : st.departments.join(', ')}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleSendTestToStaff(st)}
                        disabled={testingStaffId === st.id}
                        className="px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-bold cursor-pointer"
                        title="Bu personele test WhatsApp mesajı gönder"
                      >
                        {testingStaffId === st.id ? '...' : '📲 Test'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleStaffActive(st.id)}
                        className={`px-2.5 py-1.5 rounded-xl text-[10px] font-bold border cursor-pointer ${
                          st.active
                            ? 'bg-emerald-600 text-white border-emerald-700'
                            : 'bg-zinc-200 text-zinc-700 border-zinc-300'
                        }`}
                      >
                        {st.active ? 'Aktif' : 'Pasif'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteStaff(st.id, st.name)}
                        className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[10px] font-bold inline-flex items-center gap-1 cursor-pointer transition"
                        title="Personeli Sil"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Sil</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. YENİ SORUMLU PERSONEL KAYIT FORMU */}
          <div className="p-4 rounded-2xl bg-emerald-50/45 border border-emerald-200/90 space-y-3">
            <div className="font-bold text-emerald-950 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-emerald-700" />
              <span>Yeni Sorumlu Personel & WhatsApp İletişim Bilgisi Ekle</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-zinc-700 block">
                  Personel Adı Soyadı
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Örn: Ayşe Demir"
                  className="w-full p-2.5 bg-white border border-emerald-200 rounded-xl text-xs text-zinc-900"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-zinc-700 block">
                  Görevi / Sorumluluk Alanı
                </label>
                <input
                  type="text"
                  value={newRoleTitle}
                  onChange={(e) => setNewRoleTitle(e.target.value)}
                  placeholder="Örn: Kat Hizmetleri Sorumlusu / Teknik Uzman"
                  className="w-full p-2.5 bg-white border border-emerald-200 rounded-xl text-xs text-zinc-900"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-zinc-700 block">
                  WhatsApp Telefon Numarası
                </label>
                <input
                  type="tel"
                  required
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="Örn: 0532 000 00 00"
                  className="w-full p-2.5 bg-white border border-emerald-200 rounded-xl text-xs font-mono text-zinc-900"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-zinc-700 block">
                Otomatik WhatsApp Bildirimi Alacağı Departmanlar:
              </label>
              <div className="flex flex-wrap items-center gap-1.5">
                {STAFF_DEPARTMENTS.map((dept) => {
                  const checked = newReceiveAll || newDepts.includes(dept.key);
                  return (
                    <button
                      key={dept.key}
                      type="button"
                      onClick={() => {
                        if (newReceiveAll) setNewReceiveAll(false);
                        toggleDeptSelection(dept.key);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
                        checked
                          ? 'bg-emerald-600 text-white border-emerald-700'
                          : 'bg-white text-zinc-700 border-emerald-200 hover:bg-emerald-50'
                      }`}
                    >
                      {dept.label}
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => setNewReceiveAll((v) => !v)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
                    newReceiveAll
                      ? 'bg-amber-600 text-white border-amber-700'
                      : 'bg-white text-amber-900 border-amber-300 hover:bg-amber-50'
                  }`}
                >
                  ★ Tüm Talep & Siparişleri Alsın (Genel Sorumlu)
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[10px] text-zinc-600">
                💡 Eklenen personel +90 850 308 59 06 Comus WhatsApp hattından anlık talep bildirimlerini alır.
              </span>
              <button
                type="button"
                onClick={handleAddStaff}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Sorumlu Personeli Kaydet</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

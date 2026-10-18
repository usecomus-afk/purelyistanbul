"use client";

import { useState, useEffect, useMemo } from 'react';
import { XeniosStore } from '@/lib/store';
import { ServiceRequest, ServiceStatus, ModuleAdminSettingsMap } from '@/lib/types';
import { SERVICE_MODULES, getModuleConfig, deriveStatus, nextStage, formatFieldValue, resolvePricing, deriveRequestStatus as displayStatus, isToday } from '@/lib/service-modules';
import { BellRing, CheckCircle2, Clock, AlertTriangle, Building2, ArrowRight, LayoutGrid } from 'lucide-react';
import { toast } from 'sonner';


const STATUS_LABEL: Record<ServiceStatus, string> = {
  pending: 'Bekliyor',
  in_progress: 'İşlemde',
  completed: 'Tamamlandı',
  cancelled: 'İptal / Reddedildi'
};

export default function LiveRequestsPage() {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [filter, setFilter] = useState<'all' | ServiceStatus>('all');
  const [moduleFilter, setModuleFilter] = useState<string>('all');
  const [moduleSettings, setModuleSettings] = useState<ModuleAdminSettingsMap>({});

  const refreshData = () => {
    setRequests(XeniosStore.getRequests());
    setModuleSettings(XeniosStore.getModuleSettings());
  };

  useEffect(() => {
    refreshData();
    // Deep-link from the Hizmet Modülleri Yönetimi page: /live-requests?module=breakfast
    const preset = new URLSearchParams(window.location.search).get('module');
    if (preset && SERVICE_MODULES[preset]) setModuleFilter(preset);

    window.addEventListener('xenios_requests_updated', refreshData);
    window.addEventListener('xenios_module_settings_updated', refreshData);
    window.addEventListener('xenios_demo_updated', refreshData);
    return () => {
      window.removeEventListener('xenios_requests_updated', refreshData);
      window.removeEventListener('xenios_module_settings_updated', refreshData);
      window.removeEventListener('xenios_demo_updated', refreshData);
    };
  }, []);

  const handleStatusChange = (id: string, status: ServiceRequest['status']) => {
    XeniosStore.updateRequestStatus(id, status);
    toast.success('Talep durumu güncellendi.');
    refreshData();
  };

  const handleStageChange = (req: ServiceRequest, stageId: string) => {
    const config = getModuleConfig(req.serviceKey);
    if (!config) return;
    XeniosStore.updateRequestStage(req.id, stageId, deriveStatus(config, stageId));
    toast.success('Talep aşaması güncellendi.');
    refreshData();
  };

  const handleAdvance = (req: ServiceRequest) => {
    const config = getModuleConfig(req.serviceKey);
    if (!config) return;
    const current = req.stage ?? config.stages[0].id;
    const ns = nextStage(config, current);
    if (!ns) return;
    XeniosStore.updateRequestStage(req.id, ns.id, deriveStatus(config, ns.id));
    toast.success(`Aşama: ${ns.label}`);
    refreshData();
  };

  const filtered = requests.filter((r) => {
    const statusMatch = filter === 'all' || displayStatus(r) === filter;
    const moduleMatch = moduleFilter === 'all' || r.serviceKey === moduleFilter;
    return statusMatch && moduleMatch;
  });

  const stats = useMemo(() => {
    const todayCount = requests.filter((r) => isToday(r.createdAt)).length;
    const byStatus: Record<ServiceStatus, number> = { pending: 0, in_progress: 0, completed: 0, cancelled: 0 };
    let urgentOpen = 0;
    const byDept: Record<string, number> = {};

    requests.forEach((r) => {
      const s = displayStatus(r);
      byStatus[s] += 1;
      if (r.priority === 'acil' && s !== 'completed' && s !== 'cancelled') urgentOpen += 1;
      const dept = r.department ?? 'Diğer';
      byDept[dept] = (byDept[dept] ?? 0) + 1;
    });

    const topDepartments = Object.entries(byDept).sort((a, b) => b[1] - a[1]).slice(0, 4);

    return { todayCount, byStatus, urgentOpen, topDepartments };
  }, [requests]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold font-serif text-zinc-900 dark:text-slate-100">Canlı Oda Talepleri Yönetim Masası</h1>
          <p className="text-xs text-zinc-500 dark:text-slate-400">Misafirlerin QR kod ile odalarından ilettiği tüm canlı istekler — modül bazlı iş akışı ve operasyon durumu</p>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 dark:border-slate-800 border border-amber-200/80">
          <span className="text-[10px] text-zinc-500 dark:text-slate-400 font-semibold uppercase tracking-wide">Bugünkü Talepler</span>
          <div className="text-xl font-bold text-zinc-900 dark:text-slate-100 mt-1 font-mono">{stats.todayCount}</div>
        </div>
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 dark:border-slate-800 border border-amber-200/80">
          <span className="text-[10px] text-zinc-500 dark:text-slate-400 font-semibold uppercase tracking-wide">Bekleyen</span>
          <div className="text-xl font-bold text-amber-400 mt-1 font-mono">{stats.byStatus.pending}</div>
        </div>
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 dark:border-slate-800 border border-amber-200/80">
          <span className="text-[10px] text-zinc-500 dark:text-slate-400 font-semibold uppercase tracking-wide">İşlemde</span>
          <div className="text-xl font-bold text-blue-400 mt-1 font-mono">{stats.byStatus.in_progress}</div>
        </div>
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 dark:border-slate-800 border border-amber-200/80">
          <span className="text-[10px] text-zinc-500 dark:text-slate-400 font-semibold uppercase tracking-wide flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-red-500" /> Acil (Açık)
          </span>
          <div className="text-xl font-bold text-red-400 mt-1 font-mono">{stats.urgentOpen}</div>
        </div>
      </div>

      {stats.topDepartments.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          <span className="text-zinc-500 dark:text-slate-400 font-semibold flex items-center gap-1"><LayoutGrid className="w-3.5 h-3.5" /> Departman Dağılımı:</span>
          {stats.topDepartments.map(([dept, count]) => (
            <span key={dept} className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 dark:border-slate-800 border border-amber-200/80 text-zinc-700">
              {dept} <strong className="text-amber-400">{count}</strong>
            </span>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full box-border">
        <div className="flex flex-wrap items-center gap-1.5 bg-white dark:bg-slate-900 dark:border-slate-800 p-1.5 rounded-xl border border-amber-200/80 w-full sm:w-auto">
          {(['all', 'pending', 'in_progress', 'completed', 'cancelled'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                filter === f
                  ? 'bg-amber-500 text-black font-bold'
                  : 'text-zinc-500 dark:text-slate-400 hover:text-zinc-800 dark:text-slate-200'
              }`}
            >
              {f === 'all' ? 'Tümü' : STATUS_LABEL[f]}
            </button>
          ))}
        </div>

        <select
          value={moduleFilter}
          onChange={(e) => setModuleFilter(e.target.value)}
          className="w-full sm:w-auto bg-white dark:bg-slate-900 dark:border-slate-800 border border-amber-200/80 text-zinc-700 text-xs rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
        >
          <option value="all">Tüm Modüller</option>
          {Object.values(SERVICE_MODULES).map((m) => (
            <option key={m.key} value={m.key}>{m.title}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div
          className="w-full box-border p-12 text-center text-zinc-600 space-y-2"
          style={{
            background: 'rgba(245, 215, 130, 0.22)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1.5px solid rgba(230, 185, 75, 0.5)',
            borderRadius: '16px',
          }}
        >
          <BellRing className="w-8 h-8 mx-auto text-amber-700/60" />
          <p className="text-xs font-semibold whitespace-normal break-words">Bu filtreye uygun aktif talep bulunmuyor.</p>
        </div>
      ) : (
        <div className="space-y-3.5 w-full box-border">
          {filtered.map((req) => {
            const config = getModuleConfig(req.serviceKey);
            const currentStageId = req.stage ?? config?.stages[0]?.id;
            const currentStage = config?.stages.find((s) => s.id === currentStageId);
            const upcoming = config && currentStageId ? nextStage(config, currentStageId) : undefined;
            const status = displayStatus(req);
            const detailFields = config?.fields ?? [];
            const currencySymbol =
              req.paymentCurrency === 'EUR' ? '€' : req.paymentCurrency === 'USD' ? '$' : '₺';

            return (
              <article
                key={req.id}
                className="w-full box-border flex flex-col gap-3 text-xs whitespace-normal break-words"
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  background: 'rgba(245, 215, 130, 0.22)',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  border: '1.5px solid rgba(230, 185, 75, 0.5)',
                  borderRadius: '16px',
                  padding: '16px',
                }}
              >
                {/* A) HEADER */}
                <div className="flex items-center justify-between w-full gap-2 pb-2.5 border-b border-amber-700/20">
                  <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                    <span className="golden-pill-badge px-2.5 py-1 rounded-lg text-[#2C1E0F] font-mono font-bold text-xs">
                      Birim {req.roomNumber}
                    </span>
                    {req.department && (
                      <span className="px-2.5 py-1 rounded-lg bg-white/70 border border-amber-600/35 text-[#2C1E0F] font-semibold text-[11px]">
                        {req.department}
                      </span>
                    )}
                    {req.priority === 'acil' && (
                      <span className="px-2 py-0.5 rounded-lg bg-red-100 text-red-800 border border-red-300 font-bold text-[10px] inline-flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> ACİL
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-[#3A2A18] bg-white/60 px-2 py-1 rounded-lg border border-amber-600/25">
                      <Clock className="w-3 h-3 text-amber-800 shrink-0" />
                      {new Date(req.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className={`px-2.5 py-1 rounded-lg font-bold text-[11px] ${
                      status === 'pending' ? 'bg-amber-200/80 text-amber-950' :
                      status === 'in_progress' ? 'bg-blue-100 text-blue-900' :
                      status === 'completed' ? 'bg-emerald-100 text-emerald-900' :
                      'bg-zinc-200 text-zinc-700'
                    }`}>
                      {STATUS_LABEL[status]}
                    </span>
                  </div>
                </div>

                {/* B) BODY */}
                <div className="flex flex-col gap-2.5 w-full min-w-0">
                  <h2 className="text-[15px] font-bold text-[#1A1A1A] leading-snug whitespace-normal break-words">
                    {req.serviceTitle}
                  </h2>

                  <div className="grid grid-cols-2 gap-2 w-full">
                    <div className="p-2.5 rounded-xl bg-white/55 border border-amber-600/25 min-w-0">
                      <span className="block text-[10px] font-semibold uppercase tracking-wider text-[#6E5638]">
                        Tesis / Departman
                      </span>
                      <span className="block text-xs font-bold text-[#1F1912] mt-0.5 whitespace-normal break-words">
                        {req.hotelName || 'Partner Tesis'} · {req.department || 'Genel'}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white/55 border border-amber-600/25 min-w-0">
                      <span className="block text-[10px] font-semibold uppercase tracking-wider text-[#6E5638]">
                        Aciliyet Derecesi
                      </span>
                      <span className={`block text-xs font-bold mt-0.5 whitespace-normal break-words ${req.priority === 'acil' ? 'text-red-700' : 'text-[#1F1912]'}`}>
                        {req.priority === 'acil' ? 'Acil' : 'Standart'}
                      </span>
                    </div>

                    {config && detailFields.map((f) => {
                      const rawValue = req.details ? req.details[f.key] : undefined;
                      const value = f.type === 'display'
                        ? (f.compute ? f.compute(req.details ?? {}, resolvePricing(config, moduleSettings[req.serviceKey]?.pricing)) : '—')
                        : formatFieldValue(f, rawValue);
                      if (f.optional && (value === '—' || value === '')) return null;
                      return (
                        <div key={f.key} className="p-2.5 rounded-xl bg-white/55 border border-amber-600/25 min-w-0">
                          <span className="block text-[10px] font-semibold uppercase tracking-wider text-[#6E5638] whitespace-normal break-words">
                            {f.label}
                          </span>
                          <span className="block text-xs font-bold text-[#1F1912] mt-0.5 whitespace-normal break-words">
                            {value}
                          </span>
                        </div>
                      );
                    })}

                    {req.notes && (
                      <div className="col-span-2 p-2.5 rounded-xl bg-white/65 border border-amber-600/30 min-w-0">
                        <span className="block text-[10px] font-semibold uppercase tracking-wider text-[#6E5638]">
                          Sorun Açıklaması / Misafir Notu
                        </span>
                        <p className="text-xs font-medium text-[#1F1912] mt-0.5 leading-relaxed whitespace-normal break-words">
                          {req.notes}
                        </p>
                      </div>
                    )}

                    {req.paymentAmount && req.paymentAmount > 0 && (
                      <div className="col-span-2 p-2.5 rounded-xl bg-amber-100/75 border border-amber-400/70 text-[#2C1E0F] flex items-center justify-between gap-2 min-w-0">
                        <span className="text-[10px] font-bold uppercase tracking-wider">Tutar / Folyo Bilgisi</span>
                        <span className="text-xs font-bold font-mono whitespace-normal break-words text-right">
                          {req.paymentAmount.toLocaleString('tr-TR')} {currencySymbol} · {req.paymentStatus === 'paid_online' ? 'Online Ödendi' : 'Birim Folyosu'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* C) FOOTER */}
                <div className="flex flex-wrap items-center justify-end gap-2 pt-2.5 border-t border-amber-700/20 w-full">
                  {config ? (
                    <>
                      <select
                        value={currentStageId}
                        onChange={(e) => handleStageChange(req, e.target.value)}
                        className="bg-white/80 border border-amber-600/35 text-zinc-900 text-[11px] font-semibold rounded-xl px-2.5 py-2 focus:outline-none"
                      >
                        {config.stages.map((s) => (
                          <option key={s.id} value={s.id}>{s.label}</option>
                        ))}
                      </select>
                      {upcoming && (
                        <button
                          onClick={() => handleAdvance(req)}
                          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition flex items-center gap-1 cursor-pointer"
                        >
                          <span>{upcoming.label}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {!upcoming && (
                        <span className="px-3.5 py-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{currentStage?.label ?? 'Tamamlandı'}</span>
                        </span>
                      )}
                    </>
                  ) : (
                    <>
                      {req.status === 'pending' && (
                        <button
                          onClick={() => handleStatusChange(req.id, 'in_progress')}
                          className="px-3.5 py-2 bg-white/85 hover:bg-white text-[#2C1E0F] border border-amber-600/40 rounded-xl font-bold transition cursor-pointer"
                        >
                          İşleme Al
                        </button>
                      )}
                      {req.status !== 'completed' && (
                        <button
                          onClick={() => handleStatusChange(req.id, 'completed')}
                          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition flex items-center gap-1 cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Tamamlandı</span>
                        </button>
                      )}
                      {req.status === 'completed' && (
                        <span className="px-3.5 py-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold">
                          ✓ Tamamlandı
                        </span>
                      )}
                    </>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

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
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 dark:border-slate-800 p-1 rounded-xl border border-amber-200/80 overflow-x-auto">
          {(['all', 'pending', 'in_progress', 'completed', 'cancelled'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
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
          className="bg-white dark:bg-slate-900 dark:border-slate-800 border border-amber-200/80 text-zinc-700 text-xs rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
        >
          <option value="all">Tüm Modüller</option>
          {Object.values(SERVICE_MODULES).map((m) => (
            <option key={m.key} value={m.key}>{m.title}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 dark:border-slate-800 rounded-3xl p-12 text-center text-zinc-500 dark:text-slate-400 border border-amber-200/80 space-y-2">
          <BellRing className="w-8 h-8 mx-auto text-amber-500 opacity-40" />
          <p className="text-xs">Bu filtreye uygun aktif talep bulunmuyor.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((req) => {
            const config = getModuleConfig(req.serviceKey);
            const currentStageId = req.stage ?? config?.stages[0]?.id;
            const currentStage = config?.stages.find((s) => s.id === currentStageId);
            const upcoming = config && currentStageId ? nextStage(config, currentStageId) : undefined;
            const status = displayStatus(req);
            const detailFields = config?.fields ?? [];

            return (
              <div
                key={req.id}
                className="p-4 rounded-2xl bg-white dark:bg-slate-900 dark:border-slate-800 border border-amber-200/80 hover:border-amber-500/40 transition flex flex-col gap-3 text-xs overflow-hidden"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-400 font-mono font-bold text-xs shrink-0">
                        Oda {req.roomNumber}
                      </span>
                      <strong className="text-sm text-zinc-900 dark:text-slate-100 truncate">{req.serviceTitle}</strong>
                      
                      {req.priority === 'acil' && (
                        <span className="px-2 py-0.5 rounded-lg bg-red-500/20 text-red-400 font-bold text-[10px] flex items-center gap-1 shrink-0">
                          <AlertTriangle className="w-3 h-3" /> ACİL
                        </span>
                      )}
                      {req.department && (
                        <span className="px-2 py-0.5 rounded-lg bg-amber-50/40 border border-amber-200/80 text-zinc-500 dark:text-slate-400 text-[10px] shrink-0">
                          {req.department}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-zinc-500 dark:text-slate-400 text-[11px]">
                      <Building2 className="w-3.5 h-3.5 text-zinc-500 dark:text-slate-400 shrink-0" />
                      <span className="truncate">{req.hotelName}</span>
                      <span>•</span>
                      <Clock className="w-3.5 h-3.5 text-zinc-500 dark:text-slate-400 shrink-0" />
                      <span className="font-mono">{new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>

                  <span className={`px-2.5 py-1 rounded-xl font-bold text-[11px] shrink-0 ${
                    status === 'pending' ? 'bg-amber-500/20 text-amber-400' :
                    status === 'in_progress' ? 'bg-blue-500/20 text-blue-400' :
                    status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' :
                    'bg-zinc-500/20 text-zinc-500 dark:text-slate-400'
                  }`}>
                    {STATUS_LABEL[status]}
                  </span>
                </div>

                {/* Structured module details */}
                {config && detailFields.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 bg-white dark:bg-slate-900 dark:border-slate-800 p-3 rounded-xl border border-amber-200/80">
                    {detailFields.map((f) => {
                      const rawValue = req.details ? req.details[f.key] : undefined;
                      const value = f.type === 'display'
                        ? (f.compute ? f.compute(req.details ?? {}, resolvePricing(config, moduleSettings[req.serviceKey]?.pricing)) : '—')
                        : formatFieldValue(f, rawValue);
                      if (f.optional && (value === '—' || value === '')) return null;
                      return (
                        <div key={f.key} className="flex items-baseline justify-between gap-2 text-[11px] border-b border-[#1d2028] pb-1 last:border-0">
                          <span className="text-zinc-500 dark:text-slate-400">{f.label}</span>
                          <span className="text-zinc-800 dark:text-slate-200 font-semibold text-right truncate">{value}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {!config && req.notes && (
                  <div className="bg-white dark:bg-slate-900 dark:border-slate-800 p-2.5 rounded-xl border border-amber-200/80 text-zinc-700 text-[11px] break-words">
                    <strong className="text-amber-400/80 block text-[10px]">Misafir Notu:</strong>
                    {req.notes}
                  </div>
                )}

                {/* Stage / Status controls */}
                <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-[#1d2028]">
                  {config ? (
                    <>
                      <select
                        value={currentStageId}
                        onChange={(e) => handleStageChange(req, e.target.value)}
                        className="bg-amber-50/40 border border-amber-200/80 text-zinc-800 dark:text-slate-200 text-[11px] font-semibold rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                      >
                        {config.stages.map((s) => (
                          <option key={s.id} value={s.id}>{s.label}</option>
                        ))}
                      </select>
                      {upcoming && (
                        <button
                          onClick={() => handleAdvance(req)}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-zinc-900 dark:text-slate-100 rounded-lg font-bold transition flex items-center gap-1"
                        >
                          <span>{upcoming.label}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {!upcoming && (
                        <span className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold flex items-center gap-1">
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
                          className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-zinc-900 dark:text-slate-100 rounded-xl font-bold transition"
                        >
                          İşleme Al
                        </button>
                      )}
                      {req.status !== 'completed' && (
                        <button
                          onClick={() => handleStatusChange(req.id, 'completed')}
                          className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-zinc-900 dark:text-slate-100 rounded-xl font-bold transition flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Tamamlandı</span>
                        </button>
                      )}
                      {req.status === 'completed' && (
                        <span className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 font-bold">
                          ✓ Çözümlendi
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

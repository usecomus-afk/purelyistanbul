"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { authFetch } from "./auth-fetch";
import { XeniosStore } from "./store";
import type { Booking, Complaint, InvestmentLead, ServiceRequest } from "./types";

/**
 * Yönetici operasyon istemcisi. Rezervasyon / talep / şikayet / lead verisini SUNUCUDAN
 * (/api/admin/ops → Firestore) okur; durum değişikliklerini denetim kaydıyla sunucuya yazar.
 */

export interface OpsSummary {
  generatedAt: string;
  bookings: {
    total: number;
    byStatus: Record<string, number>;
    revenueByCurrency: Record<string, number>;
    byHotel: Array<{ hotelId: string; hotelName: string; count: number; revenue: number }>;
    byDay: Array<{ date: string; count: number; revenue: number }>;
    topExperiences: Array<{ id: string; title: string; count: number; revenue: number }>;
  };
  requests: {
    total: number;
    open: number;
    byStatus: Record<string, number>;
    byService: Array<{ key: string; title: string; count: number }>;
    byHotel: Array<{ hotelId: string; hotelName: string; count: number }>;
    byDay: Array<{ date: string; count: number }>;
    avgResolutionMinutes: number | null;
  };
  complaints: {
    total: number;
    open: number;
    byStatus: Record<string, number>;
    byCategory: Record<string, number>;
    discrepancyByCurrency: Record<string, number>;
  };
  leads: { total: number; byProperty: Array<{ propertyId: string; title: string; count: number }> };
}

export interface OpsData {
  bookings: Booking[];
  requests: ServiceRequest[];
  complaints: Complaint[];
  leads: InvestmentLead[];
  summary: OpsSummary;
  truncated?: Record<string, boolean>;
}

export interface OpsFilter {
  from?: string;
  to?: string;
  hotelId?: string;
  includeTest?: boolean;
}

function qs(f: OpsFilter & Record<string, string | boolean | undefined>) {
  const p = new URLSearchParams();
  Object.entries(f).forEach(([k, v]) => {
    if (v === undefined || v === "" || v === false) return;
    p.set(k, v === true ? "1" : String(v));
  });
  return p.toString();
}

export async function fetchOps(filter: OpsFilter = {}): Promise<OpsData> {
  const res = await authFetch(`/api/admin/ops?${qs({ type: "all", ...filter })}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.success) {
    const err = new Error(data.error || `HTTP ${res.status}`) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }
  return data as OpsData;
}

export async function updateOpsStatus(
  kind: "booking" | "request" | "complaint",
  id: string,
  status: string,
  extra: { note?: string; isPublicAlert?: boolean } = {}
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await authFetch("/api/admin/ops", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, id, status, ...extra }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.success) {
      window.dispatchEvent(new Event("xenios_ops_changed"));
      return { ok: true };
    }
    return { ok: false, error: data.error || `HTTP ${res.status}` };
  } catch {
    return { ok: false, error: "Sunucuya bağlanılamadı." };
  }
}

/** Sunucudan CSV indirir (Authorization başlığı gerektiği için fetch + blob). */
export async function downloadOpsCsv(
  type: "bookings" | "requests" | "complaints" | "leads",
  filter: OpsFilter = {}
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await authFetch(`/api/admin/ops?${qs({ type, format: "csv", ...filter })}`);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { ok: false, error: data.error || `HTTP ${res.status}` };
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `purelyistanbul-${type}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    return { ok: true };
  } catch {
    return { ok: false, error: "Dosya indirilemedi." };
  }
}

export type OpsSyncState = "idle" | "loading" | "ok" | "error";

/**
 * Operasyon verisini yükler, periyodik yeniler (varsayılan 30 sn) ve veriyi yerel depoya yansıtır;
 * böylece mevcut paneller (XeniosStore okuyanlar) otomatik olarak sunucu verisini görür.
 */
export function useOpsData(opts: { enabled?: boolean; pollMs?: number; filter?: OpsFilter } = {}) {
  const { enabled = true, pollMs = 30000, filter } = opts;
  const [data, setData] = useState<OpsData | null>(null);
  const [state, setState] = useState<OpsSyncState>("idle");
  const [error, setError] = useState<string>("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const filterKey = JSON.stringify(filter || {});
  const busy = useRef(false);

  const refresh = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    setState((s) => (s === "ok" ? s : "loading"));
    try {
      const d = await fetchOps(filter);
      XeniosStore.syncBookingsFromRemote(d.bookings);
      XeniosStore.syncComplaintsFromRemote(d.complaints);
      XeniosStore.syncLeadsFromRemote(d.leads);
      XeniosStore.syncRequestsFromRemote(d.requests);
      setData(d);
      setError("");
      setState("ok");
      setLastUpdated(new Date());
    } catch (e: any) {
      setError(e?.status === 401 || e?.status === 403 ? "Yönetici oturumu gerekli (yeniden giriş yapın)." : e?.message || "Veri alınamadı.");
      setState("error");
    } finally {
      busy.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey]);

  useEffect(() => {
    if (!enabled) return;
    refresh();
    const t = pollMs > 0 ? setInterval(refresh, pollMs) : undefined;
    const onChanged = () => refresh();
    window.addEventListener("xenios_ops_changed", onChanged);
    return () => {
      if (t) clearInterval(t);
      window.removeEventListener("xenios_ops_changed", onChanged);
    };
  }, [enabled, pollMs, refresh]);

  return { data, state, error, lastUpdated, refresh };
}

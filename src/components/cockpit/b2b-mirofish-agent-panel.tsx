"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { XeniosStore } from "@/lib/store";
import type {
  B2BAgentPitch,
  B2BLead,
  B2BLeadStage,
  MirofishSystemParameters,
} from "@/lib/types";
import { toast } from "sonner";
import {
  Bot,
  Sparkles,
  Search,
  Plus,
  Download,
  Upload,
  RefreshCw,
  MessageSquare,
  Mail,
  Phone,
  Globe,
  MapPin,
  ShieldCheck,
  TrendingUp,
  Building2,
  Briefcase,
  CheckCircle2,
  Copy,
  ExternalLink,
  Edit3,
  Trash2,
  Sliders,
  ArrowUpRight,
  Users,
  Wallet,
  X,
  Save,
  Compass,
  FileJson,
  AlertCircle,
} from "lucide-react";

const CORE_DISTRICTS = ["Beyoğlu", "Şişli", "Fatih", "Beşiktaş", "Kadıköy"] as const;

const PIPELINE_STAGES: B2BLeadStage[] = [
  "Keşfedildi",
  "İlk Temas Kuruldu",
  "İletişim Doğrulandı",
  "Saha Randevusu",
  "Pilot Sözleşme",
];

const STAGE_STYLES: Record<string, string> = {
  "Keşfedildi": "bg-[#EDE8DE] text-[#4A4A38] border-[#C8C4B0]",
  "İlk Temas Kuruldu": "bg-blue-50 text-blue-900 border-blue-200",
  "İletişim Doğrulandı": "bg-amber-50 text-amber-900 border-amber-300",
  "Saha Randevusu": "bg-purple-50 text-purple-900 border-purple-200",
  "Pilot Sözleşme": "bg-[#EAF3DE] text-[#27500A] border-[#C0DD97]",
};

const ROLE_TYPES = [
  "Konaklama Partneri (Arz)",
  "Küratörlü Hizmet Tedarikçisi (Revenue Node)",
] as const;

const CATEGORY_OPTIONS = [
  "PMC (Profesyonel Mülk Yönetimi)",
  "Butik Otel (10-35 Oda)",
  "VIP Transfer (D2 Belgeli)",
  "Boğaz VIP Yat & Tekne",
  "Özel Tur & Deneyim (A Grubu TÜRSAB)",
  "Kahvaltı & Gurme Gastronomi",
  "Ekspres Kuru Temizleme",
];

type SubView = "crm" | "discovery_agent" | "pitch_agent" | "mirofish_sim";

interface B2BMirofishAgentPanelProps {
  onNavigateToLiveTab?: (tab: "hotels" | "suppliers") => void;
}

export function B2BMirofishAgentPanel({
  onNavigateToLiveTab,
}: B2BMirofishAgentPanelProps) {
  const [subView, setSubView] = useState<SubView>("crm");
  const [leads, setLeads] = useState<B2BLead[]>([]);
  const [params, setParams] = useState<MirofishSystemParameters>(() =>
    XeniosStore.getMirofishParameters()
  );

  // CRM Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [districtFilter, setDistrictFilter] = useState<string>("all");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  // Agent 1: Discovery Agent State
  const [discDistrict, setDiscDistrict] = useState<string>("Beyoğlu");
  const [discRoleType, setDiscRoleType] = useState<string>(
    "Konaklama Partneri (Arz)"
  );
  const [discCategory, setDiscCategory] = useState<string>(
    "PMC (Profesyonel Mülk Yönetimi)"
  );
  const [discCount, setDiscCount] = useState<number>(3);
  const [discCustomFocus, setDiscCustomFocus] = useState<string>("");
  const [isDiscovering, setIsDiscovering] = useState<boolean>(false);
  const [discoveryError, setDiscoveryError] = useState<string>("");
  const [discoveredLeads, setDiscoveredLeads] = useState<B2BLead[]>([]);
  const [discoverySummary, setDiscoverySummary] = useState<string>("");

  // Agent 2: Pitch & Outreach Agent State
  const [selectedPitchLeadId, setSelectedPitchLeadId] = useState<string>("");
  const [pitchLang, setPitchLang] = useState<"tr" | "en">("tr");
  const [pitchTone, setPitchTone] = useState<string>("kurumsal_yatirimci");
  const [isGeneratingPitch, setIsGeneratingPitch] = useState<boolean>(false);
  const [pitchError, setPitchError] = useState<string>("");
  const [activePitch, setActivePitch] = useState<B2BAgentPitch | null>(null);

  // Modals: Edit/Add Lead & JSON Import
  const [editingLead, setEditingLead] = useState<B2BLead | null>(null);
  const [isNewLeadModal, setIsNewLeadModal] = useState<boolean>(false);
  const [isJsonImportOpen, setIsJsonImportOpen] = useState<boolean>(false);
  const [jsonPasteText, setJsonPasteText] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const refresh = () => {
    const loadedLeads = XeniosStore.getB2BLeads();
    setLeads(loadedLeads);
    setParams(XeniosStore.getMirofishParameters());
    if (!selectedPitchLeadId && loadedLeads.length > 0) {
      setSelectedPitchLeadId(loadedLeads[0].id);
      if (loadedLeads[0].lastAgentPitch) {
        setActivePitch(loadedLeads[0].lastAgentPitch);
      }
    }
  };

  useEffect(() => {
    refresh();
    window.addEventListener("xenios_b2b_leads_updated", refresh);
    return () => window.removeEventListener("xenios_b2b_leads_updated", refresh);
  }, []);

  const selectedPitchLead = useMemo(() => {
    return leads.find((l) => l.id === selectedPitchLeadId) || leads[0] || null;
  }, [leads, selectedPitchLeadId]);

  useEffect(() => {
    if (selectedPitchLead?.lastAgentPitch) {
      setActivePitch(selectedPitchLead.lastAgentPitch);
    } else {
      setActivePitch(null);
    }
  }, [selectedPitchLeadId, selectedPitchLead]);

  // Computed Mirofish Portfolio Metrics
  const metrics = useMemo(() => {
    const supplyLeads = leads.filter(
      (l) =>
        l.roleType.includes("Konaklama") ||
        l.category.toLowerCase().includes("pmc") ||
        l.category.toLowerCase().includes("otel")
    );
    const revenueNodes = leads.filter((l) => !supplyLeads.includes(l));

    const totalSupplyUnits = supplyLeads.reduce(
      (sum, l) => sum + (Number(l.unitCount) || 0),
      0
    );
    const totalMonthlyGmv = leads.reduce(
      (sum, l) => sum + (Number(l.estimatedMonthlyEuroVolume) || 0),
      0
    );
    const totalPlatformCommission = leads.reduce(
      (sum, l) => sum + (Number(l.platformCommissionEuro) || 0),
      0
    );
    const totalAnnualListingFees = leads.reduce(
      (sum, l) => sum + (Number(l.annualListingFeeEuro) || 0),
      0
    );
    const verifiedOrFurtherCount = leads.filter(
      (l) =>
        l.stage === "İletişim Doğrulandı" ||
        l.stage === "Saha Randevusu" ||
        l.stage === "Pilot Sözleşme"
    ).length;
    const signedPilotCount = leads.filter(
      (l) => l.stage === "Pilot Sözleşme"
    ).length;

    const unitProgressPct = Math.min(
      100,
      Math.round(
        (totalSupplyUnits / Math.max(1, params.phase1PilotUnitsTarget || 12500)) *
          100
      )
    );
    const partnerProgressPct = Math.min(
      100,
      Math.round(
        (leads.length / Math.max(1, params.phase1PilotPartnersTarget || 50)) * 100
      )
    );

    return {
      totalActors: leads.length,
      supplyCount: supplyLeads.length,
      revenueNodeCount: revenueNodes.length,
      totalSupplyUnits,
      totalMonthlyGmv,
      totalPlatformCommission,
      totalAnnualListingFees,
      verifiedOrFurtherCount,
      signedPilotCount,
      unitProgressPct,
      partnerProgressPct,
    };
  }, [leads, params]);

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    return leads.filter((l) => {
      if (roleFilter !== "all" && l.roleType !== roleFilter) return false;
      if (districtFilter !== "all" && l.district !== districtFilter) return false;
      if (stageFilter !== "all" && l.stage !== stageFilter) return false;
      if (categoryFilter !== "all" && l.category !== categoryFilter) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        l.name.toLowerCase().includes(q) ||
        l.neighborhood.toLowerCase().includes(q) ||
        l.district.toLowerCase().includes(q) ||
        l.category.toLowerCase().includes(q) ||
        (l.fieldNotes || "").toLowerCase().includes(q) ||
        (l.legalShieldStatus || "").toLowerCase().includes(q)
      );
    });
  }, [leads, roleFilter, districtFilter, stageFilter, categoryFilter, searchQuery]);

  // Handlers
  const handleStageChange = (leadId: string, nextStage: string) => {
    XeniosStore.updateB2BLead(leadId, { stage: nextStage });
    refresh();
    toast.success(`Aşama "${nextStage}" olarak güncellendi.`);
  };

  const handleDeleteLead = (lead: B2BLead) => {
    XeniosStore.deleteB2BLead(lead.id);
    refresh();
    toast.success(`"${lead.name}" B2B CRM listesinden kaldırıldı.`, {
      action: {
        label: "Geri Al",
        onClick: () => {
          XeniosStore.addB2BLead(lead);
          refresh();
          toast.info(`"${lead.name}" geri yüklendi.`);
        },
      },
    });
  };

  const handleOnboardToLive = (lead: B2BLead) => {
    const result = XeniosStore.onboardB2BLeadToLiveInventory(lead);
    refresh();
    if (result.type === "hotel") {
      toast.success(
        `"${lead.name}" canlı Partner Otel & Konaklama envanterine (${lead.unitCount} birim) aktarıldı!`,
        {
          action: onNavigateToLiveTab
            ? {
                label: "Otelleri Gör",
                onClick: () => onNavigateToLiveTab("hotels"),
              }
            : undefined,
        }
      );
    } else {
      toast.success(
        `"${lead.name}" canlı Anlaşmalı Tedarikçi envanterine aktarıldı!`,
        {
          action: onNavigateToLiveTab
            ? {
                label: "İşletmeleri Gör",
                onClick: () => onNavigateToLiveTab("suppliers"),
              }
            : undefined,
        }
      );
    }
  };

  const handleExportJson = () => {
    const dataset = XeniosStore.exportB2BMirofishDataset();
    const jsonStr = JSON.stringify(dataset, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `purelyistanbul-b2b-mirofish-${new Date()
      .toISOString()
      .slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(
      `AI Studio uyumlu JSON dosyası (${dataset.totalCount} aktör) indirildi.`
    );
  };

  const handleImportJsonString = (raw: string) => {
    try {
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") {
        toast.error("Geçersiz JSON formatı.");
        return;
      }
      const { importedCount } = XeniosStore.importB2BMirofishDataset(parsed);
      refresh();
      setIsJsonImportOpen(false);
      setJsonPasteText("");
      toast.success(
        `${importedCount} B2B aktör ve Mirofish sistem parametreleri başarıyla içe aktarıldı!`
      );
    } catch {
      toast.error("JSON ayrıştırılamadı. Lütfen geçerli bir JSON dosyası seçin.");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = String(ev.target?.result || "");
      handleImportJsonString(content);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // Agent 1 Execution: Discover Leads
  const handleRunDiscoveryAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsDiscovering(true);
    setDiscoveryError("");
    try {
      const res = await fetch("/api/admin/b2b-agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "discover_leads",
          district: discDistrict,
          roleType: discRoleType,
          category: discCategory,
          count: discCount,
          customFocus: discCustomFocus,
          existingNames: leads.map((l) => l.name),
          mirofishParameters: params,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Keşif ajanı yanıt veremedi.");
      }
      setDiscoveredLeads(Array.isArray(data.leads) ? data.leads : []);
      setDiscoverySummary(data.agentSummary || "");
      toast.success(
        `${ (data.leads || []).length } yeni B2B aday aktör keşfedildi!`
      );
    } catch (err: any) {
      const msg =
        err?.message || "Keşif ajanı çalıştırılırken bağlantı hatası oluştu.";
      setDiscoveryError(msg);
      toast.error(msg);
    } finally {
      setIsDiscovering(false);
    }
  };

  const handleSaveDiscoveredLead = (candidate: B2BLead) => {
    XeniosStore.addB2BLead(candidate);
    setDiscoveredLeads((prev) => prev.filter((x) => x.id !== candidate.id));
    refresh();
    toast.success(`"${candidate.name}" B2B CRM listesine eklendi!`);
  };

  const handleSaveAllDiscovered = () => {
    if (discoveredLeads.length === 0) return;
    discoveredLeads.forEach((c) => XeniosStore.addB2BLead(c));
    const count = discoveredLeads.length;
    setDiscoveredLeads([]);
    refresh();
    toast.success(`${count} yeni B2B aktör CRM listesine kaydedildi!`);
  };

  // Agent 2 Execution: Generate Pitch
  const handleRunPitchAgent = async (targetLead?: B2BLead) => {
    const leadToUse = targetLead || selectedPitchLead;
    if (!leadToUse) {
      toast.error("Lütfen önce bir B2B aktör seçin.");
      return;
    }
    if (targetLead) {
      setSelectedPitchLeadId(targetLead.id);
      setSubView("pitch_agent");
    }
    setIsGeneratingPitch(true);
    setPitchError("");
    try {
      const res = await fetch("/api/admin/b2b-agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate_pitch",
          lead: leadToUse,
          mirofishParameters: params,
          language: pitchLang,
          tone: pitchTone,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok || !data.pitch) {
        throw new Error(data.error || "Pitch ajanı yanıt üretemedi.");
      }
      const generated: B2BAgentPitch = data.pitch;
      setActivePitch(generated);
      XeniosStore.updateB2BLead(leadToUse.id, { lastAgentPitch: generated });
      refresh();
      toast.success(`"${leadToUse.name}" için B2B Pitch paketi hazırlandı!`);
    } catch (err: any) {
      const msg =
        err?.message || "Pitch ajanı çalıştırılırken bir hata oluştu.";
      setPitchError(msg);
      toast.error(msg);
    } finally {
      setIsGeneratingPitch(false);
    }
  };

  const formatWhatsAppUrl = (phone: string, text?: string) => {
    const digits = (phone || "").replace(/\D/g, "");
    const normalized = digits.startsWith("0")
      ? `90${digits.slice(1)}`
      : digits.startsWith("90")
      ? digits
      : `90${digits}`;
    const encoded = text ? `?text=${encodeURIComponent(text)}` : "";
    return `https://wa.me/${normalized}${encoded}`;
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(
      () => toast.success(`${label} panoya kopyalandı.`),
      () => toast.error("Kopyalama başarısız.")
    );
  };

  const openCreateNewLeadModal = () => {
    const now = new Date().toISOString().slice(0, 10);
    setIsNewLeadModal(true);
    setEditingLead({
      id: `lead-custom-${Date.now()}`,
      name: "",
      roleType: "Konaklama Partneri (Arz)",
      category: "PMC (Profesyonel Mülk Yönetimi)",
      district: "Beyoğlu",
      neighborhood: "Galata · Cihangir",
      unitCount: 30,
      unitLabel: "Daire",
      phone: "+90 532 000 00 00",
      whatsappReady: true,
      email: "",
      website: "https://",
      instagram: "@",
      address: "Beyoğlu / İstanbul",
      decisionMakerRole: "Operasyon & Portföy Yöneticisi",
      decisionMakerName: "",
      legalShieldStatus: "Resmi Vergi Levhalı · Turizm Konutu Uyumlu",
      listingChannels: ["Booking.com", "Airbnb"],
      estimatedMonthlyEuroVolume: 6000,
      partnerOrSupplierNetEuro: 240,
      platformCommissionEuro: 660,
      annualListingFeeEuro: 0,
      stage: "Keşfedildi",
      fieldNotes: "",
      pitchAngle:
        "Sıfır operasyonel yük ile her dairede Comus AI concierge ve %4 net B2B pasif gelir paylaşımı.",
      sources: [],
      verifiedAt: now,
    });
  };

  const handleSaveLeadModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLead || !editingLead.name.trim()) {
      toast.error("Lütfen işletme adını giriniz.");
      return;
    }
    if (isNewLeadModal) {
      XeniosStore.addB2BLead(editingLead);
      toast.success(`"${editingLead.name}" B2B CRM listesine eklendi.`);
    } else {
      XeniosStore.updateB2BLead(editingLead.id, editingLead);
      toast.success(`"${editingLead.name}" bilgileri güncellendi.`);
    }
    setEditingLead(null);
    setIsNewLeadModal(false);
    refresh();
  };

  const handleRecalculateAllEconomics = () => {
    const passivePct = (Number(params.b2bPartnerPassivePercent) || 4) / 100;
    const supplierPct = (Number(params.supplierPayoutPercent) || 85) / 100;
    const platformPct = (Number(params.platformCommissionPercent) || 11) / 100;
    const fee = Number(params.annualPremiumListingFeeEuro) || 500;

    const updated = leads.map((lead) => {
      const isSupply =
        lead.roleType.includes("Konaklama") ||
        lead.category.toLowerCase().includes("pmc") ||
        lead.category.toLowerCase().includes("otel");
      const vol = Number(lead.estimatedMonthlyEuroVolume) || 0;
      return {
        ...lead,
        partnerOrSupplierNetEuro: Math.round(
          vol * (isSupply ? passivePct : supplierPct)
        ),
        platformCommissionEuro: Math.round(vol * platformPct),
        annualListingFeeEuro: isSupply ? 0 : fee,
      };
    });
    XeniosStore.saveB2BLeads(updated);
    XeniosStore.saveMirofishParameters(params);
    refresh();
    toast.success(
      `Tüm ${updated.length} aktörün hakediş projeksiyonları (%${params.supplierPayoutPercent} / %${params.platformCommissionPercent} / %${params.b2bPartnerPassivePercent}) yeniden hesaplandı!`
    );
  };

  return (
    <div className="space-y-6 min-w-0">
      {/* Hidden File Input for JSON Import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Top Executive Header & JSON Sync Controls */}
      <div className="bg-white border border-[#C8C4B0] rounded-2xl p-4 sm:p-6 shadow-xs space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#C8C4B0]/60">
          <div className="space-y-1.5 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-wider font-bold text-[#27500A] bg-[#EAF3DE] px-2.5 py-1 rounded-md border border-[#C0DD97]">
                <Bot className="w-3.5 h-3.5 text-[#3B6D11]" />
                AI Studio B2B Ajan &amp; Mirofish CRM PWA
              </span>
              <span className="text-[11px] font-mono text-[#6B6B55] bg-[#F6F1E8] px-2.5 py-1 rounded-md border border-[#C8C4B0]">
                5 Çekirdek İlçe · %{params.marketCoveragePercent} Pazar Kapsaması
              </span>
            </div>
            <h1
              style={{ fontSize: "clamp(1.35rem, 1rem + 1.5vw, 2.1rem)" }}
              className="comus-serif font-normal text-[#1E1E12] leading-tight"
            >
              Purelyistanbul B2B{" "}
              <em className="italic text-[#3B6D11]">Ajan Operasyon</em> &amp;
              Mirofish Masası
            </h1>
            <p className="text-xs sm:text-sm text-[#525240] leading-relaxed max-w-3xl">
              Konaklama Partnerleri (PMC &amp; Butik Otel — <strong>%{params.b2bPartnerPassivePercent}</strong>{" "}
              pasif gelir) ve Küratörlü Hizmet Tedarikçileri (Revenue Node —{" "}
              <strong>%{params.supplierPayoutPercent}</strong> net hakediş, Platform{" "}
              <strong>%{params.platformCommissionPercent}</strong>) için otonom
              keşif, saha pitch üretimi ve Faz-1 simülasyonu.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsJsonImportOpen(true)}
              className="min-h-[44px] px-3.5 py-2 rounded-xl bg-[#F6F1E8] hover:bg-[#EDE8DE] text-[#2C2C1A] border border-[#C8C4B0] text-xs font-semibold inline-flex items-center gap-1.5 transition cursor-pointer"
            >
              <Upload className="w-4 h-4 text-[#3B6D11]" />
              <span>JSON İçe Aktar</span>
            </button>
            <button
              type="button"
              onClick={handleExportJson}
              className="min-h-[44px] px-3.5 py-2 rounded-xl bg-[#F6F1E8] hover:bg-[#EDE8DE] text-[#2C2C1A] border border-[#C8C4B0] text-xs font-semibold inline-flex items-center gap-1.5 transition cursor-pointer"
            >
              <Download className="w-4 h-4 text-[#3B6D11]" />
              <span>JSON Dışa Aktar ({leads.length})</span>
            </button>
            <button
              type="button"
              onClick={openCreateNewLeadModal}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-[#3B6D11] hover:bg-[#27500A] text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-xs transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Yeni B2B Aktör Ekle</span>
            </button>
          </div>
        </div>

        {/* Mirofish Phase-1 Executive KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-3.5 rounded-xl bg-[#F6F1E8]/80 border border-[#C8C4B0] space-y-1 min-w-0">
            <div className="text-[10px] uppercase tracking-wider font-bold text-[#6B6B55] truncate">
              B2B CRM Aktörleri
            </div>
            <div className="text-xl font-bold font-mono text-[#1E1E12]">
              {metrics.totalActors}{" "}
              <span className="text-xs font-normal text-[#6B6B55]">
                / {params.phase1PilotPartnersTarget}
              </span>
            </div>
            <div className="text-[11px] text-[#3B6D11] font-semibold truncate">
              {metrics.supplyCount} Arz • {metrics.revenueNodeCount} Tedarikçi
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#F6F1E8]/80 border border-[#C8C4B0] space-y-1 min-w-0">
            <div className="text-[10px] uppercase tracking-wider font-bold text-[#6B6B55] truncate">
              Arz Kapasitesi (Oda/Daire)
            </div>
            <div className="text-xl font-bold font-mono text-[#1E1E12]">
              {metrics.totalSupplyUnits.toLocaleString("tr-TR")}
            </div>
            <div className="text-[11px] text-[#525240] truncate">
              Faz-1 Hedef:{" "}
              <strong>
                {params.phase1PilotUnitsTarget.toLocaleString("tr-TR")}
              </strong>{" "}
              birim
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#F6F1E8]/80 border border-[#C8C4B0] space-y-1 min-w-0">
            <div className="text-[10px] uppercase tracking-wider font-bold text-[#6B6B55] truncate">
              Aylık Tahmini Hacim (GMV)
            </div>
            <div className="text-xl font-bold font-mono text-[#1E1E12]">
              €{metrics.totalMonthlyGmv.toLocaleString("tr-TR")}
            </div>
            <div className="text-[11px] text-[#525240] truncate">
              Ort. Sepet: <strong>€{params.averageBasketEuro}</strong> · CAC:{" "}
              <strong>€{params.cacCostEuro}</strong>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#EAF3DE]/70 border border-[#C0DD97] space-y-1 min-w-0">
            <div className="text-[10px] uppercase tracking-wider font-bold text-[#27500A] truncate">
              Platform Net (%{params.platformCommissionPercent})
            </div>
            <div className="text-xl font-bold font-mono text-[#27500A]">
              €{metrics.totalPlatformCommission.toLocaleString("tr-TR")}
              <span className="text-xs font-normal">/ay</span>
            </div>
            <div className="text-[11px] text-[#27500A] font-medium truncate">
              Yıllık ~€
              {(metrics.totalPlatformCommission * 12).toLocaleString("tr-TR")}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#F6F1E8]/80 border border-[#C8C4B0] space-y-1 min-w-0">
            <div className="text-[10px] uppercase tracking-wider font-bold text-[#6B6B55] truncate">
              Yıllık Ağ Üyelik Geliri
            </div>
            <div className="text-xl font-bold font-mono text-[#C1622F]">
              €{metrics.totalAnnualListingFees.toLocaleString("tr-TR")}
              <span className="text-xs font-normal">/yıl</span>
            </div>
            <div className="text-[11px] text-[#525240] truncate">
              Tedarikçi başı €{params.annualPremiumListingFeeEuro}/yıl
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#F6F1E8]/80 border border-[#C8C4B0] space-y-1 min-w-0">
            <div className="text-[10px] uppercase tracking-wider font-bold text-[#6B6B55] truncate">
              Doğrulanan &amp; Sözleşme
            </div>
            <div className="text-xl font-bold font-mono text-[#1E1E12]">
              {metrics.verifiedOrFurtherCount}{" "}
              <span className="text-xs font-normal text-[#3B6D11]">
                ({metrics.signedPilotCount} Pilot)
              </span>
            </div>
            <div className="text-[11px] text-[#3B6D11] font-semibold truncate">
              WhatsApp &amp; Yasal Kalkan Hazır
            </div>
          </div>
        </div>
      </div>

      {/* 4-Tab Mobile-First Sub-Navigation */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        {[
          {
            id: "crm" as SubView,
            title: "1. B2B Lead & Pipeline",
            sub: `${leads.length} Aktör · 5 Çekirdek İlçe`,
            icon: Briefcase,
          },
          {
            id: "discovery_agent" as SubView,
            title: "2. Keşif & Araştırma Ajanı",
            sub: "Gemini 3.8 + Google Search",
            icon: Compass,
          },
          {
            id: "pitch_agent" as SubView,
            title: "3. B2B Pitch & İletişim Ajanı",
            sub: "WhatsApp, E-Posta & Saha Senaryosu",
            icon: MessageSquare,
          },
          {
            id: "mirofish_sim" as SubView,
            title: "4. Mirofish Parametre & Simülatör",
            sub: `%${params.supplierPayoutPercent} / %${params.platformCommissionPercent} / %${params.b2bPartnerPassivePercent} Ekonomisi`,
            icon: Sliders,
          },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = subView === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSubView(tab.id)}
              className={`min-h-[56px] p-3.5 rounded-2xl border text-left flex items-center gap-3 transition cursor-pointer ${
                active
                  ? "bg-[#3B6D11] text-white border-[#27500A] shadow-xs"
                  : "bg-white hover:bg-[#F6F1E8] text-[#1E1E12] border-[#C8C4B0]"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  active
                    ? "bg-white/20 text-white"
                    : "bg-[#EAF3DE] text-[#3B6D11]"
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-xs sm:text-sm font-bold truncate">
                  {tab.title}
                </div>
                <div
                  className={`text-[11px] truncate ${
                    active ? "text-white/90" : "text-[#6B6B55]"
                  }`}
                >
                  {tab.sub}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* =====================================================================
          SUB-VIEW 1: B2B LEAD & PIPELINE CRM (20+ ACTORS)
      ===================================================================== */}
      {subView === "crm" && (
        <div className="space-y-4 min-w-0">
          {/* Filters Bar */}
          <div className="bg-white border border-[#C8C4B0] rounded-2xl p-4 space-y-3 shadow-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
              <div className="relative sm:col-span-2 lg:col-span-1">
                <Search className="w-4 h-4 text-[#6B6B55] absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="İşletme, semt, not ara..."
                  className="w-full min-h-[44px] pl-9 pr-3 py-2 text-xs bg-[#F6F1E8]/70 border border-[#C8C4B0] rounded-xl text-[#1E1E12] focus:outline-none focus:border-[#3B6D11]"
                />
              </div>

              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                aria-label="Rol Tipine Göre Filtrele"
                className="min-h-[44px] px-3 py-2 text-xs bg-[#F6F1E8]/70 border border-[#C8C4B0] rounded-xl text-[#1E1E12] font-medium cursor-pointer"
              >
                <option value="all">Tüm Roller (Arz + Tedarikçi)</option>
                {ROLE_TYPES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>

              <select
                value={districtFilter}
                onChange={(e) => setDistrictFilter(e.target.value)}
                aria-label="İlçeye Göre Filtrele"
                className="min-h-[44px] px-3 py-2 text-xs bg-[#F6F1E8]/70 border border-[#C8C4B0] rounded-xl text-[#1E1E12] font-medium cursor-pointer"
              >
                <option value="all">Tüm 5 Çekirdek İlçe</option>
                {CORE_DISTRICTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                aria-label="Kategoriye Göre Filtrele"
                className="min-h-[44px] px-3 py-2 text-xs bg-[#F6F1E8]/70 border border-[#C8C4B0] rounded-xl text-[#1E1E12] font-medium cursor-pointer"
              >
                <option value="all">Tüm Kategoriler</option>
                {CATEGORY_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              <select
                value={stageFilter}
                onChange={(e) => setStageFilter(e.target.value)}
                aria-label="Pipeline Aşamasına Göre Filtrele"
                className="min-h-[44px] px-3 py-2 text-xs bg-[#F6F1E8]/70 border border-[#C8C4B0] rounded-xl text-[#1E1E12] font-medium cursor-pointer"
              >
                <option value="all">Tüm Pipeline Aşamaları</option>
                {PIPELINE_STAGES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#C8C4B0]/50 text-xs text-[#525240]">
              <span>
                Gösterilen: <strong>{filteredLeads.length}</strong> /{" "}
                {leads.length} B2B Aktör
              </span>
              {(roleFilter !== "all" ||
                districtFilter !== "all" ||
                stageFilter !== "all" ||
                categoryFilter !== "all" ||
                searchQuery) && (
                <button
                  type="button"
                  onClick={() => {
                    setRoleFilter("all");
                    setDistrictFilter("all");
                    setStageFilter("all");
                    setCategoryFilter("all");
                    setSearchQuery("");
                  }}
                  className="text-xs font-semibold text-[#C1622F] hover:underline cursor-pointer"
                >
                  Filtreleri Temizle
                </button>
              )}
            </div>
          </div>

          {/* Empty State */}
          {filteredLeads.length === 0 ? (
            <div className="bg-white border border-[#C8C4B0] rounded-2xl p-8 text-center space-y-3">
              <AlertCircle className="w-8 h-8 text-[#C1622F] mx-auto" />
              <h3 className="text-base font-bold text-[#1E1E12]">
                Eşleşen B2B Aktör Bulunamadı
              </h3>
              <p className="text-xs text-[#6B6B55] max-w-md mx-auto">
                Arama kriterlerinize uygun kayıt yok. Filtreleri sıfırlayabilir
                veya Keşif Ajanı ile yeni aktörler bulabilirsiniz.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredLeads.map((lead) => {
                const isSupply =
                  lead.roleType.includes("Konaklama") ||
                  lead.category.toLowerCase().includes("pmc") ||
                  lead.category.toLowerCase().includes("otel");
                const stageClass =
                  STAGE_STYLES[lead.stage] ||
                  "bg-[#EDE8DE] text-[#2C2C1A] border-[#C8C4B0]";

                return (
                  <div
                    key={lead.id}
                    className="bg-white border border-[#C8C4B0] rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between gap-4 min-w-0"
                  >
                    <div className="space-y-3 min-w-0">
                      {/* Badges & Stage Selector */}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                          <span
                            className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                              isSupply
                                ? "bg-[#EAF3DE] text-[#27500A] border-[#C0DD97]"
                                : "bg-[#F3E3D8] text-[#9C4E24] border-[#E5C4B0]"
                            }`}
                          >
                            {isSupply
                              ? "🏨 Konaklama Partneri (Arz)"
                              : "⚡ Hizmet Tedarikçisi (Revenue Node)"}
                          </span>
                          <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-[#F6F1E8] text-[#4A4A38] border border-[#C8C4B0]">
                            {lead.category}
                          </span>
                        </div>

                        <select
                          value={lead.stage}
                          onChange={(e) =>
                            handleStageChange(lead.id, e.target.value)
                          }
                          aria-label={`${lead.name} aşaması`}
                          className={`text-[11px] font-bold px-2.5 py-1.5 rounded-xl border cursor-pointer ${stageClass}`}
                        >
                          {PIPELINE_STAGES.map((st) => (
                            <option key={st} value={st}>
                              {st}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Title & Unit Pill */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="text-base sm:text-lg font-bold text-[#1E1E12] leading-snug break-words">
                            {lead.name}
                          </h3>
                          <p className="text-xs text-[#525240] flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3.5 h-3.5 text-[#3B6D11] shrink-0" />
                            <span className="truncate">
                              <strong>{lead.district}</strong> ·{" "}
                              {lead.neighborhood}
                            </span>
                          </p>
                        </div>

                        <div className="px-3 py-1.5 rounded-xl bg-[#F6F1E8] border border-[#C8C4B0] text-right shrink-0">
                          <span className="text-sm sm:text-base font-bold font-mono text-[#1E1E12] block leading-none">
                            {lead.unitCount}
                          </span>
                          <span className="text-[10px] font-semibold text-[#6B6B55]">
                            {lead.unitLabel}
                          </span>
                        </div>
                      </div>

                      {/* Legal Shield & Decision Maker Box */}
                      <div className="p-3 rounded-xl bg-[#F6F1E8]/70 border border-[#C8C4B0]/80 space-y-1.5 text-xs">
                        <div className="flex items-start gap-1.5 text-[#27500A] font-semibold">
                          <ShieldCheck className="w-4 h-4 text-[#3B6D11] shrink-0 mt-0.5" />
                          <span className="break-words">
                            {lead.legalShieldStatus}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#525240] pt-1 border-t border-[#C8C4B0]/50">
                          <span>
                            <strong>Karar Verici:</strong>{" "}
                            {lead.decisionMakerRole}
                            {lead.decisionMakerName
                              ? ` (${lead.decisionMakerName})`
                              : ""}
                          </span>
                          <span className="font-mono text-[#1E1E12] font-semibold">
                            {lead.phone}
                          </span>
                        </div>
                      </div>

                      {/* Mirofish Unit Economics Grid */}
                      <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-[#EAF3DE]/45 border border-[#C0DD97] text-center">
                        <div className="min-w-0">
                          <span className="text-[10px] font-bold uppercase text-[#525240] block truncate">
                            Aylık Hacim
                          </span>
                          <strong className="text-xs sm:text-sm font-mono font-bold text-[#1E1E12]">
                            €
                            {(
                              lead.estimatedMonthlyEuroVolume || 0
                            ).toLocaleString("tr-TR")}
                          </strong>
                        </div>
                        <div className="min-w-0 border-x border-[#C0DD97]">
                          <span className="text-[10px] font-bold uppercase text-[#27500A] block truncate">
                            {isSupply
                              ? `Partner %${params.b2bPartnerPassivePercent}`
                              : `Tedarikçi %${params.supplierPayoutPercent}`}
                          </span>
                          <strong className="text-xs sm:text-sm font-mono font-bold text-[#27500A]">
                            €
                            {(lead.partnerOrSupplierNetEuro || 0).toLocaleString(
                              "tr-TR"
                            )}
                          </strong>
                        </div>
                        <div className="min-w-0">
                          <span className="text-[10px] font-bold uppercase text-[#9C4E24] block truncate">
                            Platform %{params.platformCommissionPercent}
                          </span>
                          <strong className="text-xs sm:text-sm font-mono font-bold text-[#9C4E24]">
                            €
                            {(lead.platformCommissionEuro || 0).toLocaleString(
                              "tr-TR"
                            )}
                          </strong>
                        </div>
                      </div>

                      {/* Pitch Angle & Field Notes */}
                      <div className="space-y-1.5 text-xs">
                        <div className="p-2.5 rounded-xl bg-[#FFFCFA] border border-[#C8C4B0]/70">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#3B6D11] block mb-0.5">
                            🎯 Ajan Pitch Açısı (Pitch Angle)
                          </span>
                          <p className="text-[#2C2C1A] leading-relaxed break-words">
                            {lead.pitchAngle}
                          </p>
                        </div>
                        {lead.fieldNotes && (
                          <p className="text-[11px] text-[#525240] leading-relaxed px-1 break-words">
                            <strong>Saha Notu:</strong> {lead.fieldNotes}
                          </p>
                        )}
                      </div>

                      {/* Channels & Verified Sources */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                        <div className="flex flex-wrap items-center gap-1">
                          {(lead.listingChannels || []).map((ch) => (
                            <span
                              key={ch}
                              className="text-[10px] px-2 py-0.5 rounded-md bg-[#F6F1E8] text-[#4A4A38] border border-[#C8C4B0]"
                            >
                              {ch}
                            </span>
                          ))}
                        </div>
                        {lead.sources && lead.sources.length > 0 && (
                          <a
                            href={lead.sources[0].url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] font-semibold text-[#3B6D11] hover:underline inline-flex items-center gap-1"
                          >
                            <span>{lead.sources[0].title}</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Action Bar (Min 44px Touch Targets) */}
                    <div className="pt-3 border-t border-[#C8C4B0]/60 space-y-2">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => handleRunPitchAgent(lead)}
                          className="min-h-[44px] px-3 py-2 rounded-xl bg-[#3B6D11] hover:bg-[#27500A] text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 transition cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5 shrink-0" />
                          <span>AI Pitch Üret</span>
                        </button>

                        <a
                          href={formatWhatsAppUrl(
                            lead.phone,
                            lead.lastAgentPitch?.whatsappMessage ||
                              `Merhaba ${lead.name}, Purelyistanbul B2B Partnerlik Ekibinden ulaşıyorum. ${lead.pitchAngle}`
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="min-h-[44px] px-3 py-2 rounded-xl bg-[#EAF3DE] hover:bg-[#d8ebc2] text-[#27500A] border border-[#C0DD97] text-xs font-bold inline-flex items-center justify-center gap-1.5 transition"
                        >
                          <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                          <span>WhatsApp</span>
                        </a>

                        <button
                          type="button"
                          onClick={() => handleOnboardToLive(lead)}
                          className="col-span-2 sm:col-span-1 min-h-[44px] px-3 py-2 rounded-xl bg-[#C1622F] hover:bg-[#9C4E24] text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 transition cursor-pointer"
                        >
                          <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
                          <span>
                            {lead.onboardedToLiveId
                              ? "Canlıda Güncelle"
                              : "Canlıya Aktar"}
                          </span>
                        </button>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-1">
                        <div className="flex items-center gap-2 text-[11px] text-[#6B6B55] min-w-0">
                          <a
                            href={`mailto:${lead.email}?subject=${encodeURIComponent(
                              `Purelyistanbul B2B Partnerlik — ${lead.name}`
                            )}&body=${encodeURIComponent(
                              lead.lastAgentPitch?.emailBody || lead.pitchAngle
                            )}`}
                            className="hover:text-[#1E1E12] underline truncate"
                          >
                            {lead.email}
                          </a>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setIsNewLeadModal(false);
                              setEditingLead({ ...lead });
                            }}
                            className="min-h-[38px] px-2.5 py-1.5 rounded-lg bg-[#F6F1E8] hover:bg-[#EDE8DE] text-[#2C2C1A] border border-[#C8C4B0] text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Düzenle</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteLead(lead)}
                            className="min-h-[38px] px-2.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                            title="Sil"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          SUB-VIEW 2: KEŞİF & LEAD ARAŞTIRMA AJANI (GEMINI + GOOGLE SEARCH)
      ===================================================================== */}
      {subView === "discovery_agent" && (
        <div className="space-y-5 min-w-0">
          <div className="bg-white border border-[#C8C4B0] rounded-2xl p-4 sm:p-6 shadow-xs space-y-4">
            <div className="border-b border-[#C8C4B0]/60 pb-3">
              <div className="text-[11px] uppercase tracking-widest font-bold text-[#3B6D11]">
                Ajan 1 · Google Search Grounding + Mirofish Hesap Motoru
              </div>
              <h2 className="comus-serif text-2xl font-normal text-[#1E1E12]">
                Keşif &amp; B2B Lead Araştırma Ajanı
              </h2>
              <p className="text-xs text-[#525240] mt-1">
                5 çekirdek ilçede yeni PMC mülk yönetim şirketlerini, 10–35
                odalı butik otelleri ve D2 / A Grubu TÜRSAB belgeli hizmet
                tedarikçilerini JSON şemasına ve %85/%11/%4 gelir matematiğine
                uygun olarak keşfeder.
              </p>
            </div>

            <form onSubmit={handleRunDiscoveryAgent} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#2C2C1A] block mb-1">
                    Hedef Çekirdek İlçe
                  </label>
                  <select
                    value={discDistrict}
                    onChange={(e) => setDiscDistrict(e.target.value)}
                    className="w-full min-h-[44px] px-3 py-2 text-xs bg-[#F6F1E8] border border-[#C8C4B0] rounded-xl text-[#1E1E12] font-semibold"
                  >
                    {CORE_DISTRICTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#2C2C1A] block mb-1">
                    Aktör Rol Tipi
                  </label>
                  <select
                    value={discRoleType}
                    onChange={(e) => setDiscRoleType(e.target.value)}
                    className="w-full min-h-[44px] px-3 py-2 text-xs bg-[#F6F1E8] border border-[#C8C4B0] rounded-xl text-[#1E1E12] font-semibold"
                  >
                    {ROLE_TYPES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#2C2C1A] block mb-1">
                    Hedef Kategori
                  </label>
                  <select
                    value={discCategory}
                    onChange={(e) => setDiscCategory(e.target.value)}
                    className="w-full min-h-[44px] px-3 py-2 text-xs bg-[#F6F1E8] border border-[#C8C4B0] rounded-xl text-[#1E1E12] font-semibold"
                  >
                    {CATEGORY_OPTIONS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#2C2C1A] block mb-1">
                    Keşfedilecek Aday Sayısı
                  </label>
                  <select
                    value={discCount}
                    onChange={(e) => setDiscCount(Number(e.target.value))}
                    className="w-full min-h-[44px] px-3 py-2 text-xs bg-[#F6F1E8] border border-[#C8C4B0] rounded-xl text-[#1E1E12] font-semibold"
                  >
                    <option value={2}>2 Aday Aktör</option>
                    <option value={3}>3 Aday Aktör (Önerilen)</option>
                    <option value={5}>5 Aday Aktör</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#2C2C1A] block mb-1">
                  Özel Saha Odağı / Ajan Talimatı (İsteğe Bağlı)
                </label>
                <input
                  type="text"
                  value={discCustomFocus}
                  onChange={(e) => setDiscCustomFocus(e.target.value)}
                  placeholder="Örn: Galata ve Çukurcuma çevresinde resepsiyonsuz apart/süit işleten PMC firmaları veya Bebek kalkışlı yat filoları..."
                  className="w-full min-h-[44px] px-3.5 py-2 text-xs bg-[#F6F1E8]/70 border border-[#C8C4B0] rounded-xl text-[#1E1E12]"
                />
              </div>

              {discoveryError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
                  {discoveryError}
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <span className="text-[11px] text-[#6B6B55]">
                  Mevcut <strong>{leads.length}</strong> CRM kaydıyla çakışmayan
                  yeni adaylar üretilir.
                </span>
                <button
                  type="submit"
                  disabled={isDiscovering}
                  className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#3B6D11] hover:bg-[#27500A] disabled:opacity-60 text-white text-xs font-bold inline-flex items-center gap-2 cursor-pointer transition"
                >
                  {isDiscovering ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>
                        Gemini 3.8 Flash Saha Taraması Yapıyor...
                      </span>
                    </>
                  ) : (
                    <>
                      <Compass className="w-4 h-4" />
                      <span>Keşif Ajanını Başlat</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Discovered Leads Results */}
          {discoveredLeads.length > 0 && (
            <div className="bg-white border border-[#3B6D11] rounded-2xl p-4 sm:p-6 space-y-4 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#C8C4B0]/60">
                <div>
                  <span className="text-[11px] font-bold uppercase text-[#27500A] bg-[#EAF3DE] px-2.5 py-0.5 rounded-full border border-[#C0DD97]">
                    Keşif Tamamlandı ({discoveredLeads.length} Aday)
                  </span>
                  <p className="text-xs text-[#2C2C1A] font-medium mt-1">
                    {discoverySummary}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleSaveAllDiscovered}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-[#3B6D11] hover:bg-[#27500A] text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tümünü B2B CRM&apos;e Kaydet ({discoveredLeads.length})</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {discoveredLeads.map((cand) => (
                  <div
                    key={cand.id}
                    className="p-4 rounded-2xl bg-[#F6F1E8]/80 border border-[#C8C4B0] flex flex-col justify-between gap-3"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#EAF3DE] text-[#27500A]">
                          {cand.district} · {cand.neighborhood}
                        </span>
                        <span className="text-xs font-mono font-bold text-[#1E1E12]">
                          {cand.unitCount} {cand.unitLabel}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-[#1E1E12]">
                        {cand.name}
                      </h4>
                      <p className="text-[11px] text-[#27500A] font-semibold">
                        🛡️ {cand.legalShieldStatus}
                      </p>
                      <p className="text-xs text-[#525240]">{cand.pitchAngle}</p>
                      <div className="grid grid-cols-3 gap-2 p-2 rounded-xl bg-white border border-[#C8C4B0] text-center text-[11px]">
                        <div>
                          <span className="text-[9px] text-[#6B6B55] block">
                            AYLIK HACİM
                          </span>
                          <strong className="font-mono">
                            €{cand.estimatedMonthlyEuroVolume.toLocaleString("tr-TR")}
                          </strong>
                        </div>
                        <div>
                          <span className="text-[9px] text-[#27500A] block">
                            PARTNER NET
                          </span>
                          <strong className="font-mono text-[#27500A]">
                            €{cand.partnerOrSupplierNetEuro.toLocaleString("tr-TR")}
                          </strong>
                        </div>
                        <div>
                          <span className="text-[9px] text-[#9C4E24] block">
                            PLATFORM %11
                          </span>
                          <strong className="font-mono text-[#9C4E24]">
                            €{cand.platformCommissionEuro.toLocaleString("tr-TR")}
                          </strong>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSaveDiscoveredLead(cand)}
                      className="min-h-[44px] w-full py-2 px-3 rounded-xl bg-[#3B6D11] hover:bg-[#27500A] text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Bu Aktörü CRM&apos;e Ekle</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          SUB-VIEW 3: B2B PITCH & İLETİŞİM AJANI (OUTREACH STUDIO)
      ===================================================================== */}
      {subView === "pitch_agent" && (
        <div className="space-y-5 min-w-0">
          <div className="bg-white border border-[#C8C4B0] rounded-2xl p-4 sm:p-6 shadow-xs space-y-4">
            <div className="border-b border-[#C8C4B0]/60 pb-3">
              <div className="text-[11px] uppercase tracking-widest font-bold text-[#3B6D11]">
                Ajan 2 · Kişiselleştirilmiş B2B Satış &amp; Hakediş İletişimi
              </div>
              <h2 className="comus-serif text-2xl font-normal text-[#1E1E12]">
                B2B Pitch, WhatsApp &amp; Kurumsal E-Posta Ajanı
              </h2>
              <p className="text-xs text-[#525240] mt-1">
                Seçilen aktörün birim kapasitesi, karar verici rolü, yasal
                kalkan durumu ve Mirofish %85/%11/%4 gelir paylaşımı verileriyle
                doğrudan gönderime hazır iletişim paketi üretir.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-bold text-[#2C2C1A] block mb-1">
                  Hedef B2B Aktör Seçin ({leads.length})
                </label>
                <select
                  value={selectedPitchLeadId}
                  onChange={(e) => setSelectedPitchLeadId(e.target.value)}
                  className="w-full min-h-[44px] px-3 py-2 text-xs bg-[#F6F1E8] border border-[#C8C4B0] rounded-xl text-[#1E1E12] font-semibold"
                >
                  {leads.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name} ({l.unitCount} {l.unitLabel} · {l.district})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-[#2C2C1A] block mb-1">
                  İletişim Dili
                </label>
                <select
                  value={pitchLang}
                  onChange={(e) => setPitchLang(e.target.value as "tr" | "en")}
                  className="w-full min-h-[44px] px-3 py-2 text-xs bg-[#F6F1E8] border border-[#C8C4B0] rounded-xl text-[#1E1E12] font-semibold"
                >
                  <option value="tr">🇹🇷 Türkçe (Kurumsal B2B)</option>
                  <option value="en">🇬🇧 English (Global / Expat PMC)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-[#2C2C1A] block mb-1">
                  Pitch Tonu &amp; Yaklaşım
                </label>
                <select
                  value={pitchTone}
                  onChange={(e) => setPitchTone(e.target.value)}
                  className="w-full min-h-[44px] px-3 py-2 text-xs bg-[#F6F1E8] border border-[#C8C4B0] rounded-xl text-[#1E1E12] font-semibold"
                >
                  <option value="kurumsal_yatirimci">
                    ROI &amp; Pasif Gelir Odaklı (Karar Verici)
                  </option>
                  <option value="saha_hizli">
                    Hızlı Saha Randevusu &amp; Numune QR Stand
                  </option>
                  <option value="kurucu_ortak">
                    Faz-1 Pilot Kurucu Partner Daveti
                  </option>
                </select>
              </div>
            </div>

            {selectedPitchLead && (
              <div className="p-3.5 rounded-xl bg-[#F6F1E8]/80 border border-[#C8C4B0] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-0.5 min-w-0">
                  <div className="font-bold text-[#1E1E12]">
                    {selectedPitchLead.name} —{" "}
                    <span className="text-[#3B6D11]">
                      {selectedPitchLead.decisionMakerRole}
                    </span>
                  </div>
                  <div className="text-[11px] text-[#525240]">
                    Aylık Hacim:{" "}
                    <strong>
                      €
                      {selectedPitchLead.estimatedMonthlyEuroVolume.toLocaleString(
                        "tr-TR"
                      )}
                    </strong>{" "}
                    • Net Partner/Tedarikçi Hakedişi:{" "}
                    <strong className="text-[#27500A]">
                      €
                      {selectedPitchLead.partnerOrSupplierNetEuro.toLocaleString(
                        "tr-TR"
                      )}
                      /ay
                    </strong>{" "}
                    • Platform:{" "}
                    <strong>
                      €
                      {selectedPitchLead.platformCommissionEuro.toLocaleString(
                        "tr-TR"
                      )}
                      /ay
                    </strong>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleRunPitchAgent(selectedPitchLead)}
                  disabled={isGeneratingPitch}
                  className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#3B6D11] hover:bg-[#27500A] disabled:opacity-60 text-white text-xs font-bold inline-flex items-center gap-2 shrink-0 cursor-pointer"
                >
                  {isGeneratingPitch ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Pitch Paketi Üretiliyor...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Gemini 3.8 ile Pitch Üret</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {pitchError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
                {pitchError}
              </div>
            )}
          </div>

          {/* Generated Pitch Output Cards */}
          {activePitch && selectedPitchLead && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* WhatsApp Message Card */}
              <div className="bg-white border border-[#C8C4B0] rounded-2xl p-4 sm:p-5 space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-[#27500A] bg-[#EAF3DE] px-2.5 py-1 rounded-lg border border-[#C0DD97]">
                      💬 1. WhatsApp Doğrudan Mesajı
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        copyToClipboard(
                          activePitch.whatsappMessage,
                          "WhatsApp mesajı"
                        )
                      }
                      className="min-h-[38px] px-3 py-1.5 rounded-lg bg-[#F6F1E8] hover:bg-[#EDE8DE] text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Kopyala</span>
                    </button>
                  </div>
                  <textarea
                    rows={9}
                    value={activePitch.whatsappMessage}
                    onChange={(e) =>
                      setActivePitch({
                        ...activePitch,
                        whatsappMessage: e.target.value,
                      })
                    }
                    className="w-full p-3 text-xs bg-[#F6F1E8]/60 border border-[#C8C4B0] rounded-xl text-[#1E1E12] leading-relaxed font-sans"
                  />
                </div>

                <a
                  href={formatWhatsAppUrl(
                    selectedPitchLead.phone,
                    activePitch.whatsappMessage
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-h-[44px] w-full py-2.5 px-4 rounded-xl bg-[#3B6D11] hover:bg-[#27500A] text-white text-xs font-bold inline-flex items-center justify-center gap-2 transition"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>
                    WhatsApp Üzerinden {selectedPitchLead.name} Yetkilisine Gönder
                  </span>
                </a>
              </div>

              {/* Corporate Email Card */}
              <div className="bg-white border border-[#C8C4B0] rounded-2xl p-4 sm:p-5 space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-[#9C4E24] bg-[#F3E3D8] px-2.5 py-1 rounded-lg border border-[#E5C4B0]">
                      ✉️ 2. Kurumsal B2B E-Posta Teklifi
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        copyToClipboard(
                          `${activePitch.emailSubject}\n\n${activePitch.emailBody}`,
                          "E-Posta metni"
                        )
                      }
                      className="min-h-[38px] px-3 py-1.5 rounded-lg bg-[#F6F1E8] hover:bg-[#EDE8DE] text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Kopyala</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={activePitch.emailSubject}
                    onChange={(e) =>
                      setActivePitch({
                        ...activePitch,
                        emailSubject: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 text-xs font-bold bg-[#F6F1E8]/60 border border-[#C8C4B0] rounded-xl text-[#1E1E12]"
                  />
                  <textarea
                    rows={7}
                    value={activePitch.emailBody}
                    onChange={(e) =>
                      setActivePitch({
                        ...activePitch,
                        emailBody: e.target.value,
                      })
                    }
                    className="w-full p-3 text-xs bg-[#F6F1E8]/60 border border-[#C8C4B0] rounded-xl text-[#1E1E12] leading-relaxed font-sans"
                  />
                </div>

                <a
                  href={`mailto:${selectedPitchLead.email}?subject=${encodeURIComponent(
                    activePitch.emailSubject
                  )}&body=${encodeURIComponent(activePitch.emailBody)}`}
                  className="min-h-[44px] w-full py-2.5 px-4 rounded-xl bg-[#C1622F] hover:bg-[#9C4E24] text-white text-xs font-bold inline-flex items-center justify-center gap-2 transition"
                >
                  <Mail className="w-4 h-4" />
                  <span>
                    {selectedPitchLead.email} Adresine E-Posta Gönder
                  </span>
                </a>
              </div>

              {/* Field Visit Script */}
              <div className="bg-white border border-[#C8C4B0] rounded-2xl p-4 sm:p-5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#1E1E12]">
                    🤝 3. Saha Ziyareti &amp; Karar Verici Sunum Akışı
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      copyToClipboard(
                        activePitch.fieldScript,
                        "Saha senaryosu"
                      )
                    }
                    className="text-xs text-[#3B6D11] font-semibold hover:underline cursor-pointer"
                  >
                    Kopyala
                  </button>
                </div>
                <pre className="whitespace-pre-wrap text-xs text-[#2C2C1A] bg-[#F6F1E8]/70 p-3.5 rounded-xl border border-[#C8C4B0] font-sans leading-relaxed">
                  {activePitch.fieldScript}
                </pre>
              </div>

              {/* Financial Unit Economics Summary */}
              <div className="bg-white border border-[#C8C4B0] rounded-2xl p-4 sm:p-5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#27500A]">
                    📊 4. Mirofish Birim Ekonomisi &amp; ROI Özeti
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      copyToClipboard(
                        activePitch.financialSummary,
                        "Finansal özet"
                      )
                    }
                    className="text-xs text-[#3B6D11] font-semibold hover:underline cursor-pointer"
                  >
                    Kopyala
                  </button>
                </div>
                <pre className="whitespace-pre-wrap text-xs text-[#1E1E12] bg-[#EAF3DE]/50 p-3.5 rounded-xl border border-[#C0DD97] font-mono leading-relaxed">
                  {activePitch.financialSummary}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          SUB-VIEW 4: MIROFISH SİSTEM PARAMETRELERİ & 85/11/4 SİMÜLATÖRÜ
      ===================================================================== */}
      {subView === "mirofish_sim" && (
        <div className="space-y-5 min-w-0">
          <div className="bg-white border border-[#C8C4B0] rounded-2xl p-4 sm:p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#C8C4B0]/60">
              <div>
                <div className="text-[11px] uppercase tracking-widest font-bold text-[#3B6D11]">
                  Mirofish Sistem Parametreleri &amp; Birim Ekonomisi
                </div>
                <h2 className="comus-serif text-2xl font-normal text-[#1E1E12]">
                  Faz-1 Pilot Hedefi &amp; %85 / %11 / %4 Gelir Dağılım Motoru
                </h2>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (
                      confirm(
                        "Tüm B2B Lead listesini ve Mirofish parametrelerini ilk 20 aktörlük varsayılan AI Studio JSON verisine sıfırlamak istiyor musunuz?"
                      )
                    ) {
                      XeniosStore.resetB2BMirofishToSeed();
                      refresh();
                      toast.success(
                        "B2B CRM verileri başlangıçtaki 20 aktörlük sete sıfırlandı."
                      );
                    }
                  }}
                  className="min-h-[44px] px-3.5 py-2 rounded-xl bg-[#F6F1E8] hover:bg-[#EDE8DE] text-[#2C2C1A] border border-[#C8C4B0] text-xs font-semibold cursor-pointer"
                >
                  Varsayılan 20 Lead&apos;e Sıfırla
                </button>
                <button
                  type="button"
                  onClick={handleRecalculateAllEconomics}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-[#3B6D11] hover:bg-[#27500A] text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Parametreleri Kaydet &amp; Tüm Hakedişleri Güncelle</span>
                </button>
              </div>
            </div>

            {/* Progress Bars towards Phase-1 Target */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-[#F6F1E8] border border-[#C8C4B0] space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span>
                    Faz-1 Partner Hedefi ({metrics.totalActors} /{" "}
                    {params.phase1PilotPartnersTarget} Partner)
                  </span>
                  <span className="text-[#3B6D11] font-mono">
                    %{metrics.partnerProgressPct}
                  </span>
                </div>
                <div className="w-full h-3 rounded-full bg-[#EDE8DE] overflow-hidden border border-[#C8C4B0]">
                  <div
                    className="h-full bg-[#3B6D11] transition-all duration-300"
                    style={{ width: `${metrics.partnerProgressPct}%` }}
                  />
                </div>
                <p className="text-[11px] text-[#525240]">
                  Tavan Hedef Aktör: {params.b2bTargetActorsMax} • Butik Otel:{" "}
                  {params.boutiqueHotelRange} • PMC: {params.pmcCompanyRange}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#F6F1E8] border border-[#C8C4B0] space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span>
                    Faz-1 Oda/Daire QR Kapsaması (
                    {metrics.totalSupplyUnits.toLocaleString("tr-TR")} /{" "}
                    {params.phase1PilotUnitsTarget.toLocaleString("tr-TR")}{" "}
                    Birim)
                  </span>
                  <span className="text-[#C1622F] font-mono">
                    %{metrics.unitProgressPct}
                  </span>
                </div>
                <div className="w-full h-3 rounded-full bg-[#EDE8DE] overflow-hidden border border-[#C8C4B0]">
                  <div
                    className="h-full bg-[#C1622F] transition-all duration-300"
                    style={{ width: `${metrics.unitProgressPct}%` }}
                  />
                </div>
                <p className="text-[11px] text-[#525240]">
                  Simülasyon Tavanı:{" "}
                  {params.simulationCeilingUnits.toLocaleString("tr-TR")} Birim
                  • Yabancı Turist: {params.annualForeignTouristsRange}
                </p>
              </div>
            </div>

            {/* Editable Mirofish Parameters Form */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-2">
              <div>
                <label className="text-xs font-bold text-[#2C2C1A] block mb-1">
                  Ortalama Sepet Tutarı (€)
                </label>
                <input
                  type="number"
                  value={params.averageBasketEuro}
                  onChange={(e) =>
                    setParams({
                      ...params,
                      averageBasketEuro: Number(e.target.value),
                    })
                  }
                  className="w-full min-h-[44px] px-3 py-2 text-xs font-mono font-bold bg-[#F6F1E8] border border-[#C8C4B0] rounded-xl"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#27500A] block mb-1">
                  Tedarikçi Net Hakediş (%)
                </label>
                <input
                  type="number"
                  value={params.supplierPayoutPercent}
                  onChange={(e) =>
                    setParams({
                      ...params,
                      supplierPayoutPercent: Number(e.target.value),
                    })
                  }
                  className="w-full min-h-[44px] px-3 py-2 text-xs font-mono font-bold bg-[#EAF3DE] border border-[#C0DD97] rounded-xl text-[#27500A]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#9C4E24] block mb-1">
                  Platform Komisyonu (%)
                </label>
                <input
                  type="number"
                  value={params.platformCommissionPercent}
                  onChange={(e) =>
                    setParams({
                      ...params,
                      platformCommissionPercent: Number(e.target.value),
                    })
                  }
                  className="w-full min-h-[44px] px-3 py-2 text-xs font-mono font-bold bg-[#F3E3D8] border border-[#E5C4B0] rounded-xl text-[#9C4E24]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#2C2C1A] block mb-1">
                  Konaklama Partneri Pasif Pay (%)
                </label>
                <input
                  type="number"
                  value={params.b2bPartnerPassivePercent}
                  onChange={(e) =>
                    setParams({
                      ...params,
                      b2bPartnerPassivePercent: Number(e.target.value),
                    })
                  }
                  className="w-full min-h-[44px] px-3 py-2 text-xs font-mono font-bold bg-[#F6F1E8] border border-[#C8C4B0] rounded-xl"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#2C2C1A] block mb-1">
                  Tedarikçi Yıllık Ağ Bedeli (€)
                </label>
                <input
                  type="number"
                  value={params.annualPremiumListingFeeEuro}
                  onChange={(e) =>
                    setParams({
                      ...params,
                      annualPremiumListingFeeEuro: Number(e.target.value),
                    })
                  }
                  className="w-full min-h-[44px] px-3 py-2 text-xs font-mono font-bold bg-[#F6F1E8] border border-[#C8C4B0] rounded-xl"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#2C2C1A] block mb-1">
                  Faz-1 Pilot Partner Hedefi
                </label>
                <input
                  type="number"
                  value={params.phase1PilotPartnersTarget}
                  onChange={(e) =>
                    setParams({
                      ...params,
                      phase1PilotPartnersTarget: Number(e.target.value),
                    })
                  }
                  className="w-full min-h-[44px] px-3 py-2 text-xs font-mono font-bold bg-[#F6F1E8] border border-[#C8C4B0] rounded-xl"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#2C2C1A] block mb-1">
                  Faz-1 Pilot Birim Hedefi (Oda/Daire)
                </label>
                <input
                  type="number"
                  value={params.phase1PilotUnitsTarget}
                  onChange={(e) =>
                    setParams({
                      ...params,
                      phase1PilotUnitsTarget: Number(e.target.value),
                    })
                  }
                  className="w-full min-h-[44px] px-3 py-2 text-xs font-mono font-bold bg-[#F6F1E8] border border-[#C8C4B0] rounded-xl"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#2C2C1A] block mb-1">
                  Pazar Kapsama Oranı (%)
                </label>
                <input
                  type="number"
                  value={params.marketCoveragePercent}
                  onChange={(e) =>
                    setParams({
                      ...params,
                      marketCoveragePercent: Number(e.target.value),
                    })
                  }
                  className="w-full min-h-[44px] px-3 py-2 text-xs font-mono font-bold bg-[#F6F1E8] border border-[#C8C4B0] rounded-xl"
                />
              </div>
            </div>

            {/* 5 Core Districts Breakdown Table */}
            <div className="pt-4 border-t border-[#C8C4B0]/60 space-y-3">
              <h3 className="text-sm font-bold text-[#1E1E12]">
                5 Çekirdek İlçeye Göre B2B Portföy &amp; Gelir Dağılımı
              </h3>
              <div className="comus-table-wrapper">
                <table className="comus-responsive-table text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#C8C4B0] text-[11px] uppercase text-[#6B6B55]">
                      <th scope="col" className="py-2.5 px-3">
                        Çekirdek İlçe
                      </th>
                      <th scope="col" className="py-2.5 px-3">
                        Toplam Aktör
                      </th>
                      <th scope="col" className="py-2.5 px-3">
                        Konaklama Birimi (Arz)
                      </th>
                      <th scope="col" className="py-2.5 px-3">
                        Aylık Tahmini Hacim
                      </th>
                      <th scope="col" className="py-2.5 px-3">
                        Platform %11 Komisyon
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#C8C4B0]/50">
                    {CORE_DISTRICTS.map((dist) => {
                      const dLeads = leads.filter((l) => l.district === dist);
                      const dSupplyUnits = dLeads
                        .filter(
                          (l) =>
                            l.roleType.includes("Konaklama") ||
                            l.category.toLowerCase().includes("pmc") ||
                            l.category.toLowerCase().includes("otel")
                        )
                        .reduce((s, l) => s + (Number(l.unitCount) || 0), 0);
                      const dVol = dLeads.reduce(
                        (s, l) =>
                          s + (Number(l.estimatedMonthlyEuroVolume) || 0),
                        0
                      );
                      const dComm = dLeads.reduce(
                        (s, l) => s + (Number(l.platformCommissionEuro) || 0),
                        0
                      );
                      return (
                        <tr key={dist} className="hover:bg-[#F6F1E8]/60">
                          <th
                            scope="row"
                            className="py-2.5 px-3 font-bold text-[#1E1E12]"
                          >
                            {dist}
                          </th>
                          <td className="py-2.5 px-3 font-mono">
                            {dLeads.length} aktör
                          </td>
                          <td className="py-2.5 px-3 font-mono font-semibold text-[#3B6D11]">
                            {dSupplyUnits.toLocaleString("tr-TR")} birim
                          </td>
                          <td className="py-2.5 px-3 font-mono font-semibold">
                            €{dVol.toLocaleString("tr-TR")}/ay
                          </td>
                          <td className="py-2.5 px-3 font-mono font-bold text-[#9C4E24]">
                            €{dComm.toLocaleString("tr-TR")}/ay
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL 1: CREATE / EDIT B2B LEAD
      ===================================================================== */}
      {editingLead && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-[#FFFCFA] border border-[#C8C4B0] rounded-2xl max-w-2xl w-full p-4 sm:p-6 space-y-4 my-4 max-h-[90dvh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#C8C4B0] pb-3">
              <div>
                <h3 className="comus-serif text-xl font-medium text-[#1E1E12]">
                  {isNewLeadModal
                    ? "Yeni B2B Aktör / Lead Kaydı"
                    : `B2B Aktör Düzenle: ${editingLead.name}`}
                </h3>
                <p className="text-xs text-[#6B6B55]">
                  Mirofish B2B Hospitality SaaS &amp; Curated Marketplace Şeması
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingLead(null);
                  setIsNewLeadModal(false);
                }}
                className="min-h-[40px] min-w-[40px] p-2 rounded-xl bg-[#F6F1E8] text-[#2C2C1A] flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveLeadModal} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="font-bold text-[#2C2C1A] block mb-1">
                    İşletme / Partner Adı *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingLead.name}
                    onChange={(e) =>
                      setEditingLead({ ...editingLead, name: e.target.value })
                    }
                    className="w-full min-h-[42px] px-3 py-2 bg-[#F6F1E8] border border-[#C8C4B0] rounded-xl"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#2C2C1A] block mb-1">
                    Rol Tipi
                  </label>
                  <select
                    value={editingLead.roleType}
                    onChange={(e) =>
                      setEditingLead({
                        ...editingLead,
                        roleType: e.target.value,
                      })
                    }
                    className="w-full min-h-[42px] px-3 py-2 bg-[#F6F1E8] border border-[#C8C4B0] rounded-xl"
                  >
                    {ROLE_TYPES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-[#2C2C1A] block mb-1">
                    Kategori
                  </label>
                  <input
                    type="text"
                    value={editingLead.category}
                    onChange={(e) =>
                      setEditingLead({
                        ...editingLead,
                        category: e.target.value,
                      })
                    }
                    className="w-full min-h-[42px] px-3 py-2 bg-[#F6F1E8] border border-[#C8C4B0] rounded-xl"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#2C2C1A] block mb-1">
                    Çekirdek İlçe
                  </label>
                  <select
                    value={editingLead.district}
                    onChange={(e) =>
                      setEditingLead({
                        ...editingLead,
                        district: e.target.value,
                      })
                    }
                    className="w-full min-h-[42px] px-3 py-2 bg-[#F6F1E8] border border-[#C8C4B0] rounded-xl"
                  >
                    {CORE_DISTRICTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-[#2C2C1A] block mb-1">
                    Mahalle / Alt Bölge
                  </label>
                  <input
                    type="text"
                    value={editingLead.neighborhood}
                    onChange={(e) =>
                      setEditingLead({
                        ...editingLead,
                        neighborhood: e.target.value,
                      })
                    }
                    className="w-full min-h-[42px] px-3 py-2 bg-[#F6F1E8] border border-[#C8C4B0] rounded-xl"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#2C2C1A] block mb-1">
                    Birim Sayısı (unitCount)
                  </label>
                  <input
                    type="number"
                    value={editingLead.unitCount}
                    onChange={(e) =>
                      setEditingLead({
                        ...editingLead,
                        unitCount: Number(e.target.value),
                      })
                    }
                    className="w-full min-h-[42px] px-3 py-2 bg-[#F6F1E8] border border-[#C8C4B0] rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#2C2C1A] block mb-1">
                    Birim Etiketi (Daire / Oda / Yat / VIP Araç)
                  </label>
                  <input
                    type="text"
                    value={editingLead.unitLabel}
                    onChange={(e) =>
                      setEditingLead({
                        ...editingLead,
                        unitLabel: e.target.value,
                      })
                    }
                    className="w-full min-h-[42px] px-3 py-2 bg-[#F6F1E8] border border-[#C8C4B0] rounded-xl"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#2C2C1A] block mb-1">
                    Telefon
                  </label>
                  <input
                    type="text"
                    value={editingLead.phone}
                    onChange={(e) =>
                      setEditingLead({ ...editingLead, phone: e.target.value })
                    }
                    className="w-full min-h-[42px] px-3 py-2 bg-[#F6F1E8] border border-[#C8C4B0] rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#2C2C1A] block mb-1">
                    E-Posta
                  </label>
                  <input
                    type="email"
                    value={editingLead.email}
                    onChange={(e) =>
                      setEditingLead({ ...editingLead, email: e.target.value })
                    }
                    className="w-full min-h-[42px] px-3 py-2 bg-[#F6F1E8] border border-[#C8C4B0] rounded-xl"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#2C2C1A] block mb-1">
                    Karar Verici Ünvanı
                  </label>
                  <input
                    type="text"
                    value={editingLead.decisionMakerRole}
                    onChange={(e) =>
                      setEditingLead({
                        ...editingLead,
                        decisionMakerRole: e.target.value,
                      })
                    }
                    className="w-full min-h-[42px] px-3 py-2 bg-[#F6F1E8] border border-[#C8C4B0] rounded-xl"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#2C2C1A] block mb-1">
                    Aylık Tahmini Euro Hacmi (€)
                  </label>
                  <input
                    type="number"
                    value={editingLead.estimatedMonthlyEuroVolume}
                    onChange={(e) => {
                      const vol = Number(e.target.value) || 0;
                      const isSupply =
                        editingLead.roleType.includes("Konaklama") ||
                        editingLead.category.toLowerCase().includes("pmc") ||
                        editingLead.category.toLowerCase().includes("otel");
                      setEditingLead({
                        ...editingLead,
                        estimatedMonthlyEuroVolume: vol,
                        partnerOrSupplierNetEuro: Math.round(
                          vol *
                            ((isSupply
                              ? params.b2bPartnerPassivePercent
                              : params.supplierPayoutPercent) /
                              100)
                        ),
                        platformCommissionEuro: Math.round(
                          vol * (params.platformCommissionPercent / 100)
                        ),
                      });
                    }}
                    className="w-full min-h-[42px] px-3 py-2 bg-[#F6F1E8] border border-[#C8C4B0] rounded-xl font-mono font-bold"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="font-bold text-[#2C2C1A] block mb-1">
                    Yasal Kalkan Durumu (legalShieldStatus)
                  </label>
                  <input
                    type="text"
                    value={editingLead.legalShieldStatus}
                    onChange={(e) =>
                      setEditingLead({
                        ...editingLead,
                        legalShieldStatus: e.target.value,
                      })
                    }
                    className="w-full min-h-[42px] px-3 py-2 bg-[#F6F1E8] border border-[#C8C4B0] rounded-xl"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="font-bold text-[#2C2C1A] block mb-1">
                    Pitch Açısı (pitchAngle)
                  </label>
                  <textarea
                    rows={2}
                    value={editingLead.pitchAngle}
                    onChange={(e) =>
                      setEditingLead({
                        ...editingLead,
                        pitchAngle: e.target.value,
                      })
                    }
                    className="w-full p-3 bg-[#F6F1E8] border border-[#C8C4B0] rounded-xl"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="font-bold text-[#2C2C1A] block mb-1">
                    Saha Notları (fieldNotes)
                  </label>
                  <textarea
                    rows={2}
                    value={editingLead.fieldNotes}
                    onChange={(e) =>
                      setEditingLead({
                        ...editingLead,
                        fieldNotes: e.target.value,
                      })
                    }
                    className="w-full p-3 bg-[#F6F1E8] border border-[#C8C4B0] rounded-xl"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#C8C4B0]">
                <button
                  type="button"
                  onClick={() => {
                    setEditingLead(null);
                    setIsNewLeadModal(false);
                  }}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-[#F6F1E8] text-[#2C2C1A] font-semibold cursor-pointer"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="min-h-[44px] px-5 py-2 rounded-xl bg-[#3B6D11] hover:bg-[#27500A] text-white font-bold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Kaydet ve Senkronize Et</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL 2: JSON IMPORT (FILE UPLOAD OR PASTE)
      ===================================================================== */}
      {isJsonImportOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-[#FFFCFA] border border-[#C8C4B0] rounded-2xl max-w-xl w-full p-4 sm:p-6 space-y-4 my-4 max-h-[90dvh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#C8C4B0] pb-3">
              <div className="flex items-center gap-2">
                <FileJson className="w-5 h-5 text-[#3B6D11]" />
                <h3 className="comus-serif text-xl font-medium text-[#1E1E12]">
                  AI Studio B2B Ajan JSON İçe Aktar
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsJsonImportOpen(false)}
                className="min-h-[40px] min-w-[40px] p-2 rounded-xl bg-[#F6F1E8] text-[#2C2C1A] flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-[#525240]">
                Google AI Studio uygulamanızdan dışa aktardığınız{" "}
                <code>mirofishSystemParameters</code> ve <code>suppliers</code>{" "}
                içeren JSON dosyasını seçebilir veya doğrudan aşağıya
                yapıştırabilirsiniz.
              </p>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="min-h-[48px] w-full py-3 px-4 rounded-xl bg-[#EAF3DE] hover:bg-[#d8ebc2] text-[#27500A] border border-[#C0DD97] font-bold flex items-center justify-center gap-2 cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>Bilgisayardan / Telefondan .JSON Dosyası Seç</span>
              </button>

              <div>
                <label className="font-bold text-[#2C2C1A] block mb-1">
                  Veya JSON İçeriğini Buraya Yapıştırın:
                </label>
                <textarea
                  rows={7}
                  value={jsonPasteText}
                  onChange={(e) => setJsonPasteText(e.target.value)}
                  placeholder='{ "project": "Purelyistanbul B2B Hospitality SaaS...", "mirofishSystemParameters": { ... }, "suppliers": [ ... ] }'
                  className="w-full p-3 font-mono text-[11px] bg-[#F6F1E8] border border-[#C8C4B0] rounded-xl text-[#1E1E12]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsJsonImportOpen(false)}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-[#F6F1E8] text-[#2C2C1A] font-semibold cursor-pointer"
                >
                  Kapat
                </button>
                <button
                  type="button"
                  disabled={!jsonPasteText.trim()}
                  onClick={() => handleImportJsonString(jsonPasteText)}
                  className="min-h-[44px] px-5 py-2 rounded-xl bg-[#3B6D11] hover:bg-[#27500A] disabled:opacity-50 text-white font-bold cursor-pointer"
                >
                  Yapıştırılan JSON&apos;u İçe Aktar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

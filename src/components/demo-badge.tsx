"use client";

import { useState } from 'react';
import { AlertTriangle, EyeOff, X, CheckCircle2 } from 'lucide-react';
import { XeniosStore } from '@/lib/store';
import { toast } from 'sonner';

interface DemoBadgeProps {
  label?: string;
  size?: 'sm' | 'md';
  className?: string;
}

export function DemoBadge({ label = "Örnek Vaka", size = "sm", className = "" }: DemoBadgeProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleDismissAllDemo = () => {
    XeniosStore.setHideDemoData(true);
    setIsOpen(false);
    toast.success("Tüm örnek ve demo vakalar sistemden gizlendi.", {
      description: "Artık yalnızca gerçek misafir ve otel talepleri görüntülenecektir."
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(true);
        }}
        title="Bu bir örnek vakadır. Gizlemek için tıklayın."
        className={`inline-flex items-center gap-1 font-bold rounded-full transition cursor-pointer shrink-0 ${
          size === 'sm'
            ? 'px-2 py-0.5 text-[9px] bg-amber-500/20 text-amber-900 border border-amber-400 hover:bg-amber-500/30'
            : 'px-2.5 py-1 text-xs bg-amber-500/20 text-amber-900 border border-amber-400 hover:bg-amber-500/30'
        } ${className}`}
      >
        <AlertTriangle className="w-2.5 h-2.5 text-amber-700" />
        <span>{label}</span>
      </button>

      {/* Confirmation Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(false);
          }}
        >
          <div
            className="bg-white   rounded-3xl max-w-md w-full p-6 shadow-2xl border border-amber-200 animate-in zoom-in-95 space-y-4 text-slate-900 "
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 border-b border-amber-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-800 shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold font-serif text-slate-900 ">Örnek Demo Vaka</h3>
                  <p className="text-xs text-slate-500 ">Sistem Tanıtım ve Test Verisi</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-7 h-7 rounded-full bg-zinc-100 hover:bg-zinc-200 text-slate-500  flex items-center justify-center text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs text-slate-600  leading-relaxed">
              <p>
                Bu kayıt, platformun işleyişini ve panel özelliklerini göstermek amacıyla oluşturulmuş <strong>örnek / demo</strong> bir vakadır.
              </p>
              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200/80 text-amber-950 font-medium">
                Örnek verileri kapatmak istediğinizde, sistemdeki tüm örnek talepler, rezervasyonlar ve şikayetler gizlenir; yalnızca gerçek kullanıcı kayıtları gösterilir.
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-zinc-200 text-xs font-bold text-slate-700 hover:bg-zinc-50 transition cursor-pointer"
              >
                Kapat
              </button>
              <button
                type="button"
                onClick={handleDismissAllDemo}
                className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-zinc-950 text-xs font-bold shadow-md shadow-amber-500/20 transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <EyeOff className="w-3.5 h-3.5" />
                <span>Bir Daha Gösterme</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

"use client";

import { useState } from 'react';
import { ServiceField, ServiceModuleConfig, buildInitialDetails, resolveFieldOptions } from '@/lib/service-modules';
import { AlertTriangle } from 'lucide-react';

interface ServiceRequestFormProps {
  config: ServiceModuleConfig;
  onSubmit: (details: Record<string, any>) => void;
  onCancel: () => void;
  isSubmitting: boolean;
  pricing?: Record<string, number>;
  fieldOptionOverrides?: Record<string, string[]>;
}

function FieldInput({ field, options, value, onChange }: { field: ServiceField; options: string[]; value: any; onChange: (v: any) => void }) {
  const baseClass = "w-full font-luxury-sans text-xs p-2.5 rounded-xl border border-[#C4B8A4] bg-[#FAF8F4] text-[#141414] placeholder:text-[#78716C] focus:outline-none focus:ring-2 focus:ring-[#8E7252]/40";

  switch (field.type) {
    case 'select':
      return (
        <select className={baseClass} value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
          {options.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      );

    case 'multiselect':
      return (
        <div className="flex flex-wrap gap-1.5">
          {options.map((opt) => {
            const selected: string[] = Array.isArray(value) ? value : [];
            const active = selected.includes(opt);
            return (
              <button
                type="button"
                key={opt}
                onClick={() => {
                  const next = active ? selected.filter((s) => s !== opt) : [...selected, opt];
                  onChange(next);
                }}
                className={`font-luxury-sans px-3 py-1.5 rounded-xl text-[11px] font-semibold border transition cursor-pointer ${
                  active
                    ? 'bg-gradient-to-b from-[#9E7B42] to-[#7D5E2A] border-[#7D5E2A] text-white shadow-2xs'
                    : 'bg-[#FAF8F4] border-[#C4B8A4] text-[#221F1C] hover:bg-[#EFE8DA]'
                }`}
              >
                {opt}
              </button>
            );
          })}
        </div>
      );

    case 'number':
      return (
        <input
          type="number"
          className={baseClass}
          min={field.min}
          max={field.max}
          value={value ?? field.min ?? 1}
          onChange={(e) => onChange(Number(e.target.value))}
        />
      );

    case 'time':
      return (
        <input type="time" className={baseClass} value={value ?? ''} onChange={(e) => onChange(e.target.value)} />
      );

    case 'text':
      return (
        <input
          type="text"
          className={baseClass}
          placeholder={field.placeholder}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
        />
      );

    case 'textarea':
      return (
        <textarea
          className={`${baseClass} h-20`}
          placeholder={field.placeholder}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
        />
      );

    case 'toggle': {
      const [onLabel, offLabel] = field.toggleLabels ?? ['Evet', 'Hayır'];
      const isOn = !!value;
      const isAlert = field.key === 'urgentHelp';
      return (
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onChange(true)}
            className={`font-luxury-sans flex-1 py-2 rounded-xl text-[11px] font-bold border transition cursor-pointer ${
              isOn
                ? isAlert ? 'bg-[#1D2025] border-[#8E7252] text-white' : 'bg-gradient-to-b from-[#9E7B42] to-[#7D5E2A] border-[#7D5E2A] text-white'
                : 'bg-[#FAF8F4] border-[#C4B8A4] text-[#5C4938]'
            }`}
          >
            {onLabel}
          </button>
          <button
            type="button"
            onClick={() => onChange(false)}
            className={`font-luxury-sans flex-1 py-2 rounded-xl text-[11px] font-bold border transition cursor-pointer ${
              !isOn ? 'bg-[#1D2025] border-[#1D2025] text-white' : 'bg-[#FAF8F4] border-[#C4B8A4] text-[#5C4938]'
            }`}
          >
            {offLabel}
          </button>
        </div>
      );
    }

    default:
      return null;
  }
}

export function ServiceRequestForm({ config, onSubmit, onCancel, isSubmitting, pricing = {}, fieldOptionOverrides }: ServiceRequestFormProps) {
  const [details, setDetails] = useState<Record<string, any>>(() => buildInitialDetails(config));

  const setField = (key: string, value: any) => setDetails((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="space-y-3 font-luxury-sans">
      {config.fields.map((field) => {
        if (field.type === 'display') {
          return (
            <div key={field.key} className="bg-[#FAF8F4]/90 p-3 rounded-xl border border-[#C4B8A4] flex items-center justify-between gap-2 text-xs">
              <span className="font-semibold text-[#3D352E]">{field.label}</span>
              <span className="font-luxury-serif text-sm font-bold text-[#7D5E2A] text-right">{field.compute ? field.compute(details, pricing) : '—'}</span>
            </div>
          );
        }

        const isUrgentAlert = field.key === 'urgentHelp' && !!details[field.key];
        const options = resolveFieldOptions(field, fieldOptionOverrides);

        return (
          <div key={field.key} className="space-y-1">
            <label className="text-[11px] font-bold text-[#141414] flex items-center gap-1">
              {field.label}
              {field.optional && <span className="text-[#6B5A48] font-normal">(İsteğe Bağlı)</span>}
              {isUrgentAlert && <AlertTriangle className="w-3.5 h-3.5 text-[#8E7252]" />}
            </label>
            <FieldInput field={field} options={options} value={details[field.key]} onChange={(v) => setField(field.key, v)} />
          </div>
        );
      })}

      <div className="flex items-center gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2.5 rounded-xl bg-[#FAF8F4] hover:bg-[#EFE8DA] border border-[#C4B8A4] text-xs font-bold text-[#141414] transition cursor-pointer"
        >
          İptal
        </button>
        <button
          type="button"
          onClick={() => onSubmit(details)}
          disabled={isSubmitting}
          className="flex-1 py-2.5 rounded-xl bg-gradient-to-b from-[#9E7B42] to-[#7D5E2A] hover:from-[#8C6D46] hover:to-[#6E501E] text-white text-xs font-bold shadow-sm transition cursor-pointer"
        >
          {isSubmitting ? 'Gönderiliyor...' : 'Talebi İlet'}
        </button>
      </div>
    </div>
  );
}

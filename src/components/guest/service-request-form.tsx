"use client";

import { useState } from 'react';
import { ServiceField, ServiceModuleConfig, buildInitialDetails, resolveFieldOptions } from '@/lib/service-modules';
import { AlertTriangle } from 'lucide-react';

interface ServiceRequestFormProps {
  config: ServiceModuleConfig;
  onSubmit: (details: Record<string, any>) => void;
  onCancel: () => void;
  isSubmitting: boolean;
  /** Cockpit-managed pricing overrides for this module (see service-modules.ts). */
  pricing?: Record<string, number>;
  /** Cockpit-managed content (option list) overrides, keyed by field key. */
  fieldOptionOverrides?: Record<string, string[]>;
}

function FieldInput({ field, options, value, onChange }: { field: ServiceField; options: string[]; value: any; onChange: (v: any) => void }) {
  const baseClass = "w-full text-xs p-2.5 rounded-xl border border-amber-200 bg-white dark:bg-slate-900 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/40";

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
                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition ${
                  active
                    ? 'bg-amber-500 border-amber-500 text-white'
                    : 'bg-white dark:bg-slate-900 dark:border-slate-800 border-amber-200 text-zinc-600 dark:text-slate-400 hover:border-amber-400'
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
            className={`flex-1 py-2 rounded-lg text-[11px] font-bold border transition ${
              isOn
                ? isAlert ? 'bg-red-500 border-red-500 text-white' : 'bg-amber-500 border-amber-500 text-white'
                : 'bg-white dark:bg-slate-900 dark:border-slate-800 border-amber-200 text-zinc-500 dark:text-slate-400'
            }`}
          >
            {onLabel}
          </button>
          <button
            type="button"
            onClick={() => onChange(false)}
            className={`flex-1 py-2 rounded-lg text-[11px] font-bold border transition ${
              !isOn ? 'bg-zinc-700 border-zinc-700 text-white' : 'bg-white dark:bg-slate-900 dark:border-slate-800 border-amber-200 text-zinc-500 dark:text-slate-400'
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
    <div className="space-y-3">
      {config.fields.map((field) => {
        if (field.type === 'display') {
          return (
            <div key={field.key} className="bg-amber-50/70 p-2.5 rounded-xl border border-amber-200/70 flex items-center justify-between gap-2 text-xs">
              <span className="font-semibold text-zinc-600 dark:text-slate-400">{field.label}</span>
              <span className="font-bold text-amber-800 text-right">{field.compute ? field.compute(details, pricing) : '—'}</span>
            </div>
          );
        }

        const isUrgentAlert = field.key === 'urgentHelp' && !!details[field.key];
        const options = resolveFieldOptions(field, fieldOptionOverrides);

        return (
          <div key={field.key} className="space-y-1">
            <label className="text-[11px] font-semibold text-zinc-700 flex items-center gap-1">
              {field.label}
              {field.optional && <span className="text-zinc-400 font-normal">(İsteğe Bağlı)</span>}
              {isUrgentAlert && <AlertTriangle className="w-3 h-3 text-red-500" />}
            </label>
            <FieldInput field={field} options={options} value={details[field.key]} onChange={(v) => setField(field.key, v)} />
          </div>
        );
      })}

      <div className="flex items-center gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2.5 rounded-xl border border-zinc-200 text-xs font-semibold text-zinc-600 dark:text-slate-400 hover:bg-zinc-50 transition"
        >
          İptal
        </button>
        <button
          type="button"
          onClick={() => onSubmit(details)}
          disabled={isSubmitting}
          className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-md shadow-amber-500/30 transition"
        >
          {isSubmitting ? 'Gönderiliyor...' : 'Talebi İlet'}
        </button>
      </div>
    </div>
  );
}

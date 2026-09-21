"use client";

import { useId } from "react";

export function CalcField({
  label,
  value,
  onChange,
  unit,
  step,
  min,
  placeholder,
}: {
  label: string;
  value: number | "";
  onChange: (v: number | "") => void;
  unit?: string;
  step?: number;
  min?: number;
  placeholder?: string;
}) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-chalk">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type="number"
          inputMode="decimal"
          value={value}
          step={step ?? "any"}
          min={min}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
          className="w-full rounded-lg border border-outline bg-slate-high text-chalk placeholder:text-chalk/40 px-3 py-2.5 pr-14 text-sm focus:outline-none focus:ring-1 focus:ring-secondary"
        />
        {unit && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-chalk/40 pointer-events-none">
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}

export function Stat({ 
  label, 
  value, 
  hint, 
  description 
}: { 
  label: string; 
  value: string; 
  hint?: string;
  description?: string;
}) {
  return (
    <div className="rounded-2xl bg-surface border border-border p-6">
      <div className="text-sm text-fg-subtle">{label}</div>
      <div className="mt-2 text-3xl font-semibold tracking-tight">{value}</div>
      {hint && <div className="mt-2 text-xs text-fg-muted">{hint}</div>}
      {description && <div className="mt-3 pt-3 border-t border-border text-xs text-fg-subtle leading-relaxed">{description}</div>}
    </div>
  );
}


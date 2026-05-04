export function MetricCard({ label, value, detail }: { label: string; value: string | number; detail?: string }) {
  return (
    <div className="subtle-panel p-4">
      <p className="label">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
      {detail ? <p className="mt-1 text-xs text-slate-500">{detail}</p> : null}
    </div>
  );
}

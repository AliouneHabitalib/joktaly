export function Placeholder({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{title}</h1>
      <div className="rounded-2xl border bg-card p-12 text-center shadow-[var(--shadow-card)]">
        <p className="text-muted-foreground">{desc}</p>
      </div>
    </div>
  );
}
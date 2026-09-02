export default function SectionLabel({ code, title }: { code: string; title: string }) {
  return (
    <div className="mb-8 flex items-center gap-4">
      <span className="kicker">{code}</span>
      <span className="h-px flex-1 bg-line" aria-hidden />
      <h2 className="display text-2xl font-bold md:text-3xl">{title}</h2>
    </div>
  );
}

// Shared hero for every interior page.
//
// The forest band is reserved for the home page and the footer now: two dark
// bookends around a light site. Interior pages open straight onto the paper
// ground with the headline carrying the weight instead of a background — the
// type is large enough that it does not need one.
//
// The section code sits *below* the lede rather than above it. It is a
// reference, not a label to read first.

export default function PageHero({
  code,
  title,
  lede,
}: {
  code: string;
  title: string;
  lede: string;
}) {
  return (
    <section className="border-b border-line">
      <div className="mx-auto max-w-[1180px] px-8 pb-14 pt-20 md:pb-20 md:pt-28">
        <h1 className="display rise max-w-4xl text-[clamp(40px,5.6vw,76px)] font-extrabold leading-[0.98] tracking-[-0.03em] text-ink">
          {title}
        </h1>
        <p className="rise rise-1 mt-7 max-w-2xl text-[19px] leading-[1.6] text-mute">{lede}</p>
        <p className="kicker rise rise-2 mt-8">{code}</p>
      </div>
    </section>
  );
}

import type { VehicleStatus } from "@/lib/vehicles";
import { STATUS_LABEL } from "@/lib/vehicles";

// Status carries a colour and a dot, never colour alone — an expired vehicle
// has to read as expired to someone who cannot separate green from amber.

const TONE: Record<VehicleStatus, string> = {
  awarded: "border-[#9fb8f2] bg-[rgb(234_241_255/0.8)] text-[#22366f]",
  active: "border-signal-dim bg-[rgb(30_122_70/0.07)] text-signal",
  expiring: "border-[#d0b164] bg-[rgb(250_238_214/0.7)] text-[#75530a]",
  expired: "border-line bg-raise text-mute",
};

const DOT: Record<VehicleStatus, string> = {
  awarded: "bg-[#3f5fd4]",
  active: "bg-signal",
  expiring: "bg-[#b8860b]",
  expired: "bg-mute",
};

export default function StatusBadge({ status }: { status: VehicleStatus }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.1em] ${TONE[status]}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${DOT[status]}`} aria-hidden />
      {STATUS_LABEL[status]}
    </span>
  );
}

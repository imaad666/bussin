const OPERATOR_ALIASES: Record<string, string> = {
  "orange tours & travels": "orange travels",
  "orange tours and travels": "orange travels",
  "srs travels": "srs travels",
  "kallada travels": "kallada travels",
  "jabbar travels": "jabbar travels",
  "vrl travels": "vrl travels",
  "intrcity smartbus": "intrcity smartbus",
  "intrcity smart bus": "intrcity smartbus",
  "zingbus": "zingbus",
  "apsrtc": "apsrtc",
  "tsrtc": "tsrtc",
};

export function normalizeOperator(name: string): string {
  const key = name.trim().toLowerCase().replace(/\s+/g, " ");
  return OPERATOR_ALIASES[key] ?? key;
}

export function parseTimeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function formatTime12h(time: string): string {
  const [hStr, mStr] = time.split(":");
  let h = Number(hStr);
  const m = mStr;
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${m} ${ampm}`;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export type Bill = {
  id: string;
  name: string;
  amount: number;
};

export type Simulation = {
  id: string;
  name: string;
  income: number;
  incomeDate: string; // ISO yyyy-mm-dd — tanggal cair pemasukan
  endDate: string;    // ISO yyyy-mm-dd — sampai (gajian berikutnya)
  bills: Bill[];
  createdAt: string;
  updatedAt: string;
};

export const ROUND_STEP = 10_000;

export const formatIDR = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Math.round(n || 0));

export const formatNumberID = (n: number) =>
  new Intl.NumberFormat("id-ID").format(Math.round(n || 0));

export const parseRupiahInput = (s: string): number => {
  const cleaned = (s || "").replace(/[^\d]/g, "");
  return cleaned ? parseInt(cleaned, 10) : 0;
};

export const formatLongDate = (iso: string) => {
  if (!iso) return "-";
  const d = new Date(iso + "T00:00:00");
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
};

export const daysBetweenInclusive = (startISO: string, endISO: string) => {
  if (!startISO || !endISO) return 0;
  const a = new Date(startISO + "T00:00:00").getTime();
  const b = new Date(endISO + "T00:00:00").getTime();
  if (isNaN(a) || isNaN(b) || b < a) return 0;
  return Math.floor((b - a) / 86_400_000) + 1;
};

export type Computation = {
  totalBills: number;
  remaining: number;       // setelah dikurangi tagihan
  days: number;            // jumlah hari termasuk hari ini
  rawDaily: number;        // sebelum dibulatkan
  dailyBudget: number;     // dibulatkan ke kelipatan 10rb (ke bawah)
  reserve: number;         // sisa karena pembulatan
  weekly: number;          // dailyBudget * 7
  monthly: number;         // dailyBudget * 30
  isUnderwater: boolean;   // tagihan > pemasukan
  isTight: boolean;        // dailyBudget < 10rb
};

export const compute = (sim: Pick<Simulation, "income" | "incomeDate" | "endDate" | "bills">): Computation => {
  const totalBills = sim.bills.reduce((s, b) => s + (b.amount || 0), 0);
  const remaining = Math.max(0, sim.income - totalBills);
  const days = daysBetweenInclusive(sim.incomeDate, sim.endDate);
  const rawDaily = days > 0 ? remaining / days : 0;
  const dailyBudget = Math.floor(rawDaily / ROUND_STEP) * ROUND_STEP;
  const reserve = remaining - dailyBudget * days;
  return {
    totalBills,
    remaining,
    days,
    rawDaily,
    dailyBudget,
    reserve: Math.max(0, reserve),
    weekly: dailyBudget * 7,
    monthly: dailyBudget * 30,
    isUnderwater: totalBills > sim.income,
    isTight: dailyBudget > 0 && dailyBudget < ROUND_STEP * 2,
  };
};

export const uid = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

export const todayISO = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export const addDaysISO = (iso: string, days: number) => {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

// ───────── Insight engine ─────────
export type Insight = {
  id: string;
  level: "good" | "info" | "warn" | "danger";
  title: string;
  detail: string;
};

export const buildInsights = (sim: Simulation, c: Computation): Insight[] => {
  const out: Insight[] = [];
  if (sim.income <= 0) {
    out.push({ id: "no-income", level: "info", title: "Mulai dari pemasukan", detail: "Masukkan jumlah uang yang kamu pegang untuk mulai simulasi." });
    return out;
  }
  if (c.days === 0) {
    out.push({ id: "no-range", level: "warn", title: "Tanggal belum lengkap", detail: "Atur tanggal cair dan tanggal gajian berikutnya." });
  }
  if (c.isUnderwater) {
    out.push({ id: "underwater", level: "danger", title: "Tagihan melebihi pemasukan", detail: `Kekurangan ${formatIDR(c.totalBills - sim.income)}. Pertimbangkan menunda atau memotong tagihan.` });
  }
  const billRatio = sim.income > 0 ? c.totalBills / sim.income : 0;
  if (billRatio >= 0.7 && !c.isUnderwater) {
    out.push({ id: "bill-heavy", level: "warn", title: "Tagihan berat", detail: `${Math.round(billRatio * 100)}% pemasukan habis untuk tagihan. Sisanya tipis.` });
  } else if (billRatio > 0 && billRatio <= 0.4) {
    out.push({ id: "bill-light", level: "good", title: "Tagihan terkendali", detail: `Hanya ${Math.round(billRatio * 100)}% pemasukan untuk tagihan — porsi sehat.` });
  }
  if (c.dailyBudget > 0) {
    out.push({ id: "daily", level: "info", title: "Jatah harian rapi", detail: `${formatIDR(c.dailyBudget)}/hari — sudah dibulatkan kelipatan 10 ribu agar mudah diingat.` });
    out.push({ id: "weekly", level: "info", title: "Patokan mingguan", detail: `Kira-kira ${formatIDR(c.weekly)} per minggu untuk pengeluaran harian.` });
  }
  if (c.isTight) {
    out.push({ id: "tight", level: "warn", title: "Jatah harian tipis", detail: `Hanya ${formatIDR(c.dailyBudget)}/hari. Hindari jajan impulsif.` });
  }
  if (c.reserve >= ROUND_STEP) {
    out.push({ id: "reserve", level: "good", title: "Dana cadangan terbentuk", detail: `Sisa pembulatan ${formatIDR(c.reserve)} bisa jadi tabungan kecil atau dana darurat mini.` });
  }
  if (sim.bills.length >= 1) {
    const top = [...sim.bills].sort((a, b) => b.amount - a.amount)[0];
    if (top && top.amount > 0) {
      const pct = Math.round((top.amount / sim.income) * 100);
      out.push({
        id: "top-bill",
        level: pct >= 40 ? "warn" : "info",
        title: `Tagihan terbesar: ${top.name || "Tanpa nama"}`,
        detail: `${formatIDR(top.amount)} (${pct}% pemasukan).`,
      });
    }
  }
  if (c.days >= 1 && c.dailyBudget > 0) {
    const halfPoint = Math.floor(c.days / 2);
    out.push({
      id: "midpoint",
      level: "info",
      title: "Cek di tengah periode",
      detail: `Hari ke-${halfPoint || 1}, idealnya kamu masih pegang ${formatIDR(c.dailyBudget * (c.days - halfPoint))} untuk sisa hari.`,
    });
  }
  if (c.dailyBudget >= 50_000) {
    out.push({ id: "saving-tip", level: "good", title: "Peluang menabung", detail: `Coba sisihkan 10 ribu/hari → ${formatIDR(10_000 * c.days)} di akhir periode.` });
  }
  if (sim.bills.length === 0 && sim.income > 0) {
    out.push({ id: "add-bills", level: "info", title: "Tambahkan tagihan", detail: "Masukkan tagihan rutin (listrik, cicilan, internet) supaya hitungan lebih akurat." });
  }
  return out;
};

// Build text report for share
export const buildReport = (sim: Simulation, c: Computation): string => {
  const lines: string[] = [];
  lines.push(`*Aman Sampai Gajian* — ${sim.name || "Simulasi"}`);
  lines.push("");
  lines.push(`💰 Pemasukan: ${formatIDR(sim.income)}`);
  lines.push(`📅 Cair: ${formatLongDate(sim.incomeDate)}`);
  lines.push(`📅 Gajian berikutnya: ${formatLongDate(sim.endDate)}`);
  lines.push(`🗓️ Periode: ${c.days} hari`);
  lines.push("");
  if (sim.bills.length) {
    lines.push(`*Tagihan* (${formatIDR(c.totalBills)})`);
    sim.bills.forEach((b, i) => {
      lines.push(`${i + 1}. ${b.name || "Tanpa nama"} — ${formatIDR(b.amount)}`);
    });
    lines.push("");
  }
  lines.push(`*Sisa untuk harian:* ${formatIDR(c.remaining)}`);
  lines.push(`*Jatah harian:* ${formatIDR(c.dailyBudget)} (dibulatkan)`);
  lines.push(`*Mingguan:* ${formatIDR(c.weekly)}`);
  if (c.reserve > 0) lines.push(`*Dana cadangan:* ${formatIDR(c.reserve)}`);
  lines.push("");
  lines.push("— dibuat dengan Aman Sampai Gajian by Gibikey Studio");
  return lines.join("\n");
};

import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Wallet, TrendingDown, Sparkles, CalendarDays, PiggyBank, Receipt,
  ShieldCheck, AlertTriangle, Lightbulb, Copy, Share2, ArrowRight, History,
} from "lucide-react";
import { useSimulation } from "@/lib/simulation-context";
import {
  compute, buildInsights, buildReport, formatIDR, formatLongDate, daysBetweenInclusive, todayISO,
} from "@/lib/budget";
import { toast } from "sonner";
import { useSidebar } from "@/components/ui/sidebar";

export const Route = createFileRoute("/")({
  component: Dashboard,
  head: () => ({
    meta: [
      { title: "Aman Sampai Gajian — Gibikey Studio" },
      { name: "description", content: "Bagi otomatis budget harian sampai gajian berikutnya. Hitung sisa setelah tagihan, dapatkan jatah harian rapi (kelipatan 10rb), dan bagikan ke pasangan." },
      { property: "og:title", content: "Aman Sampai Gajian — Gibikey Studio" },
      { property: "og:description", content: "Atur uangmu biar aman sampai gajian." },
      { property: "og:image", content: "/og-image.png" },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
});

function Dashboard() {
  const { current, history } = useSimulation();
  const c = useMemo(() => compute(current), [current]);
  const insights = useMemo(() => buildInsights(current, c), [current, c]);
  const sidebar = useSidebar();

  const elapsed = useMemo(() => {
    const today = todayISO();
    if (!current.incomeDate || !current.endDate) return { used: 0, left: c.days };
    if (today < current.incomeDate) return { used: 0, left: c.days };
    if (today > current.endDate) return { used: c.days, left: 0 };
    const used = daysBetweenInclusive(current.incomeDate, today);
    return { used, left: Math.max(0, c.days - used) };
  }, [current.incomeDate, current.endDate, c.days]);

  const billRatio = current.income > 0 ? Math.min(100, Math.round((c.totalBills / current.income) * 100)) : 0;
  const periodProgress = c.days > 0 ? Math.round((elapsed.used / c.days) * 100) : 0;

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(buildReport(current, c));
      toast.success("Ringkasan disalin");
    } catch {
      toast.error("Gagal menyalin");
    }
  };
  const onShareWA = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(buildReport(current, c))}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const isEmpty = current.income === 0 && current.bills.length === 0;

  return (
    <div className="px-4 sm:px-6 lg:px-10 py-6 max-w-6xl mx-auto space-y-6">
      {isEmpty && (
        <Card className="p-5 sm:p-6 bg-gold-gradient text-primary-foreground shadow-gold border-transparent">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-1">
              <Badge className="bg-background/30 text-primary-foreground border-0 mb-2">Mulai di sini</Badge>
              <h2 className="font-display text-2xl sm:text-3xl font-semibold">Atur uangmu, aman sampai gajian.</h2>
              <p className="text-sm sm:text-base opacity-90 mt-1">
                Buka panel <span className="font-semibold">Simulasi</span> untuk masukkan pemasukan, tagihan, dan tanggal gajian berikutnya. Kami bagikan jatah harian yang rapi.
              </p>
            </div>
            <Button onClick={() => sidebar.setOpenMobile(true)} variant="secondary" className="shadow-soft">
              Mulai Simulasi <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </Card>
      )}

      {/* HERO METRICS */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <BigMetric
          icon={<PiggyBank className="h-5 w-5" />}
          label="Jatah Harian"
          value={formatIDR(c.dailyBudget)}
          hint={c.days > 0 ? `dibagi ke ${c.days} hari` : "Atur tanggal dulu"}
          highlight
        />
        <BigMetric
          icon={<Wallet className="h-5 w-5" />}
          label="Sisa setelah Tagihan"
          value={formatIDR(c.remaining)}
          hint={`${formatIDR(c.totalBills)} dipotong dari pemasukan`}
        />
        <BigMetric
          icon={<CalendarDays className="h-5 w-5" />}
          label="Periode"
          value={c.days > 0 ? `${c.days} hari` : "—"}
          hint={current.incomeDate && current.endDate ? `${formatLongDate(current.incomeDate)} → ${formatLongDate(current.endDate)}` : "Belum ditentukan"}
        />
      </section>

      {/* PROGRESS + ACTIONS */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="p-5 lg:col-span-2 space-y-5">
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold flex items-center gap-1.5"><Receipt className="h-4 w-4 text-primary-deep" /> Beban Tagihan</p>
              <span className="text-xs text-muted-foreground">{billRatio}% dari pemasukan</span>
            </div>
            <Progress value={billRatio} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1.5">
              {billRatio >= 70 ? "Berat — sisa untuk harian tipis." : billRatio >= 40 ? "Sedang — masih wajar." : billRatio > 0 ? "Ringan — porsi sehat." : "Belum ada tagihan."}
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold flex items-center gap-1.5"><CalendarDays className="h-4 w-4 text-primary-deep" /> Progres Periode</p>
              <span className="text-xs text-muted-foreground">{periodProgress}% berlalu</span>
            </div>
            <Progress value={periodProgress} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1.5">
              Hari ke-{elapsed.used} dari {c.days || 0} · sisa {elapsed.left} hari
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-2 border-t">
            <MiniStat label="Per Minggu" value={formatIDR(c.weekly)} />
            <MiniStat label="Per Bulan (30h)" value={formatIDR(c.monthly)} />
            <MiniStat label="Cadangan" value={formatIDR(c.reserve)} hint="dari pembulatan" />
          </div>
        </Card>

        <Card className="p-5 bg-paper-gradient flex flex-col">
          <div className="flex items-center gap-2 mb-2">
            <Share2 className="h-4 w-4 text-primary-deep" />
            <p className="text-sm font-semibold">Laporkan ke Pasangan</p>
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            Salin ringkasan atau kirim langsung lewat WhatsApp — biar transparan.
          </p>
          <div className="flex flex-col gap-2 mt-auto">
            <Button onClick={onShareWA} className="bg-success text-success-foreground hover:bg-success/90 shadow-soft">
              <Share2 className="h-4 w-4 mr-2" /> Kirim via WhatsApp
            </Button>
            <Button onClick={onCopy} variant="outline">
              <Copy className="h-4 w-4 mr-2" /> Salin Ringkasan
            </Button>
          </div>
        </Card>
      </section>

      {/* WARNINGS */}
      {(c.isUnderwater || c.isTight) && (
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {c.isUnderwater && (
            <NoticeCard
              tone="danger"
              icon={<TrendingDown className="h-4 w-4" />}
              title="Pemasukan tidak cukup"
              detail={`Tagihan melebihi pemasukan sebesar ${formatIDR(c.totalBills - current.income)}. Pertimbangkan menunda atau memotong pos non-esensial.`}
            />
          )}
          {c.isTight && (
            <NoticeCard
              tone="warn"
              icon={<AlertTriangle className="h-4 w-4" />}
              title="Jatah harian tipis"
              detail={`Hanya ${formatIDR(c.dailyBudget)}/hari. Hindari jajan impulsif & masak di rumah lebih sering.`}
            />
          )}
        </section>
      )}

      {/* INSIGHTS GRID */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display text-xl font-semibold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary-deep" /> Insight Pintar
          </h3>
          <span className="text-xs text-muted-foreground">{insights.length} insight</span>
        </div>
        {insights.length === 0 ? (
          <Card className="p-6 text-center text-sm text-muted-foreground">
            Lengkapi simulasi di sidebar untuk melihat insight.
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {insights.map((i) => <InsightTile key={i.id} {...i} />)}
          </div>
        )}
      </section>

      {/* BILLS LIST + HISTORY */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display text-lg font-semibold flex items-center gap-2">
              <Receipt className="h-5 w-5 text-primary-deep" /> Daftar Tagihan
            </h3>
            <Badge variant="secondary">{current.bills.length} item</Badge>
          </div>
          {current.bills.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada tagihan. Tambah dari sidebar.</p>
          ) : (
            <ul className="divide-y">
              {current.bills.map((b) => (
                <li key={b.id} className="py-2.5 flex items-center justify-between gap-3">
                  <span className="text-sm">{b.name}</span>
                  <span className="text-sm font-medium">{formatIDR(b.amount)}</span>
                </li>
              ))}
              <li className="pt-3 flex items-center justify-between">
                <span className="text-sm font-semibold">Total</span>
                <span className="font-display font-semibold">{formatIDR(c.totalBills)}</span>
              </li>
            </ul>
          )}
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display text-lg font-semibold flex items-center gap-2">
              <History className="h-5 w-5 text-primary-deep" /> Riwayat Terakhir
            </h3>
            <Badge variant="secondary">{history.length}</Badge>
          </div>
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada riwayat. Klik "Simpan" di sidebar untuk menyimpan simulasi ini.</p>
          ) : (
            <ul className="space-y-2">
              {history.slice(0, 5).map((h) => {
                const hc = compute(h);
                return (
                  <li key={h.id} className="rounded-lg border p-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{h.name}</p>
                      <p className="text-xs text-muted-foreground">{formatIDR(h.income)} · {hc.days}h · {formatIDR(hc.dailyBudget)}/hari</p>
                    </div>
                    <Badge variant="outline" className="shrink-0">{new Date(h.createdAt).toLocaleDateString("id-ID")}</Badge>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </section>

      <footer className="text-center text-xs text-muted-foreground pt-4 pb-2">
        © {new Date().getFullYear()} <span className="font-semibold text-foreground">Gibikey Studio</span> — Aman Sampai Gajian.
      </footer>
    </main>
  );
}

function BigMetric({ icon, label, value, hint, highlight = false }: { icon: React.ReactNode; label: string; value: string; hint?: string; highlight?: boolean }) {
  return (
    <Card className={`p-5 ${highlight ? "bg-gold-gradient text-primary-foreground shadow-gold border-transparent" : "bg-card"}`}>
      <div className={`flex items-center gap-2 ${highlight ? "opacity-90" : "text-muted-foreground"}`}>
        {icon}
        <p className="text-xs uppercase tracking-wider font-medium">{label}</p>
      </div>
      <p className={`font-display text-3xl font-semibold mt-2 ${highlight ? "" : "text-gold-gradient"}`}>{value}</p>
      {hint && <p className={`text-xs mt-1 ${highlight ? "opacity-90" : "text-muted-foreground"}`}>{hint}</p>}
    </Card>
  );
}

function MiniStat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="font-display font-semibold text-base">{value}</p>
      {hint && <p className="text-[10px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

function NoticeCard({ tone, icon, title, detail }: { tone: "danger" | "warn"; icon: React.ReactNode; title: string; detail: string }) {
  const cls = tone === "danger"
    ? "border-destructive/40 bg-destructive/8 text-destructive"
    : "border-[oklch(0.78_0.16_70/0.45)] bg-[oklch(0.78_0.16_70/0.12)]";
  return (
    <Card className={`p-4 border ${cls}`}>
      <div className="flex items-start gap-2">
        <div className="mt-0.5">{icon}</div>
        <div>
          <p className="text-sm font-semibold">{title}</p>
          <p className="text-xs mt-0.5 text-foreground/80">{detail}</p>
        </div>
      </div>
    </Card>
  );
}

function InsightTile({ level, title, detail }: { level: "good" | "info" | "warn" | "danger"; title: string; detail: string }) {
  const map = {
    good: { ring: "border-[oklch(0.62_0.14_155/0.4)]", bg: "bg-[oklch(0.62_0.14_155/0.08)]", icon: <ShieldCheck className="h-4 w-4 text-success" /> },
    info: { ring: "border-border", bg: "bg-card", icon: <Lightbulb className="h-4 w-4 text-primary-deep" /> },
    warn: { ring: "border-[oklch(0.78_0.16_70/0.45)]", bg: "bg-[oklch(0.78_0.16_70/0.10)]", icon: <AlertTriangle className="h-4 w-4 text-warning" /> },
    danger: { ring: "border-destructive/45", bg: "bg-destructive/8", icon: <AlertTriangle className="h-4 w-4 text-destructive" /> },
  }[level];
  return (
    <Card className={`p-4 ${map.ring} ${map.bg}`}>
      <div className="flex items-start gap-2">
        <div className="mt-0.5 shrink-0">{map.icon}</div>
        <div className="min-w-0">
          <p className="text-sm font-semibold leading-tight">{title}</p>
          <p className="text-xs text-muted-foreground mt-1 leading-snug">{detail}</p>
        </div>
      </div>
    </Card>
  );
}

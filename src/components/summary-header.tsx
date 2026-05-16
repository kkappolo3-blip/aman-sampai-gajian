import { useMemo } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Copy, Share2 } from "lucide-react";
import logo from "@/assets/logo.png";
import { useSimulation } from "@/lib/simulation-context";
import { compute, formatIDR, buildReport } from "@/lib/budget";
import { toast } from "sonner";

export function SummaryHeader() {
  const { current } = useSimulation();
  const c = useMemo(() => compute(current), [current]);

  const report = useMemo(() => buildReport(current, c), [current, c]);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(report);
      toast.success("Ringkasan disalin");
    } catch {
      toast.error("Gagal menyalin");
    }
  };
  const onShareWA = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(report)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70">
      <div className="flex items-center gap-2 px-3 sm:px-5 h-14 border-b border-border/40">
        <SidebarTrigger className="shrink-0" />
        <img src={logo} alt="" className="h-7 w-7 rounded-md shadow-soft hidden sm:block" />
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-sm sm:text-base font-semibold leading-tight truncate">
            {current.name || "Simulasi Baru"}
          </h1>
          <p className="text-[10px] text-muted-foreground tracking-wide uppercase">Aman Sampai Gajian · Gibikey Studio</p>
        </div>
        <div className="flex items-center gap-1.5">
          <Button size="sm" variant="outline" onClick={onCopy} className="h-8">
            <Copy className="h-3.5 w-3.5 sm:mr-1.5" /><span className="hidden sm:inline">Salin</span>
          </Button>
          <Button size="sm" onClick={onShareWA} className="h-8 bg-success text-success-foreground hover:bg-success/90">
            <Share2 className="h-3.5 w-3.5 sm:mr-1.5" /><span className="hidden sm:inline">Kirim WA</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-border/50">
        <Stat label="Pemasukan" value={formatIDR(current.income)} />
        <Stat label="Tagihan" value={formatIDR(c.totalBills)} tone={c.isUnderwater ? "danger" : "default"} />
        <Stat label="Sisa" value={formatIDR(c.remaining)} tone="primary" />
        <Stat label={`Per hari · ${c.days}h`} value={formatIDR(c.dailyBudget)} tone="primary" highlight />
      </div>
    </header>
  );
}

function Stat({ label, value, tone = "default", highlight = false }: { label: string; value: string; tone?: "default" | "primary" | "danger"; highlight?: boolean }) {
  const valueClass =
    tone === "primary" ? "text-gold-gradient" :
    tone === "danger" ? "text-destructive" : "text-foreground";
  return (
    <div className={`px-3 sm:px-5 py-2.5 ${highlight ? "bg-paper-gradient" : ""}`}>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`font-display font-semibold text-sm sm:text-lg leading-tight truncate ${valueClass}`}>{value}</p>
    </div>
  );
}

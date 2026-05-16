import { useMemo } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Calculator, Save, FileX2, History, Trash2, RotateCcw,
  Lightbulb, ShieldCheck, AlertTriangle, Sparkles,
} from "lucide-react";
import logo from "@/assets/logo.png";
import { useSimulation } from "@/lib/simulation-context";
import {
  formatIDR, formatNumberID, parseRupiahInput, compute, buildInsights,
} from "@/lib/budget";
import { toast } from "sonner";
import { BillsEditor } from "@/components/bills-editor";

export function AppSidebar() {
  const {
    current, history, hydrated,
    updateCurrent, saveToHistory, loadFromHistory, removeFromHistory, newSimulation,
  } = useSimulation();
  const c = useMemo(() => compute(current), [current]);
  const insights = useMemo(() => buildInsights(current, c), [current, c]);

  return (
    <Sidebar collapsible="offcanvas" className="border-r">
      <SidebarHeader className="border-b border-sidebar-border bg-sidebar">
        <div className="flex items-center gap-2.5 px-1 py-1">
          <img src={logo} alt="Aman Sampai Gajian" className="h-9 w-9 rounded-md shadow-soft" />
          <div className="min-w-0">
            <p className="font-display text-sm font-semibold leading-tight">Aman Sampai Gajian</p>
            <p className="text-[10px] text-muted-foreground tracking-wide uppercase">by Gibikey Studio</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="bg-sidebar">
        {/* SIMULASI */}
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center gap-1.5">
            <Calculator className="h-3.5 w-3.5" /> Simulasi
          </SidebarGroupLabel>
          <SidebarGroupContent className="px-2 space-y-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Nama simulasi</Label>
              <Input
                value={current.name}
                onChange={(e) => updateCurrent({ name: e.target.value })}
                placeholder="Gajian Maret"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Pemasukan (Rp)</Label>
              <Input
                inputMode="numeric"
                value={current.income ? formatNumberID(current.income) : ""}
                onChange={(e) => updateCurrent({ income: parseRupiahInput(e.target.value) })}
                placeholder="0"
                className="font-display text-base"
              />
            </div>

            <div className="grid grid-cols-1 gap-2">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Tanggal cair pemasukan</Label>
                <Input
                  type="date"
                  value={current.incomeDate}
                  onChange={(e) => updateCurrent({ incomeDate: e.target.value })}
                />
                <p className="text-[10px] text-muted-foreground">{c.days > 0 ? "Mulai dihitung dari tanggal ini." : "—"}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Sampai (gajian berikutnya)</Label>
                <Input
                  type="date"
                  value={current.endDate}
                  onChange={(e) => updateCurrent({ endDate: e.target.value })}
                />
                <p className="text-[10px] text-muted-foreground">{c.days > 0 ? `${c.days} hari` : "Tanggal akhir harus setelah tanggal cair."}</p>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <p className="text-xs font-semibold tracking-wide uppercase text-muted-foreground">Tagihan</p>
              <BillsEditor />
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <Button onClick={() => { saveToHistory(); toast.success("Simulasi disimpan ke riwayat"); }} variant="secondary" size="sm">
                <Save className="h-3.5 w-3.5 mr-1" /> Simpan
              </Button>
              <Button onClick={() => { newSimulation(); toast("Simulasi baru dibuat"); }} variant="outline" size="sm">
                <FileX2 className="h-3.5 w-3.5 mr-1" /> Baru
              </Button>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>

        <Separator />

        {/* INSIGHTS */}
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center gap-1.5">
            <Lightbulb className="h-3.5 w-3.5" /> Insight Pintar
          </SidebarGroupLabel>
          <SidebarGroupContent className="px-2 space-y-2">
            {insights.length === 0 ? (
              <p className="text-xs text-muted-foreground">Lengkapi data untuk lihat insight.</p>
            ) : (
              insights.map((i) => <InsightCard key={i.id} level={i.level} title={i.title} detail={i.detail} />)
            )}
          </SidebarGroupContent>
        </SidebarGroup>

        <Separator />

        {/* RIWAYAT */}
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center gap-1.5">
            <History className="h-3.5 w-3.5" /> Riwayat Simulasi
          </SidebarGroupLabel>
          <SidebarGroupContent className="px-2 space-y-2">
            {!hydrated ? null : history.length === 0 ? (
              <p className="text-xs text-muted-foreground">Belum ada riwayat. Klik "Simpan" untuk menyimpan simulasi.</p>
            ) : (
              <ul className="space-y-1.5">
                {history.map((h) => {
                  const hc = compute(h);
                  return (
                    <li key={h.id} className="rounded-lg border border-sidebar-border bg-card/70 p-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{h.name}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {formatIDR(h.income)} • {hc.days}h • {formatIDR(hc.dailyBudget)}/hari
                          </p>
                        </div>
                        <div className="flex items-center gap-0.5 shrink-0">
                          <Button size="icon" variant="ghost" className="h-6 w-6" title="Muat" onClick={() => { loadFromHistory(h.id); toast.success("Simulasi dimuat"); }}>
                            <RotateCcw className="h-3 w-3" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" title="Hapus" onClick={() => removeFromHistory(h.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="bg-sidebar border-t border-sidebar-border">
        <Card className="p-2.5 bg-paper-gradient border-border/60">
          <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-primary-deep" />
            <p className="text-[10px] leading-tight text-muted-foreground">
              <span className="font-semibold text-foreground">Gibikey Studio</span> — alat keuangan harian.
            </p>
          </div>
        </Card>
      </SidebarFooter>
    </Sidebar>
  );
}

function InsightCard({ level, title, detail }: { level: "good" | "info" | "warn" | "danger"; title: string; detail: string }) {
  const styles = {
    good: { wrap: "border-[oklch(0.62_0.14_155/0.35)] bg-[oklch(0.62_0.14_155/0.08)]", icon: <ShieldCheck className="h-3.5 w-3.5 text-success" /> },
    info: { wrap: "border-border bg-card/70", icon: <Lightbulb className="h-3.5 w-3.5 text-primary-deep" /> },
    warn: { wrap: "border-[oklch(0.78_0.16_70/0.4)] bg-[oklch(0.78_0.16_70/0.1)]", icon: <AlertTriangle className="h-3.5 w-3.5 text-warning" /> },
    danger: { wrap: "border-destructive/40 bg-destructive/10", icon: <AlertTriangle className="h-3.5 w-3.5 text-destructive" /> },
  }[level];
  return (
    <div className={`rounded-lg border ${styles.wrap} p-2`}>
      <div className="flex items-start gap-1.5">
        <div className="mt-0.5">{styles.icon}</div>
        <div className="min-w-0">
          <p className="text-xs font-semibold leading-tight">{title}</p>
          <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">{detail}</p>
        </div>
      </div>
    </div>
  );
}

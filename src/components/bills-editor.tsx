import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Plus, Pencil, Copy, Trash2, Check, X } from "lucide-react";
import { useSimulation } from "@/lib/simulation-context";
import { formatIDR, formatNumberID, parseRupiahInput } from "@/lib/budget";
import { toast } from "sonner";

export function BillsEditor() {
  const { current, addBill, updateBill, removeBill, duplicateBill } = useSimulation();
  const [name, setName] = useState("");
  const [amountStr, setAmountStr] = useState("");

  const submit = () => {
    const amount = parseRupiahInput(amountStr);
    if (!name.trim()) return toast.error("Nama tagihan wajib diisi");
    if (amount <= 0) return toast.error("Jumlah tagihan harus lebih dari 0");
    addBill({ name: name.trim(), amount });
    setName("");
    setAmountStr("");
    toast.success("Tagihan ditambahkan");
  };

  return (
    <div className="space-y-3">
      <Card className="p-3 bg-card/60 border-border/70">
        <div className="space-y-2">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Nama tagihan</Label>
            <Input
              placeholder="Listrik, Internet, Cicilan…"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Jumlah (Rp)</Label>
            <Input
              inputMode="numeric"
              placeholder="0"
              value={amountStr ? formatNumberID(parseRupiahInput(amountStr)) : ""}
              onChange={(e) => setAmountStr(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
            />
          </div>
          <Button onClick={submit} className="w-full bg-gold-gradient text-primary-foreground hover:opacity-90 shadow-soft">
            <Plus className="h-4 w-4 mr-1" /> Tambah Tagihan
          </Button>
        </div>
      </Card>

      {current.bills.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-4">Belum ada tagihan.</p>
      ) : (
        <ul className="space-y-2">
          {current.bills.map((b) => (
            <BillRow
              key={b.id}
              id={b.id}
              name={b.name}
              amount={b.amount}
              onUpdate={(p) => updateBill(b.id, p)}
              onDelete={() => { removeBill(b.id); toast.success("Tagihan dihapus"); }}
              onCopy={() => { duplicateBill(b.id); toast.success("Tagihan disalin"); }}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function BillRow({
  name, amount, onUpdate, onDelete, onCopy,
}: { id: string; name: string; amount: number; onUpdate: (p: { name?: string; amount?: number }) => void; onDelete: () => void; onCopy: () => void }) {
  const [editing, setEditing] = useState(false);
  const [n, setN] = useState(name);
  const [a, setA] = useState(String(amount));

  useEffect(() => { setN(name); setA(String(amount)); }, [name, amount]);

  const save = () => {
    const amt = parseRupiahInput(a);
    if (!n.trim() || amt <= 0) { toast.error("Isi nama & jumlah valid"); return; }
    onUpdate({ name: n.trim(), amount: amt });
    setEditing(false);
  };

  if (editing) {
    return (
      <li className="rounded-lg border border-border bg-card p-2 space-y-2">
        <Input value={n} onChange={(e) => setN(e.target.value)} placeholder="Nama" />
        <Input
          inputMode="numeric"
          value={formatNumberID(parseRupiahInput(a))}
          onChange={(e) => setA(e.target.value)}
          placeholder="Jumlah"
        />
        <div className="flex gap-1">
          <Button size="sm" onClick={save} className="flex-1"><Check className="h-3 w-3 mr-1" />Simpan</Button>
          <Button size="sm" variant="ghost" onClick={() => setEditing(false)}><X className="h-3 w-3" /></Button>
        </div>
      </li>
    );
  }

  return (
    <li className="rounded-lg border border-border/70 bg-card/80 p-2.5 flex items-center gap-2 group">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate">{name}</p>
        <p className="text-xs text-muted-foreground">{formatIDR(amount)}</p>
      </div>
      <div className="flex items-center gap-0.5 opacity-70 group-hover:opacity-100 transition">
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditing(true)} title="Edit"><Pencil className="h-3.5 w-3.5" /></Button>
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onCopy} title="Salin"><Copy className="h-3.5 w-3.5" /></Button>
        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={onDelete} title="Hapus"><Trash2 className="h-3.5 w-3.5" /></Button>
      </div>
    </li>
  );
}

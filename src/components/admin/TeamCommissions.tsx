import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Coins, Plus, Pencil, Wallet, Loader2, Users } from "lucide-react";
import { toast } from "sonner";

interface CommissionMember {
  id: string;
  display_name: string;
  role_type: string;
  wallet_address: string | null;
  commission_percentage: number;
  is_active: boolean;
  notes: string | null;
  created_at: string;
}

const ROLE_OPTIONS = ["admin", "affiliate", "agent", "employee", "referral"];

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-[hsl(var(--admin-fir))]/15 text-[hsl(var(--admin-fir))] border-[hsl(var(--admin-fir))]/30",
  affiliate: "bg-[hsl(var(--admin-gold))]/15 text-[hsl(var(--admin-gold))] border-[hsl(var(--admin-gold))]/30",
  agent: "bg-[hsl(var(--admin-sky))]/15 text-[hsl(var(--admin-sky))] border-[hsl(var(--admin-sky))]/30",
  employee: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  referral: "bg-[hsl(var(--admin-olive))]/15 text-[hsl(var(--admin-olive))] border-[hsl(var(--admin-olive))]/30",
};

export function TeamCommissions() {
  const [members, setMembers] = useState<CommissionMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CommissionMember | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [role, setRole] = useState("employee");
  const [wallet, setWallet] = useState("");
  const [commission, setCommission] = useState("0");
  const [notes, setNotes] = useState("");

  const fetchMembers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("team_commissions")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error) setMembers((data as unknown as CommissionMember[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchMembers(); }, []);

  const resetForm = () => {
    setName(""); setRole("employee"); setWallet(""); setCommission("0"); setNotes("");
    setEditing(null);
  };

  const openEdit = (m: CommissionMember) => {
    setEditing(m);
    setName(m.display_name);
    setRole(m.role_type);
    setWallet(m.wallet_address || "");
    setCommission(String(m.commission_percentage));
    setNotes(m.notes || "");
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim()) { toast.error("Name is required"); return; }
    if (wallet && !wallet.startsWith("0x")) { toast.error("Wallet must start with 0x"); return; }
    const pct = parseFloat(commission);
    if (isNaN(pct) || pct < 0 || pct > 100) { toast.error("Commission must be 0-100"); return; }

    setSaving(true);
    const payload = {
      display_name: name.trim(),
      role_type: role,
      wallet_address: wallet.trim() || null,
      commission_percentage: pct,
      notes: notes.trim() || null,
    };

    if (editing) {
      const { error } = await supabase.from("team_commissions").update(payload).eq("id", editing.id);
      if (error) { toast.error("Update failed"); setSaving(false); return; }
      toast.success("Member updated");
    } else {
      const { error } = await supabase.from("team_commissions").insert(payload);
      if (error) { toast.error("Failed to add member"); setSaving(false); return; }
      toast.success("Member added");
    }

    setSaving(false);
    setDialogOpen(false);
    resetForm();
    fetchMembers();
  };

  const toggleActive = async (m: CommissionMember) => {
    await supabase.from("team_commissions").update({ is_active: !m.is_active }).eq("id", m.id);
    fetchMembers();
  };

  return (
    <Card className="border-[hsl(var(--admin-soft-green))]/30">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[hsl(var(--admin-gold))]/15">
              <Coins className="w-5 h-5 text-[hsl(var(--admin-gold))]" />
            </div>
            <div>
              <CardTitle>Commission Structure</CardTitle>
              <CardDescription>All payouts settled on-chain to attached ETH wallets</CardDescription>
            </div>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="bg-[hsl(var(--admin-fir))] hover:bg-[hsl(var(--admin-forest-deep))] text-white gap-2">
                <Plus className="w-4 h-4" /> Add Member
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>{editing ? "Edit Member" : "Add Team Member"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div>
                  <Label>Display Name *</Label>
                  <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Ricardo Capone" />
                </div>
                <div>
                  <Label>Role</Label>
                  <Select value={role} onValueChange={setRole}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ROLE_OPTIONS.map(r => (
                        <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>ETH Wallet Address</Label>
                  <Input value={wallet} onChange={e => setWallet(e.target.value)} placeholder="0x..." className="font-mono text-sm" />
                  <p className="text-xs text-muted-foreground mt-1">Web3 receipt address for commission payouts</p>
                </div>
                <div>
                  <Label>Commission %</Label>
                  <Input type="number" min="0" max="100" step="0.01" value={commission} onChange={e => setCommission(e.target.value)} />
                </div>
                <div>
                  <Label>Notes (optional)</Label>
                  <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any notes..." />
                </div>
                <Button onClick={handleSave} disabled={saving} className="w-full bg-[hsl(var(--admin-fir))] hover:bg-[hsl(var(--admin-forest-deep))] text-white">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  {editing ? "Update Member" : "Add Member"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center gap-2 py-8 justify-center text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading…
          </div>
        ) : members.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="font-medium">No team members yet</p>
            <p className="text-sm">Add your first team member to configure commissions</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[hsl(var(--admin-soft-green))]/20 text-muted-foreground">
                    <th className="text-left py-3 px-2 font-medium">Name</th>
                    <th className="text-left py-3 px-2 font-medium">Role</th>
                    <th className="text-left py-3 px-2 font-medium">Wallet</th>
                    <th className="text-right py-3 px-2 font-medium">Commission</th>
                    <th className="text-center py-3 px-2 font-medium">Active</th>
                    <th className="text-right py-3 px-2 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map(m => (
                    <tr key={m.id} className="border-b border-border/40 hover:bg-[hsl(var(--admin-parchment))]/50 dark:hover:bg-[hsl(var(--admin-forest))]/30 transition-colors">
                      <td className="py-3 px-2 font-medium">{m.display_name}</td>
                      <td className="py-3 px-2">
                        <Badge variant="outline" className={`capitalize ${ROLE_COLORS[m.role_type] || ""}`}>
                          {m.role_type}
                        </Badge>
                      </td>
                      <td className="py-3 px-2">
                        {m.wallet_address ? (
                          <span className="font-mono text-xs text-muted-foreground">
                            {m.wallet_address.slice(0, 6)}...{m.wallet_address.slice(-4)}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">Not set</span>
                        )}
                      </td>
                      <td className="py-3 px-2 text-right">
                        <span className="font-semibold text-[hsl(var(--admin-gold))]">{m.commission_percentage}%</span>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <Switch checked={m.is_active} onCheckedChange={() => toggleActive(m)} />
                      </td>
                      <td className="py-3 px-2 text-right">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(m)}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
              {members.map(m => (
                <div key={m.id} className="rounded-xl border border-[hsl(var(--admin-soft-green))]/20 p-4 space-y-3 bg-card">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{m.display_name}</p>
                      <Badge variant="outline" className={`capitalize mt-1 text-xs ${ROLE_COLORS[m.role_type] || ""}`}>
                        {m.role_type}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-[hsl(var(--admin-gold))]">{m.commission_percentage}%</p>
                      <Switch checked={m.is_active} onCheckedChange={() => toggleActive(m)} />
                    </div>
                  </div>
                  {m.wallet_address && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Wallet className="w-3.5 h-3.5" />
                      <span className="font-mono">{m.wallet_address.slice(0, 10)}...{m.wallet_address.slice(-6)}</span>
                    </div>
                  )}
                  <Button variant="ghost" size="sm" className="w-full" onClick={() => openEdit(m)}>
                    <Pencil className="w-3.5 h-3.5 mr-1" /> Edit
                  </Button>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, RefreshCw, Search, CheckCircle, XCircle, Clock, ShieldCheck, ShieldAlert,
  Loader2, Copy, AlertTriangle, User, Mail, Globe, ExternalLink, Info, KeyRound,
  MapPin, ChevronDown, MoreHorizontal,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useDrGreenApi } from "@/hooks/useDrGreenApi";
import { supabase } from "@/integrations/supabase/client";
import { ShippingAddressForm, type ShippingAddress } from "@/components/shop/ShippingAddressForm";
import { cn } from "@/lib/utils";

interface DrGreenClient {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isKYCVerified: boolean;
  adminApproval: string;
  createdAt: string;
}

interface ClientsSummary {
  PENDING: number;
  VERIFIED: number;
  REJECTED: number;
  totalCount: number;
}

type FilterStatus = "all" | "PENDING" | "VERIFIED" | "REJECTED";

const DRGREEN_ADMIN_URL = "https://dapp.drgreennft.com";

export function AdminClientManager() {
  const { toast } = useToast();
  const { getDappClients, getClientsSummary, syncClientStatus, reregisterClient, getDappClientDetails } = useDrGreenApi();
  
  const [clients, setClients] = useState<DrGreenClient[]>([]);
  const [summary, setSummary] = useState<ClientsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isRefetching, setIsRefetching] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [syncingClientId, setSyncingClientId] = useState<string | null>(null);
  const [reregisteringClientId, setReregisteringClientId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  const [expandedClientId, setExpandedClientId] = useState<string | null>(null);
  const [fetchingAddressFor, setFetchingAddressFor] = useState<string | null>(null);
  const [clientAddresses, setClientAddresses] = useState<Record<string, ShippingAddress | null>>({});

  const filterRef = useRef(filter);
  const searchQueryRef = useRef(searchQuery);
  
  useEffect(() => { filterRef.current = filter; }, [filter]);
  useEffect(() => { searchQueryRef.current = searchQuery; }, [searchQuery]);

  const syncClientsToLocalDb = useCallback(async (clientsList: DrGreenClient[]) => {
    try {
      const { data: existingClients } = await supabase
        .from('drgreen_clients')
        .select('drgreen_client_id, user_id');
      
      const existingMap = new Map(
        (existingClients || []).map(c => [c.drgreen_client_id, c.user_id])
      );

      for (const client of clientsList) {
        if (!client.id || !client.email) continue;
        if (existingMap.has(client.id)) continue;
        
        const fullName = [client.firstName, client.lastName].filter(Boolean).join(' ');
        
        await supabase
          .from('drgreen_clients')
          .upsert({
            drgreen_client_id: client.id,
            email: client.email,
            full_name: fullName || null,
            is_kyc_verified: client.isKYCVerified ?? false,
            admin_approval: client.adminApproval || 'PENDING',
            country_code: 'PT',
            user_id: existingMap.get(client.id) || crypto.randomUUID(),
          }, { onConflict: 'drgreen_client_id', ignoreDuplicates: false });
      }
    } catch (err) {
      console.warn('[AdminClientManager] Background sync failed:', err);
    }
  }, []);

  const fetchData = useCallback(async (options?: { showToast?: boolean; isInitialLoad?: boolean }) => {
    const { showToast = false, isInitialLoad = false } = options || {};
    
    if (showToast) setRefreshing(true);
    else if (isInitialLoad) setLoading(true);
    else setIsRefetching(true);

    try {
      const clientParams: Record<string, unknown> = { take: 100 };
      if (filterRef.current !== "all") clientParams.adminApproval = filterRef.current;
      if (searchQueryRef.current.trim()) {
        clientParams.search = searchQueryRef.current.trim();
        clientParams.searchBy = "email";
      }

      const [clientsResult, summaryResult] = await Promise.all([
        getDappClients(clientParams as Parameters<typeof getDappClients>[0]),
        getClientsSummary(),
      ]);

      if (clientsResult.error) {
        toast({ title: "Error", description: "Failed to fetch clients.", variant: "destructive" });
      } else {
        const responseData = clientsResult.data as unknown as { data?: { clients?: DrGreenClient[] } };
        const clientsList = responseData?.data?.clients || (clientsResult.data as { clients?: DrGreenClient[] })?.clients;
        if (clientsList) {
          setClients(clientsList);
          syncClientsToLocalDb(clientsList);
        }
      }

      const summaryData = summaryResult.data as unknown as { data?: { summary?: ClientsSummary } };
      const summaryObj = summaryData?.data?.summary || (summaryResult.data as { summary?: ClientsSummary })?.summary;
      if (summaryObj) setSummary(summaryObj);

      if (showToast) toast({ title: "Data Refreshed", description: "Client list updated from live API." });
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setIsRefetching(false);
      setInitialLoadComplete(true);
    }
  }, [getDappClients, getClientsSummary, toast, syncClientsToLocalDb]);

  useEffect(() => { fetchData({ isInitialLoad: true }); }, []);
  useEffect(() => { if (initialLoadComplete) fetchData(); }, [filter, searchQuery]);

  const handleSyncStatus = async (clientId: string, clientName: string) => {
    setSyncingClientId(clientId);
    try {
      const result = await syncClientStatus(clientId);
      if (result.error) {
        toast({ title: "Sync Failed", description: result.error, variant: "destructive" });
      } else {
        const responseData = result.data as unknown as { data?: DrGreenClient };
        const updatedClient = responseData?.data || result.data;
        if (updatedClient) {
          setClients(prev => prev.map(c => 
            c.id === clientId 
              ? { ...c, adminApproval: (updatedClient as DrGreenClient).adminApproval, isKYCVerified: (updatedClient as DrGreenClient).isKYCVerified }
              : c
          ));
          toast({ title: "Status Synced", description: `${clientName}'s status refreshed.` });
        }
        const summaryResult = await getClientsSummary();
        const summaryData = summaryResult.data as unknown as { data?: { summary?: ClientsSummary } };
        const summaryObj = summaryData?.data?.summary || (summaryResult.data as { summary?: ClientsSummary })?.summary;
        if (summaryObj) setSummary(summaryObj);
      }
    } catch (err) {
      toast({ title: "Sync Error", description: "Failed to sync.", variant: "destructive" });
    } finally {
      setSyncingClientId(null);
    }
  };

  const handleReregister = async (client: DrGreenClient) => {
    if (!confirm(`Re-register ${client.firstName} ${client.lastName} (${client.email})?`)) return;
    setReregisteringClientId(client.id);
    try {
      const result = await reregisterClient({
        email: client.email, firstName: client.firstName, lastName: client.lastName, countryCode: 'ZA',
      });
      if (result.error) {
        toast({ title: "Re-Registration Failed", description: result.error, variant: "destructive" });
      } else if (result.data?.success) {
        toast({ title: "Client Re-Registered", description: `New ID: ${result.data.clientId?.slice(0, 8)}...` });
        fetchData({ showToast: false });
        if (result.data.kycLink) {
          navigator.clipboard.writeText(result.data.kycLink);
          toast({ title: "KYC Link Copied" });
        }
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to re-register.", variant: "destructive" });
    } finally {
      setReregisteringClientId(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied", description: "Client ID copied." });
  };

  const handleToggleAddress = async (clientId: string) => {
    if (expandedClientId === clientId) { setExpandedClientId(null); return; }
    setExpandedClientId(clientId);
    if (clientAddresses[clientId] !== undefined) return;
    
    setFetchingAddressFor(clientId);
    try {
      const result = await getDappClientDetails(clientId);
      const responseData = result.data as unknown as { data?: { shippings?: ShippingAddress[] } };
      const shipping = responseData?.data?.shippings?.[0] || (result.data as { shippings?: ShippingAddress[] })?.shippings?.[0] || null;
      setClientAddresses(prev => ({ ...prev, [clientId]: shipping }));
      
      if (shipping) {
        await supabase.from('drgreen_clients').update({ 
          shipping_address: {
            address1: shipping.address1, address2: shipping.address2 || '', landmark: shipping.landmark || '',
            city: shipping.city, state: shipping.state || '', country: shipping.country,
            countryCode: shipping.countryCode, postalCode: shipping.postalCode,
          },
          updated_at: new Date().toISOString(),
        }).eq('drgreen_client_id', clientId);
      }
    } catch (err) {
      setClientAddresses(prev => ({ ...prev, [clientId]: null }));
      toast({ title: "Error", description: "Failed to fetch address.", variant: "destructive" });
    } finally {
      setFetchingAddressFor(null);
    }
  };

  const handleAddressSaved = (clientId: string, address: ShippingAddress) => {
    setClientAddresses(prev => ({ ...prev, [clientId]: address }));
    toast({ title: "Address Updated" });
  };

  const getStatusBadge = (client: DrGreenClient) => {
    if (client.adminApproval === "VERIFIED" && client.isKYCVerified) {
      return <Badge className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20"><ShieldCheck className="w-3 h-3 mr-1" />Verified</Badge>;
    }
    if (client.adminApproval === "PENDING" && client.isKYCVerified) {
      return <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"><Clock className="w-3 h-3 mr-1" />Ready</Badge>;
    }
    if (client.adminApproval === "PENDING") {
      return <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"><AlertTriangle className="w-3 h-3 mr-1" />Awaiting KYC</Badge>;
    }
    if (client.adminApproval === "REJECTED") {
      return <Badge className="bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20"><ShieldAlert className="w-3 h-3 mr-1" />Rejected</Badge>;
    }
    return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />{client.adminApproval}</Badge>;
  };

  const filterOptions: { value: FilterStatus; label: string; color: string }[] = [
    { value: "all", label: "All", color: "" },
    { value: "PENDING", label: "Pending", color: "text-amber-600" },
    { value: "VERIFIED", label: "Verified", color: "text-green-600" },
    { value: "REJECTED", label: "Rejected", color: "text-red-600" },
  ];

  return (
    <div className="space-y-5">
      {/* Metric Cards */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Total Clients", value: summary.totalCount, icon: Users, color: "text-[hsl(var(--admin-forest))]", bg: "bg-[hsl(var(--admin-forest))]/10" },
            { label: "Pending", value: summary.PENDING, icon: Clock, color: "text-amber-600", bg: "bg-amber-500/10" },
            { label: "Verified", value: summary.VERIFIED, icon: ShieldCheck, color: "text-[hsl(var(--admin-olive))]", bg: "bg-[hsl(var(--admin-olive))]/10" },
            { label: "Rejected", value: summary.REJECTED, icon: XCircle, color: "text-red-500", bg: "bg-red-500/10" },
          ].map((m) => (
            <Card key={m.label} className="border-[hsl(var(--admin-soft-green))]/20 bg-white/80 dark:bg-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{m.label}</p>
                    <p className={cn("text-2xl font-bold mt-1", m.color)}>{m.value}</p>
                  </div>
                  <div className={cn("p-2.5 rounded-xl", m.bg)}>
                    <m.icon className={cn("w-5 h-5", m.color)} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Filter pills */}
        <div className="flex gap-1.5 bg-[hsl(var(--admin-parchment))]/60 dark:bg-card rounded-xl p-1 flex-shrink-0">
          {filterOptions.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                filter === f.value
                  ? "bg-[hsl(var(--admin-fir))] text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/50 dark:hover:bg-white/5"
              )}
            >
              {f.label}
              {summary && f.value !== "all" && (
                <span className="ml-1.5 text-xs opacity-70">
                  {summary[f.value as keyof ClientsSummary]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchData()}
            className="pl-9 rounded-xl border-[hsl(var(--admin-soft-green))]/30"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2 flex-shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchData({ showToast: true })}
            disabled={refreshing}
            className="border-[hsl(var(--admin-soft-green))]/30 rounded-xl"
          >
            <RefreshCw className={cn("w-4 h-4 mr-1", refreshing && "animate-spin")} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="border-[hsl(var(--admin-soft-green))]/30 rounded-xl">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => window.open(DRGREEN_ADMIN_URL, '_blank')}>
                <ExternalLink className="w-4 h-4 mr-2" />Dr. Green Portal
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Client List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
        </div>
      ) : clients.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Users className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="font-medium">No clients found</p>
          <p className="text-sm mt-1">Try adjusting your filters or search</p>
        </div>
      ) : (
        <div className={cn("transition-opacity duration-200", isRefetching && "opacity-60 pointer-events-none")}>
          <ScrollArea className="h-[600px]">
            <div className="space-y-2">
              {clients.map((client, index) => (
                <motion.div
                  key={client.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.03 }}
                >
                  <Card className="border-[hsl(var(--admin-soft-green))]/15 hover:border-[hsl(var(--admin-fir))]/30 transition-all bg-white/80 dark:bg-card rounded-xl overflow-hidden">
                    <CardContent className="p-3 sm:p-4">
                      {/* Desktop: single row */}
                      <div className="hidden sm:flex items-center gap-4">
                        <div className="w-9 h-9 rounded-full bg-[hsl(var(--admin-fir))]/10 flex items-center justify-center flex-shrink-0">
                          <User className="w-4 h-4 text-[hsl(var(--admin-fir))]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm">{client.firstName} {client.lastName}</span>
                            {getStatusBadge(client)}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                            <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{client.email}</span>
                            <span className="font-mono">{client.id.slice(0, 8)}…</span>
                            <span>{new Date(client.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => copyToClipboard(client.id)}>
                                <Copy className="w-4 h-4 mr-2" />Copy Client ID
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleToggleAddress(client.id)}>
                                <MapPin className="w-4 h-4 mr-2" />
                                {expandedClientId === client.id ? "Hide Address" : "View Address"}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleSyncStatus(client.id, `${client.firstName} ${client.lastName}`)} disabled={syncingClientId === client.id}>
                                <RefreshCw className="w-4 h-4 mr-2" />Sync Status
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleReregister(client)} disabled={reregisteringClientId === client.id}
                                className="text-amber-600">
                                <KeyRound className="w-4 h-4 mr-2" />Re-Register
                              </DropdownMenuItem>
                              {client.adminApproval === "PENDING" && (
                                <DropdownMenuItem onClick={() => window.open(DRGREEN_ADMIN_URL, '_blank')}>
                                  <ExternalLink className="w-4 h-4 mr-2" />Approve in Dr. Green
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>

                      {/* Mobile: stacked card */}
                      <div className="sm:hidden space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-8 h-8 rounded-full bg-[hsl(var(--admin-fir))]/10 flex items-center justify-center flex-shrink-0">
                              <User className="w-3.5 h-3.5 text-[hsl(var(--admin-fir))]" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-sm truncate">{client.firstName} {client.lastName}</p>
                              <p className="text-xs text-muted-foreground truncate">{client.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            {getStatusBadge(client)}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => copyToClipboard(client.id)}>
                                  <Copy className="w-4 h-4 mr-2" />Copy ID
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleToggleAddress(client.id)}>
                                  <MapPin className="w-4 h-4 mr-2" />Address
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleSyncStatus(client.id, `${client.firstName}`)}>
                                  <RefreshCw className="w-4 h-4 mr-2" />Sync
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleReregister(client)} className="text-amber-600">
                                  <KeyRound className="w-4 h-4 mr-2" />Re-Register
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </div>

                      {/* Expandable Address Panel */}
                      <AnimatePresence>
                        {expandedClientId === client.id && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="mt-3 pt-3 border-t border-border/30">
                              <div className="flex items-center gap-2 mb-3">
                                <MapPin className="w-4 h-4 text-[hsl(var(--admin-fir))]" />
                                <span className="font-medium text-sm">Shipping Address</span>
                              </div>
                              {fetchingAddressFor === client.id ? (
                                <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
                                  <Loader2 className="w-4 h-4 animate-spin" />Fetching…
                                </div>
                              ) : (
                                <>
                                  {clientAddresses[client.id] && (
                                    <div className="mb-3 p-3 rounded-xl bg-[hsl(var(--admin-parchment))]/50 dark:bg-muted/30 text-sm">
                                      <p className="font-medium mb-1">Current:</p>
                                      <p>{clientAddresses[client.id]!.address1}</p>
                                      {clientAddresses[client.id]!.address2 && <p>{clientAddresses[client.id]!.address2}</p>}
                                      <p>{clientAddresses[client.id]!.city}{clientAddresses[client.id]!.state && `, ${clientAddresses[client.id]!.state}`} {clientAddresses[client.id]!.postalCode}</p>
                                      <p>{clientAddresses[client.id]!.country}</p>
                                    </div>
                                  )}
                                  {!clientAddresses[client.id] && clientAddresses[client.id] !== undefined && (
                                    <p className="text-sm text-muted-foreground mb-3">No address on file</p>
                                  )}
                                  <ShippingAddressForm
                                    clientId={client.id}
                                    initialAddress={clientAddresses[client.id]}
                                    variant="inline"
                                    isAdmin={true}
                                    submitLabel="Update Address"
                                    onSuccess={(addr) => handleAddressSaved(client.id, addr)}
                                    onCancel={() => setExpandedClientId(null)}
                                  />
                                </>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}

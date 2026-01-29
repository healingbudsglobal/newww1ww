import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Users,
  RefreshCw,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  Copy,
  AlertTriangle,
  User,
  Mail,
  Globe,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useDrGreenApi } from "@/hooks/useDrGreenApi";
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

export function AdminClientManager() {
  const { toast } = useToast();
  const { getDappClients, getClientsSummary, verifyDappClient } = useDrGreenApi();
  
  const [clients, setClients] = useState<DrGreenClient[]>([]);
  const [summary, setSummary] = useState<ClientsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isRefetching, setIsRefetching] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    action: 'approve' | 'reject' | null;
    client: DrGreenClient | null;
  }>({ open: false, action: null, client: null });

  // Use refs to access current filter/search values without triggering re-creation
  const filterRef = React.useRef(filter);
  const searchQueryRef = React.useRef(searchQuery);
  
  useEffect(() => {
    filterRef.current = filter;
  }, [filter]);
  
  useEffect(() => {
    searchQueryRef.current = searchQuery;
  }, [searchQuery]);

  const fetchData = useCallback(async (options?: { showToast?: boolean; isInitialLoad?: boolean }) => {
    const { showToast = false, isInitialLoad = false } = options || {};
    
    if (showToast) {
      setRefreshing(true);
    } else if (isInitialLoad) {
      setLoading(true);
    } else {
      setIsRefetching(true);
    }

    try {
      // Fetch clients with filter - use refs to get current values
      const clientParams: Record<string, unknown> = { take: 100 };
      if (filterRef.current !== "all") {
        clientParams.adminApproval = filterRef.current;
      }
      if (searchQueryRef.current.trim()) {
        clientParams.search = searchQueryRef.current.trim();
        clientParams.searchBy = "email";
      }

      const [clientsResult, summaryResult] = await Promise.all([
        getDappClients(clientParams as Parameters<typeof getDappClients>[0]),
        getClientsSummary(),
      ]);

      if (clientsResult.error) {
        console.error("Error fetching clients:", clientsResult.error);
        toast({
          title: "Error",
          description: "Failed to fetch clients from Dr. Green API.",
          variant: "destructive",
        });
      } else {
        // Handle nested data structure from API: { success, statusCode, message, data: { clients: [...] } }
        const responseData = clientsResult.data as unknown as { data?: { clients?: DrGreenClient[] } };
        const clientsList = responseData?.data?.clients || (clientsResult.data as { clients?: DrGreenClient[] })?.clients;
        if (clientsList) {
          setClients(clientsList);
        }
      }

      // Handle nested summary structure: { success, statusCode, message, data: { summary: {...} } }
      const summaryData = summaryResult.data as unknown as { data?: { summary?: ClientsSummary } };
      const summaryObj = summaryData?.data?.summary || (summaryResult.data as { summary?: ClientsSummary })?.summary;
      if (summaryObj) {
        setSummary(summaryObj);
      }

      if (showToast) {
        toast({
          title: "Data Refreshed",
          description: "Client list updated from live API.",
        });
      }
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setIsRefetching(false);
      setInitialLoadComplete(true);
    }
  }, [getDappClients, getClientsSummary, toast]);

  // Initial load effect - runs once on mount
  useEffect(() => {
    fetchData({ isInitialLoad: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filter/search change effect - doesn't show full loading state
  useEffect(() => {
    if (initialLoadComplete) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, searchQuery]);

  const handleApprove = async (clientId: string, clientName: string) => {
    setActionLoading(clientId);
    try {
      const { error } = await verifyDappClient(clientId, "verify");
      if (error) {
        toast({
          title: "Approval Failed",
          description: error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Client Approved",
          description: `${clientName} has been verified successfully.`,
        });
        await fetchData();
      }
    } catch (err) {
      console.error("Approve error:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (clientId: string, clientName: string) => {
    setActionLoading(clientId);
    try {
      const { error } = await verifyDappClient(clientId, "reject");
      if (error) {
        toast({
          title: "Rejection Failed",
          description: error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Client Rejected",
          description: `${clientName} has been rejected.`,
        });
        await fetchData();
      }
    } catch (err) {
      console.error("Reject error:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Client ID copied to clipboard.",
    });
  };

  const openConfirmDialog = (client: DrGreenClient, action: 'approve' | 'reject') => {
    setConfirmDialog({ open: true, action, client });
  };

  const closeConfirmDialog = () => {
    setConfirmDialog({ open: false, action: null, client: null });
  };

  const executeConfirmedAction = async () => {
    if (!confirmDialog.client || !confirmDialog.action) return;
    
    const { client, action } = confirmDialog;
    const clientName = `${client.firstName} ${client.lastName}`;
    
    closeConfirmDialog();
    
    if (action === 'approve') {
      await handleApprove(client.id, clientName);
    } else {
      await handleReject(client.id, clientName);
    }
  };

  const getStatusBadge = (client: DrGreenClient) => {
    if (client.adminApproval === "VERIFIED" && client.isKYCVerified) {
      return (
        <Badge className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20">
          <ShieldCheck className="w-3 h-3 mr-1" />
          Fully Verified
        </Badge>
      );
    }
    if (client.adminApproval === "PENDING" && client.isKYCVerified) {
      return (
        <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20">
          <Clock className="w-3 h-3 mr-1" />
          Ready for Approval
        </Badge>
      );
    }
    if (client.adminApproval === "PENDING" && !client.isKYCVerified) {
      return (
        <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20">
          <AlertTriangle className="w-3 h-3 mr-1" />
          Awaiting KYC
        </Badge>
      );
    }
    if (client.adminApproval === "REJECTED") {
      return (
        <Badge className="bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20">
          <ShieldAlert className="w-3 h-3 mr-1" />
          Rejected
        </Badge>
      );
    }
    return (
      <Badge variant="secondary">
        <Clock className="w-3 h-3 mr-1" />
        {client.adminApproval}
      </Badge>
    );
  };

  const getKycBadge = (isKYCVerified: boolean) => {
    if (isKYCVerified) {
      return (
        <Badge variant="outline" className="text-green-600 dark:text-green-400 border-green-500/30">
          <CheckCircle className="w-3 h-3 mr-1" />
          KYC Verified
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="text-muted-foreground border-muted">
        <XCircle className="w-3 h-3 mr-1" />
        KYC Pending
      </Badge>
    );
  };

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-xl">Client Management</CardTitle>
                <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 rounded animate-pulse">
                  LIVE
                </span>
              </div>
              <CardDescription>
                Manage Dr. Green API clients • Approve or reject registrations
              </CardDescription>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchData({ showToast: true })}
            disabled={refreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Filter Tabs */}
        <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterStatus)}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all" className="text-xs sm:text-sm">
              All
              {summary && (
                <span className="ml-1.5 px-1.5 py-0.5 text-[10px] bg-muted rounded">
                  {summary.totalCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="PENDING" className="text-xs sm:text-sm">
              Pending
              {summary && (
                <span className="ml-1.5 px-1.5 py-0.5 text-[10px] bg-amber-500/20 text-amber-600 rounded">
                  {summary.PENDING}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="VERIFIED" className="text-xs sm:text-sm">
              Verified
              {summary && (
                <span className="ml-1.5 px-1.5 py-0.5 text-[10px] bg-green-500/20 text-green-600 rounded">
                  {summary.VERIFIED}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="REJECTED" className="text-xs sm:text-sm">
              Rejected
              {summary && (
                <span className="ml-1.5 px-1.5 py-0.5 text-[10px] bg-red-500/20 text-red-600 rounded">
                  {summary.REJECTED}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Search */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchData()}
              className="pl-9"
            />
          </div>
          <Button variant="secondary" onClick={() => fetchData()}>
            Search
          </Button>
        </div>

        {/* Client List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        ) : clients.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No clients found</p>
          </div>
        ) : (
          <div className={cn(
            "transition-opacity duration-200",
            isRefetching && "opacity-60 pointer-events-none"
          )}>
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-4">
              {clients.map((client, index) => (
                <motion.div
                  key={client.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Card className="border-border/60 hover:border-primary/30 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        {/* Client Info */}
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-muted-foreground" />
                              <span className="font-semibold text-foreground">
                                {client.firstName} {client.lastName}
                              </span>
                            </div>
                            {getStatusBadge(client)}
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                            <div className="flex items-center gap-1.5">
                              <Mail className="w-3.5 h-3.5" />
                              <span>{client.email}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Globe className="w-3.5 h-3.5" />
                              <span className="font-mono text-xs">
                                {client.id.slice(0, 8)}...
                              </span>
                              <button
                                onClick={() => copyToClipboard(client.id)}
                                className="text-muted-foreground hover:text-foreground transition-colors"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 flex-wrap">
                            {getKycBadge(client.isKYCVerified)}
                            <span className="text-xs text-muted-foreground">
                              Registered: {new Date(client.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2">
                          {client.adminApproval === "PENDING" && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => openConfirmDialog(client, 'approve')}
                                disabled={actionLoading === client.id}
                                className="bg-green-600 hover:bg-green-700 text-white"
                              >
                                {actionLoading === client.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <>
                                    <CheckCircle className="w-4 h-4 mr-1" />
                                    Approve
                                  </>
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openConfirmDialog(client, 'reject')}
                                disabled={actionLoading === client.id}
                                className="border-red-500/30 text-red-600 hover:bg-red-500/10"
                              >
                                {actionLoading === client.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <>
                                    <XCircle className="w-4 h-4 mr-1" />
                                    Reject
                                  </>
                                )}
                              </Button>
                            </>
                          )}
                          {client.adminApproval === "VERIFIED" && (
                            <Badge className="bg-green-500/10 text-green-600 dark:text-green-400 px-3 py-1">
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Approved
                            </Badge>
                          )}
                          {client.adminApproval === "REJECTED" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openConfirmDialog(client, 'approve')}
                              disabled={actionLoading === client.id}
                            >
                              {actionLoading === client.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <>
                                  <RefreshCw className="w-4 h-4 mr-1" />
                                  Re-approve
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </ScrollArea>
          </div>
        )}

        {/* Confirmation Dialog */}
        <AlertDialog open={confirmDialog.open} onOpenChange={(open) => !open && closeConfirmDialog()}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                {confirmDialog.action === 'approve' ? (
                  <>
                    <ShieldCheck className="w-5 h-5 text-green-600" />
                    Approve Client?
                  </>
                ) : (
                  <>
                    <ShieldAlert className="w-5 h-5 text-red-600" />
                    Reject Client?
                  </>
                )}
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-2">
                <p>
                  Are you sure you want to {confirmDialog.action}{" "}
                  <strong>{confirmDialog.client?.firstName} {confirmDialog.client?.lastName}</strong>{" "}
                  ({confirmDialog.client?.email})?
                </p>
                <p className="text-muted-foreground">
                  {confirmDialog.action === 'approve' 
                    ? "This will grant them access to purchase medical cannabis products through the platform."
                    : "This will prevent them from purchasing products until they are re-approved."}
                </p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={executeConfirmedAction}
                className={
                  confirmDialog.action === 'approve'
                    ? "bg-green-600 hover:bg-green-700 text-white"
                    : "bg-red-600 hover:bg-red-700 text-white"
                }
              >
                {confirmDialog.action === 'approve' ? "Yes, Approve Client" : "Yes, Reject Client"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}

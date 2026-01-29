import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Server,
  Database,
  Users,
  ShoppingCart,
  Leaf,
  ArrowLeftRight,
  TrendingUp,
  Settings,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useApiComparison, DataType, StrainDiff, StrainItem, Environment } from "@/hooks/useApiComparison";
import { formatPrice } from "@/lib/currency";

export function ApiComparisonDashboard() {
  const { 
    state, 
    isRefreshing, 
    stagingEnvironment,
    setStagingEnvironment,
    fetchComparison, 
    calculateStrainDiffs, 
    getDiffCount 
  } = useApiComparison();
  const [activeTab, setActiveTab] = useState<DataType>("strains");
  const [countryCode] = useState("ZAF");

  useEffect(() => {
    fetchComparison(activeTab, countryCode);
  }, [stagingEnvironment]);

  const handleRefresh = () => {
    fetchComparison(activeTab, countryCode);
  };

  const handleTabChange = (value: string) => {
    const dataType = value as DataType;
    setActiveTab(dataType);
    fetchComparison(dataType, countryCode);
  };

  const handleEnvironmentChange = (value: string) => {
    setStagingEnvironment(value as 'staging' | 'railway');
  };

  const prodData = state.production.data;
  const stagingData = state.staging.data;
  const strainDiffs = activeTab === "strains" && prodData?.data && stagingData?.data
    ? calculateStrainDiffs(prodData.data, stagingData.data)
    : [];

  const diffCount = strainDiffs.filter(d => d.hasDiff).length;
  const prodCount = prodData?.itemCount || 0;
  const stagingCount = stagingData?.itemCount || 0;

  // Get summary data for comparison
  const prodSummary = prodData?.summary;
  const stagingSummary = stagingData?.summary;

  return (
    <Card className="border-2 border-dashed border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <ArrowLeftRight className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">API Comparison Dashboard</CardTitle>
              <CardDescription>
                Compare production and staging environments side-by-side
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Environment Selector */}
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4 text-muted-foreground" />
              <Select value={stagingEnvironment} onValueChange={handleEnvironmentChange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select staging env" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="staging">Official Staging</SelectItem>
                  <SelectItem value="railway">Railway (Dev)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {state.lastUpdated && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {state.lastUpdated.toLocaleTimeString()}
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh All
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Tab Navigation */}
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="strains" className="flex items-center gap-2">
              <Leaf className="w-4 h-4" />
              Strains
            </TabsTrigger>
            <TabsTrigger value="clients" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Clients
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4" />
              Orders
            </TabsTrigger>
            <TabsTrigger value="sales" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Sales
            </TabsTrigger>
            <TabsTrigger value="clientsSummary" className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              Summary
            </TabsTrigger>
          </TabsList>

          {/* Side-by-Side Comparison Panels */}
          <div className="grid grid-cols-2 gap-4 mt-6">
            {/* Production Panel */}
            <EnvironmentPanel
              title="Production"
              badge="🟢"
              loading={state.production.loading}
              error={state.production.error}
              data={prodData}
              summary={prodSummary}
              isProduction
              dataType={activeTab}
            />

            {/* Staging Panel */}
            <EnvironmentPanel
              title={stagingEnvironment === 'staging' ? 'Staging (Official)' : 'Railway (Dev)'}
              badge="🟠"
              loading={state.staging.loading}
              error={state.staging.error}
              data={stagingData}
              summary={stagingSummary}
              isProduction={false}
              dataType={activeTab}
            />
          </div>

          {/* Comparison Table Content */}
          <TabsContent value="strains" className="mt-6">
            <StrainsComparisonTable diffs={strainDiffs} loading={state.production.loading || state.staging.loading} />
          </TabsContent>

          <TabsContent value="clients" className="mt-6">
            <GenericComparisonTable
              prodData={prodData?.data || []}
              stagingData={stagingData?.data || []}
              loading={state.production.loading || state.staging.loading}
              columns={["id", "email", "firstName", "lastName", "isKYCVerified", "adminApproval"]}
              idField="id"
            />
          </TabsContent>

          <TabsContent value="orders" className="mt-6">
            <GenericComparisonTable
              prodData={prodData?.data || []}
              stagingData={stagingData?.data || []}
              loading={state.production.loading || state.staging.loading}
              columns={["id", "orderStatus", "paymentStatus", "totalAmount"]}
              idField="id"
            />
          </TabsContent>

          <TabsContent value="sales" className="mt-6">
            <SalesComparisonTable
              prodData={prodData?.data || []}
              stagingData={stagingData?.data || []}
              loading={state.production.loading || state.staging.loading}
            />
          </TabsContent>

          <TabsContent value="clientsSummary" className="mt-6">
            <SummaryComparison
              prodSummary={prodSummary}
              stagingSummary={stagingSummary}
              loading={state.production.loading || state.staging.loading}
            />
          </TabsContent>
        </Tabs>

        {/* Summary Footer */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border">
          <div className="flex items-center gap-4">
            <Database className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm">
              <strong>{prodCount}</strong> items (Prod) vs <strong>{stagingCount}</strong> items ({stagingEnvironment === 'staging' ? 'Staging' : 'Railway'})
            </span>
          </div>
          <div className="flex items-center gap-2">
            {diffCount > 0 ? (
              <Badge variant="destructive" className="flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                {diffCount} differences
              </Badge>
            ) : (
              <Badge className="bg-green-500/10 text-green-600 border-green-500/20 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                In sync
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface EnvironmentPanelProps {
  title: string;
  badge: string;
  loading: boolean;
  error: string | null;
  data: {
    apiUrl: string;
    responseTime: number;
    itemCount: number;
    success: boolean;
  } | null;
  summary?: {
    PENDING?: number;
    VERIFIED?: number;
    REJECTED?: number;
    ONGOING?: number;
    LEADS?: number;
    CLOSED?: number;
    totalCount?: number;
  } | null;
  isProduction: boolean;
  dataType: DataType;
}

function EnvironmentPanel({ title, badge, loading, error, data, summary, isProduction, dataType }: EnvironmentPanelProps) {
  const bgColor = isProduction ? "bg-green-500/5 border-green-500/20" : "bg-orange-500/5 border-orange-500/20";
  const textColor = isProduction ? "text-green-600" : "text-orange-600";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={`${bgColor} border`}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">{badge}</span>
              <CardTitle className={`text-sm font-medium ${textColor}`}>{title}</CardTitle>
            </div>
            {loading ? (
              <Skeleton className="h-4 w-16" />
            ) : data?.success ? (
              <CheckCircle className="w-4 h-4 text-green-500" />
            ) : (
              <XCircle className="w-4 h-4 text-destructive" />
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          ) : error ? (
            <p className="text-xs text-destructive">{error}</p>
          ) : data ? (
            <>
              <p className="text-xs text-muted-foreground truncate" title={data.apiUrl}>
                <Server className="w-3 h-3 inline mr-1" />
                {data.apiUrl.replace('https://', '').split('/')[0]}
              </p>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  <Clock className="w-3 h-3 inline mr-1" />
                  {data.responseTime}ms
                </span>
                <Badge variant="outline" className="text-xs">
                  {data.itemCount} items
                </Badge>
              </div>
              {/* Show summary data for summary tabs */}
              {summary && (dataType === 'clientsSummary' || dataType === 'salesSummary') && (
                <div className="mt-2 pt-2 border-t space-y-1">
                  {summary.PENDING !== undefined && (
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Pending:</span>
                      <span className="font-medium">{summary.PENDING}</span>
                    </div>
                  )}
                  {summary.VERIFIED !== undefined && (
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Verified:</span>
                      <span className="font-medium text-green-600">{summary.VERIFIED}</span>
                    </div>
                  )}
                  {summary.REJECTED !== undefined && (
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Rejected:</span>
                      <span className="font-medium text-destructive">{summary.REJECTED}</span>
                    </div>
                  )}
                  {summary.LEADS !== undefined && (
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Leads:</span>
                      <span className="font-medium text-blue-600">{summary.LEADS}</span>
                    </div>
                  )}
                  {summary.ONGOING !== undefined && (
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Ongoing:</span>
                      <span className="font-medium text-amber-600">{summary.ONGOING}</span>
                    </div>
                  )}
                  {summary.CLOSED !== undefined && (
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Closed:</span>
                      <span className="font-medium text-green-600">{summary.CLOSED}</span>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : null}
        </CardContent>
      </Card>
    </motion.div>
  );
}

interface StrainsComparisonTableProps {
  diffs: StrainDiff[];
  loading: boolean;
}

function StrainsComparisonTable({ diffs, loading }: StrainsComparisonTableProps) {
  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (diffs.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No strains data to compare
      </div>
    );
  }

  return (
    <ScrollArea className="h-[400px]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Status</TableHead>
            <TableHead>Name / SKU</TableHead>
            <TableHead className="text-right">Prod Price</TableHead>
            <TableHead className="text-right">Staging Price</TableHead>
            <TableHead>THC/CBD</TableHead>
            <TableHead>Differences</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {diffs.map((diff) => (
            <TableRow key={diff.id} className={diff.hasDiff ? "bg-amber-500/5" : ""}>
              <TableCell>
                {diff.hasDiff ? (
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                ) : (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                )}
              </TableCell>
              <TableCell>
                <div>
                  <p className="font-medium">{diff.name}</p>
                  {diff.sku && (
                    <p className="text-xs text-muted-foreground">{diff.sku}</p>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-right">
                {diff.production?.retailPrice != null
                  ? formatPrice(diff.production.retailPrice, 'ZA')
                  : <span className="text-muted-foreground">—</span>}
              </TableCell>
              <TableCell className="text-right">
                {diff.staging?.retailPrice != null
                  ? formatPrice(diff.staging.retailPrice, 'ZA')
                  : <span className="text-muted-foreground">—</span>}
              </TableCell>
              <TableCell>
                <div className="text-xs">
                  <span className="text-green-600">{diff.production?.thcContent || diff.staging?.thcContent || 0}% THC</span>
                  {" / "}
                  <span className="text-blue-600">{diff.production?.cbdContent || diff.staging?.cbdContent || 0}% CBD</span>
                </div>
              </TableCell>
              <TableCell>
                {diff.diffs.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {diff.diffs.map((d, i) => (
                      <Badge key={i} variant="outline" className="text-xs bg-amber-500/10 text-amber-600 border-amber-500/20">
                        {d}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">Match</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ScrollArea>
  );
}

interface GenericComparisonTableProps {
  prodData: unknown[];
  stagingData: unknown[];
  loading: boolean;
  columns: string[];
  idField: string;
}

function GenericComparisonTable({ prodData, stagingData, loading, columns, idField }: GenericComparisonTableProps) {
  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  // Simple display of production data for now
  const data = prodData.length > 0 ? prodData : stagingData;

  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No data to display
      </div>
    );
  }

  return (
    <ScrollArea className="h-[400px]">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col) => (
              <TableHead key={col} className="capitalize">
                {col.replace(/([A-Z])/g, ' $1').trim()}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.slice(0, 20).map((item, index) => {
            const row = item as Record<string, unknown>;
            return (
              <TableRow key={row[idField] as string || index}>
                {columns.map((col) => (
                  <TableCell key={col}>
                    {typeof row[col] === 'boolean' ? (
                      row[col] ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-destructive" />
                      )
                    ) : typeof row[col] === 'number' ? (
                      formatPrice(row[col] as number, 'ZA')
                    ) : (
                      String(row[col] ?? '—')
                    )}
                  </TableCell>
                ))}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </ScrollArea>
  );
}

interface SalesComparisonTableProps {
  prodData: unknown[];
  stagingData: unknown[];
  loading: boolean;
}

function SalesComparisonTable({ prodData, stagingData, loading }: SalesComparisonTableProps) {
  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  const data = prodData.length > 0 ? prodData : stagingData;

  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No sales data to display
      </div>
    );
  }

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'LEADS':
        return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'ONGOING':
        return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      case 'CLOSED':
        return 'bg-green-500/10 text-green-600 border-green-500/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <ScrollArea className="h-[400px]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Stage</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.slice(0, 20).map((item, index) => {
            const sale = item as {
              id: string;
              stage: string;
              client?: { firstName?: string; lastName?: string; email?: string };
              createdAt: string;
            };
            return (
              <TableRow key={sale.id || index}>
                <TableCell>
                  <Badge variant="outline" className={getStageColor(sale.stage)}>
                    {sale.stage}
                  </Badge>
                </TableCell>
                <TableCell className="font-medium">
                  {sale.client?.firstName} {sale.client?.lastName}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {sale.client?.email || '—'}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {sale.createdAt ? new Date(sale.createdAt).toLocaleDateString() : '—'}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </ScrollArea>
  );
}

interface SummaryComparisonProps {
  prodSummary?: {
    PENDING?: number;
    VERIFIED?: number;
    REJECTED?: number;
    ONGOING?: number;
    LEADS?: number;
    CLOSED?: number;
    totalCount?: number;
  } | null;
  stagingSummary?: {
    PENDING?: number;
    VERIFIED?: number;
    REJECTED?: number;
    ONGOING?: number;
    LEADS?: number;
    CLOSED?: number;
    totalCount?: number;
  } | null;
  loading: boolean;
}

function SummaryComparison({ prodSummary, stagingSummary, loading }: SummaryComparisonProps) {
  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (!prodSummary && !stagingSummary) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No summary data available. Select "Clients Summary" or "Sales Summary" data type.
      </div>
    );
  }

  const summaryItems = [
    { label: 'Pending Clients', key: 'PENDING' as const, color: 'text-amber-600' },
    { label: 'Verified Clients', key: 'VERIFIED' as const, color: 'text-green-600' },
    { label: 'Rejected Clients', key: 'REJECTED' as const, color: 'text-destructive' },
    { label: 'Sales Leads', key: 'LEADS' as const, color: 'text-blue-600' },
    { label: 'Sales Ongoing', key: 'ONGOING' as const, color: 'text-amber-600' },
    { label: 'Sales Closed', key: 'CLOSED' as const, color: 'text-green-600' },
    { label: 'Total Count', key: 'totalCount' as const, color: 'text-foreground' },
  ];

  return (
    <Card>
      <CardContent className="pt-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Metric</TableHead>
              <TableHead className="text-right">Production</TableHead>
              <TableHead className="text-right">Staging</TableHead>
              <TableHead className="text-center">Match</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {summaryItems.map((item) => {
              const prodValue = prodSummary?.[item.key];
              const stagingValue = stagingSummary?.[item.key];
              const hasValue = prodValue !== undefined || stagingValue !== undefined;
              const matches = prodValue === stagingValue;

              if (!hasValue) return null;

              return (
                <TableRow key={item.key}>
                  <TableCell className="font-medium">{item.label}</TableCell>
                  <TableCell className={`text-right ${item.color}`}>
                    {prodValue ?? '—'}
                  </TableCell>
                  <TableCell className={`text-right ${item.color}`}>
                    {stagingValue ?? '—'}
                  </TableCell>
                  <TableCell className="text-center">
                    {matches ? (
                      <CheckCircle className="w-4 h-4 text-green-500 mx-auto" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-500 mx-auto" />
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

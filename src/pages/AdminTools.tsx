import { useState } from "react";
import AdminLayout from "@/layout/AdminLayout";
import { ApiTestRunner } from "@/components/admin/ApiTestRunner";
import { ApiComparisonDashboard } from "@/components/admin/ApiComparisonDashboard";
import { ApiDebugPanel } from "@/components/admin/ApiDebugPanel";
import { BatchImageGenerator } from "@/components/admin/BatchImageGenerator";
import { AdminClientImport } from "@/components/admin/AdminClientImport";
import { AdminEmailTrigger } from "@/components/admin/AdminEmailTrigger";
import { KYCJourneyViewer } from "@/components/admin/KYCJourneyViewer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw, Newspaper } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const RefreshWireButton = () => {
  const [loading, setLoading] = useState(false);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { data, error } = await supabase.functions.invoke("fetch-wire-articles", {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });
      if (error) throw error;
      toast.success(`Fetched ${data?.inserted || 0} new articles`);
    } catch (err: any) {
      toast.error(err.message || "Failed to fetch articles");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Newspaper className="w-5 h-5" />
          The Wire – News Fetcher
        </CardTitle>
        <CardDescription>
          Fetch latest cannabis industry news from RSS feeds and auto-publish to The Wire
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={handleRefresh} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          {loading ? "Fetching..." : "Refresh News"}
        </Button>
      </CardContent>
    </Card>
  );
};

const AdminTools = () => (
  <AdminLayout
    title="Developer Tools"
    description="API testing, debugging, and data import utilities"
  >
    <div className="space-y-8">
      <RefreshWireButton />
      <ApiTestRunner />
      <ApiComparisonDashboard />
      <ApiDebugPanel />
      <BatchImageGenerator />
      <KYCJourneyViewer />
      <AdminEmailTrigger />
      <AdminClientImport />
    </div>
  </AdminLayout>
);

export default AdminTools;

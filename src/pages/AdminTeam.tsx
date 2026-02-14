import AdminLayout from "@/layout/AdminLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminUserRoles from "@/components/admin/AdminUserRoles";
import { WalletEmailMappings } from "@/components/admin/WalletEmailMappings";
import { TeamCommissions } from "@/components/admin/TeamCommissions";
import { Shield, Wallet, Coins } from "lucide-react";

const AdminTeam = () => (
  <AdminLayout
    title="Team & Access"
    description="Manage user roles, wallet mappings, and commission structures"
  >
    <Tabs defaultValue="roles" className="space-y-6">
      <TabsList className="inline-flex h-11 rounded-xl bg-[hsl(var(--admin-parchment))] dark:bg-[hsl(var(--admin-forest-deep))] p-1 gap-1">
        <TabsTrigger value="roles" className="rounded-lg gap-2 data-[state=active]:bg-[hsl(var(--admin-fir))] data-[state=active]:text-white px-4">
          <Shield className="w-4 h-4" />
          Roles
        </TabsTrigger>
        <TabsTrigger value="wallets" className="rounded-lg gap-2 data-[state=active]:bg-[hsl(var(--admin-fir))] data-[state=active]:text-white px-4">
          <Wallet className="w-4 h-4" />
          Wallet Mappings
        </TabsTrigger>
        <TabsTrigger value="commissions" className="rounded-lg gap-2 data-[state=active]:bg-[hsl(var(--admin-fir))] data-[state=active]:text-white px-4">
          <Coins className="w-4 h-4" />
          Commissions
        </TabsTrigger>
      </TabsList>
      <TabsContent value="roles">
        <AdminUserRoles />
      </TabsContent>
      <TabsContent value="wallets">
        <WalletEmailMappings />
      </TabsContent>
      <TabsContent value="commissions">
        <TeamCommissions />
      </TabsContent>
    </Tabs>
  </AdminLayout>
);

export default AdminTeam;

import { useState } from "react";
import AdminLayout from "@/layout/AdminLayout";
import { AdminClientManager } from "@/components/admin/AdminClientManager";
import { AdminClientCreator } from "@/components/admin/AdminClientCreator";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Plus, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const AdminClients = () => {
  const [creatorOpen, setCreatorOpen] = useState(false);

  return (
    <AdminLayout
      title="Client Management"
      description="Create, manage, and sync client records with Dr. Green DApp"
    >
      <div className="space-y-6">
        <Collapsible open={creatorOpen} onOpenChange={setCreatorOpen}>
          <CollapsibleTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-between border-[hsl(var(--admin-soft-green))]/30 hover:bg-[hsl(var(--admin-parchment))]/50 dark:hover:bg-card"
            >
              <span className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Create New Client
              </span>
              <ChevronDown className={cn("w-4 h-4 transition-transform", creatorOpen && "rotate-180")} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3">
            <AdminClientCreator />
          </CollapsibleContent>
        </Collapsible>
        <AdminClientManager />
      </div>
    </AdminLayout>
  );
};

export default AdminClients;

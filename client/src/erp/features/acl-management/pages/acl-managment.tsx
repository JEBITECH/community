import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import RoleAccessRights from "../components/aclListComponent";
import Layout from "@/components/Layout";
import { Shield } from "lucide-react";

export default function ACLManagement() {
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  
  useEffect(() => {
    if (!isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, toast]);

  if (!isAuthenticated) return null;

  return (
    <Layout onNewImport={() => {}} title="Access Control Management" subtitle="Manage user roles, permissions, and access rights" icon={<Shield className="h-8 w-8" />}>
      <div className="p-6 bg-background min-h-full">
        <RoleAccessRights />
      </div>
    </Layout>
  );
}

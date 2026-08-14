import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Layout from "@/components/Layout";
import { useLoading } from "@/utils/hooks/useLoading";
import { Users } from "lucide-react";
import { useUsers } from "../hooks/useUsers";
import UserTable from "../components/UserTable";
import { useOrganizationContext } from "@/contexts/OrganizationContext";

export default function UserManagement() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const { toast } = useToast();
  const { isAuthenticated, loading, user } = useAuth();
  const { showLoader, hideLoader } = useLoading();

  const isSuperAdmin = (user as any)?.role === "super_admin";

  const { selectedOrganizationId } = useOrganizationContext();

  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(value);
      setCurrentPage(1);
    }, 300);
  }, []);

  // Reset to page 1 whenever the selected org changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedOrganizationId]);

  const { data: usersList, isLoading, refetch: refetchUsers } = useUsers(currentPage, 10, selectedOrganizationId, debouncedSearch || undefined);

  useEffect(() => {
    if (isLoading) showLoader();
    else hideLoader();
  }, [isLoading]);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      toast({
        title: "Session Expired",
        description: "Please log in again.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 1000);
    }
  }, [isAuthenticated, loading, toast]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!isAuthenticated) return null;

  const tableUsers = Array.isArray(usersList) ? usersList : (usersList?.data || []);
  const paginationMeta = usersList?.meta;

  return (
    <Layout title="User Management" subtitle="Manage system users and their permissions" icon={<Users className="h-8 w-8" />}>
      <div className="bg-background min-h-full">
        <div className="p-6">
          <UserTable
            userList={tableUsers}
            refetchUsers={refetchUsers}
            isSuperAdmin={isSuperAdmin}
            paginationMeta={paginationMeta}
            onPageChange={setCurrentPage}
            selectedOrganizationId={selectedOrganizationId}
            searchQuery={searchQuery}
            onSearchChange={handleSearchChange}
          />
        </div>
      </div>
    </Layout>
  );
}

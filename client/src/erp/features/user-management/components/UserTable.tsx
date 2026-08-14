import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useGetUserById, useInviteUser, useReInviteUser } from "../hooks/useCreateUsers";
import { capitalizeWords } from "@/utils/helper";
import { toast } from "@/hooks/use-toast";
import { useOrganizations } from "../../organization-management";
import { useGetRolesByOrganization } from "../../acl-management";
import { User, Mail, Shield, Phone, CheckCircle, XCircle, Plus, Building, Info, Loader2, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

interface Role {
  role_id: number;
  name: string;
}

interface UserWithOrganization {
  id: string; firstName: string; lastName: string; email: string; role: string;
  roleId: number | null; resetPasswordExpires: string | null; isActive: boolean;
  createdAt: string; updatedAt: string; organization_id: number;
}

interface PaginationMeta {
  currentPage: number; totalPages: number; totalItems: number; itemsPerPage: number;
}

export default function UserTable(props: { userList: any[]; refetchUsers: () => void; isSuperAdmin: boolean; paginationMeta?: PaginationMeta; onPageChange?: (page: number) => void; selectedOrganizationId?: number | null; searchQuery?: string; onSearchChange?: (value: string) => void }) {
  const { user } = useAuth();
  const userWithOrg = user as unknown as UserWithOrganization;
  const { userList, refetchUsers, isSuperAdmin, paginationMeta, onPageChange, searchQuery: searchQueryProp, onSearchChange } = props;
  const navigate = useNavigate();

  const reInviteMutation = useReInviteUser();
  const inviteMutation = useInviteUser();
  const { data: organizationsList, isLoading: isLoadingOrganizations } = useOrganizations();

  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedOrganization, setSelectedOrganization] = useState<string>("");
  const [form, setForm] = useState({ email: "", firstName: "", organizationId: "", roleId: "" });
  const [emailError, setEmailError] = useState("");
  const [nameError, setNameError] = useState("");
  const [organizationError, setOrganizationError] = useState("");
  const { data: userProfile, isLoading: userProfileLoading, refetch: refetchUserProfile } = useGetUserById(selectedUserId?.toString() ?? '');
  const { data: organizationRoles = [], isLoading: roleLoading, refetch: refetchOrganizationRoles } = useGetRolesByOrganization(selectedOrganization);
  const [organizationOptions, setOrganizationOptions] = useState<any[]>([]);

  const searchQuery = searchQueryProp ?? '';

  useEffect(() => {
    if (!isLoadingOrganizations && organizationsList?.organization_list?.length > 0) {
      let filtered = organizationsList.organization_list;
      if (userWithOrg?.role === "super_admin" && userWithOrg?.organization_id) {
        filtered = organizationsList.organization_list.filter((org: any) => org.organization_id === userWithOrg.organization_id);
      }
      setOrganizationOptions(filtered);
    }
  }, [isLoadingOrganizations, organizationsList, userWithOrg]);

  useEffect(() => { if (selectedOrganization) refetchOrganizationRoles(); }, [selectedOrganization]);

  const handleOpenView = async (userId: number) => {
    setSelectedUserId(userId);
    navigate(`/users/profile/${userId}`);
    await refetchUserProfile();
  };

  const handleOpenInvite = () => {
    setForm({ email: "", firstName: "", organizationId: "", roleId: "" });
    setSelectedOrganization("");
    setEmailError(""); setNameError(""); setOrganizationError("");
    setInviteDialogOpen(true);
  };

  const isValidEmail = (email: string): boolean => /^[a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
  const MAX_NAME_LENGTH = 100;
  const isValidName = (name: string): boolean => /^[a-zA-Z\s'-]+$/.test(name) && name.trim().length > 0 && name.length <= MAX_NAME_LENGTH;

  const handleInviteSubmit = async () => {
    setEmailError(""); setNameError("");
    if (!form.firstName.trim()) { setNameError("Please enter a name"); toast({ title: "Invalid Name", description: "Please enter a name", variant: "destructive" }); return; }
    if (form.firstName.length > MAX_NAME_LENGTH) { setNameError(`Name must not exceed ${MAX_NAME_LENGTH} characters`); return; }
    if (!isValidName(form.firstName.trim())) { setNameError("Name can only contain letters, spaces, hyphens, and apostrophes"); return; }
    if (!isValidEmail(form.email.trim())) { setEmailError("Please enter a valid email address"); return; }
    if (!form.organizationId) { toast({ title: "Organization Required", description: "Please select an organization", variant: "destructive" }); return; }
    if (organizationError) { toast({ title: "Invalid Organization", description: organizationError, variant: "destructive" }); return; }
    if (!form.roleId) { toast({ title: "Role Required", description: "Please select a role", variant: "destructive" }); return; }
    try {
      await inviteMutation.mutateAsync({ ...form, email: form.email.trim() });
      toast({ title: "Success", description: "User invited successfully!", variant: "success" });
      setEmailError(""); setInviteDialogOpen(false); refetchUsers();
    } catch (err: any) {
      let errorMessage = "Failed to invite user";
      if (err.message) {
        if (err.message.includes("already exists") || err.message.includes("duplicate") || err.message.includes("already invited")) errorMessage = "This user has already been invited.";
        else if (err.message.includes("400")) { const match = err.message.match(/400:\s*(.+)/); if (match?.[1]) errorMessage = match[1]; }
        else errorMessage = err.message;
      }
      setEmailError(errorMessage);
      toast({ title: "Unable to Invite User", description: errorMessage, variant: "destructive" });
    }
  };

  return (
    <>
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
        {/* Card Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Users</h2>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input type="text" placeholder="Search users..." value={searchQuery} onChange={(e) => onSearchChange?.(e.target.value)}
                  className="h-8 pl-8 pr-3 w-56 border border-slate-200 dark:border-slate-700 rounded-md text-xs bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-150" />
              </div>
              {user?.role !== 'owner' && (
              <button onClick={handleOpenInvite}
                className="h-8 px-3 bg-primary text-primary-foreground rounded-md flex items-center gap-1.5 text-xs font-medium hover:bg-primary/90 transition-colors">
                <Plus className="h-3.5 w-3.5" /> Invite User
              </button>
              )}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 text-xs text-muted-foreground">
                <th className="text-left px-6 py-2 font-medium">NAME</th>
                <th className="text-left px-6 py-2 font-medium">EMAIL</th>
                <th className="text-left px-6 py-2 font-medium">ROLE</th>
                <th className="text-left px-6 py-2 font-medium">STATUS</th>
                <th className="text-left px-6 py-2 font-medium">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {userList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                    {isSuperAdmin ? "No users found in this organization." : "No users available."}
                  </td>
                </tr>
              ) : (
                userList.map((u: any) => (
                  <tr key={u.id} className="border-b border-slate-100 dark:border-slate-800">
                    <td className="px-6 py-3 font-medium text-foreground">{u.firstName} {u.lastName}</td>
                    <td className="px-6 py-3 text-muted-foreground">{u.email}</td>
                    <td className="px-6 py-3 text-muted-foreground">{capitalizeWords(u.role)}</td>
                    <td className="px-6 py-3">
                      <Badge variant={u.isActive ? "default" : "secondary"}>{u.isActive ? "Active" : "Inactive"}</Badge>
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-1.5">
                        <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => reInviteMutation.mutateAsync(u.id)}>Reinvite</Button>
                        <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => handleOpenView(u.id)}>View</Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {paginationMeta && paginationMeta.totalPages > 1 && (
          <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs text-muted-foreground">
            <span>Page {paginationMeta.currentPage} of {paginationMeta.totalPages} ({paginationMeta.totalItems} total)</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="h-7 text-xs" disabled={paginationMeta.currentPage <= 1} onClick={() => onPageChange?.(paginationMeta.currentPage - 1)}>Previous</Button>
              <Button variant="outline" size="sm" className="h-7 text-xs" disabled={paginationMeta.currentPage >= paginationMeta.totalPages} onClick={() => onPageChange?.(paginationMeta.currentPage + 1)}>Next</Button>
            </div>
          </div>
        )}
      </div>

      {/* View User Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-lg">
          {userProfileLoading ? (
            <div className="flex items-center justify-center py-12"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
          ) : userProfile ? (
            <div className="space-y-0">
              <div className="text-center pb-6 border-b border-border/50">
                <div className="flex flex-col items-center space-y-4">
                  <div className="relative">
                    <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center text-primary-foreground font-bold text-xl shadow-lg">
                      {userProfile.user.firstName?.charAt(0)}{userProfile.user.lastName?.charAt(0)}
                    </div>
                    <div className="absolute -bottom-1 -right-1">
                      <div className={cn("w-6 h-6 rounded-full border-2 border-background flex items-center justify-center", userProfile.user.isActive ? "bg-success" : "bg-muted")}>
                        {userProfile.user.isActive ? <CheckCircle className="w-3 h-3 text-success-foreground" /> : <XCircle className="w-3 h-3 text-muted-foreground" />}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <h2 className="text-lg text-foreground font-semibold">{userProfile.user.firstName} {userProfile.user.lastName}</h2>
                    <Badge variant={userProfile.user.isActive ? "default" : "secondary"} className={cn("text-xs font-medium pointer-events-none", userProfile.user.isActive ? "bg-success/10 text-success border-success/20" : "bg-muted text-muted-foreground")}>
                      {userProfile.user.isActive ? "Active Account" : "Inactive Account"}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="py-6 space-y-4">
                <div className="flex items-start space-x-4 p-4 bg-primary/5 rounded-xl border border-primary/10">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center"><Mail className="w-5 h-5 text-primary" /></div>
                  <div><p className="text-xs text-primary font-medium mb-1">Email Address</p><p className="text-sm text-foreground font-medium break-all">{userProfile.user.email}</p></div>
                </div>
                <div className="flex items-start space-x-4 p-4 bg-secondary/5 rounded-xl border border-secondary/10">
                  <div className="w-10 h-10 bg-secondary/10 rounded-xl flex items-center justify-center"><Shield className="w-5 h-5 text-secondary" /></div>
                  <div><p className="text-xs text-secondary font-medium mb-1">Role</p><p className="text-sm text-foreground font-medium">{userProfile.user.role === "user" ? "ERP User" : "Administrator"}</p></div>
                </div>
                {userProfile.user.phone && (
                  <div className="flex items-start space-x-4 p-4 bg-warning/5 rounded-xl border border-warning/10">
                    <div className="w-10 h-10 bg-warning/10 rounded-xl flex items-center justify-center"><Phone className="w-5 h-5 text-warning" /></div>
                    <div><p className="text-xs text-warning font-medium mb-1">Phone Number</p><p className="text-sm text-foreground font-medium">{userProfile.user.phone}</p></div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <User className="w-8 h-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Unable to load user information</p>
            </div>
          )}
          <DialogFooter className="pt-4 border-t border-border/50"><Button variant="outline" onClick={() => setViewDialogOpen(false)} className="w-full h-11">Close</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invite User Dialog */}
      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent className="max-w-md p-0 max-h-[90vh] overflow-hidden grid-rows-[auto_1fr_auto]" onPointerDownOutside={(e) => e.preventDefault()} onInteractOutside={(e) => e.preventDefault()}>
          <div className="px-5 pt-5 pb-3 text-center border-b border-border/50">
            <DialogTitle className="text-lg font-semibold text-foreground">Invite New User</DialogTitle>
            <p className="text-xs text-muted-foreground">Send an invitation to join your organization</p>
          </div>
          <div className="px-5 py-4 space-y-4 overflow-y-auto">
            <div className="space-y-3">
              <div className="flex items-center space-x-2 pb-1 border-b border-border/30"><User className="w-3.5 h-3.5 text-primary" /><h3 className="text-xs font-medium text-foreground uppercase tracking-wide">Personal Information</h3></div>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1.5">Email Address <span className="text-destructive">*</span></label>
                  <div className="relative"><Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
                    <Input type="email" placeholder="user@company.com" value={form.email} onChange={(e) => { setForm({ ...form, email: e.target.value }); setEmailError(""); }}
                      className={`pl-10 h-9 text-sm ${emailError ? "border-destructive" : ""}`} />
                  </div>
                  {emailError && <p className="text-xs text-destructive flex items-center mt-1"><XCircle className="w-3 h-3 mr-1" />{emailError}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1.5">Full Name <span className="text-destructive">*</span></label>
                  <div className="relative"><User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
                    <Input placeholder="John Doe" value={form.firstName} maxLength={MAX_NAME_LENGTH}
                      onChange={(e) => { const v = e.target.value; if (v === "" || /^[a-zA-Z\s'-]*$/.test(v)) { setForm({ ...form, firstName: v }); setNameError(""); } }}
                      className={`pl-10 h-9 text-sm ${nameError ? "border-destructive" : ""}`} />
                  </div>
                  {nameError && <p className="text-xs text-destructive flex items-center mt-1"><XCircle className="w-3 h-3 mr-1" />{nameError}</p>}
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center space-x-2 pb-1 border-b border-border/30"><Shield className="w-3.5 h-3.5 text-secondary" /><h3 className="text-xs font-medium text-foreground uppercase tracking-wide">Access Configuration</h3></div>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1.5"><Building className="inline w-3.5 h-3.5 text-muted-foreground mr-1.5" />Organization <span className="text-destructive">*</span></label>
                  <Select value={form.organizationId} onValueChange={(value) => {
                    const selectedOrg = organizationOptions.find((org: any) => org.organization_id.toString() === value);
                    setOrganizationError("");
                    setSelectedOrganization(value);
                    setForm({ ...form, organizationId: value, roleId: "" });
                    if (selectedOrg?.is_archived) { setOrganizationError("This organization is archived"); return; }
                    if (selectedOrg?.organization_status === 'deleted' || selectedOrg?.organization_status === 'inactive') { setOrganizationError(`Organization is ${selectedOrg.organization_status}`); return; }
                    refetchOrganizationRoles();
                  }}>
                    <SelectTrigger className={`h-9 text-sm ${organizationError ? "border-destructive" : ""}`}><SelectValue placeholder="Choose an organization" /></SelectTrigger>
                    <SelectContent>
                      {isLoadingOrganizations ? <SelectItem value="loading" disabled>Loading...</SelectItem>
                        : organizationOptions.length > 0 ? organizationOptions.map((org: any) => <SelectItem key={org.organization_id} value={org.organization_id.toString()}>{org.organization_name}</SelectItem>)
                        : <SelectItem value="no-orgs" disabled>No organizations available</SelectItem>}
                    </SelectContent>
                  </Select>
                  {organizationError && <p className="text-xs text-destructive flex items-center mt-1.5"><XCircle className="w-3 h-3 mr-1" />{organizationError}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1.5"><Shield className="inline w-3.5 h-3.5 text-muted-foreground mr-1.5" />Role <span className="text-destructive">*</span></label>
                  <Select value={form.roleId} onValueChange={(value) => setForm({ ...form, roleId: value })} disabled={!selectedOrganization || roleLoading}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue placeholder={!selectedOrganization ? "Select organization first" : roleLoading ? "Loading roles..." : "Choose a role"} /></SelectTrigger>
                    <SelectContent>
                      {Array.isArray(organizationRoles?.role_list) && organizationRoles.role_list.length > 0
                        ? organizationRoles.role_list.map((role: Role) => <SelectItem key={role.role_id} value={role.role_id.toString()}>{role.name}</SelectItem>)
                        : <SelectItem value="no-roles" disabled>No roles available</SelectItem>}
                    </SelectContent>
                  </Select>
                  {!selectedOrganization && <p className="text-xs text-muted-foreground mt-1.5 flex items-center"><Info className="w-3 h-3 mr-1" />Select an organization to view roles</p>}
                </div>
              </div>
            </div>
          </div>
          <div className="px-5 py-3 border-t border-border/50 bg-muted/20">
            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => setInviteDialogOpen(false)} className="flex-1 h-9 text-sm">Cancel</Button>
              <Button onClick={handleInviteSubmit} className="flex-1 h-9 text-sm" disabled={inviteMutation.isPending || !form.email || !form.firstName || !form.organizationId || !form.roleId || !!organizationError}>
                {inviteMutation.isPending
                  ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Sending…</>
                  : <><Mail className="w-3.5 h-3.5 mr-1.5" />Send Invitation</>}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

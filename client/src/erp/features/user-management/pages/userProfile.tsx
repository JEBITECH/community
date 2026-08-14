import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Users, Mail, Edit2, ArrowLeft, Trash2, Plus, ChevronDown, ChevronUp, Banknote, Home } from "lucide-react";
import { useGetUserById, useUpdateUser } from '../hooks/useCreateUsers';
import { useGetUserAddresses, useCreateUserAddress, useUpdateUserAddress, useDeleteUserAddress } from '../hooks/useUserAddress';
import { useGetUserBankAccounts, useCreateUserBankAccount, useUpdateUserBankAccount, useDeleteUserBankAccount } from '../hooks/useUserBankAccount';
import { useGetRolesByOrganization } from '@/erp/features/acl-management';
import Layout from '@/components/Layout';

interface AddressData {
  id: string | number;
  street: string;
  city: string;
  province: string;
  zip: string;
  country: string;
  isDefault: boolean;
}

interface BankDetailData {
  id: string | number;
  bankOwnerName: string;
  bankAccountNumber: string;
  bankAccountCode: string;
  isDefault: boolean;
}

interface ProfileFormData {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  dob: string;
  role: string;
  status: string;
  companyId: string;
  taxNumber: string;
  addresses: AddressData[];
  banks: BankDetailData[];
}

const generateId = () => Math.random().toString(36).substr(2, 9);

const emptyProfile: ProfileFormData = {
  firstName: '', lastName: '', email: '', phoneNumber: '', dob: '',
  role: 'User', status: 'Active', companyId: '', taxNumber: '',
  addresses: [], banks: [],
};

export default function UserProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [expandedAddresses, setExpandedAddresses] = useState<string[]>([]);
  const [expandedBanks, setExpandedBanks] = useState<string[]>([]);
  const [profile, setProfile] = useState<ProfileFormData>(emptyProfile);

  const { data: apiData, isLoading, refetch } = useGetUserById(userId || '');
  const { data: addressesData } = useGetUserAddresses(userId || '');
  const { data: bankAccountsData } = useGetUserBankAccounts(userId || '');

  const organizationIdForRoles = apiData?.user?.organization_id;
  const { data: rolesData } = useGetRolesByOrganization(organizationIdForRoles?.toString() || '');

  const createAddressMutation = useCreateUserAddress();
  const updateAddressMutation = useUpdateUserAddress();
  const deleteAddressMutation = useDeleteUserAddress();
  const createBankMutation = useCreateUserBankAccount();
  const updateBankMutation = useUpdateUserBankAccount();
  const deleteBankMutation = useDeleteUserBankAccount();
  const updateUserMutation = useUpdateUser();

  useEffect(() => {
    if (!apiData?.user) return;
    const user = apiData.user;

    const addresses: AddressData[] = (addressesData?.data ?? []).map((addr: any) => ({
      id: addr.id,
      street: addr.street || '',
      city: addr.city || '',
      province: addr.province || '',
      zip: addr.zip_code || '',
      country: addr.country?.name || addr.country || '',
      isDefault: addr.is_default || false,
    }));

    const banks: BankDetailData[] = (bankAccountsData?.data ?? []).map((bank: any) => ({
      id: bank.id,
      bankOwnerName: bank.bank_owner_name || '',
      bankAccountNumber: bank.bank_account_number || '',
      bankAccountCode: bank.bank_account_code || '',
      isDefault: bank.is_default || false,
    }));

    setProfile({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      phoneNumber: user.phone || '',
      dob: user.dob || '',
      role: user.role || 'User',
      status: (user.isActive !== undefined ? user.isActive : user.is_active) ? 'Active' : 'Inactive',
      companyId: user.company_identification_number || '',
      taxNumber: user.tax_number || '',
      addresses,
      banks,
    });

    if (addresses.length > 0) setExpandedAddresses([addresses[0].id.toString()]);
    if (banks.length > 0) setExpandedBanks([banks[0].id.toString()]);
  }, [apiData, addressesData, bankAccountsData]);

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  const addNewAddress = () => {
    if (profile.addresses.length >= 10) {
      toast({ title: "Maximum addresses reached", description: "You can only add up to 10 addresses.", variant: "destructive" });
      return;
    }
    const newAddress: AddressData = { id: generateId(), street: '', city: '', province: '', zip: '', country: '', isDefault: profile.addresses.length === 0 };
    setProfile(prev => ({ ...prev, addresses: [...prev.addresses, newAddress] }));
    setExpandedAddresses(prev => [...prev, newAddress.id.toString()]);
  };

  const removeAddress = (id: string | number) => {
    setProfile(prev => ({ ...prev, addresses: prev.addresses.filter(addr => addr.id !== id) }));
    setExpandedAddresses(prev => prev.filter(addrId => addrId !== id.toString()));
  };

  const updateAddressField = (id: string | number, field: keyof AddressData, value: any) => {
    setProfile(prev => ({ ...prev, addresses: prev.addresses.map(addr => addr.id === id ? { ...addr, [field]: value } : addr) }));
  };

  const setDefaultAddress = (id: string | number) => {
    setProfile(prev => ({ ...prev, addresses: prev.addresses.map(addr => ({ ...addr, isDefault: addr.id === id })) }));
  };

  const addNewBank = () => {
    if (profile.banks.length >= 10) {
      toast({ title: "Maximum bank details reached", description: "You can only add up to 10 bank details.", variant: "destructive" });
      return;
    }
    const newBank: BankDetailData = { id: generateId(), bankOwnerName: '', bankAccountNumber: '', bankAccountCode: '', isDefault: profile.banks.length === 0 };
    setProfile(prev => ({ ...prev, banks: [...prev.banks, newBank] }));
    setExpandedBanks(prev => [...prev, newBank.id.toString()]);
  };

  const removeBank = (id: string | number) => {
    setProfile(prev => ({ ...prev, banks: prev.banks.filter(bank => bank.id !== id) }));
    setExpandedBanks(prev => prev.filter(bankId => bankId !== id.toString()));
  };

  const updateBankField = (id: string | number, field: keyof BankDetailData, value: any) => {
    setProfile(prev => ({ ...prev, banks: prev.banks.map(bank => bank.id === id ? { ...bank, [field]: value } : bank) }));
  };

  const setDefaultBank = (id: string | number) => {
    setProfile(prev => ({ ...prev, banks: prev.banks.map(bank => ({ ...bank, isDefault: bank.id === id })) }));
  };

  const toggleAddress = (id: string | number) => {
    const idStr = id.toString();
    setExpandedAddresses(prev => prev.includes(idStr) ? prev.filter(a => a !== idStr) : [...prev, idStr]);
  };

  const toggleBank = (id: string | number) => {
    const idStr = id.toString();
    setExpandedBanks(prev => prev.includes(idStr) ? prev.filter(b => b !== idStr) : [...prev, idStr]);
  };

  const handleSave = async () => {
    if (!userId) return;
    if (!profile.firstName.trim() || !profile.lastName.trim() || !profile.email.trim()) {
      toast({ title: "Validation Error", description: "First name, last name and email are required.", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    try {
      await updateUserMutation.mutateAsync({
        userId,
        data: {
          firstName: profile.firstName,
          lastName: profile.lastName,
          email: profile.email,
          phone: profile.phoneNumber,
          dob: profile.dob || null,
          role: profile.role,
          roleId: rolesData?.role_list?.find((r: any) => r.name === profile.role)?.role_id || null,
          isActive: profile.status === 'Active',
          company_identification_number: profile.companyId,
          tax_number: profile.taxNumber,
        },
      });

      const existingAddresses = addressesData?.data || [];
      for (const address of profile.addresses) {
        const addressData = {
          user_id: userId,
          address_type: 'home' as const,
          full: `${address.street}, ${address.city}, ${address.province} ${address.zip}, ${address.country}`,
          street: address.street,
          city: address.city,
          province: address.province,
          zip_code: address.zip,
          country: address.country,
          is_default: address.isDefault,
        };
        if (typeof address.id === 'number') {
          await updateAddressMutation.mutateAsync({ id: address.id, data: addressData });
        } else {
          await createAddressMutation.mutateAsync(addressData);
        }
      }
      const currentAddressIds = profile.addresses.filter(a => typeof a.id === 'number').map(a => a.id as number);
      for (const existing of existingAddresses) {
        if (!currentAddressIds.includes(existing.id)) {
          await deleteAddressMutation.mutateAsync({ id: existing.id, userId });
        }
      }

      const existingBanks = bankAccountsData?.data || [];
      for (const bank of profile.banks) {
        const bankData = {
          user_id: userId,
          bank_owner_name: bank.bankOwnerName,
          bank_account_number: bank.bankAccountNumber,
          bank_account_code: bank.bankAccountCode,
          is_default: bank.isDefault,
          is_active: true,
        };
        if (typeof bank.id === 'number') {
          await updateBankMutation.mutateAsync({ id: bank.id, data: bankData });
        } else {
          await createBankMutation.mutateAsync(bankData);
        }
      }
      const currentBankIds = profile.banks.filter(b => typeof b.id === 'number').map(b => b.id as number);
      for (const existing of existingBanks) {
        if (!currentBankIds.includes(existing.id)) {
          await deleteBankMutation.mutateAsync({ id: existing.id, userId });
        }
      }

      toast({ title: "Profile updated", description: "User profile has been successfully updated." });
      setIsEditMode(false);
      refetch();
    } catch (err: any) {
      toast({ title: "Update failed", description: err.message || "Failed to update user profile", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Layout title="User Profile" subtitle="View and edit user details" icon={<Users className="h-8 w-8" />}>
      <div className="p-6 space-y-6 bg-background">
        <Button variant="outline" size="sm" className="gap-2" onClick={() => navigate('/users')}>
          <ArrowLeft className="w-4 h-4" /> Back to Users
        </Button>

        <Card>
          <CardContent className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback>{profile.firstName?.charAt(0)}{profile.lastName?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-lg font-semibold">{profile.firstName} {profile.lastName}</h2>
                  <Badge variant={profile.status === 'Active' ? 'default' : 'secondary'}>{profile.status}</Badge>
                </div>
              </div>
              {!isEditMode ? (
                <Button onClick={() => setIsEditMode(true)} className="gap-2"><Edit2 className="w-4 h-4" /> Edit</Button>
              ) : (
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setIsEditMode(false)} disabled={isSaving}>Cancel</Button>
                  <Button onClick={handleSave} disabled={isSaving}>{isSaving ? "Saving..." : "Save Changes"}</Button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>First Name</Label>
                <Input value={profile.firstName} disabled={!isEditMode} onChange={(e) => setProfile(p => ({ ...p, firstName: e.target.value }))} />
              </div>
              <div>
                <Label>Last Name</Label>
                <Input value={profile.lastName} disabled={!isEditMode} onChange={(e) => setProfile(p => ({ ...p, lastName: e.target.value }))} />
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" value={profile.email} disabled={!isEditMode} onChange={(e) => setProfile(p => ({ ...p, email: e.target.value }))} />
              </div>
              <div>
                <Label>Phone Number</Label>
                <Input value={profile.phoneNumber} disabled={!isEditMode} onChange={(e) => setProfile(p => ({ ...p, phoneNumber: e.target.value }))} />
              </div>
              <div>
                <Label>Date of Birth</Label>
                <Input type="date" value={profile.dob} disabled={!isEditMode} onChange={(e) => setProfile(p => ({ ...p, dob: e.target.value }))} />
              </div>
              <div>
                <Label>Role</Label>
                {isEditMode ? (
                  <Select value={profile.role} onValueChange={(value) => setProfile(p => ({ ...p, role: value }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(rolesData?.role_list ?? []).map((r: any) => (
                        <SelectItem key={r.role_id} value={r.name}>{r.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input value={profile.role} disabled />
                )}
              </div>
              <div>
                <Label>Status</Label>
                {isEditMode ? (
                  <Select value={profile.status} onValueChange={(value) => setProfile(p => ({ ...p, status: value }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Input value={profile.status} disabled />
                )}
              </div>
              <div>
                <Label>Company ID</Label>
                <Input value={profile.companyId} disabled={!isEditMode} onChange={(e) => setProfile(p => ({ ...p, companyId: e.target.value }))} />
              </div>
              <div>
                <Label>Tax Number</Label>
                <Input value={profile.taxNumber} disabled={!isEditMode} onChange={(e) => setProfile(p => ({ ...p, taxNumber: e.target.value }))} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Addresses */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold flex items-center gap-2"><Home className="w-4 h-4" /> Addresses</h3>
              {isEditMode && (
                <Button variant="outline" size="sm" onClick={addNewAddress} className="gap-1"><Plus className="w-3.5 h-3.5" /> Add Address</Button>
              )}
            </div>
            {profile.addresses.length === 0 && <p className="text-sm text-muted-foreground">No addresses on file.</p>}
            {profile.addresses.map((address) => {
              const isExpanded = expandedAddresses.includes(address.id.toString());
              return (
                <div key={address.id} className="border rounded-lg">
                  <div className="flex items-center justify-between p-3 cursor-pointer" onClick={() => toggleAddress(address.id)}>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{address.street || 'New Address'}, {address.city}</span>
                      {address.isDefault && <Badge variant="secondary">Default</Badge>}
                    </div>
                    <div className="flex items-center gap-2">
                      {isEditMode && (
                        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); removeAddress(address.id); }}><Trash2 className="w-3.5 h-3.5" /></Button>
                      )}
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="p-3 pt-0 grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Input placeholder="Street" value={address.street} disabled={!isEditMode} onChange={(e) => updateAddressField(address.id, 'street', e.target.value)} />
                      <Input placeholder="City" value={address.city} disabled={!isEditMode} onChange={(e) => updateAddressField(address.id, 'city', e.target.value)} />
                      <Input placeholder="Province/State" value={address.province} disabled={!isEditMode} onChange={(e) => updateAddressField(address.id, 'province', e.target.value)} />
                      <Input placeholder="ZIP/Postal Code" value={address.zip} disabled={!isEditMode} onChange={(e) => updateAddressField(address.id, 'zip', e.target.value)} />
                      <Input placeholder="Country" value={address.country} disabled={!isEditMode} onChange={(e) => updateAddressField(address.id, 'country', e.target.value)} />
                      {isEditMode && !address.isDefault && (
                        <Button variant="outline" size="sm" onClick={() => setDefaultAddress(address.id)}>Set as Default</Button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Bank Accounts */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold flex items-center gap-2"><Banknote className="w-4 h-4" /> Bank Accounts</h3>
              {isEditMode && (
                <Button variant="outline" size="sm" onClick={addNewBank} className="gap-1"><Plus className="w-3.5 h-3.5" /> Add Bank Account</Button>
              )}
            </div>
            {profile.banks.length === 0 && <p className="text-sm text-muted-foreground">No bank accounts on file.</p>}
            {profile.banks.map((bank) => {
              const isExpanded = expandedBanks.includes(bank.id.toString());
              return (
                <div key={bank.id} className="border rounded-lg">
                  <div className="flex items-center justify-between p-3 cursor-pointer" onClick={() => toggleBank(bank.id)}>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{bank.bankOwnerName || 'New Bank Account'}</span>
                      {bank.isDefault && <Badge variant="secondary">Default</Badge>}
                    </div>
                    <div className="flex items-center gap-2">
                      {isEditMode && (
                        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); removeBank(bank.id); }}><Trash2 className="w-3.5 h-3.5" /></Button>
                      )}
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="p-3 pt-0 grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Input placeholder="Account Owner Name" value={bank.bankOwnerName} disabled={!isEditMode} onChange={(e) => updateBankField(bank.id, 'bankOwnerName', e.target.value)} />
                      <Input placeholder="Account Number" value={bank.bankAccountNumber} disabled={!isEditMode} onChange={(e) => updateBankField(bank.id, 'bankAccountNumber', e.target.value)} />
                      <Input placeholder="Bank/Routing Code" value={bank.bankAccountCode} disabled={!isEditMode} onChange={(e) => updateBankField(bank.id, 'bankAccountCode', e.target.value)} />
                      {isEditMode && !bank.isDefault && (
                        <Button variant="outline" size="sm" onClick={() => setDefaultBank(bank.id)}>Set as Default</Button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

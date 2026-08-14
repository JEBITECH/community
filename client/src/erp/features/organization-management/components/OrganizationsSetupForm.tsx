import React, { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { GitBranch } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Building, Car, CheckCircle, Eye, EyeOff, Mail, Phone, Plus, Trash2, User, X, XCircle, Search, Filter } from "lucide-react";
import AccordionView from "./AccordionVIew";
import { useAddOrganiztion } from "../hooks/addOrganiaztion";
import { useDeleteOrganization } from "../hooks/deleteOrganization";
import { capitalizeWords } from "@/utils/helper";
import { useGetModules } from "../hooks/getAllModules";
import { toast } from "@/hooks/use-toast";
import { useLoading } from "@/utils/hooks/useLoading";
import { useNavigate } from "react-router-dom";
import { ReloadIcon } from "@radix-ui/react-icons";
import { useUpdateOrganization } from "../hooks/updateOrganization";
import { WarnPopupModal } from "@/components/reusable ui/WarningDailogBox";
import { DynamicTabs } from "@/components/reusable ui/AppTabs";
import { ActionTable, Column } from "@/components/reusable ui/AcctionTable";
import AppStepper from "@/components/reusable ui/AppStepper";
import FormLabel from "@/components/reusable ui/AppFormLabel";
import { useCheckOrganizationEmail } from "../hooks/checkOrganizationEmailUnique";
import { CreateOrganizationDto, ModuleSubscription, OrganizationData, PropertyLocation } from "../utils/types";
import { modulePriceConfig } from "@/utils/config";
import FormInput from "@/components/reusable ui/FormInputField";
import { TimezoneCombobox } from "@/components/reusable ui/TimezoneCombobox";
import ImageUpload from "@/components/reusable ui/ImageUpload";
import { deleteFile } from "@/lib/firebase-upload";

export interface ThemeConfig {
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
}

const initialThemeConfig: ThemeConfig = {
  primaryColor: "#000000",
  secondaryColor: "#ffffff",
  fontFamily: "Arial",
};
interface OrganizationProps {
  organizations: OrganizationData[];
  isLoading: boolean;
  refetchOrganization: () => void;
  currentUserOrgId?: number;
  /** When true, the form was opened from Franchise Listings to add a franchisee */
  franchiseeMode?: boolean;
  /** The franchisor org ID to set as parent_org_id */
  parentOrgId?: number | null;
  /** Display name of the parent franchisor org */
  franchiseeParentName?: string;
  /** Pre-populate the form for edit/view when navigating from Franchise Listings */
  initialEditData?: OrganizationData | null;
  /** When true the form is opened in read-only view mode */
  isViewMode?: boolean;
}

export interface LocationInfo {
  propertyName: string;
  propertyLocation: string;
}
interface Organization {
  name: string;
  email: string;
  address: string;
  timezone?: string;
  contactInformation?: string;
  locationInformation?: PropertyLocation[];
  is_franchisor?: boolean;
}

interface SuperAdmin {
  id?: number;
  name: string;
  email: string;
  newEmail?: string;
  phone?: string;
}

export interface Modules {
  id: number;
  moduleName: string;
}
export interface PMSDetails {
  is_archived?: boolean;
  pmsId?: number;
  pmsName: string;
  clientId: string;
  secretId: string;
  clientName: string;
  location: string;
  account: string;
  url: string;
}

interface FinalOrgData {
  organization: Organization;
  superAdmin: SuperAdmin;
  pmsList: PMSDetails[];
}
const columns: Column<PMSDetails>[] = [
  { header: "PMS Name", accessor: (row: any) => (row?.pmsName ? capitalizeWords(row.pmsName) : "") },
  { header: "Client ID", accessor: "clientId" },
  { header: "Secret ID", accessor: "secretId" },
  { header: "Client Name", accessor: "clientName" },
  { header: "Location", accessor: "location" },
  { header: "Account", accessor: "account" },
  { header: "URL", accessor: (row: any) => <span>{row.url}</span> },
];
export default function OrganizationSetupForm({ organizations, isLoading, refetchOrganization, currentUserOrgId, franchiseeMode = false, parentOrgId = null, franchiseeParentName, initialEditData = null, isViewMode = false }: OrganizationProps) {
  const [open, setOpen] = useState<boolean>(false);
  const [step, setStep] = useState<number>(1);
  const [localViewMode, setLocalViewMode] = useState<boolean>(isViewMode);

  const [logoFilePath, setLogoFilePath] = useState<string>("");
  const [removedLogoPaths, setRemovedLogoPaths] = useState<string[]>([]);

  const [themeType, setThemeType] = useState<"default" | "manual">("default");
  const [themeConfig, setThemeConfig] = useState<ThemeConfig>(initialThemeConfig);
  const [isEditOrganizationData, setEditOrganizationData] = useState<OrganizationData | null>(null);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [openArchiveModal, setOpenArchiveModal] = useState(false);
  const mutationDelete = useDeleteOrganization();
  const [selectedmodules, setSelectedmodules] = useState<number[]>([]);
  const [propertyInformation, setPropertyInformation] = useState<LocationInfo>({
    propertyName: "",
    propertyLocation: "",
  });
  const [showPropertyForm, setShowPropertyForm] = useState<boolean>(false);
  const [locationInformation, setLocationInformation] = useState<PropertyLocation[]>([]);
  const [organization, setOrganization] = useState<Organization>({
    name: "",
    email: "",
    address: "",
    timezone: "",
    contactInformation: "",
    locationInformation: [],
    is_franchisor: false,
  });
  const [superAdmin, setSuperAdmin] = useState<SuperAdmin>({
    id: 0,
    name: "",
    email: "",
    newEmail: "",
    phone: "",
  });

  const [pmsList, setPmsList] = useState<PMSDetails[]>([{ pmsName: "", clientId: "", secretId: "", clientName: "", location: "", account: "", url: "", is_archived: false }]);
  const [moduleSubscriptions, setModuleSubscriptions] = useState<ModuleSubscription[]>(
    selectedmodules.map((id) => ({
      module_id: id,
      term: "short",
      price: "0",
      startDate: new Date().toISOString().split("T")[0],
      endDate: new Date().toISOString().split("T")[0],
    }))
  );
  const [addedPms, setAddedPms] = useState<PMSDetails[]>([]);
  const [archivedPms, setArchivedPms] = useState<PMSDetails[]>([]);

  const [showClientId, setShowClientId] = useState<{ [key: number]: boolean }>({});
  const [showSecretId, setShowSecretId] = useState<{ [key: number]: boolean }>({});
  const [showClientName, setShowClientName] = useState<{ [key: number]: boolean }>({});

  const [modules, setModules] = useState<Modules[]>([]);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [originalEmail, setOriginalEmail] = useState<string>("");
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const { showLoader, hideLoader } = useLoading();

  const mutation = useAddOrganiztion();
  const mutationUpdate = useUpdateOrganization();
  const { data: getAllModules } = useGetModules();
  const { data: isOrganizationEmailExists, refetch: refetchEmail } = useCheckOrganizationEmail(organization.email.trim(), { enabled: false });

  const today = new Date().toISOString().split("T")[0];
  const tomorrow = new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split("T")[0];
  useEffect(() => {
    // Initialize startDate with today and endDate with tomorrow if empty
    setModuleSubscriptions((prev) =>
      prev.map((sub) => ({
        ...sub,
        startDate: sub.startDate || today,
        endDate: sub.endDate || tomorrow,
      }))
    );
  }, []);
  useEffect(() => {
    if (!selectedmodules?.length) return;

    const today = new Date().toISOString().split("T")[0];

    let updatedSubscriptions: ModuleSubscription[] = [];

    if (isEditOrganizationData) {
      // 1️⃣ Include existing subscriptions from backend (for modules already subscribed)
      const existingSubs = isEditOrganizationData.moduleSubscriptions || [];

      // 2️⃣ Find any *newly added modules* (not already in subscriptions)
      const newSubs = selectedmodules
        .filter((id) => !existingSubs.some((sub: any) => sub.module_id === id))
        .map((id) => {
          const config = modulePriceConfig.find((m) => m.moduleId === id);
          const tomorrow = new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split("T")[0];
          return {
            module_id: id,
            term: "short" as const,
            price: config ? config.prices["short"].toString() : "0",
            startDate: today,
            endDate: tomorrow,
          };
        });

      // 3️⃣ Merge with previously selected moduleSubscriptions (state)
      const tomorrow = new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split("T")[0];
      const mergedSubs = [
        ...existingSubs.map((sub: any) => ({
          module_id: sub.module_id,
          term: sub.term,
          price: sub.price,
          startDate: sub.startDate || today,
          endDate: sub.endDate || tomorrow,
        })),
        ...newSubs,
      ];

      // 4️⃣ Filter only modules currently selected (to remove unchecked ones)
      updatedSubscriptions = mergedSubs.filter((sub) => selectedmodules.includes(sub.module_id));
    } else {
      // When adding new org
      const tomorrow = new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split("T")[0];
      updatedSubscriptions = selectedmodules.map((id) => {
        const config = modulePriceConfig.find((m) => m.moduleId === id);
        return {
          module_id: id,
          term: "short" as const,
          price: config ? config.prices["short"].toString() : "0",
          startDate: today,
          endDate: tomorrow,
        };
      });
    }

    setModuleSubscriptions(updatedSubscriptions);
  }, [selectedmodules, isEditOrganizationData]);

  useEffect(() => {
    if (isEditOrganizationData) {
      setOrganization({
        name: isEditOrganizationData.organization_name,
        email: isEditOrganizationData.organization_email,
        address: isEditOrganizationData.organization_location,
      });

      setOriginalEmail(isEditOrganizationData.organization_email); // store original
    }
  }, [isEditOrganizationData]);
  useEffect(() => {
    if (isEditOrganizationData) {
      console.log("org data", isEditOrganizationData);
      setOrganization({
        name: isEditOrganizationData.organization_name,
        email: isEditOrganizationData.organization_email,
        address: isEditOrganizationData.organization_location,
        timezone: isEditOrganizationData.organization_timezone,
        contactInformation: isEditOrganizationData.organization_contact_info || "",
        is_franchisor: isEditOrganizationData.is_franchisor ?? false,
      });
      setLocationInformation(isEditOrganizationData.organization_property_locations || []);
      setSuperAdmin({
        id: isEditOrganizationData.super_admin_id,
        name: isEditOrganizationData.super_admin_name,
        email: isEditOrganizationData.super_admin_email,
        phone: isEditOrganizationData.super_admin_phone || "",
      });
      // Pre-fill PMS list for editing
      setAddedPms(
        isEditOrganizationData.pms_list
          ?.filter((pms: any) => !pms.is_archived)
          .map((pms: any) => ({
            is_archived: pms.is_archived,
            pmsId: pms.pms_id,
            pmsName: pms.pms_name,
            clientId: pms.client_id || "",
            secretId: pms.pms_client_secret || "",
            clientName: pms.pms_client_name || "",
            location: pms.pms_location || "",
            account: pms.pms_account || "",
            url: pms.pms_url || "",
          })) || []
      );
      setArchivedPms(
        isEditOrganizationData.pms_list
          ?.filter((pms: any) => pms.is_archived)
          .map((pms: any) => ({
            is_archived: pms.is_archived,
            pmsId: pms.pms_id,
            pmsName: pms.pms_name,
            clientId: pms.client_id || "",
            secretId: pms.pms_client_secret || "",
            location: pms.pms_location || "",
            account: pms.pms_account || "",
            url: pms.pms_url || "",
            clientName: pms.pms_client_name || "",
          }))
      );
      setSelectedmodules(isEditOrganizationData.modules?.map((mod: any) => mod.id) || []);

      if (isEditOrganizationData?.themeConfig?.font_family) {
        setThemeConfig({
          primaryColor: isEditOrganizationData.themeConfig.primary_color,
          secondaryColor: isEditOrganizationData.themeConfig.secondary_color,
          fontFamily: isEditOrganizationData.themeConfig.font_family,
        });
        setThemeType("manual");
      }

      // Pre-fill logo path for editing
      setLogoFilePath(isEditOrganizationData.organization_logo || "");
    } else {
      setStep(1);
      setAddedPms([]);
      setOrganization({ name: "", email: "", address: "", is_franchisor: false });
      setSuperAdmin({ name: "", email: "" });
      setPmsList([{ pmsName: "", clientId: "", secretId: "", clientName: "", location: "", account: "", url: "" }]);
      setPropertyInformation({ propertyName: "", propertyLocation: "" });
      setErrors({});
    }
  }, [open, isEditOrganizationData]);

  useEffect(() => {
    if (getAllModules) {
      setModules(getAllModules?.module_list?.map((module: any) => ({ id: module.module_id, moduleName: module.name })) || []);
    }
  }, [getAllModules?.module_list]);

  // const handleEmailBlur = async () => {
  //   const email = organization.email.trim();
  //   if (!email) return;
  //   if(organization.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(organization.email)){
  //     setErrors(prev => ({ ...prev, email: "Invalid email format." }));
  //     return;
  //   }
  //   // Only check if email changed in edit mode
  //   if (!isEditOrganizationData || email !== originalEmail.trim()) {
  //     try {
  //       const { data } = await refetchEmail();
  //       if (!data?.isUnique) {
  //         setErrors(prev => ({ ...prev, email: "This email/domain is already in use." }));
  //       } else {
  //         setErrors(prev => ({ ...prev, email: undefined }));
  //       }
  //     } catch (err) {
  //       console.error("Error checking email:", err);
  //     }
  //   }
  // };

  // Validate all module subscription dates
  const validateModuleDates = (subscriptions: ModuleSubscription[]) => {
    const dateErrors: string[] = [];
    subscriptions.forEach((sub, index) => {
      const moduleName = modules.find((m) => m.id === sub.module_id)?.moduleName || `Module #${index + 1}`;
      if (sub.startDate && sub.endDate) {
        const start = new Date(sub.startDate);
        const end = new Date(sub.endDate);
        if (start > end) {
          dateErrors.push(`${moduleName}: Start date cannot be after end date.`);
        } else if (start.getTime() === end.getTime()) {
          dateErrors.push(`${moduleName}: Start Date and End Date cannot be the same.`);
        }
      }
    });

    if (dateErrors.length > 0) {
      setErrors(prev => ({ ...prev, moduleSubscriptions: dateErrors.join('|') }));
    } else {
      setErrors(prev => ({ ...prev, moduleSubscriptions: undefined }));
    }
  };

  const handleTermChange = (moduleId: number, term: "short" | "long") => {
    setModuleSubscriptions((prev) =>
      prev.map((s) => {
        if (s.module_id === moduleId) {
          // Look up price from config
          const config = modulePriceConfig.find((m) => m.moduleId === moduleId);
          return {
            ...s,
            term,
            price: config ? config.prices[term].toString() : s.price,
          };
        }
        return s;
      })
    );
  };

  // Handle checkbox toggle
  const handleCheckboxChange = (option: number) => {
    setSelectedmodules((prevSelected) => (prevSelected.includes(option) ? prevSelected.filter((item) => item !== option) : [...prevSelected, option]));
  };

  const handlePmsChange = (index: number, field: keyof PMSDetails, value: string) => {
    const updated = [...pmsList];
    // updated[index][field] = value;
    // If changing PMS name, clear fields that don't apply to the new PMS type
    if (field === "pmsName") {
      updated[index] = {
        ...updated[index],
        pmsName: value,
        clientId: "", // Clear client ID when switching
        secretId: "", // Clear secret ID when switching
        clientName:"", // Clear client name when switching
      };
    } else {
      //@ts-ignore
      updated[index][field] = value;
    }
    setPmsList(updated);
  };

  const handleAddPropertyLocation = () => {
    const { propertyName, propertyLocation } = propertyInformation;

    if (!propertyName.trim() || !propertyLocation.trim()) {
      setErrors({
        propertyLocation: "Both Property Name and Location are required.",
      });
      return;
    }

    // Validate property name
    if (propertyName.trim().length < 2) {
      setErrors({
        propertyLocation: "Property Name must be at least 2 characters.",
      });
      return;
    }

    if (propertyName.trim().length > 100) {
      setErrors({
        propertyLocation: "Property Name cannot exceed 100 characters.",
      });
      return;
    }

    if (!/^[a-zA-Z0-9\s\-_.&()]+$/.test(propertyName.trim())) {
      setErrors({
        propertyLocation: "Property Name contains invalid characters. Only letters, numbers, spaces, and -_.&() are allowed.",
      });
      return;
    }

    // Validate property location
    if (propertyLocation.trim().length < 3) {
      setErrors({
        propertyLocation: "Property Location must be at least 3 characters.",
      });
      return;
    }

    if (propertyLocation.trim().length > 300) {
      setErrors({
        propertyLocation: "Property Location cannot exceed 300 characters.",
      });
      return;
    }

    // Clear the specific error before adding
    setLocationInformation((prev) => [
      ...prev,
      {
        property_name: propertyName.trim(),
        property_location: propertyLocation.trim(),
      },
    ]);

    // Clear input fields and hide form
    setPropertyInformation({ propertyName: "", propertyLocation: "" });
    setErrors({});
    setShowPropertyForm(false);
  };

  const handleRemovePropertyLocation = (index: number) => {
    const updated = [...locationInformation];
    updated.splice(index, 1);
    setLocationInformation(updated);

    setOrganization((prev) => ({ ...prev, locationInformation: updated }));
  };

  // Real-time validation functions
  const validateOrganizationName = (value: string) => {
    if (!value.trim()) {
      return "Organization name is required.";
    } else if (value.trim().length < 3) {
      return "Organization name must be at least 3 characters.";
    } else if (value.trim().length > 80) {
      return "Organization name cannot exceed 80 characters.";
    } else if (/^\d+$/.test(value.trim())) {
      return "Organization name cannot contain only numbers.";
    } else if (!/^[a-zA-Z0-9\s\-_.&()]+$/.test(value.trim())) {
      return "Organization name contains invalid characters. Only letters, numbers, spaces, and -_.&() are allowed.";
    }
    return undefined;
  };

  const validateOrganizationAddress = (value: string) => {
    if (!value.trim()) {
      return "Address is required.";
    } else if (value.trim().length < 5) {
      return "Address must be at least 5 characters.";
    } else if (value.trim().length > 200) {
      return "Address cannot exceed 200 characters.";
    }
    return undefined;
  };

  const validateContactInfo = (value: string) => {
    if (!value.trim()) return undefined;

    if (!/^\+?\d{1,4}?[-.\s]?\(?\d{1,3}?\)?[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}$/.test(value)) {
      return "Invalid phone number format.";
    } else if (value.trim().length < 10 || value.trim().length > 12) {
      return "Contact Information number must be between 10 and 12 digits.";
    }
    return undefined;
  };

  const validateSuperAdminName = (value: string) => {
    if (!value.trim()) {
      return "Super Admin name is required.";
    } else if (value.trim().length < 3) {
      return "Super Admin name must be at least 3 characters.";
    } else if (value.trim().length > 20) {
      return "Super Admin name cannot exceed 25 characters.";
    } else if (/^\d+$/.test(value.trim())) {
      return "Super Admin name cannot contain only numbers.";
    } else if (!/^[a-zA-Z\s\-'.]+$/.test(value.trim())) {
      return "Super Admin name contains invalid characters. Only letters, spaces, hyphens, apostrophes, and periods are allowed.";
    }
    return undefined;
  };

  const validateEmail = (value: string, fieldName: string = "email") => {
  if (!value.trim()) {
    return fieldName === "superAdminEmail"
      ? "Organization email is required."
      : undefined;
  }

  // Updated regex: allows letters, numbers, ., _, -, and +
  const emailRegex = /^[a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  if (!emailRegex.test(value.trim())) {
    return "Invalid email format.";
  }

  return undefined;
};

  const validateOrganizationEmail = (value: string) => {
    // Only show error if field has content (like user management does)
    if (!value || !value.trim()) {
      return undefined;
    }

    const trimmedValue = value.trim();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // email@domain.com
    // Domain must have at least one dot (e.g., example.com, not just "example")
    const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/; // domain.com (requires at least one dot)

    // If it contains @, validate as email
    if (trimmedValue.includes("@")) {
      if (!emailRegex.test(trimmedValue)) {
        return "Please enter a valid email address.";
      }
    } else {
      // Otherwise validate as domain
      if (!domainRegex.test(trimmedValue)) {
        return "Please enter a valid domain or email.";
      }
    }

    return undefined;
  };

  const validatePhone = (value: string) => {
    if (!value.trim()) return undefined;

    if (!/^\+?\d{1,4}?[-.\s]?\(?\d{1,3}?\)?[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}$/.test(value)) {
      return "Invalid phone number format.";
    } else if (value.trim().length < 10 || value.trim().length > 12) {
      return "Phone number must be between 10 and 12 digits.";
    }
    return undefined;
  };
  const validateStep = async (): Promise<boolean> => {
    let newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!organization.name.trim()) {
        newErrors.name = "Organization name is required.";
      } else if (organization.name.trim().length < 3) {
        newErrors.name = "Organization name must be at least 3 characters.";
      } else if (organization.name.trim().length > 80) {
        newErrors.name = "Organization name cannot exceed 80 characters.";
      } else if (/^\d+$/.test(organization.name.trim())) {
        newErrors.name = "Organization name cannot contain only numbers.";
      } else if (!/^[a-zA-Z0-9\s\-_.&()]+$/.test(organization.name.trim())) {
        newErrors.name = "Organization name contains invalid characters. Only letters, numbers, spaces, and -_.&() are allowed.";
      }
      const emailOrDomain = organization.email.trim();

      if (emailOrDomain) {
        // Allow both email format and domain format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // email@domain.com
        const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/; // domain.com

        if (!emailRegex.test(emailOrDomain) && !domainRegex.test(emailOrDomain)) {
          newErrors.email = "Please enter a valid email or domain.";
        } else {
          // Only check uniqueness if format is valid and changed
          if (!isEditOrganizationData || emailOrDomain !== originalEmail.trim()) {
            try {
              const emailData = await refetchEmail();
              if (!emailData.data?.isUnique) {
                newErrors.email = "This email/domain is already in use.";
              }
            } catch (err) {
              console.error("Error checking email/domain:", err);
              newErrors.email = "Error validating email/domain. Please try again.";
            }
          }
        }
      }
      // Organization Address Validation
      if (!organization.address.trim()) {
        newErrors.address = "Address is required.";
      } else if (organization.address.trim().length < 5) {
        newErrors.address = "Address must be at least 5 characters.";
      } else if (organization.address.trim().length > 200) {
        newErrors.address = "Address cannot exceed 200 characters.";
      }

      if (organization.contactInformation?.trim() && !/^\+?\d{1,4}?[-.\s]?\(?\d{1,3}?\)?[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}$/.test(organization.contactInformation)) {
        newErrors.organizationcontactInformation = "Invalid phone number format.";
      } else if (organization.contactInformation?.trim()) {
        if (organization.contactInformation?.trim().length < 10 || organization.contactInformation?.trim().length > 12) {
          newErrors.organizationcontactInformation = "Contact Information number must be between 10 and 12 digits.";
        }
      }
    }

    if (step === 2) {
      const emailRegex = /^[^\s@]+(\+\d+)?@[^\s@]+\.[^\s@]+$/;
      if (!superAdmin.name.trim()) {
        newErrors.superAdminName = "Super Admin name is required.";
      } else if (superAdmin.name.trim().length < 3) {
        newErrors.superAdminName = "Super Admin name must be at least 2 characters.";
      } else if (superAdmin.name.trim().length > 20) {
        newErrors.superAdminName = "Super Admin name cannot exceed 25 characters.";
      } else if (/^\d+$/.test(superAdmin.name.trim())) {
        newErrors.superAdminName = "Super Admin name cannot contain only numbers.";
      } else if (!/^[a-zA-Z\s\-'.]+$/.test(superAdmin.name.trim())) {
        newErrors.superAdminName = "Super Admin name contains invalid characters. Only letters, spaces, hyphens, apostrophes, and periods are allowed.";
      }
      if (!superAdmin.email.trim()) {
        newErrors.superAdminEmail = "Organization email is required.";
      } else if (superAdmin.email?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(superAdmin.email?.trim())) {
        newErrors.superAdminEmail = "Invalid email format.";
      }
      if (superAdmin.newEmail?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(superAdmin.newEmail)) {
        newErrors.superAdminNewEmail = "Invalid email format.";
      }
      if (superAdmin.phone?.trim() && !/^\+?\d{1,4}?[-.\s]?\(?\d{1,3}?\)?[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}$/.test(superAdmin.phone)) {
        newErrors.superAdminPhone = "Invalid phone number format.";
      } else if (superAdmin.phone?.trim()) {
        if (superAdmin.phone?.trim().length < 10 || superAdmin.phone?.trim().length > 12) {
          newErrors.superAdminPhone = "Phone number must be between 10 and 12 digits.";
        }
      }
    }

    // Step 3: PMS is optional — no mandatory validation
    if (step === 4) {
      if (!selectedmodules.length) {
        newErrors.modules = "Please select at least one option.";
      }
    }
    if (step === 5) {
      const subscriptionErrors: string[] = [];
      moduleSubscriptions.forEach((sub, index) => {
        const moduleName = modules.find((m) => m.id === sub.module_id)?.moduleName || `Module #${index + 1}`;
        // Validate price
        if (!sub.price || sub.price.trim() === "") {
          subscriptionErrors.push(`${moduleName}: Price is required.`);
          return;
        }
        
        const priceValue = parseFloat(sub.price);
        if (isNaN(priceValue) || priceValue <= 0) {
          subscriptionErrors.push(`${moduleName}: Price must be a valid number greater than 0.`);
          return;
        }
        
        // Validate dates
        if (!sub.startDate || !sub.endDate) {
          subscriptionErrors.push(`${moduleName}: Start date and end date are required.`);
          return;
        }
        
        if (sub.startDate && sub.endDate) {
          const start = new Date(sub.startDate);
          const end = new Date(sub.endDate);
          if (start > end) {
            subscriptionErrors.push(`${moduleName}: Start date cannot be after end date.`);
          } else if (start.getTime() === end.getTime()) {
            subscriptionErrors.push(`${moduleName}: Start Date and End Date cannot be the same.`);
          }
        }
      });

      if (subscriptionErrors.length > 0) {
        newErrors.moduleSubscriptions = subscriptionErrors.join('|'); // Use | as separator
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSavePms = () => {
    const current = pmsList[0];

    // Clear previous errors
    setErrors({});

    // Validate all required fields
    let pmsErrors: string[] = [];

    // PMS Name validation
    if (!current.pmsName.trim()) {
      pmsErrors.push("PMS Name is required.");
    }
    if (!current.location.trim()) {
      pmsErrors.push("Location is required.");
    }

    // Client ID validation
    if (!current.clientId.trim() && (current.pmsName === "guesty")) {
      pmsErrors.push("Client ID is required.");
    } else if (current.clientId.trim().length > 100) {
      pmsErrors.push("Client ID cannot exceed 100 characters.");
    }

    // Secret ID validation
    if (!current.secretId.trim()) {
      pmsErrors.push("Secret ID/API Key is required.");
    } else if (current.secretId.trim().length > 100) {
      pmsErrors.push("Secret ID cannot exceed 100 characters.");
    }

    // URL validation uncomment for manadotry field now it is optional
    // if (!current.url.trim()) {
    //   pmsErrors.push("URL is required.");
    // } else {
    if (current.url.trim().length > 500) {
      pmsErrors.push("URL cannot exceed 500 characters.");
    }
    const urlRegex = /^(https?:\/\/)?(localhost|\d{1,3}(\.\d{1,3}){3}|([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,})(:\d+)?(\/.*)?$/;

    if (current.url && !urlRegex.test(current.url.trim())) {
      pmsErrors.push("Please enter a valid URL.");
    }
    // }

    // Location validation (optional)
    if (current.location.trim() && current.location.trim().length > 100) {
      pmsErrors.push("Location cannot exceed 100 characters.");
    }

    // Account validation (optional)
    if (current.account.trim() && current.account.trim().length > 50) {
      pmsErrors.push("Account cannot exceed 50 characters.");
    }

    // If there are errors, show them and don't add the PMS
    if (pmsErrors.length > 0) {
      setErrors({ pms: pmsErrors.join(" ") });
      return;
    }

    // If validation passes, add the PMS
    current.is_archived = false;
    setAddedPms((prev) => [...prev, current]);
    setPmsList([{ pmsName: "", clientId: "", secretId: "", clientName: "", location: "", account: "", url: "", is_archived: false }]);
    setErrors({});
  };

  const handleRemovePms = (index: number) => {
    const removedPms = addedPms[index];
    removedPms.is_archived = true;
    setArchivedPms((prev) => [...prev, removedPms]);
    setAddedPms((prev) => prev.filter((_, i) => i !== index));
  };
  const handleRestorePms = (index: number) => {
    setArchivedPms((prev) => prev.filter((_, i) => i !== index));
    const restoredPms = archivedPms[index];
    restoredPms.is_archived = false;
    setAddedPms((prev) => [...prev, restoredPms]);
  };
  const handleNext = async () => {
    // For step 3, auto-add PMS if form is filled but not yet added
    let pmsWasAdded = false;
    if (step === 3) {
      const currentPms = pmsList[0];
      const hasValidCurrentPms = 
        currentPms.pmsName.trim() !== "" &&
        currentPms.secretId.trim() !== "" &&
        currentPms.location.trim() !== "" &&
        (currentPms.pmsName !== "guesty" || currentPms.clientId.trim() !== "");
      
      // If there's valid data in the form but not added yet, add it automatically
      if (hasValidCurrentPms && addedPms.length === 0) {
        // Validate before adding
        let pmsErrors: string[] = [];

        if (!currentPms.pmsName.trim()) {
          pmsErrors.push("PMS Name is required.");
        }
        if (!currentPms.location.trim()) {
          pmsErrors.push("Location is required.");
        }
        if (!currentPms.clientId.trim() && currentPms.pmsName === "guesty") {
          pmsErrors.push("Client ID is required.");
        } else if (currentPms.clientId.trim().length > 100) {
          pmsErrors.push("Client ID cannot exceed 100 characters.");
        }
        if (!currentPms.secretId.trim()) {
          pmsErrors.push("Secret ID/API Key is required.");
        } else if (currentPms.secretId.trim().length > 100) {
          pmsErrors.push("Secret ID cannot exceed 100 characters.");
        }
        if (currentPms.url.trim().length > 500) {
          pmsErrors.push("URL cannot exceed 500 characters.");
        }
        const urlRegex = /^(https?:\/\/)?(localhost|\d{1,3}(\.\d{1,3}){3}|([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,})(:\d+)?(\/.*)?$/;
        if (currentPms.url && !urlRegex.test(currentPms.url.trim())) {
          pmsErrors.push("Please enter a valid URL.");
        }
        if (currentPms.location.trim() && currentPms.location.trim().length > 100) {
          pmsErrors.push("Location cannot exceed 100 characters.");
        }
        if (currentPms.account.trim() && currentPms.account.trim().length > 50) {
          pmsErrors.push("Account cannot exceed 50 characters.");
        }

        if (pmsErrors.length > 0) {
          setErrors({ pms: pmsErrors.join(" ") });
          return; // Don't proceed if validation fails
        }

        // Add the PMS to the list
        currentPms.is_archived = false;
        setAddedPms((prev) => [...prev, currentPms]);
        setPmsList([{ pmsName: "", clientId: "", secretId: "", clientName: "", location: "", account: "", url: "", is_archived: false }]);
        setErrors({});
        pmsWasAdded = true;
      }
    }
    
    // Skip validation for step 3 if we just added a PMS (state hasn't updated yet)
    if (step === 3 && pmsWasAdded) {
      setStep((prev) => prev + 1);
      return;
    }
    
    const isValid = await validateStep();
    if (isValid) setStep((prev) => prev + 1);
  };

  const handleBack = () => setStep((prev) => prev - 1);

  const toggleClientId = (index: number) => {
    setShowClientId((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const toggleSecretId = (index: number) => {
    setShowSecretId((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const toggleClientName = (index: number) => {
    setShowClientName((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;

    try {
      showLoader();
      const allPms = [...addedPms, ...(archivedPms ?? [])];

      // franchiseeMode only applies when CREATING a new org (not editing).
      // If the user navigated from Franchise Listings and then edits an existing
      // org on the same page, location.state still holds the franchise state —
      // we must not apply franchisee constraints to that edit.
      const isCreatingFranchisee = franchiseeMode && !isEditOrganizationData;

      // Determine parent_org_id:
      // • Creating franchisee → always use the franchisor ID passed via props
      // • Normal create/edit  → existing logic
      let resolvedParentOrgId: number | null;
      if (isCreatingFranchisee && parentOrgId) {
        resolvedParentOrgId = parentOrgId;
      } else {
        const currentUserOrg = currentUserOrgId
          ? organizations.find((org) => org.organization_id === currentUserOrgId)
          : null;
        resolvedParentOrgId =
          !isEditOrganizationData && currentUserOrg?.is_franchisor
            ? (currentUserOrgId ?? null)
            : (isEditOrganizationData?.parent_org_id ?? null);
      }

      const payload: CreateOrganizationDto = {
        organization_name: organization.name.trim(),
        organization_email: organization.email.trim(),
        organization_location: organization.address.trim(),
        organization_timezone: organization.timezone,
        organization_contact_info: organization.contactInformation,
        organization_property_locations: locationInformation.filter((loc) => loc.property_name && loc.property_location),

        super_admin: {
          first_name: superAdmin.name.trim(),
          email: superAdmin.email.trim(),
          new_email: superAdmin.newEmail?.trim(),
          user_role: "super_admin",
          phone: superAdmin.phone?.trim(),
        },

        // pms_id is only included when the entry already exists in the DB.
        pms_master: allPms?.map((pms) => ({
          is_archived: Boolean(pms.is_archived),
          ...(pms.pmsId && pms.pmsId > 0 ? { pms_id: pms.pmsId } : {}),
          pms_name: pms.pmsName.trim(),
          client_id: pms.clientId.trim(),
          pms_client_secret: pms.secretId.trim(),
          client_name: pms.clientName.trim() || "",
          pms_location: pms.location.trim() || "",
          pms_account: pms.account.trim() || undefined,
          pms_url: pms.url.trim() || "",
        })),

        module_ids: selectedmodules,
        module_subscriptions: moduleSubscriptions?.map((subscription) => ({
          module_id: subscription.module_id,
          term: subscription.term,
          price: Number(subscription.price),
          startDate: subscription.startDate,
          endDate: subscription.endDate,
        })),

        themeConfig: {
          primary_color: themeConfig.primaryColor,
          secondary_color: themeConfig.secondaryColor,
          font_family: themeConfig.fontFamily,
        },

        // In franchisee creation mode a new org can never be a franchisor itself.
        // During edit mode, preserve whatever is_franchisor value was loaded.
        is_franchisor: isCreatingFranchisee ? false : (organization.is_franchisor ?? false),
        parent_org_id: resolvedParentOrgId ?? null,
      };
      
      if (logoFilePath) {
        payload.organization_logo = logoFilePath;
      } else if (removedLogoPaths.length > 0) {
        // User explicitly removed the logo — clear it
        payload.organization_logo = null;
      } else if (isEditOrganizationData && isEditOrganizationData.organization_logo) {
        // Preserve existing logo if editing and no new logo uploaded
        payload.organization_logo = isEditOrganizationData.organization_logo;
      }
      
      if (isEditOrganizationData && isEditOrganizationData.organization_id) {
        await mutationUpdate.mutateAsync({ id: isEditOrganizationData.organization_id, data: payload });
      } else {
        await mutation.mutateAsync(payload);
      }

      // Clean up removed logo files from Firebase storage
      if (removedLogoPaths.length > 0) {
        await Promise.allSettled(
          removedLogoPaths
            .filter((p) => p && !p.startsWith('http'))
            .map((p) => deleteFile(p))
        );
        setRemovedLogoPaths([]);
      }

      await refetchOrganization();
      toast({
        title: `${isEditOrganizationData ? "Organization updated" : "Organization added"}`,
        description: `${isEditOrganizationData ? "Organization updated" : "Organization added"} successfully!`,
        variant: "success",
      });
    } catch (error) {
      console.error("Error adding organization:", error);
      toast({
        title: `${isEditOrganizationData ? "Failed to update" : "Failed to add"} organization`,
        description: `${isEditOrganizationData ? "Failed to update" : "Failed to add"} organization. Please try again.`,
        variant: "destructive",
      });
    } finally {
      hideLoader();
      setOpen(false);
      setStep(1);
      setAddedPms([]);
      setArchivedPms([]);
      setSelectedmodules([]);
      setOrganization({ name: "", email: "", address: "", is_franchisor: false });
      setSuperAdmin({ name: "", email: "" });
      setPmsList([{ pmsName: "", clientId: "", secretId: "", clientName: "", location: "", account: "", url: "" }]);
      setPropertyInformation({ propertyName: "", propertyLocation: "" });
      setLocationInformation([
        {
          property_location: "",
          property_name: "",
        },
      ]);
      setThemeType("default");
      setThemeConfig(initialThemeConfig);
      setErrors({});
    }
  };

  useEffect(() => {
    if (!open) {
      setStep(1);
      setLogoFilePath("");
      setRemovedLogoPaths([]);
      setAddedPms([]);
      setArchivedPms([]);
      setSelectedmodules([]);
      setThemeType("default");
      setThemeConfig(initialThemeConfig);
      setOrganization({
        name: "",
        email: "",
        address: "",
        timezone: "",
        contactInformation: "",
        locationInformation: [],
        is_franchisor: false,
      });
      setSuperAdmin({ name: "", email: "" });
      setEditOrganizationData(null);
      setPmsList([{ pmsName: "", clientId: "", secretId: "", clientName: "", location: "", account: "", url: "", is_archived: false }]);
      setPropertyInformation({ propertyName: "", propertyLocation: "" });
      setShowPropertyForm(false);
      // setLocationInformation([{
      //   property_name: "",
      //   property_location: "",
      // }]);
      setLocationInformation([]);
      setShowClientId({});
      setShowSecretId({});
      setErrors({});
      // Logo path is already reset above
    }
  }, [open]);

  // Auto-open the add form when arriving from Franchise Listings
  useEffect(() => {
    if (franchiseeMode) {
      setEditOrganizationData(null);
      setOrganization((prev) => ({ ...prev, is_franchisor: false }));
      setOpen(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [franchiseeMode]);

  // Auto-open the form in edit/view mode when navigating from Franchise Listings
  useEffect(() => {
    if (initialEditData) {
      setEditOrganizationData(initialEditData);
      setLocalViewMode(isViewMode);
      setOpen(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialEditData, isViewMode]);

  const handleConfirmEdit = () => {
    handleSubmit();
    setOpenEditModal(false);
  };

  const handleConfirmArchive = async () => {
    if (!isEditOrganizationData?.organization_id) return;
    try {
      showLoader();
      await mutationDelete.mutateAsync(isEditOrganizationData.organization_id);
      await refetchOrganization();
      toast({
        title: 'Archived',
        description: `${isEditOrganizationData.organization_name} has been archived.`,
        variant: 'success' as any,
      });
      setOpen(false);
      setEditOrganizationData(null);
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to archive organization. Please try again.',
        variant: 'destructive',
      });
    } finally {
      hideLoader();
      setOpenArchiveModal(false);
    }
  };

  const handleLogoChange = useCallback((filePaths: string[]) => {
    setLogoFilePath(filePaths[0] || "");
  }, []);

  const handleLogoRemove = useCallback((filePath: string) => {
    if (filePath && !filePath.startsWith('http')) {
      setRemovedLogoPaths((prev) => [...prev, filePath]);
    }
  }, []);

  const isFormOpen = open;

  const handleAddOrganizationClick = () => {
    setEditOrganizationData(null);
    setOpen(true);
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [orgTypeFilter, setOrgTypeFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const ORG_TYPE_OPTIONS = [
    { value: '', label: 'All Types' },
    { value: 'franchisor', label: 'Franchisor' },
    { value: 'franchisee', label: 'Franchisee' },
    { value: 'standard', label: 'Standard' },
  ];

  const activeFilterCount = [orgTypeFilter].filter(Boolean).length;

  const allOrgs = organizations.filter((org: any) => activeTab === 'archived' ? org.is_archived : !org.is_archived);

  // Apply filters
  const filteredOrgs = allOrgs.filter((org: any) => {
    // Type filter
    if (orgTypeFilter === 'franchisor' && !org.is_franchisor) return false;
    if (orgTypeFilter === 'franchisee' && !org.parent_org_id) return false;
    if (orgTypeFilter === 'standard' && (org.is_franchisor || org.parent_org_id)) return false;

    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        org.organization_name?.toLowerCase().includes(q) ||
        org.organization_email?.toLowerCase().includes(q) ||
        org.organization_location?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const activeOrgs = organizations.filter((org: any) => !org.is_archived);
  const archivedOrgs = organizations.filter((org: any) => org.is_archived);

  return (
    <>
      {/* Header */}
      {!isFormOpen && (
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Organizations</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`h-8 px-3 border rounded-md flex items-center gap-1.5 text-xs font-medium transition-colors relative ${
                  showFilters || activeFilterCount > 0
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <Filter className="h-3.5 w-3.5" />
                Filter
                {activeFilterCount > 0 && (
                  <span className="ml-1 h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </button>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search organizations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 pl-8 pr-3 w-56 border border-slate-200 dark:border-slate-700 rounded-md text-xs bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-150"
                />
              </div>
              <Button
                size="sm"
                className="h-8 text-xs"
                onClick={handleAddOrganizationClick}
              >
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                Add
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Filter Panel */}
      {!isFormOpen && showFilters && (
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap">
                Organization Type
              </label>
              <select
                value={orgTypeFilter}
                onChange={(e) => setOrgTypeFilter(e.target.value)}
                className="h-8 px-3 w-44 border border-slate-200 dark:border-slate-700 rounded-md text-xs bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-150"
              >
                {ORG_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            {activeFilterCount > 0 && (
              <button
                onClick={() => setOrgTypeFilter('')}
                className="h-8 px-2.5 text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 flex items-center gap-1 transition-colors"
              >
                <X className="h-3 w-3" />
                Clear filters
              </button>
            )}
          </div>
        </div>
      )}

      {isFormOpen && (
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">
              {isEditOrganizationData
                ? `${localViewMode ? 'View' : 'Edit'}: ${isEditOrganizationData?.organization_name}`
                : (franchiseeMode && !isEditOrganizationData)
                  ? "Add Franchisee"
                  : "Add Organization"}
            </h2>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={() => setOpen(false)}
            >
              Back to List
            </Button>
          </div>
        </div>
      )}

      {/* Tab bar */}
      {!isFormOpen && (
        <div className="border-b border-slate-200 dark:border-slate-700">
          <div className="flex">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'all'
                  ? 'border-primary text-primary bg-primary/5'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              All Organizations ({activeOrgs.length})
            </button>
            <button
              onClick={() => setActiveTab('archived')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'archived'
                  ? 'border-primary text-primary bg-primary/5'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Archived Organizations ({archivedOrgs.length})
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      {isFormOpen ? (
        <div className="p-6">
          <AppStepper stepData={["Organization Details", "Super Admin Details", "PMS Details", "Modules", "Modules Subscription", "Theme Configuration"]} step={step} />
          <div className={localViewMode ? "pointer-events-none opacity-70" : ""}>
          <div className="mt-6">
                {/* ---------- STEP 1 ---------- */}
                {step === 1 && (
                  <div className="space-y-3 mt-8 flex flex-col gap-2">
                    <div className="flex flex-col gap-1">
                      <FormInput
                        label="Organization Name"
                        required
                        placeholder="Organization Name"
                        value={organization.name}
                        maxLength={80}
                        onChange={(e) => {
                          const value = e.target.value;
                          setOrganization({ ...organization, name: value });
                          const error = validateOrganizationName(value);
                          setErrors((prev) => ({ ...prev, name: error }));
                        }}
                        error={errors.name}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <FormInput
                        label="Organization Email/Domain"
                        placeholder="Organization Email/Domain"
                        value={organization.email}
                        onChange={(e) => {
                          const value = e.target.value;
                          setOrganization({ ...organization, email: value });
                          const error = validateOrganizationEmail(value);
                          setErrors((prev) => ({ ...prev, email: error }));
                        }}
                        error={errors.email}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <FormInput
                        label="Organization Address"
                        required
                        placeholder="Organization Address"
                        value={organization.address}
                        onChange={(e) => {
                          const value = e.target.value;
                          setOrganization({ ...organization, address: value });
                          const error = validateOrganizationAddress(value);
                          setErrors((prev) => ({ ...prev, address: error }));
                        }}
                        error={errors.address}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <FormLabel label="Organization Timezone" />
                      <TimezoneCombobox
                        value={organization.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone}
                        onChange={(value) => setOrganization({ ...organization, timezone: value })}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <FormInput
                        label="Organization Contact Information"
                        placeholder="Contact Information"
                        value={organization.contactInformation || ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          setOrganization({ ...organization, contactInformation: value });
                          const error = validateContactInfo(value);
                          setErrors((prev) => ({ ...prev, organizationcontactInformation: error }));
                        }}
                        error={errors.organizationcontactInformation}
                      />
                    </div>
                    {(franchiseeMode && !isEditOrganizationData) ? (
                      /* Read-only banner: visible only when CREATING a new franchisee */
                      <div className="flex items-center gap-3 px-3 py-2 rounded-md bg-primary/10 border border-primary/20">
                        <GitBranch className="w-4 h-4 text-primary flex-shrink-0" />
                        <div>
                          <p className="text-sm font-semibold text-primary">Adding as Franchisee</p>
                          <p className="text-xs text-muted-foreground">
                            Parent Franchisor:{" "}
                            <span className="font-medium text-foreground">{franchiseeParentName ?? `Org #${parentOrgId}`}</span>
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 py-1">
                        <input
                          type="checkbox"
                          id="is_franchisor"
                          checked={organization.is_franchisor ?? false}
                          onChange={(e) =>
                            setOrganization({ ...organization, is_franchisor: e.target.checked })
                          }
                          disabled={!!isEditOrganizationData?.parent_org_id}
                          className="w-5 h-5 accent-primary cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                        <label
                          htmlFor="is_franchisor"
                          className={`text-foreground font-medium select-none ${isEditOrganizationData?.parent_org_id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                          This organization is a Franchisor
                        </label>
                      </div>
                    )}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <FormLabel label="Properties and Locations" className="font-semibold text-base" />
                        <p className="text-xs text-muted-foreground">Optional</p>
                      </div>

                      {/* Added Properties List */}
                      {locationInformation.length > 0 && (
                        <div className="mb-4 space-y-2">
                          {locationInformation.map((loc, idx) => {
                            if (!loc.property_name && !loc.property_location) return null;
                            return (
                              <div key={idx} className="group relative p-4 rounded-lg border border-border bg-card hover:border-primary/50 transition-all duration-200">
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex-1 space-y-2">
                                    <div className="flex items-center gap-2">
                                      <Building className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                      <div className="flex-1">
                                        <p className="text-xs text-muted-foreground">Property Name</p>
                                        <p className="text-sm font-medium text-foreground">{loc.property_name || "—"}</p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Car className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                      <div className="flex-1">
                                        <p className="text-xs text-muted-foreground">Location</p>
                                        <p className="text-sm text-foreground">{loc.property_location || "—"}</p>
                                      </div>
                                    </div>
                                  </div>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRemovePropertyLocation(idx)}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Add New Property Form */}
                      {showPropertyForm && (
                        <div className="p-4 rounded-lg border border-dashed border-border bg-muted/30 space-y-3">
                          <div className="flex items-center gap-2 mb-2">
                            <Plus className="w-4 h-4 text-primary" />
                            <p className="text-sm font-medium text-foreground">Add Property Location</p>
                          </div>

                          <FormInput
                            label="Property Name"
                            placeholder="e.g., Downtown Office, Main Branch"
                            value={propertyInformation.propertyName}
                            onChange={(e) => {
                              setPropertyInformation({ ...propertyInformation, propertyName: e.target.value });
                              if (errors.propertyLocation) setErrors((prev) => ({ ...prev, propertyLocation: undefined }));
                            }}
                          />

                          <FormInput
                            label="Location"
                            placeholder="e.g., 123 Main St, New York, NY 10001"
                            value={propertyInformation.propertyLocation}
                            onChange={(e) => {
                              setPropertyInformation({ ...propertyInformation, propertyLocation: e.target.value });
                              if (errors.propertyLocation) setErrors((prev) => ({ ...prev, propertyLocation: undefined }));
                            }}
                          />

                          {errors.propertyLocation && (
                            <div className="flex items-start gap-2 p-3 rounded-md bg-destructive/10 border border-destructive/20">
                              <XCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
                              <p className="text-sm text-destructive">{errors.propertyLocation}</p>
                            </div>
                          )}

                          <div className="flex items-center gap-2 pt-2">
                            <Button
                              type="button"
                              size="sm"
                              onClick={handleAddPropertyLocation}
                              disabled={!propertyInformation.propertyName.trim() && !propertyInformation.propertyLocation.trim()}
                              className="flex items-center gap-2"
                            >
                              <CheckCircle className="w-4 h-4" />
                              Save Property
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setPropertyInformation({ propertyName: "", propertyLocation: "" });
                                setErrors((prev) => ({ ...prev, propertyLocation: undefined }));
                                setShowPropertyForm(false);
                              }}
                              className="flex items-center gap-2"
                            >
                              <X className="w-4 h-4" />
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Add Property Button (shown when form is not visible) */}
                      {!showPropertyForm && (
                        <Button
                          type="button"
                          variant="outline"
                          size="default"
                          onClick={() => setShowPropertyForm(true)}
                          className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-primary/30 hover:border-primary hover:bg-primary/5 text-primary hover:text-primary transition-all"
                        >
                          <Plus className="w-5 h-5" />
                          <span className="font-medium">{locationInformation.length === 0 ? "Add First Property" : "Add Another Property"}</span>
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                {/* ---------- STEP 2 ---------- */}
                {step === 2 && (
                  <div className="space-y-3 flex flex-col gap-2 mt-8">
                    <div className="flex flex-col gap-1">
                      <FormInput
                        label="Super Admin Name"
                        required
                        placeholder="Super Admin Name"
                        value={superAdmin.name}
                        onChange={(e) => {
                          const value = e.target.value;
                          setSuperAdmin({ ...superAdmin, name: value });
                          const error = validateSuperAdminName(value);
                          setErrors((prev) => ({ ...prev, superAdminName: error }));
                        }}
                        error={errors.superAdminName}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <FormInput
                        label="Super Admin Email"
                        required
                        placeholder="superadmin@gmail.com"
                        value={superAdmin.email}
                        onChange={(e) => {
                          const value = e.target.value;
                          setSuperAdmin({ ...superAdmin, email: value });
                          const error = validateEmail(value, "superAdminEmail");
                          setErrors((prev) => ({ ...prev, superAdminEmail: error }));
                        }}
                        icon={() => <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />}
                        disabled={isEditOrganizationData?.super_admin_email ? true : false}
                        error={!isEditOrganizationData?.super_admin_email ? errors.superAdminEmail : ""}
                      />
                    </div>

                    {isEditOrganizationData?.super_admin_email && (
                      <div className="flex flex-col gap-1">
                        <FormInput
                          label="Super Admin New Email"
                          placeholder="superadmin@gmail.com"
                          value={superAdmin.newEmail || ""}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === superAdmin.email) {
                              setSuperAdmin({ ...superAdmin, newEmail: "" });
                            } else {
                              setSuperAdmin({ ...superAdmin, newEmail: value });
                              const error = validateEmail(value, "superAdminNewEmail");
                              setErrors((prev) => ({ ...prev, superAdminNewEmail: error }));
                            }
                          }}
                          icon={() => <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />}
                          error={errors.superAdminNewEmail}
                        />
                      </div>
                    )}
                    <div className="flex flex-col gap-1">
                      <FormInput
                        label="Super Admin Phone"
                        placeholder="+11234567890"
                        value={superAdmin.phone || ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          setSuperAdmin({ ...superAdmin, phone: value });
                          const error = validatePhone(value);
                          setErrors((prev) => ({ ...prev, superAdminPhone: error }));
                        }}
                        icon={() => <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />}
                        error={errors.superAdminPhone}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <FormInput
                        label="Super Admin Role"
                        placeholder="Role"
                        value={"Role: Super Admin"}
                        disabled
                        onChange={(e) => setSuperAdmin({ ...superAdmin, email: e.target.value })}
                        icon={() => <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />}
                      />
                    </div>
                  </div>
                )}

                {/* ---------- STEP 3 ---------- */}
                {step === 3 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-lg font-semibold text-foreground">PMS Configuration</h3>
                      <p className="text-xs text-muted-foreground">Optional</p>
                    </div>
                    {pmsList.map((pms, index) => (
                      <div key={index} className="border border-border p-3 rounded-lg space-y-2 bg-muted/50">
                        <h3 className="font-semibold text-foreground">PMS #{index + 1}</h3>
                        {/* <Input
                          placeholder="PMS Name"
                          value={pms.pmsName}
                          onChange={(e) => handlePmsChange(index, "pmsName", e.target.value)}
                          className="placeholder:text-gray-500"
                        /> */}
                        {/* PMS Name Dropdown */}
                        <select
                          value={pms.pmsName}
                          onChange={(e) => handlePmsChange(index, "pmsName", e.target.value)}
                          className="border border-input rounded-lg px-4 py-2 w-full bg-background text-foreground"
                        >
                          <option value="">Select PMS Type</option>
                          <option value="guesty">Guesty</option>
                          <option value="dharma">Dharma</option>
                          <option value="mews">Mews</option>
                        </select>

                        {/* Conditional Fields */}
                        {pms.pmsName === "guesty" && (
                          <>
                            <div className="relative">
                              <Input
                                placeholder="Client ID"
                                type={showClientId[index] ? "text" : "password"}
                                value={pms.clientId}
                                onChange={(e) => handlePmsChange(index, "clientId", e.target.value)}
                                className="placeholder:text-gray-500"
                              />
                              <button type="button" onClick={() => toggleClientId(index)} className="absolute right-2 top-2 text-gray-400 hover:text-gray-900">
                                {showClientId[index] ? <EyeOff size={20} /> : <Eye size={20} />}
                              </button>
                            </div>

                            <div className="relative">
                              <Input
                                placeholder="Secret ID"
                                type={showSecretId[index] ? "text" : "password"}
                                value={pms.secretId}
                                onChange={(e) => handlePmsChange(index, "secretId", e.target.value)}
                                className="placeholder:text-gray-500"
                              />
                              <button type="button" onClick={() => toggleSecretId(index)} className="absolute right-2 top-2 text-gray-400 hover:text-gray-900">
                                {showSecretId[index] ? <EyeOff size={20} /> : <Eye size={20} />}
                              </button>
                            </div>
                          </>
                        )}

                        {pms.pmsName === "dharma" && (
                          <Input
                            placeholder="X-API Key"
                            value={pms.secretId} // reuse secretId field for API key
                            onChange={(e) => handlePmsChange(index, "secretId", e.target.value)}
                            className="placeholder:text-gray-500"
                          />
                        )}

                        {pms.pmsName === "mews" && (
                          <>
                            <div className="relative">
                              <Input
                                placeholder="Client Token"
                                type={showClientId[index] ? "text" : "password"}
                                value={pms.clientId}
                                onChange={(e) => handlePmsChange(index, "clientId", e.target.value)}
                                className="placeholder:text-gray-500"
                              />
                              <button type="button" onClick={() => toggleClientId(index)} className="absolute right-2 top-2 text-gray-400 hover:text-gray-900">
                                {showClientId[index] ? <EyeOff size={20} /> : <Eye size={20} />}
                              </button>
                            </div>

                            <div className="relative">
                              <Input
                                placeholder="Access Token"
                                type={showSecretId[index] ? "text" : "password"}
                                value={pms.secretId}
                                onChange={(e) => handlePmsChange(index, "secretId", e.target.value)}
                                className="placeholder:text-gray-500"
                              />
                              <button type="button" onClick={() => toggleSecretId(index)} className="absolute right-2 top-2 text-gray-400 hover:text-gray-900">
                                {showSecretId[index] ? <EyeOff size={20} /> : <Eye size={20} />}
                              </button>
                            </div>

                            <div className="relative">
                              <Input
                                placeholder="Client Name"
                                type={showClientName[index] ? "text" : "password"}
                                value={pms.clientName}
                                onChange={(e) => handlePmsChange(index, "clientName", e.target.value)}
                                className="placeholder:text-gray-500"
                              />
                              <button type="button" onClick={() => toggleClientName(index)} className="absolute right-2 top-2 text-gray-400 hover:text-gray-900">
                                {showClientName[index] ? <EyeOff size={20} /> : <Eye size={20} />}
                              </button>
                            </div>
                          </>
                        )}

                        <Input placeholder="Location" value={pms.location} onChange={(e) => handlePmsChange(index, "location", e.target.value)} className="placeholder:text-gray-500" />
                        <Input placeholder="Account" value={pms.account} onChange={(e) => handlePmsChange(index, "account", e.target.value)} className="placeholder:text-gray-500" />
                        <Input placeholder="URL" value={pms.url} onChange={(e) => handlePmsChange(index, "url", e.target.value)} className="placeholder:text-gray-500" />
                      </div>
                    ))}
                    {errors.pms && <p className="text-destructive text-sm">{errors.pms}</p>}

                    <div className="flex gap-3">
                      <Button onClick={handleSavePms} className="bg-primary hover:bg-primary/90">
                        + Add PMS
                      </Button>
                    </div>

                    {/* Added PMS Display */}
                    <DynamicTabs
                      tabs={[
                        {
                          label: `Active PMS (${addedPms?.length})`,
                          value: "activePms",
                          content: (
                            <>
                              <h3 className="font-semibold mb-3">Active PMS List:</h3>
                              {addedPms?.length > 0 ? (
                                <ActionTable
                                  data={addedPms || []}
                                  columns={columns}
                                  actions={(row, idx) => {
                                    return (
                                      <Button
                                        variant={"destructive"}
                                        className="text-end px-3"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleRemovePms(idx);
                                        }}
                                      >
                                        Archive
                                      </Button>
                                    );
                                  }}
                                />
                              ) : (
                                <div className="text-gray-500">No Active PMS added yet.</div>
                              )}
                            </>
                          ),
                        },
                        {
                          label: `Archived PMS (${archivedPms?.length})`,
                          value: "archivedPms",
                          content: (
                            <>
                              <h3 className="font-semibold mb-3">Archived PMS List: </h3>
                              {archivedPms?.length > 0 ? (
                                <ActionTable
                                  data={archivedPms || []}
                                  columns={columns}
                                  actions={(row, idx) => {
                                    return (
                                      <Button
                                        className="text-end px-3"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleRestorePms(idx);
                                        }}
                                      >
                                        Restore
                                      </Button>
                                    );
                                  }}
                                />
                              ) : (
                                <div className=" text-gray-500">No PMS archived yet.</div>
                              )}
                            </>
                          ),
                        },
                      ]}
                      defaultValue="activePms"
                    />
                  </div>
                )}
                {step === 4 && (
                  <div className="mt-8">
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-foreground mb-2">Select Modules</h3>
                      <p className="text-sm text-muted-foreground">Choose at least one module to continue</p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-2">
                      {modules.map((option, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id={`option-${index}`}
                            checked={selectedmodules.includes(option?.id || 0)}
                            onChange={() => {
                              handleCheckboxChange(option?.id || 0);
                              if (errors.modules) {
                                setErrors({ ...errors, modules: undefined });
                              }
                            }}
                            className="w-5 h-5 accent-primary cursor-pointer flex-shrink-0"
                          />
                          <label htmlFor={`option-${index}`} className="cursor-pointer text-foreground font-medium">
                            {option?.moduleName}
                          </label>
                        </div>
                      ))}
                    </div>

                    {errors.modules && (
                      <div className="mt-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-3">
                        <div className="flex-shrink-0 w-5 h-5 rounded-full bg-destructive/20 flex items-center justify-center mt-0.5">
                          <span className="text-destructive text-sm font-bold">!</span>
                        </div>
                        <div>
                          <p className="text-destructive font-medium text-sm">Module Selection Required</p>
                          <p className="text-destructive/80 text-sm mt-1">{errors.modules}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {step === 5 && (
                  <div className="mt-24 w-full overflow-x-auto">
                    <table className="mx-auto w-[95%] min-w-[800px] border-collapse border border-gray-300">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border p-2 text-left">Module</th>
                          <th className="border p-2 text-left">Term</th>
                          <th className="border p-2 text-left">Price</th>
                          <th className="border p-2 text-left">Start Date</th>
                          <th className="border p-2 text-left">End Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {moduleSubscriptions.map((sub) => {
                          const moduleName = modules.find((m) => m.id === sub.module_id)?.moduleName || "";
                          return (
                            <tr key={sub.module_id} className="border-b">
                              <td className="border p-2 font-medium">
                                {" "}
                                <button
                                  type="button"
                                  className="bg-primary text-primary-foreground px-3 py-1 rounded hover:bg-primary/90 transition-colors cursor-default"
                                  onClick={() => console.log("Clicked module:", moduleName)}
                                >
                                  {moduleName}
                                </button>
                              </td>
                              <td className="border p-2 flex flex-col">
                                <label className="mr-2">
                                  <input type="radio" name={`term-${sub.module_id}`} value="short" checked={sub.term === "short"} onChange={() => handleTermChange(sub.module_id, "short")} />{" "}
                                  Short-Term Contract
                                </label>
                                <label>
                                  <input type="radio" name={`term-${sub.module_id}`} value="long" checked={sub.term === "long"} onChange={() => handleTermChange(sub.module_id, "long")} /> Long-Term
                                  Contract
                                </label>
                              </td>
                              <td className="border p-2">
                                <div className="relative">
                                  <Input
                                    placeholder="Price"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={sub.price || ""} // Store only the numeric value
                                    onChange={(e) => {
                                      const value = e.target.value;
                                      setModuleSubscriptions((prev) => prev.map((s) => (s.module_id === sub.module_id ? { ...s, price: value } : s)));
                                      // Clear error when user starts typing
                                      if (errors.moduleSubscriptions) {
                                        setErrors((prev) => ({ ...prev, moduleSubscriptions: undefined }));
                                      }
                                    }}
                                    className="w-full pr-20"
                                  />
                                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                    <span className="text-gray-500">$/{sub.term === "short" ? "Month" : "Year"}</span>
                                  </div>
                                </div>
                              </td>
                              <td className="border p-2">
                                <Input
                                  type="date"
                                  value={sub.startDate || today}
                                  min={today}
                                  // max={sub.endDate} // will not render correctly
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    // Clear error when user changes date
                                    if (errors.moduleSubscriptions) {
                                      setErrors((prev) => ({ ...prev, moduleSubscriptions: undefined }));
                                    }
                                    setModuleSubscriptions((prev) => {
                                      const updated = prev.map((s) => (s.module_id === sub.module_id ? { ...s, startDate: value, endDate: s.endDate < value ? value : s.endDate } : s));
                                      validateModuleDates(updated);
                                      return updated;
                                    });
                                  }}
                                  className="w-full"
                                />
                              </td>
                              <td className="border p-2">
                                <Input
                                  type="date"
                                  value={sub.endDate || today}
                                  min={sub.startDate}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    // Clear error when user changes date
                                    if (errors.moduleSubscriptions) {
                                      setErrors((prev) => ({ ...prev, moduleSubscriptions: undefined }));
                                    }
                                    setModuleSubscriptions((prev) => {
                                      const updated = prev.map((s) => (s.module_id === sub.module_id ? { ...s, endDate: value, startDate: s.startDate > value ? value : s.startDate } : s));
                                      validateModuleDates(updated);
                                      return updated;
                                    });
                                  }}
                                  className="w-full"
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    {errors.moduleSubscriptions && (
                      <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                        <div className="flex items-start">
                          <XCircle className="h-5 w-5 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
                          <div className="flex-1">
                            {errors.moduleSubscriptions.split('|').map((error, idx) => (
                              <p key={idx} className="text-red-600 text-sm mb-1 last:mb-0">{error}</p>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                    {/* <ModuleSubscriptionTable
                      moduleSubscriptions={moduleSubscriptions}
                      modules={modules}
                      id={moduleSubscriptions?.}
                      moduleName={moduleName}
                      today={today}
                      setModuleSubscriptions={setModuleSubscriptions}
                      handleTermChange={handleTermChange}
                    /> */}
                  </div>
                )}
                {step === 6 && (
                  <div className="mt-14 ml-2 space-y-6">
                    {/* Logo Upload Section */}
                    <div>
                      <h3 className="font-semibold mb-2 text-foreground">Upload Logo</h3>
                      <ImageUpload
                        mode="single"
                        accept="image/*"
                        label=""
                        hint="Recommended: 200x200px, PNG or JPG"
                        existingFiles={
                          logoFilePath
                            ? [logoFilePath]
                            : isEditOrganizationData?.organization_logo
                              ? [isEditOrganizationData.organization_logo]
                              : []
                        }
                        onChange={handleLogoChange}
                        onRemove={handleLogoRemove}
                        disabled={localViewMode}
                      />
                    </div>

                    {/* Theme Selection */}
                    <div>
                      <h3 className="font-semibold mb-2 text-foreground">Theme Selection</h3>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 text-foreground">
                          <input type="radio" name="theme" value="default" checked={themeType === "default"} onChange={() => setThemeType("default")} className="accent-primary" />
                          Default Theme
                        </label>

                        <label className="flex items-center gap-2 text-foreground">
                          <input type="radio" name="theme" value="manual" checked={themeType === "manual"} onChange={() => setThemeType("manual")} className="accent-primary" />
                          Manual Theme
                        </label>
                      </div>
                    </div>

                    {/* Theme Configuration Form (only if manual is selected) */}
                    {themeType === "manual" && (
                      <div className="border border-border p-4 rounded space-y-4 bg-muted/50">
                        <h4 className="font-semibold text-foreground">Theme Configuration</h4>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-foreground">Primary Color</label>
                            <input
                              type="color"
                              value={themeConfig.primaryColor}
                              onChange={(e) => setThemeConfig({ ...themeConfig, primaryColor: e.target.value })}
                              className="w-full border border-input p-1 rounded bg-background"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-foreground">Secondary Color</label>
                            <input
                              type="color"
                              value={themeConfig.secondaryColor}
                              onChange={(e) =>
                                setThemeConfig({
                                  ...themeConfig,
                                  secondaryColor: e.target.value,
                                })
                              }
                              className="w-full border border-input p-1 rounded bg-background"
                            />
                          </div>

                          <div className="col-span-2">
                            <label className="block text-sm font-medium text-foreground">Font Family</label>
                            <select
                              value={themeConfig.fontFamily}
                              onChange={(e) => setThemeConfig({ ...themeConfig, fontFamily: e.target.value })}
                              className="w-full border border-input rounded p-2 bg-background text-foreground"
                            >
                              <option value="Arial">Arial</option>
                              <option value="Roboto">Roboto</option>
                              <option value="Poppins">Poppins</option>
                              <option value="Open Sans">Open Sans</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              </div>

              {/* ---------- Footer Navigation ---------- */}
              <div className="flex justify-between mt-16">
                {localViewMode ? (
                  <>
                    <div className="flex gap-2">
                      {step > 1 && (
                        <Button variant="outline" onClick={handleBack}>
                          Back
                        </Button>
                      )}
                      <Button variant="ghost" onClick={() => setOpen(false)}>
                        Cancel
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      {step < 6 && (
                        <Button variant="outline" onClick={handleNext}>Next</Button>
                      )}
                      <Button variant="destructive" onClick={() => setOpenArchiveModal(true)}>
                        Archive
                      </Button>
                      <Button onClick={() => setLocalViewMode(false)}>
                        Edit
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    {step < 2 && (
                      <Button variant="ghost" onClick={() => setOpen(false)}>
                        Cancel
                      </Button>
                    )}
                    {step > 1 && (
                      <Button variant="outline" onClick={handleBack}>
                        Back
                      </Button>
                    )}
                    {step < 6 ? (
                      <Button onClick={handleNext} disabled={step === 5 && !!errors.moduleSubscriptions}>Next</Button>
                    ) : (
                      <Button onClick={() => setOpenEditModal(true)}>
                        {mutation.isPending || mutationUpdate.isPending ? (
                          <>
                            <ReloadIcon className="absolute h-4 w-4 animate-spin" />
                            <span className="opacity-0">Submit</span>
                          </>
                        ) : isEditOrganizationData ? (
                          "Save"
                        ) : (
                          "Submit"
                        )}
                      </Button>
                    )}
                  </>
                )}
              </div>

              {/* Submitted Data Table */}
          </div>
          
      ) : (
        <div className="p-5">
          {filteredOrgs.length > 0 ? (
            <AccordionView
              data={filteredOrgs}
              setEditOrganization={setEditOrganizationData}
              setIsEdit={setOpen}
              refetchOrganizations={refetchOrganization}
            />
          ) : (
            <div className="text-center py-12 text-sm text-muted-foreground">
              {searchQuery || orgTypeFilter ? 'No organizations match your filters' : 'No organizations found'}
            </div>
          )}
        </div>
      )}

      <WarnPopupModal
        open={openEditModal}
        onOpenChange={(open) => setOpenEditModal(open)}
        message={`Are you sure you want to update this ${isEditOrganizationData?.organization_name} organization?`}
        onConfirm={handleConfirmEdit}
        actionType="update"
      />
      <WarnPopupModal
        open={openArchiveModal}
        onOpenChange={(open) => setOpenArchiveModal(open)}
        message={`Are you sure you want to archive ${isEditOrganizationData?.organization_name}?`}
        onConfirm={handleConfirmArchive}
        actionType="archive"
      />
    </>
  );
}

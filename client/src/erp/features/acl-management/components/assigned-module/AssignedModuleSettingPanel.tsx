import React from 'react';
import { ChevronDown, Settings } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface AssignedModuleSettingPanelProps {
  title: string;
  description: string;
  meta?: string;
  badge?: React.ReactNode;
  isExpanded: boolean;
  onToggle: () => void;
  children?: React.ReactNode;
}

export const AssignedModuleSettingPanel: React.FC<AssignedModuleSettingPanelProps> = ({
  title,
  description,
  meta,
  badge,
  isExpanded,
  onToggle,
  children,
}) => (
  <div className="rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden bg-white dark:bg-slate-900 mt-3">
    <div
      className={`px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3 cursor-pointer ${
        isExpanded ? 'bg-primary/5' : 'hover:bg-slate-50 dark:hover:bg-slate-800/30'
      }`}
      onClick={onToggle}
    >
      <div className="flex items-center gap-3">
        <div
          className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
            isExpanded ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium text-foreground">{title}</h3>
            {meta ? <span className="text-xs text-muted-foreground">{meta}</span> : null}
          </div>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {badge}
        <ChevronDown
          className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${
            isExpanded ? 'rotate-180' : ''
          }`}
        />
      </div>
    </div>
    {isExpanded ? children : null}
  </div>
);

interface SettingToggleRowProps {
  label: string;
  description?: string;
  checked: boolean;
  disabled?: boolean;
  onChange: () => void;
}

export const SettingToggleRow: React.FC<SettingToggleRowProps> = ({
  label,
  description,
  checked,
  disabled = false,
  onChange,
}) => (
  <div className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
    <div>
      <span className="text-sm font-medium text-foreground">{label}</span>
      {description ? <p className="text-xs text-muted-foreground mt-0.5">{description}</p> : null}
    </div>
    <SettingToggle checked={checked} disabled={disabled} onChange={onChange} />
  </div>
);

export const SettingToggle = ({
  checked,
  onChange,
  disabled = false,
}: {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-disabled={disabled}
    onClick={disabled ? undefined : onChange}
    disabled={disabled}
    className={`relative inline-flex h-5 w-9 rounded-full transition-colors ${
      disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
    } ${checked ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'}`}
  >
    <span
      className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
        checked ? 'translate-x-4' : 'translate-x-0'
      }`}
    />
  </button>
);

export const OrgSettingBadge = ({ organizationId }: { organizationId?: number }) => (
  <Badge variant="outline" className="shrink-0">
    {organizationId ? `Org ${organizationId}` : 'No organization selected'}
  </Badge>
);

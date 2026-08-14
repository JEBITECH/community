import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, ArrowRight, Search, Building2, MapPin, Loader2, ChevronUp, ChevronDown, ChevronsUp, ChevronsDown } from 'lucide-react';
import { cn } from "@/lib/utils";

interface ShuttleBoxOption {
  value: string | number;
  label: string;
  unitType?: string;
  property?: string;
}

interface ShuttleBoxProps {
  open: boolean;
  onClose: () => void;
  onSave: (selectedValues: (string | number)[]) => void;
  selectedValues?: (string | number)[];
  options: ShuttleBoxOption[];
  title?: string;
  description?: string;
  availableHeader?: string;
  selectedHeader?: string;
  isLoading?: boolean;
  saveButtonText?: string;
  cancelButtonText?: string;
  emptyMessage?: string;
  showOrderButtons?: boolean;
  preserveSelectOrder?: boolean;
  unitTypeIcon?: React.ReactNode;
  propertyIcon?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl';
  /** Optional content rendered between the header and the shuttle lists */
  headerContent?: React.ReactNode;
}

/**
 * Reusable Shuttle Box Component for ERP System
 *
 * A dual-list selector that allows users to move items between available and selected lists.
 * Themed to match the ERP design system with proper spacing, borders, and colors.
 */
const ShuttleBox: React.FC<ShuttleBoxProps> = ({
  open,
  onClose,
  onSave,
  options,
  title = "Select Items",
  description,
  availableHeader = "Available",
  selectedHeader = "Selected",
  isLoading = false,
  saveButtonText = "Save",
  cancelButtonText = "Cancel",
  emptyMessage = "No items available",
  showOrderButtons = true,
  preserveSelectOrder = true,
  selectedValues = [],
  maxWidth = '6xl',
  unitTypeIcon,
  propertyIcon,
  headerContent,
}) => {
  const [selected, setSelected] = useState<(string | number)[]>([]);
  const [availableSearch, setAvailableSearch] = useState('');
  const [selectedSearch, setSelectedSearch] = useState('');
  const [highlightedAvailable, setHighlightedAvailable] = useState<(string | number)[]>([]);
  const [highlightedSelected, setHighlightedSelected] = useState<(string | number)[]>([]);

  useEffect(() => {
    if (open) {
      setSelected([...selectedValues]);
      setAvailableSearch('');
      setSelectedSearch('');
      setHighlightedAvailable([]);
      setHighlightedSelected([]);
    }
  }, [open]);

  const availableOptions = options.filter(opt => 
    !selected.includes(opt.value) &&
    (opt.label.toLowerCase().includes(availableSearch.toLowerCase()) ||
     opt.unitType?.toLowerCase().includes(availableSearch.toLowerCase()) ||
     opt.property?.toLowerCase().includes(availableSearch.toLowerCase()))
  );

  const selectedOptions = selected
    .map(val => options.find(opt => opt.value === val))
    .filter((opt): opt is ShuttleBoxOption => {
      return opt !== undefined && (
        opt.label.toLowerCase().includes(selectedSearch.toLowerCase()) ||
        (opt.unitType?.toLowerCase().includes(selectedSearch.toLowerCase()) ?? false) ||
        (opt.property?.toLowerCase().includes(selectedSearch.toLowerCase()) ?? false)
      );
    });

  const moveToSelected = () => {
    if (highlightedAvailable.length > 0) {
      setSelected(prev => [...prev, ...highlightedAvailable]);
      setHighlightedAvailable([]);
    }
  };

  const moveToAvailable = () => {
    if (highlightedSelected.length > 0) {
      setSelected(prev => prev.filter(v => !highlightedSelected.includes(v)));
      setHighlightedSelected([]);
    }
  };

  const moveAllToSelected = () => {
    setSelected(prev => [...prev, ...availableOptions.map(opt => opt.value)]);
    setHighlightedAvailable([]);
  };

  const moveAllToAvailable = () => {
    setSelected([]);
    setHighlightedSelected([]);
  };

  const moveUp = () => {
    if (highlightedSelected.length !== 1) return;
    const value = highlightedSelected[0];
    const index = selected.indexOf(value);
    if (index > 0) {
      const newSelected = [...selected];
      [newSelected[index - 1], newSelected[index]] = [newSelected[index], newSelected[index - 1]];
      setSelected(newSelected);
    }
  };

  const moveDown = () => {
    if (highlightedSelected.length !== 1) return;
    const value = highlightedSelected[0];
    const index = selected.indexOf(value);
    if (index < selected.length - 1) {
      const newSelected = [...selected];
      [newSelected[index], newSelected[index + 1]] = [newSelected[index + 1], newSelected[index]];
      setSelected(newSelected);
    }
  };

  const moveTop = () => {
    if (highlightedSelected.length !== 1) return;
    const value = highlightedSelected[0];
    const newSelected = selected.filter(v => v !== value);
    setSelected([value, ...newSelected]);
  };

  const moveBottom = () => {
    if (highlightedSelected.length !== 1) return;
    const value = highlightedSelected[0];
    const newSelected = selected.filter(v => v !== value);
    setSelected([...newSelected, value]);
  };

  const handleItemClick = (value: string | number, isInSelected: boolean) => {
    const highlighted = isInSelected ? highlightedSelected : highlightedAvailable;
    const setHighlighted = isInSelected ? setHighlightedSelected : setHighlightedAvailable;

    // Toggle selection - click to add/remove from highlighted
    if (highlighted.includes(value)) {
      setHighlighted(highlighted.filter(v => v !== value));
    } else {
      setHighlighted([...highlighted, value]);
    }
  };

  const handleSave = () => {
    onSave(selected);
  };

  const handleClose = () => {
    setSelected([]);
    setAvailableSearch('');
    setSelectedSearch('');
    setHighlightedAvailable([]);
    setHighlightedSelected([]);
    onClose();
  };

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
    '6xl': 'max-w-6xl',
    '7xl': 'max-w-7xl',
  };

  const OptionItem = ({ option, isHighlighted, onClick }: { 
    option: ShuttleBoxOption; 
    isHighlighted: boolean;
    onClick: () => void;
  }) => (
    <div
      onClick={onClick}
      className={cn(
        "group relative flex items-center gap-2.5 px-3 py-2 rounded-md cursor-pointer transition-all",
        "border",
        isHighlighted
          ? "bg-primary/8 border-primary/40 hover:bg-primary/12 hover:border-primary/60"
          : "bg-card border-border/50 hover:bg-accent/40 hover:border-border"
      )}
    >
      {/* Checkbox */}
      <div className="flex-shrink-0">
        <div className={cn(
          "w-4 h-4 rounded border-2 flex items-center justify-center transition-all",
          isHighlighted
            ? "bg-primary border-primary"
            : "bg-background border-input group-hover:border-primary/40"
        )}>
          {isHighlighted && (
            <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm text-foreground mb-1 truncate">
          {option.label}
        </div>
        {(option.unitType || option.property) && (
          <div className="flex items-center gap-2 text-xs min-w-0">
            {option.unitType && (
              <div className="flex items-center gap-1 text-muted-foreground min-w-0 flex-shrink">
                {unitTypeIcon || <Building2 className="w-3 h-3 flex-shrink-0 opacity-70" />}
                <span className="truncate">{option.unitType}</span>
              </div>
            )}
            {option.property && (
              <div className="flex items-center gap-1 text-muted-foreground min-w-0 flex-shrink">
                {propertyIcon || <MapPin className="w-3 h-3 flex-shrink-0 opacity-70" />}
                <span className="truncate">{option.property}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className={`${maxWidthClasses[maxWidth]} h-[600px] flex flex-col p-0 gap-0 overflow-hidden`}>
        {/* Header */}
        <div className="px-6 py-4 border-b border-border bg-background flex-shrink-0">
          <div className="flex-1">
            <h2 className="text-lg font-semibold leading-none tracking-tight text-foreground">
              {title}
            </h2>
            {description && (
              <p className="text-sm text-muted-foreground mt-1.5">
                {description}
              </p>
            )}
          </div>
        </div>

        {/* Optional header content (e.g. start date picker) */}
        {headerContent && (
          <div className="px-6 pt-3 pb-0 bg-background flex-shrink-0">
            {headerContent}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 px-6 py-4 overflow-hidden bg-background min-h-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Loading items...</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-[1fr_auto_1fr] gap-3 h-full min-h-0 overflow-hidden">
              {/* Available Items */}
              <div className="flex flex-col min-h-0 overflow-hidden">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold">
                    {availableHeader}
                    <span className="ml-2 text-xs font-normal text-muted-foreground">
                      ({availableOptions.length})
                    </span>
                  </h3>
                </div>

                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <Input
                    placeholder="Search..."
                    value={availableSearch}
                    onChange={(e) => setAvailableSearch(e.target.value)}
                    className="pl-9 h-9"
                  />
                </div>

                <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 min-h-0">
                  {availableOptions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center py-12">
                      <div className="w-14 h-14 rounded-full bg-muted/30 flex items-center justify-center mb-3">
                        <Search className="w-6 h-6 text-muted-foreground/60" />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {availableSearch ? 'No items found' : emptyMessage}
                      </p>
                    </div>
                  ) : (
                    availableOptions.map(option => (
                      <OptionItem 
                        key={option.value} 
                        option={option} 
                        isHighlighted={highlightedAvailable.includes(option.value)}
                        onClick={() => handleItemClick(option.value, false)}
                      />
                    ))
                  )}
                </div>
              </div>

              {/* Transfer Buttons */}
              <div className="flex flex-col items-center justify-center gap-2 px-1 flex-shrink-0">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={moveAllToSelected}
                  disabled={availableOptions.length === 0}
                  className="h-9 w-9 rounded-md"
                  title="Move all right"
                >
                  <div className="flex items-center -space-x-0.5">
                    <ArrowRight className="w-3 h-3" />
                    <ArrowRight className="w-3 h-3" />
                  </div>
                </Button>

                <Button
                  variant="default"
                  size="icon"
                  onClick={moveToSelected}
                  disabled={highlightedAvailable.length === 0}
                  className="h-9 w-9 rounded-md"
                  title="Move right"
                >
                  <ArrowRight className="w-4 h-4" />
                </Button>

                <div className="h-3" />

                <Button
                  variant="default"
                  size="icon"
                  onClick={moveToAvailable}
                  disabled={highlightedSelected.length === 0}
                  className="h-9 w-9 rounded-md"
                  title="Move left"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={moveAllToAvailable}
                  disabled={selectedOptions.length === 0}
                  className="h-9 w-9 rounded-md"
                  title="Move all left"
                >
                  <div className="flex items-center -space-x-0.5">
                    <ArrowLeft className="w-3 h-3" />
                    <ArrowLeft className="w-3 h-3" />
                  </div>
                </Button>
              </div>

              {/* Selected Items */}
              <div className="flex flex-col min-h-0 overflow-hidden">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold">
                    {selectedHeader}
                    <span className="ml-2 text-xs font-normal text-muted-foreground">
                      ({selectedOptions.length})
                    </span>
                  </h3>
                  {showOrderButtons && (
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={moveTop}
                        disabled={highlightedSelected.length !== 1 || selected.indexOf(highlightedSelected[0]) === 0}
                        className="h-7 w-7"
                        title="Move to top"
                      >
                        <ChevronsUp className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={moveUp}
                        disabled={highlightedSelected.length !== 1 || selected.indexOf(highlightedSelected[0]) === 0}
                        className="h-7 w-7"
                        title="Move up"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={moveDown}
                        disabled={highlightedSelected.length !== 1 || selected.indexOf(highlightedSelected[0]) === selected.length - 1}
                        className="h-7 w-7"
                        title="Move down"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={moveBottom}
                        disabled={highlightedSelected.length !== 1 || selected.indexOf(highlightedSelected[0]) === selected.length - 1}
                        className="h-7 w-7"
                        title="Move to bottom"
                      >
                        <ChevronsDown className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  )}
                </div>

                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <Input
                    placeholder="Search..."
                    value={selectedSearch}
                    onChange={(e) => setSelectedSearch(e.target.value)}
                    className="pl-9 h-9"
                  />
                </div>

                <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 min-h-0">
                  {selectedOptions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center py-12">
                      <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                        <ArrowRight className="w-6 h-6 text-primary/60" />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {selectedSearch ? 'No items found' : 'No items selected'}
                      </p>
                    </div>
                  ) : (
                    selectedOptions.map(option => (
                      <OptionItem 
                        key={option.value} 
                        option={option} 
                        isHighlighted={highlightedSelected.includes(option.value)}
                        onClick={() => handleItemClick(option.value, true)}
                      />
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex items-center justify-between gap-4 bg-background flex-shrink-0">
          <p className="text-sm text-muted-foreground">
            {selected.length > 0 ? (
              <span className="font-medium text-foreground">
                {selected.length} item{selected.length !== 1 ? 's' : ''} selected
              </span>
            ) : (
              'No items selected'
            )}
          </p>
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="min-w-[100px]"
            >
              {cancelButtonText}
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={selected.length === 0}
              className="min-w-[100px]"
            >
              {saveButtonText}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShuttleBox;


import React from 'react';
import { Settings, X } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';

interface Column {
  key: string;
  header: string;
  visible: boolean;
}

interface ColumnManagerProps {
  columns: Column[];
  onColumnsChange: (columns: Column[]) => void;
  buttonClassName?: string;
}

const ColumnManager: React.FC<ColumnManagerProps> = ({
  columns,
  onColumnsChange,
  buttonClassName = '',
}) => {
  const [open, setOpen] = React.useState(false);
  const [tempVisibleColumns, setTempVisibleColumns] = React.useState<string[]>([]);

  // Initialize temp columns when dialog opens
  React.useEffect(() => {
    if (open) {
      setTempVisibleColumns(columns.filter(col => col.visible).map(col => col.key));
    }
  }, [open, columns]);

  const handleToggleColumn = (key: string) => {
    setTempVisibleColumns(prev =>
      prev.includes(key)
        ? prev.filter(k => k !== key)
        : [...prev, key]
    );
  };

  const handleSelectAllColumns = () => {
    setTempVisibleColumns(columns.map(col => col.key));
  };

  const handleResetColumns = () => {
    setTempVisibleColumns(columns.map(col => col.key));
  };

  const handleSaveColumns = () => {
    const updatedColumns = columns.map(col => ({
      ...col,
      visible: tempVisibleColumns.includes(col.key),
    }));
    onColumnsChange(updatedColumns);
    setOpen(false);
  };

  const handleCancelColumns = () => {
    setOpen(false);
  };

  const visibleCount = columns.filter(col => col.visible).length;

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      {/* Trigger Button */}
      <Dialog.Trigger asChild>
        <button
          className={`
            flex items-center gap-2
            px-4 py-2
            text-sm font-medium
            rounded-lg
            border border-border
            bg-background
            text-foreground
            hover:bg-muted/50
            transition-colors
            ${buttonClassName}
          `}
        >
          <Settings className="w-4 h-4" />
          Manage Columns
          {visibleCount < columns.length && (
            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
              Columns: {visibleCount}/{columns.length}
            </span>
          )}
        </button>
      </Dialog.Trigger>

      {/* Drawer Portal */}
      <Dialog.Portal>
        {/* Overlay */}
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        
        {/* Content (Drawer from Right) */}
        <Dialog.Content
          className="
            fixed right-0 top-0 bottom-0 z-50
            w-full sm:w-[400px]
            bg-background
            border-l border-border
            shadow-lg
            flex flex-col
            data-[state=open]:animate-in 
            data-[state=closed]:animate-out 
            data-[state=closed]:slide-out-to-right 
            data-[state=open]:slide-in-from-right
            duration-300
          "
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <Dialog.Title className="text-base font-semibold text-foreground">
              Manage columns
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                className="
                  rounded-md p-1
                  text-muted-foreground
                  hover:bg-muted
                  transition-colors
                "
              >
                <X className="w-4 h-4" />
              </button>
            </Dialog.Close>
          </div>

          {/* Action Buttons */}
          <div className="px-4 py-3 flex justify-end gap-2">
            <button
              onClick={handleSelectAllColumns}
              className="
                px-3 py-1.5
                text-sm font-medium
                rounded-lg
                bg-primary
                text-primary-foreground
                hover:bg-primary/90
                transition-colors
              "
            >
              Select All
            </button>
            <button
              onClick={handleResetColumns}
              className="
                px-3 py-1.5
                text-sm font-medium
                rounded-lg
                bg-primary
                text-primary-foreground
                hover:bg-primary/90
                transition-colors
              "
            >
              Reset
            </button>
          </div>

          {/* Column List */}
          <div className="flex-1 overflow-y-auto px-4 py-2">
            <div className="space-y-1">
              {columns.map((column) => (
                <label
                  key={column.key}
                  className="
                    flex items-center gap-3
                    px-3 py-2.5
                    rounded-lg
                    hover:bg-muted
                    cursor-pointer
                    transition-colors
                  "
                >
                  <input
                    type="checkbox"
                    checked={tempVisibleColumns.includes(column.key)}
                    onChange={() => handleToggleColumn(column.key)}
                    className="
                      w-4 h-4
                      rounded
                      border-border 
                      accent-blue-600
                      focus:ring-2
                      focus:ring-blue-600
                      focus:ring-offset-0
                      bg-background
                    "
                  />
                  <span className="text-sm text-foreground flex-1">
                    {column.header}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-border" />

          {/* Footer Buttons */}
          <div className="p-4 flex gap-2">
            <button
              onClick={handleCancelColumns}
              className="
                flex-1
                px-4 py-2
                text-sm font-medium
                rounded-lg
                border border-border
                bg-background
                text-foreground
                hover:bg-muted
                transition-colors
              "
            >
              Cancel
            </button>
            <button
              onClick={handleSaveColumns}
              disabled={tempVisibleColumns.length === 0}
              className="
                flex-1
                px-4 py-2
                text-sm font-medium
                rounded-lg
                bg-primary
                text-primary-foreground
                hover:bg-primary/90
                disabled:opacity-50
                disabled:cursor-not-allowed
                transition-colors
              "
            >
              Save
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default ColumnManager;
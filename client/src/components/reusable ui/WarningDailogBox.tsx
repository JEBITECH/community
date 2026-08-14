import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Trash2, Pencil } from "lucide-react";
import clsx from "clsx";

interface WarnPopupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  message: string;
  onConfirm: () => void;
  actionType?: "delete" | "update" | "default" | "archive";
}

export function WarnPopupModal({
  open,
  onOpenChange,
  message,
  onConfirm,
  actionType = "default",
}: WarnPopupModalProps) {
  // Theme styles based on action type
  const theme = {
    delete: {
      color: "text-red-600",
      icon: <Trash2 className="w-5 h-5 text-red-600" />,
      btnVariant: "destructive" as const,
      title: "Delete Confirmation",
    },
    archive: {
      color: "text-orange-600",
      icon: <Trash2 className="w-5 h-5 text-orange-600" />,
      btnVariant: "destructive" as const,
      title: "Archive Confirmation",
    },
    update: {
      color: "text-blue-600",
      icon: <Pencil className="w-5 h-5 text-blue-600" />,
      btnVariant: "default" as const,
      title: "Update Confirmation",
    },
    default: {
      color: "text-amber-500",
      icon: <AlertTriangle className="w-5 h-5 text-amber-500" />,
      btnVariant: "default" as const,
      title: "Warning",
    },
  }[actionType];

  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[1000]" />
        <AlertDialog.Content
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-xl p-6 w-[90%] max-w-sm z-[1001] space-y-4"
        >
          <div className="flex items-center gap-2">
            {theme.icon}
            <AlertDialog.Title
              className={clsx("text-lg font-semibold", theme.color)}
            >
              {theme.title}
            </AlertDialog.Title>
          </div>

          <AlertDialog.Description className="text-gray-700 text-sm">
            {message}
          </AlertDialog.Description>

          <div className="flex justify-end gap-3 pt-4">
            <AlertDialog.Cancel asChild>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
            </AlertDialog.Cancel>
            <AlertDialog.Action asChild>
              <Button
                variant={theme.btnVariant}
                className={clsx(
                  "px-7 py-1", actionType === "update" && "bg-blue-600 hover:bg-blue-700 text-white"
                ) }
                onClick={() => {
                  onConfirm();
                  onOpenChange(false);
                }}
              >
                Yes
              </Button>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}

import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export interface ModuleSubscription {
  moduleId: number;
  term: "short" | "long";
  price?: number | string;
  startDate?: string;
  endDate?: string;
}

interface ModuleSubscriptionTableProps {
  moduleSubscriptions: ModuleSubscription[];
  modules: { id: number; moduleName: string }[];
  today: string;
  setModuleSubscriptions: React.Dispatch<React.SetStateAction<ModuleSubscription[]>>;
  handleTermChange: (moduleId: number, term: "short" | "long") => void;
}

export const ModuleSubscriptionTable: React.FC<ModuleSubscriptionTableProps> = ({
  moduleSubscriptions,
  modules,
  today,
  setModuleSubscriptions,
  handleTermChange,
}) => {
  return (
    <div className="w-full max-h-[400px] overflow-x-auto overflow-y-auto border border-gray-200 rounded">
      <table className="w-full border-collapse min-w-[800px] text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-border text-left">
            <th className="p-3 text-foreground font-semibold text-sm">Module</th>
            <th className="p-3 text-foreground font-semibold text-sm">Term</th>
            <th className="p-3 text-foreground font-semibold text-sm">Price</th>
            <th className="p-3 text-foreground font-semibold text-sm">Start Date</th>
            <th className="p-3 text-foreground font-semibold text-sm">End Date</th>
          </tr>
        </thead>
        <tbody>
          {moduleSubscriptions.map((sub) => {
            const moduleName = modules.find((m) => m.id === sub.moduleId)?.moduleName || "";
            return (
              <tr
                key={sub.moduleId}
                className="border-b border-border hover:bg-gray-50 transition-colors"
              >
                <td className="p-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="cursor-default"
                  >
                    {moduleName}
                  </Button>
                </td>
                <td className="p-3 flex flex-col space-y-1">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name={`term-${sub.moduleId}`}
                      value="short"
                      checked={sub.term === "short"}
                      onChange={() => handleTermChange(sub.moduleId, "short")}
                    />
                    Short-Term
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name={`term-${sub.moduleId}`}
                      value="long"
                      checked={sub.term === "long"}
                      onChange={() => handleTermChange(sub.moduleId, "long")}
                    />
                    Long-Term
                  </label>
                </td>
                <td className="p-3">
                  <Input
                    placeholder="Price"
                    value={sub.price ? `${sub.price} $/${sub.term === "short" ? "Month" : "Year"}` : ""}
                    onChange={(e) =>
                      setModuleSubscriptions((prev) =>
                        prev.map((s) =>
                          s.moduleId === sub.moduleId ? { ...s, price: e.target.value } : s
                        )
                      )
                    }
                    className="w-full"
                  />
                </td>
                <td className="p-3">
                  <Input
                    type="date"
                    value={sub.startDate || today}
                    max={sub.endDate}
                    onChange={(e) => {
                      const value = e.target.value;
                      setModuleSubscriptions((prev) =>
                        prev.map((s) =>
                          s.moduleId === sub.moduleId
                            ? {
                                ...s,
                                startDate: value,
                                endDate: s.endDate && s.endDate < value ? value : s.endDate,
                              }
                            : s
                        )
                      );
                    }}
                    className="w-full"
                  />
                </td>
                <td className="p-3">
                  <Input
                    type="date"
                    value={sub.endDate || today}
                    min={sub.startDate}
                    onChange={(e) => {
                      const value = e.target.value;
                      setModuleSubscriptions((prev) =>
                        prev.map((s) =>
                          s.moduleId === sub.moduleId
                            ? {
                                ...s,
                                endDate: value,
                                startDate: s.startDate && s.startDate > value ? value : s.startDate,
                              }
                            : s
                        )
                      );
                    }}
                    className="w-full"
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

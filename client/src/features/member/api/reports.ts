import { apiRequest } from "@/lib/queryClient";

export type ReportType = "events" | "financial" | "volunteer";

async function json<T>(res: Response): Promise<T> {
  return res.json();
}

export const getReport = (type: ReportType) =>
  apiRequest("GET", `/community/reports/${type}`).then((r) => json<Record<string, unknown>[]>(r));

export async function downloadReportCsv(type: ReportType): Promise<void> {
  const res = await apiRequest("GET", `/community/reports/${type}?format=csv`);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${type}-report.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

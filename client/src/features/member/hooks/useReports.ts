import { useMutation, useQuery } from "@tanstack/react-query";
import { getReport, downloadReportCsv, ReportType } from "../api/reports";
import { useToast } from "@/hooks/use-toast";

export const useReport = (type: ReportType) => useQuery({ queryKey: ["report", type], queryFn: () => getReport(type) });

export const useDownloadReportCsv = () => {
  const { toast } = useToast();
  return useMutation({
    mutationFn: downloadReportCsv,
    onError: (error: Error) => {
      toast({ title: "Couldn't download report", description: error.message, variant: "destructive" });
    },
  });
};

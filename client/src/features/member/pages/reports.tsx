import Layout from "@/components/Layout";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FileBarChart, Download } from "lucide-react";
import { useReport, useDownloadReportCsv } from "../hooks/useReports";
import { ReportType } from "../api/reports";

function ReportTable({ type }: { type: ReportType }) {
  const { data: rows, isLoading } = useReport(type);
  const download = useDownloadReportCsv();

  if (isLoading) {
    return (
      <div className="space-y-2 mt-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-10 rounded-lg" />
        ))}
      </div>
    );
  }

  if (!rows || rows.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-10">No data yet for this report.</p>;
  }

  const columns = Object.keys(rows[0]);

  return (
    <div className="mt-4 space-y-3">
      <div className="flex justify-end">
        <Button size="sm" variant="outline" className="gap-1.5" disabled={download.isPending} onClick={() => download.mutate(type)}>
          <Download className="w-3.5 h-3.5" /> Download CSV
        </Button>
      </div>
      <div className="overflow-x-auto rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead key={col} className="whitespace-nowrap capitalize">
                  {col.replace(/_/g, " ")}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, i) => (
              <TableRow key={i}>
                {columns.map((col) => (
                  <TableCell key={col} className="whitespace-nowrap">
                    {String(row[col] ?? "")}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export default function Reports() {
  return (
    <Layout title="Reports" subtitle="Export data for your community" icon={<FileBarChart className="w-5 h-5" />}>
      <div className="max-w-4xl mx-auto py-6 px-4">
        <Tabs defaultValue="events">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="events">Events</TabsTrigger>
            <TabsTrigger value="financial">Financial</TabsTrigger>
            <TabsTrigger value="volunteer">Volunteer</TabsTrigger>
          </TabsList>
          <TabsContent value="events">
            <ReportTable type="events" />
          </TabsContent>
          <TabsContent value="financial">
            <ReportTable type="financial" />
          </TabsContent>
          <TabsContent value="volunteer">
            <ReportTable type="volunteer" />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}


import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Invoice } from "@/types/invoice";
import { convertInvoicesToCSV, downloadCSV } from "@/utils/exportUtils";

export const useInvoiceExport = (invoices: Invoice[]) => {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);

  const handleExportCSV = () => {
    try {
      setIsExporting(true);
      
      const date = new Date();
      const filename = `invoices_export_${date.toISOString().slice(0, 10)}.csv`;
      
      const csvContent = convertInvoicesToCSV(invoices);
      downloadCSV(csvContent, filename);
      
      toast({
        title: "Export successful",
        description: `${invoices.length} invoices exported to ${filename}`,
      });
    } catch (error) {
      console.error('Error exporting to CSV:', error);
      toast({
        title: "Export failed",
        description: "An error occurred while exporting the data.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return {
    isExporting,
    handleExportCSV
  };
};

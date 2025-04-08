
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageTitle } from "@/components/PageTitle";
import { Loader2, Database } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const ImportApartments = () => {
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [counts, setCounts] = useState<any>(null);
  const { toast } = useToast();

  const handleCheckRecords = async () => {
    setChecking(true);
    try {
      const { data, error } = await supabase.functions.invoke('import-check');
      
      if (error) throw error;
      
      setCounts(data);
      toast({
        title: "Database Check Completed",
        description: `Found ${data.apartments} apartments, ${data.bedrooms} bedrooms, and ${data.beds} beds.`,
      });
    } catch (error: any) {
      console.error('Error checking records:', error);
      toast({
        variant: "destructive",
        title: "Error checking database records",
        description: error.message || "An unknown error occurred",
      });
    } finally {
      setChecking(false);
    }
  };

  const handleImportApartments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('import-apartments');
      
      if (error) throw error;
      
      setResult(data);
      toast({
        title: "Import Completed",
        description: "The apartment data has been imported successfully.",
      });
      
      // Refresh counts after import
      handleCheckRecords();
    } catch (error: any) {
      console.error('Error importing apartments:', error);
      toast({
        variant: "destructive",
        title: "Error importing apartments",
        description: error.message || "An unknown error occurred",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-6 space-y-6">
      <PageTitle title="Import Apartments" icon={<Database className="h-5 w-5" />} />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Database Check</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Check how many apartments, bedrooms, and beds are currently in the database.
            </p>
            <Button 
              onClick={handleCheckRecords}
              disabled={checking}
              variant="outline"
            >
              {checking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {checking ? 'Checking...' : 'Check Records'}
            </Button>
            
            {counts && (
              <div className="mt-4 p-4 bg-muted/50 rounded-md">
                <h3 className="font-medium mb-2">Current Database Status:</h3>
                <ul className="space-y-1">
                  <li>Apartments: {counts.apartments}</li>
                  <li>Bedrooms: {counts.bedrooms}</li>
                  <li>Beds: {counts.beds}</li>
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Import Apartments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Import all apartments, bedrooms, and beds from the provided data.
            </p>
            
            <Alert variant="default" className="mb-4">
              <AlertTitle>Warning</AlertTitle>
              <AlertDescription>
                This will add new apartment records to your database. It's recommended to check 
                existing records first to avoid duplicates.
              </AlertDescription>
            </Alert>
            
            <Button 
              onClick={handleImportApartments}
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? 'Importing...' : 'Import Apartments'}
            </Button>
            
            {result && (
              <div className="mt-4">
                <p className="font-medium text-green-600 dark:text-green-400 mb-2">
                  Import completed successfully!
                </p>
                <p>
                  Check the apartment management page to see the new apartments.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ImportApartments;

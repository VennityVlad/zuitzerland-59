
import { Copy } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DisplayCode } from '@/hooks/useDisplayCode';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type DisplayCodeListProps = {
  displayCodes: DisplayCode[];
  locations: any[];
  eventTags: any[];
  onCodesChange: () => void;
};

const DisplayCodeList = ({ 
  displayCodes, 
  locations, 
  eventTags, 
  onCodesChange 
}: DisplayCodeListProps) => {
  const { toast } = useToast();

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({
      title: "Copied",
      description: "URL copied to clipboard",
    });
  };

  const deleteCode = async (id: string) => {
    try {
      const { error } = await supabase
        .from('display_codes')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Display code deleted",
      });
      
      onCodesChange();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete code",
        variant: "destructive",
      });
    }
  };

  const isExpired = (expiresAt: string | null | undefined) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  const getTagNames = (code: DisplayCode) => {
    if (code.tag_filters && code.tag_filters.length > 0) {
      return code.tag_filters
        .map(tagId => eventTags.find(tag => tag.id === tagId)?.name || 'Unknown')
        .join(', ');
    }
    
    if (code.tag_filter) {
      return eventTags.find(t => t.id === code.tag_filter)?.name || 'Unknown';
    }
    
    return null;
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Existing Display Codes</h3>
      {displayCodes.map((code) => (
        <Card key={code.id} className={cn(
          "border",
          isExpired(code.expires_at) && "border-red-300 bg-red-50"
        )}>
          <CardHeader className="py-3">
            <div className="flex justify-between items-center">
              <CardTitle className="text-base">{code.name}</CardTitle>
              {isExpired(code.expires_at) && (
                <span className="text-xs font-medium text-red-500 bg-red-100 px-2 py-1 rounded">
                  Expired
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent className="py-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-sm font-medium">Access Code:</span>
                <div className="mt-1 font-mono bg-gray-100 p-2 rounded">{code.code}</div>
              </div>
              <div>
                <span className="text-sm font-medium">Display URL:</span>
                <div className="flex items-center gap-2 mt-1">
                  <Input 
                    value={`${window.location.origin}/display?code=${code.code}`} 
                    readOnly 
                    className="font-mono text-xs"
                  />
                  <Button 
                    size="icon" 
                    variant="outline" 
                    onClick={() => copyToClipboard(`${window.location.origin}/display?code=${code.code}`)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            <div className="mt-4 text-sm">
              <div className="flex flex-wrap gap-y-1 gap-x-4">
                <span>
                  <span className="font-medium">Created:</span>{' '}
                  {new Date(code.created_at).toLocaleDateString()}
                </span>
                {code.expires_at && (
                  <span>
                    <span className="font-medium">Expires:</span>{' '}
                    {new Date(code.expires_at).toLocaleDateString()}
                  </span>
                )}
                {code.location_filter && (
                  <span>
                    <span className="font-medium">Location:</span>{' '}
                    {locations.find(l => l.id === code.location_filter)?.name || 'Unknown'}
                  </span>
                )}
                {(code.tag_filter || (code.tag_filters && code.tag_filters.length > 0)) && (
                  <span>
                    <span className="font-medium">Event Tags:</span>{' '}
                    {getTagNames(code)}
                  </span>
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter className="pt-0 pb-3">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="destructive" size="sm">Delete</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete Display Code</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to delete this display code? This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline">Cancel</Button>
                  <Button variant="destructive" onClick={() => deleteCode(code.id)}>
                    Delete
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};

export default DisplayCodeList;

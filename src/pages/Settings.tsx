
import { useState, useEffect } from 'react';
import { Shield, Copy, RefreshCw } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageTitle } from "@/components/PageTitle";
import { Label } from "@/components/ui/label";
import { supabase } from '@/integrations/supabase/client';
import { usePrivy } from '@privy-io/react-auth';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from '@/components/ui/checkbox';

type DisplayCode = {
  id: string;
  code: string;
  name: string;
  location_filter?: string | null;
  tag_filter?: string | null;
  created_at: string;
  expires_at?: string | null;
};

const Settings = () => {
  const { toast } = useToast();
  const [displayCodes, setDisplayCodes] = useState<DisplayCode[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [eventTags, setEventTags] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = usePrivy();
  const [newCode, setNewCode] = useState({
    name: '',
    location_filter: '',
    tag_filter: '',
    expires_days: '7'
  });
  
  useEffect(() => {
    fetchDisplayCodes();
    fetchLocations();
    fetchEventTags();
  }, []);

  const fetchDisplayCodes = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('display_codes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDisplayCodes(data || []);
    } catch (error) {
      console.error('Error fetching display codes:', error);
      toast({
        title: "Error",
        description: "Failed to load display codes",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLocations = async () => {
    try {
      const { data, error } = await supabase
        .from('locations')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setLocations(data || []);
    } catch (error) {
      console.error('Error fetching locations:', error);
    }
  };

  const fetchEventTags = async () => {
    try {
      const { data, error } = await supabase
        .from('event_tags')
        .select('id, name');

      if (error) throw error;
      setEventTags(data || []);
    } catch (error) {
      console.error('Error fetching event tags:', error);
    }
  };

  const generateAccessCode = async () => {
    try {
      // Generate a short, readable code
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      // Calculate expiry date if provided
      const expiresAt = newCode.expires_days 
        ? new Date(Date.now() + parseInt(newCode.expires_days) * 24 * 60 * 60 * 1000).toISOString() 
        : null;
      
      const { data, error } = await supabase
        .from('display_codes')
        .insert([
          {
            code,
            name: newCode.name,
            location_filter: newCode.location_filter || null,
            tag_filter: newCode.tag_filter || null,
            expires_at: expiresAt
          }
        ])
        .select();

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Display access code generated",
      });
      
      fetchDisplayCodes();
      setNewCode({
        name: '',
        location_filter: '',
        tag_filter: '',
        expires_days: '7'
      });
    } catch (error) {
      console.error('Error generating access code:', error);
      toast({
        title: "Error",
        description: "Failed to generate access code",
        variant: "destructive",
      });
    }
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
      
      fetchDisplayCodes();
    } catch (error) {
      console.error('Error deleting code:', error);
      toast({
        title: "Error",
        description: "Failed to delete code",
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({
      title: "Copied",
      description: "URL copied to clipboard",
    });
  };

  const isExpired = (expiresAt: string | null | undefined) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  return (
    <div className="container py-6 space-y-6">
      <PageTitle title="Settings" icon={<Settings className="h-5 w-5" />} />
      
      <Card>
        <CardHeader>
          <CardTitle>TV Display Mode</CardTitle>
          <CardDescription>
            Generate access codes for the public schedule display screens
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertTitle>Access Control</AlertTitle>
            <AlertDescription>
              Generated codes provide access to view the schedule on public displays without requiring a login.
              Each code can be configured to show specific content and expires automatically.
            </AlertDescription>
          </Alert>
          
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Create New Display Access</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="display-name">Display Name</Label>
                <Input 
                  id="display-name" 
                  placeholder="Reception TV" 
                  value={newCode.name}
                  onChange={(e) => setNewCode({...newCode, name: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="expiry">Expires After</Label>
                <Select 
                  value={newCode.expires_days}
                  onValueChange={(value) => setNewCode({...newCode, expires_days: value})}
                >
                  <SelectTrigger id="expiry">
                    <SelectValue placeholder="Select expiration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 day</SelectItem>
                    <SelectItem value="7">7 days</SelectItem>
                    <SelectItem value="30">30 days</SelectItem>
                    <SelectItem value="90">90 days</SelectItem>
                    <SelectItem value="365">1 year</SelectItem>
                    <SelectItem value="">Never</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="location-filter">Filter by Location (Optional)</Label>
                <Select 
                  value={newCode.location_filter}
                  onValueChange={(value) => setNewCode({...newCode, location_filter: value})}
                >
                  <SelectTrigger id="location-filter">
                    <SelectValue placeholder="All locations" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All locations</SelectItem>
                    {locations.map((location) => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="tag-filter">Filter by Event Tag (Optional)</Label>
                <Select 
                  value={newCode.tag_filter}
                  onValueChange={(value) => setNewCode({...newCode, tag_filter: value})}
                >
                  <SelectTrigger id="tag-filter">
                    <SelectValue placeholder="All event types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All event types</SelectItem>
                    {eventTags.map((tag) => (
                      <SelectItem key={tag.id} value={tag.id}>
                        {tag.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <Button 
              onClick={generateAccessCode} 
              disabled={!newCode.name}
              className="mt-4"
            >
              Generate Access Code
            </Button>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Existing Display Codes</h3>
            {isLoading ? (
              <div className="text-center py-4">Loading...</div>
            ) : displayCodes.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">No display codes created yet</div>
            ) : (
              <div className="space-y-4">
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
                          {code.tag_filter && (
                            <span>
                              <span className="font-medium">Event Tag:</span>{' '}
                              {eventTags.find(t => t.id === code.tag_filter)?.name || 'Unknown'}
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
                              Are you sure you want to delete the display code for "{code.name}"? 
                              This action cannot be undone.
                            </DialogDescription>
                          </DialogHeader>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => {}}>Cancel</Button>
                            <Button variant="destructive" onClick={() => deleteCode(code.id)}>Delete</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;

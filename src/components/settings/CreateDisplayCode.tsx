
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from '@/integrations/supabase/client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TagFilter } from "@/components/events/TagFilter";

const EXPIRY_OPTIONS = [
  { value: "1", label: "1 day" },
  { value: "7", label: "7 days" },
  { value: "30", label: "30 days" },
  { value: "90", label: "90 days" },
  { value: "365", label: "1 year" },
  { value: "never", label: "Never" },
];

type CreateDisplayCodeProps = {
  locations: any[];
  eventTags: any[];
  onCodeCreated: () => void;
};

const CreateDisplayCode = ({ locations, eventTags, onCodeCreated }: CreateDisplayCodeProps) => {
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [tagFilters, setTagFilters] = useState<string[]>([]);
  const [expiryDays, setExpiryDays] = useState('7');

  const generateCode = async () => {
    if (!name) {
      toast({
        title: "Name required",
        description: "Please provide a name for the display code",
        variant: "destructive",
      });
      return;
    }

    try {
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      const expiresAt = expiryDays !== 'never' 
        ? new Date(Date.now() + parseInt(expiryDays) * 24 * 60 * 60 * 1000).toISOString() 
        : null;

      const { error } = await supabase
        .from('display_codes')
        .insert([{
          code,
          name,
          location_filter: locationFilter !== 'all' ? locationFilter : null,
          tag_filters: tagFilters.length > 0 ? tagFilters : null,
          expires_at: expiresAt
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Display code generated successfully",
      });

      setName('');
      setLocationFilter('all');
      setTagFilters([]);
      setExpiryDays('7');
      onCodeCreated();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to generate code",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Display Code</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="display-name">Display Name</Label>
          <Input
            id="display-name"
            placeholder="Reception TV"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="location-filter">Filter by Location (Optional)</Label>
          <Select value={locationFilter} onValueChange={setLocationFilter}>
            <SelectTrigger id="location-filter">
              <SelectValue placeholder="All locations" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All locations</SelectItem>
              {locations.map((location) => (
                <SelectItem key={location.id} value={location.id}>
                  {location.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="tag-filter">Filter by Event Tags (Optional)</Label>
          <TagFilter
            selectedTags={tagFilters}
            onTagsChange={setTagFilters}
          />
        </div>

        <div>
          <Label htmlFor="expiry">Expires After</Label>
          <Select value={expiryDays} onValueChange={setExpiryDays}>
            <SelectTrigger id="expiry">
              <SelectValue placeholder="Select expiration" />
            </SelectTrigger>
            <SelectContent>
              {EXPIRY_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button 
          onClick={generateCode} 
          disabled={!name}
          className="w-full mt-4"
        >
          Generate Access Code
        </Button>
      </CardContent>
    </Card>
  );
};

export default CreateDisplayCode;

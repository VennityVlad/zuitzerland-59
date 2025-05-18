
import React from "react";
import { format } from "date-fns";
import { Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface SearchHeaderProps {
  selectedTags: string[];
  selectedDate?: Date;
  clearFilters: () => void;
  isGoing?: boolean;
  isHosting?: boolean;
}

export const SearchHeader = ({ 
  selectedTags, 
  selectedDate, 
  clearFilters,
  isGoing = false,
  isHosting = false
}: SearchHeaderProps) => {
  const { data: tags } = useQuery({
    queryKey: ["event-tags-for-header"],
    queryFn: async () => {
      if (!selectedTags.length) return [];
      
      const { data, error } = await supabase
        .from("event_tags")
        .select("id, name")
        .in("id", selectedTags);
      
      if (error) throw error;
      return data || [];
    },
    enabled: selectedTags.length > 0,
  });

  // Show header if there are any filters active (tags, date, going, hosting)
  const hasFilterableCriteria = selectedTags.length > 0 || !!selectedDate || isGoing || isHosting;
  
  if (!hasFilterableCriteria) return null;

  return (
    <div className="bg-muted/30 rounded-lg p-4 mb-4 border">
      <div className="flex flex-col space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="font-medium">Filtered Results</h3>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-muted-foreground hover:text-foreground"
            onClick={clearFilters}
          >
            Clear all
          </Button>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {selectedDate && (
            <Badge variant="outline" className="flex items-center gap-1">
              <span>Date: {format(selectedDate, "MMM d, yyyy")}</span>
            </Badge>
          )}
          
          {isGoing && (
            <Badge variant="outline" className="flex items-center gap-1 bg-green-100">
              <span>Going</span>
            </Badge>
          )}
          
          {isHosting && (
            <Badge variant="outline" className="flex items-center gap-1 bg-blue-100">
              <span>Hosting</span>
            </Badge>
          )}
          
          {selectedTags.length > 0 && tags?.map((tag) => (
            <Badge key={tag.id} variant="outline" className="flex items-center gap-1 bg-gray-100">
              <Tag className="h-3 w-3" />
              <span>{tag.name}</span>
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
};

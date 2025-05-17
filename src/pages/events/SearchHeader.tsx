
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { X, Calendar, Tag, User, UsersRound } from "lucide-react";

interface SearchHeaderProps {
  selectedTags: string[];
  selectedDate?: Date;
  clearFilters: () => void;
  isGoing?: boolean;
  isHosting?: boolean;
}

export const SearchHeader = ({ 
  selectedTags = [], 
  selectedDate, 
  clearFilters,
  isGoing = false,
  isHosting = false
}: SearchHeaderProps) => {
  // Only show the search header when tags or date filters are active
  // Going/hosting filters are shown by button color/state
  const shouldShowHeader = selectedTags.length > 0 || !!selectedDate;
  
  if (!shouldShowHeader) {
    return null;
  }

  return (
    <div className="bg-gray-50 border rounded-md p-4 mb-4 animate-in fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="space-y-2">
          <h3 className="font-medium">Filtered results</h3>
          <div className="flex flex-wrap gap-2">
            {selectedDate && (
              <Badge variant="outline" className="flex items-center gap-1 px-3 py-1">
                <Calendar className="h-3 w-3" />
                <span>{format(selectedDate, "MMMM d, yyyy")}</span>
              </Badge>
            )}
            
            {selectedTags.map((tag, index) => (
              <Badge key={index} className="flex items-center gap-1 px-3 py-1">
                <Tag className="h-3 w-3" />
                <span>{tag}</span>
              </Badge>
            ))}
          </div>
        </div>
        
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={clearFilters} 
          className="self-start sm:self-center"
        >
          <X className="mr-1 h-4 w-4" />
          Clear filters
        </Button>
      </div>
    </div>
  );
};

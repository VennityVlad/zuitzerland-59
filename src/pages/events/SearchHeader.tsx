
import React from "react";
import { X, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

interface SearchHeaderProps {
  selectedTags: string[];
  selectedDate?: Date;
  clearFilters: () => void;
  isGoing?: boolean;
  isHosting?: boolean;
}

export const SearchHeader = ({ selectedTags, selectedDate, clearFilters, isGoing, isHosting }: SearchHeaderProps) => {
  return (
    <div className="flex items-center justify-between gap-4 py-2 px-4 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 mb-4">
      <div className="flex items-center gap-2 overflow-hidden">
        <Filter className="h-4 w-4 text-purple-500 flex-shrink-0" />
        <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
          {selectedTags.length > 0 && `${selectedTags.length} tag${selectedTags.length !== 1 ? 's' : ''}`}
          {isGoing && (selectedTags.length > 0 ? ", " : "") + "Going"}
          {isHosting && ((selectedTags.length > 0 || isGoing) ? ", " : "") + "Hosting"}
          {(selectedTags.length > 0 || isGoing || isHosting) && selectedDate && ', '}
          {selectedDate && `Date: ${format(selectedDate, 'MMM d, yyyy')}`}
        </span>
      </div>
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={clearFilters}
        className="flex-shrink-0 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
      >
        <X className="h-4 w-4 mr-1" />
        <span className="sr-only sm:not-sr-only">Clear search</span>
      </Button>
    </div>
  );
};


import { Button } from "@/components/ui/button";
import { useState } from "react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Check, ChevronDown } from "lucide-react";
import { DISPLAYED_CONTRIBUTION_TYPES } from "@/lib/zulinkConstants";

interface AppsFilterProps {
  onFilterChange: (filter: string) => void;
  onContributionTypeChange: (type: string | null) => void;
  filter: string;
  contributionTypeFilter: string | null;
  isAdmin: boolean;
  pendingProjectsCount: number;
  myProjectsCount: number;
  allProjectsCount: number;
}

export function AppsFilter({ 
  onFilterChange, 
  onContributionTypeChange,
  filter, 
  contributionTypeFilter,
  isAdmin, 
  pendingProjectsCount, 
  myProjectsCount,
  allProjectsCount
}: AppsFilterProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 mb-6">
      <div className="flex flex-wrap gap-2">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          onClick={() => onFilterChange("all")}
          size="sm"
          className="flex items-center"
        >
          All Projects
          {allProjectsCount > 0 && (
            <span className="ml-2 bg-primary-foreground text-primary rounded-full w-5 h-5 flex items-center justify-center text-xs">
              {allProjectsCount}
            </span>
          )}
        </Button>
        
        {isAdmin && (
          <Button
            variant={filter === "pending" ? "default" : "outline"}
            onClick={() => onFilterChange("pending")}
            size="sm"
            className="flex items-center"
          >
            Pending Review
            {pendingProjectsCount > 0 && (
              <span className="ml-2 bg-primary-foreground text-primary rounded-full w-5 h-5 flex items-center justify-center text-xs">
                {pendingProjectsCount}
              </span>
            )}
          </Button>
        )}
        
        <Button
          variant={filter === "my" ? "default" : "outline"}
          onClick={() => onFilterChange("my")}
          size="sm"
          className="flex items-center"
        >
          My Submissions
          {myProjectsCount > 0 && (
            <span className="ml-2 bg-primary-foreground text-primary rounded-full w-5 h-5 flex items-center justify-center text-xs">
              {myProjectsCount}
            </span>
          )}
        </Button>
      </div>
      
      <div className="ml-auto">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="flex items-center">
              {contributionTypeFilter ? `Contribution: ${contributionTypeFilter}` : "Filter by Contribution"}
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Contribution Type</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => onContributionTypeChange(null)}
              className="flex items-center justify-between"
            >
              All Types
              {contributionTypeFilter === null && <Check className="h-4 w-4 ml-2" />}
            </DropdownMenuItem>
            
            {DISPLAYED_CONTRIBUTION_TYPES.map((type) => (
              <DropdownMenuItem 
                key={type} 
                onClick={() => onContributionTypeChange(type)}
                className="flex items-center justify-between"
              >
                {type}
                {contributionTypeFilter === type && <Check className="h-4 w-4 ml-2" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

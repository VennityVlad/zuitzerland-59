
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

interface AppsFilterProps {
  onFilterChange: (filter: string) => void;
  filter: string;
  isAdmin: boolean;
  pendingCount: number;
  myAppsCount: number;
}

export function AppsFilter({ 
  onFilterChange, 
  filter, 
  isAdmin, 
  pendingCount, 
  myAppsCount 
}: AppsFilterProps) {
  return (
    <div className="flex flex-wrap gap-2 mb-6">
      <Button
        variant={filter === "all" ? "default" : "outline"}
        onClick={() => onFilterChange("all")}
        size="sm"
      >
        All Apps
      </Button>
      
      {isAdmin && (
        <Button
          variant={filter === "pending" ? "default" : "outline"}
          onClick={() => onFilterChange("pending")}
          size="sm"
          className="flex items-center"
        >
          Pending Review
          {pendingCount > 0 && (
            <span className="ml-2 bg-primary-foreground text-primary rounded-full w-5 h-5 flex items-center justify-center text-xs">
              {pendingCount}
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
        My Apps
        {myAppsCount > 0 && (
          <span className="ml-2 bg-primary-foreground text-primary rounded-full w-5 h-5 flex items-center justify-center text-xs">
            {myAppsCount}
          </span>
        )}
      </Button>
    </div>
  );
}

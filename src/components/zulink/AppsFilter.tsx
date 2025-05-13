
import { Button } from "@/components/ui/button";

interface AppsFilterProps {
  onFilterChange: (filter: string) => void;
  filter: string;
  isAdmin: boolean;
  pendingProjectsCount: number;
  myProjectsCount: number;
  allProjectsCount: number;
}

export function AppsFilter({ 
  onFilterChange, 
  filter, 
  isAdmin, 
  pendingProjectsCount, 
  myProjectsCount,
  allProjectsCount
}: AppsFilterProps) {
  return (
    <div className="flex flex-wrap gap-2 mb-6">
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
  );
}


import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface CardSkeletonProps {
  className?: string;
  height?: "sm" | "md" | "lg";
}

export const CardSkeleton = ({ className, height = "sm" }: CardSkeletonProps) => {
  const heightClass = 
    height === "sm" ? "h-[200px]" : 
    height === "md" ? "h-[300px]" : 
    "h-[400px]";
  
  return (
    <div className={cn("rounded-lg border bg-card p-4", heightClass, className)}>
      <div className="space-y-2">
        <Skeleton className="h-4 w-[150px]" />
        <Skeleton className="h-4 w-[100px]" />
      </div>
      <div className="mt-4 space-y-2">
        <Skeleton className="h-[100px] w-full" />
      </div>
    </div>
  );
};

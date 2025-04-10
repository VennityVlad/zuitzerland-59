
import { Progress } from "@/components/ui/progress";

interface OnboardingProgressProps {
  completedCount: number;
  totalCount: number;
}

export const OnboardingProgress = ({ completedCount, totalCount }: OnboardingProgressProps) => {
  const percentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium">
          Progress
        </span>
        <span className="text-sm font-medium">
          {completedCount}/{totalCount} completed
        </span>
      </div>
      <Progress value={percentage} className="h-2" />
      <p className="text-xs text-gray-500">
        {percentage === 100 ? 'All tasks completed!' : `${Math.round(percentage)}% complete`}
      </p>
    </div>
  );
};

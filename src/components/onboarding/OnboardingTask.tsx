
import { useState } from "react";
import { Check, ChevronDown, ChevronRight, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface OnboardingSubtask {
  id: string;
  label: string;
  completed: boolean;
}

interface OnboardingTaskProps {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  subtasks?: OnboardingSubtask[];
  onComplete: (taskId: string, completed: boolean) => void;
  onSubtaskComplete: (taskId: string, subtaskId: string, completed: boolean) => void;
  onTaskClick?: () => void; // Optional callback for when the task is clicked
  isLink?: boolean; // Whether the task should act as a link
}

export const OnboardingTask = ({
  id,
  title,
  description,
  completed,
  subtasks = [],
  onComplete,
  onSubtaskComplete,
  onTaskClick,
  isLink = false,
}: OnboardingTaskProps) => {
  const [expanded, setExpanded] = useState(false);
  
  const hasSubtasks = subtasks.length > 0;
  
  const toggleExpanded = () => {
    if (hasSubtasks) {
      setExpanded(!expanded);
    }
    
    // If this task is a link and there's a click handler, call it
    if (isLink && onTaskClick) {
      onTaskClick();
    }
  };

  const handleToggleTask = () => {
    onComplete(id, !completed);
  };

  const handleToggleSubtask = (subtaskId: string, isCompleted: boolean) => {
    onSubtaskComplete(id, subtaskId, isCompleted);
  };

  return (
    <div className="mb-4">
      <div 
        className={cn(
          "flex items-start p-4 rounded-lg border",
          completed ? "bg-green-50 border-green-200" : "bg-white border-gray-200",
          isLink && "cursor-pointer hover:bg-gray-50"
        )}
      >
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "h-6 w-6 rounded-full p-0 mr-3 mt-0.5",
            completed ? "bg-green-500 text-white hover:bg-green-600" : "border border-gray-300"
          )}
          onClick={handleToggleTask}
        >
          {completed && <Check className="h-3 w-3" />}
        </Button>
        
        <div 
          className="flex-1"
          onClick={toggleExpanded}
        >
          <div 
            className={cn(
              "flex items-center",
              (hasSubtasks || isLink) ? "cursor-pointer" : ""
            )}
          >
            <div className="flex-1">
              <h3 className={cn(
                "text-base font-medium",
                completed && "line-through text-gray-500",
                isLink && "text-blue-600 hover:underline"
              )}>
                {title}
                {isLink && <ArrowRight className="inline-block ml-1 h-4 w-4" />}
              </h3>
              {description && (
                <p className="text-sm text-gray-500 mt-1">{description}</p>
              )}
            </div>
            {hasSubtasks && (
              <Button variant="ghost" size="sm" className="p-0">
                {expanded ? (
                  <ChevronDown className="h-5 w-5" />
                ) : (
                  <ChevronRight className="h-5 w-5" />
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
      
      {/* Subtasks */}
      {hasSubtasks && expanded && (
        <div className="pl-10 mt-2 space-y-2">
          {subtasks.map((subtask) => (
            <div 
              key={subtask.id} 
              className={cn(
                "flex items-center p-3 rounded-lg border",
                subtask.completed ? "bg-green-50 border-green-200" : "bg-white border-gray-200"
              )}
            >
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "h-5 w-5 rounded-full p-0 mr-3",
                  subtask.completed ? "bg-green-500 text-white hover:bg-green-600" : "border border-gray-300"
                )}
                onClick={() => handleToggleSubtask(subtask.id, !subtask.completed)}
              >
                {subtask.completed && <Check className="h-3 w-3" />}
              </Button>
              <span className={cn(
                "text-sm",
                subtask.completed && "line-through text-gray-500"
              )}>
                {subtask.label}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

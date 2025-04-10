import { useEffect, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useNavigate } from "react-router-dom";
import { PageTitle } from "@/components/PageTitle";
import { supabase } from "@/integrations/supabase/client";
import { OnboardingTask } from "@/components/onboarding/OnboardingTask";
import { OnboardingProgress } from "@/components/onboarding/OnboardingProgress";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { useAdminStatus } from "@/hooks/useAdminStatus";

interface TaskData {
  completed: boolean;
  subtasks?: Record<string, boolean>;
}

interface OnboardingProgress {
  tasks: Record<string, TaskData>;
  totalCompleted: number;
  totalTasks: number;
  lastUpdated: string | null;
}

interface OnboardingTaskDefinition {
  id: string;
  title: string;
  description?: string;
  subtasks?: {
    id: string;
    label: string;
  }[];
}

const taskDefinitions: OnboardingTaskDefinition[] = [
  {
    id: "1",
    title: "Fill out your profile data",
    subtasks: [
      { id: "a", label: "Upload a profile picture" },
      { id: "b", label: "Set your username" },
    ],
  },
  {
    id: "2",
    title: "Take the personality quiz",
    subtasks: [
      { id: "a", label: "Complete the 10-question quiz" },
    ],
  },
  {
    id: "3",
    title: "Fill out housing preferences",
    subtasks: [
      { id: "a", label: "Complete the housing questionnaire" },
    ],
  },
  {
    id: "4",
    title: "Browse housing options",
  },
  {
    id: "5",
    title: "Join the community",
    subtasks: [
      { id: "a", label: "Join the Discord server" },
      { id: "b", label: "Introduce yourself in #introductions" },
    ],
  },
  {
    id: "6",
    title: "Pay your deposit",
  },
  {
    id: "7",
    title: "Sign the rental agreement",
  },
  {
    id: "8",
    title: "Submit your proof of income",
  },
  {
    id: "9",
    title: "Complete your arrival info",
    subtasks: [
      { id: "a", label: "Set your arrival date" },
    ],
  },
  {
    id: "10",
    title: "Complete payment",
  },
];

const Onboarding = () => {
  const { user } = usePrivy();
  const { isAdmin, isLoading: isAdminLoading } = useAdminStatus(user?.id);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [progress, setProgress] = useState<OnboardingProgress | null>(null);

  // Fetch onboarding progress from the user's profile
  useEffect(() => {
    const fetchOnboardingProgress = async () => {
      if (!user?.id) return;

      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('profiles')
          .select('onboarding_progress')
          .eq('privy_id', user.id)
          .maybeSingle();

        if (error) {
          throw error;
        }

        if (data?.onboarding_progress) {
          setProgress(data.onboarding_progress as OnboardingProgress);
        }
      } catch (error) {
        console.error('Error fetching onboarding progress:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load your onboarding progress"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchOnboardingProgress();
  }, [user?.id, toast]);

  // Redirect admins to another page
  useEffect(() => {
    if (!isAdminLoading && isAdmin) {
      navigate('/book');
    }
  }, [isAdmin, isAdminLoading, navigate]);

  // Handle task completion
  const updateTaskStatus = async (taskId: string, completed: boolean) => {
    if (!user?.id || !progress) return;
    
    setIsSaving(true);

    try {
      // Create a deep copy of the progress object
      const updatedProgress = JSON.parse(JSON.stringify(progress)) as OnboardingProgress;
      
      // Update the task completion status
      updatedProgress.tasks[taskId].completed = completed;
      
      // If the task has subtasks and is marked as completed, mark all subtasks as completed too
      if (completed && updatedProgress.tasks[taskId].subtasks) {
        Object.keys(updatedProgress.tasks[taskId].subtasks!).forEach(subtaskId => {
          updatedProgress.tasks[taskId].subtasks![subtaskId] = true;
        });
      }
      
      // If the task is marked as incomplete but has completed subtasks, keep them completed
      
      // Recalculate the total completed tasks
      let completedCount = 0;
      Object.values(updatedProgress.tasks).forEach(task => {
        if (task.completed) {
          completedCount++;
        }
      });
      
      updatedProgress.totalCompleted = completedCount;
      updatedProgress.lastUpdated = new Date().toISOString();
      
      // Update the progress state
      setProgress(updatedProgress);
      
      // Save to the database
      const { error } = await supabase
        .from('profiles')
        .update({ onboarding_progress: updatedProgress })
        .eq('privy_id', user.id);
      
      if (error) {
        throw error;
      }
      
      toast({
        title: completed ? "Task completed!" : "Task marked as incomplete",
        description: completed ? "Your progress has been updated" : "Your task has been reset"
      });
      
    } catch (error) {
      console.error('Error updating task status:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update task status"
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle subtask completion
  const updateSubtaskStatus = async (taskId: string, subtaskId: string, completed: boolean) => {
    if (!user?.id || !progress) return;
    
    setIsSaving(true);
    
    try {
      // Create a deep copy of the progress object
      const updatedProgress = JSON.parse(JSON.stringify(progress)) as OnboardingProgress;
      
      // Update the subtask completion status
      if (!updatedProgress.tasks[taskId].subtasks) {
        updatedProgress.tasks[taskId].subtasks = {};
      }
      updatedProgress.tasks[taskId].subtasks![subtaskId] = completed;
      
      // Check if all subtasks are completed
      const allSubtasksCompleted = Object.values(updatedProgress.tasks[taskId].subtasks!).every(status => status);
      
      // If all subtasks are completed, mark the parent task as completed
      if (allSubtasksCompleted) {
        updatedProgress.tasks[taskId].completed = true;
      } else {
        // If any subtask is incomplete, make sure the parent task is marked as incomplete
        updatedProgress.tasks[taskId].completed = false;
      }
      
      // Recalculate the total completed tasks
      let completedCount = 0;
      Object.values(updatedProgress.tasks).forEach(task => {
        if (task.completed) {
          completedCount++;
        }
      });
      
      updatedProgress.totalCompleted = completedCount;
      updatedProgress.lastUpdated = new Date().toISOString();
      
      // Update the progress state
      setProgress(updatedProgress);
      
      // Save to the database
      const { error } = await supabase
        .from('profiles')
        .update({ onboarding_progress: updatedProgress })
        .eq('privy_id', user.id);
      
      if (error) {
        throw error;
      }
      
    } catch (error) {
      console.error('Error updating subtask status:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update subtask status"
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isAdminLoading || isAdmin) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse">Redirecting...</div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <PageTitle title="Getting Started" description="Complete these steps to set up your account" />
        <div className="py-8 px-4 flex-grow">
          <div className="container max-w-3xl mx-auto">
            <div className="animate-pulse space-y-6">
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <PageTitle 
        title="Getting Started" 
        description="Complete these steps to set up your account"
      />
      <div className="py-8 px-4 flex-grow">
        <div className="container max-w-3xl mx-auto">
          <Card>
            <CardContent className="p-6">
              {progress && (
                <OnboardingProgress 
                  completedCount={progress.totalCompleted} 
                  totalCount={progress.totalTasks} 
                />
              )}
            </CardContent>
          </Card>
          
          <div className="mt-8 space-y-2">
            {taskDefinitions.map((task) => {
              // Default to an incomplete task if we don't have progress data yet
              const taskProgress = progress?.tasks[task.id] || {
                completed: false,
                subtasks: task.subtasks ? 
                  Object.fromEntries(task.subtasks.map(s => [s.id, false])) : 
                  undefined
              };
              
              const subtasks = task.subtasks?.map(subtask => ({
                id: subtask.id,
                label: subtask.label,
                completed: taskProgress.subtasks ? 
                  taskProgress.subtasks[subtask.id] || false : 
                  false
              }));
              
              return (
                <OnboardingTask
                  key={task.id}
                  id={task.id}
                  title={task.title}
                  description={task.description}
                  completed={taskProgress.completed}
                  subtasks={subtasks}
                  onComplete={updateTaskStatus}
                  onSubtaskComplete={updateSubtaskStatus}
                />
              );
            })}
          </div>
          
          <p className="text-sm text-gray-500 mt-8">
            Complete all tasks to finish your onboarding. Need help? Contact support.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;

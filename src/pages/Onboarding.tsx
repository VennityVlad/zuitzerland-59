
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
    title: "Join Telegram hub via guild.xyz/zuitzerland",
    subtasks: [
      { id: "a", label: "Introduce yourself" },
      { id: "b", label: "Reach out to the team if you'd like to be added manually" },
    ],
  },
  {
    id: "2",
    title: "Join us for April 17th Virtual Townhall",
    subtasks: [
      { id: "a", label: "Location will be announced to confirmed attendees!" },
    ],
  },
  {
    id: "3",
    title: "Plan your May",
    subtasks: [
      { id: "a", label: "Daily schedule breakdown:" },
      { id: "b", label: "Breakfast: 7.00-10.00" },
      { id: "c", label: "Core Content hours: 10.00-13.00" },
      { id: "d", label: "We recommend leaving these hours open each day" },
      { id: "e", label: "Self-Organized Lunch: 13.00-15.00" },
      { id: "f", label: "Bottoms-Up Programming: 15.00-18.00" },
      { id: "g", label: "Self-Organized Dinner: 18.00-20.00" },
    ],
  },
  {
    id: "4",
    title: "Fill out Arrival & Housing Preference Form",
  },
  {
    id: "5",
    title: "Read our Transportation Guide",
    subtasks: [
      { id: "a", label: "Direct to #2 while locked" },
      { id: "b", label: "You can coordinate car pools in the Arrivals channel in the telegram hub!" },
    ],
  },
  {
    id: "6",
    title: "Read our Privacy Policy",
  },
  {
    id: "7",
    title: "Read our Safety Policies",
  },
  {
    id: "8",
    title: "Add yourself to our Voluntary Resident Directory",
  },
  {
    id: "9",
    title: "Bring 1 (or more!) of your favorite books to Zuitzerland!",
    subtasks: [
      { id: "a", label: "Add books you plan to bring to the Library Catalogue" },
    ],
  },
  {
    id: "10",
    title: "Pack according to the Packing List!",
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

        // Use type assertion to tell TypeScript that data.onboarding_progress exists
        if (data && data.onboarding_progress) {
          // Fix the type assertion to properly handle the conversion
          const progressData = data.onboarding_progress as unknown;
          setProgress(progressData as OnboardingProgress);
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
      
      // Save to the database using type assertion to tell TypeScript onboarding_progress is valid
      const { error } = await supabase
        .from('profiles')
        .update({ 
          onboarding_progress: updatedProgress as any 
        })
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
      
      // Save to the database using type assertion to tell TypeScript onboarding_progress is valid
      const { error } = await supabase
        .from('profiles')
        .update({ 
          onboarding_progress: updatedProgress as any 
        })
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

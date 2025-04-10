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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PackingList } from "@/components/onboarding/PackingList";
import { List, Package } from "lucide-react";
import { Json } from "@/integrations/supabase/types";

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
  link?: string;
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
      { id: "b", label: "Breakfast: 7.00-10.00" },
      { id: "c", label: "Core Content hours: 10.00-13.00" },
      { id: "f", label: "10am - intro session" },
      { id: "g", label: "11am - lecture or workshop" },
      { id: "h", label: "12pm - discussion" },
      { id: "i", label: "Self-Organized Lunch: 13.00-15.00" },
      { id: "j", label: "Bottoms-Up Programming: 15.00-18.00" },
      { id: "k", label: "Self-Organized Dinner: 18.00-20.00" },
    ],
  },
  {
    id: "4",
    title: "Fill out Housing Preference Form",
    link: "/housing-preferences",
  },
  {
    id: "5",
    title: "Read our Transportation Guide (coming soon)",
    subtasks: [
      { id: "b", label: "You can coordinate car pools in the Arrivals channel in the telegram hub!" },
    ],
  },
  {
    id: "6",
    title: "Read our Code of Conduct",
  },
  {
    id: "8",
    title: "Opt In to Resident Directory",
    link: "/directory",
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
    description: "View the packing list in the Packing List tab",
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
  const [activeTab, setActiveTab] = useState("tasks");

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

        if (data && data.onboarding_progress) {
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

  useEffect(() => {
    if (!isAdminLoading && isAdmin) {
      navigate('/book');
    }
  }, [isAdmin, isAdminLoading, navigate]);

  const updateTaskStatus = async (taskId: string, completed: boolean) => {
    if (!user?.id || !progress) return;
    
    setIsSaving(true);

    try {
      const updatedProgress = JSON.parse(JSON.stringify(progress)) as OnboardingProgress;
      
      updatedProgress.tasks[taskId].completed = completed;
      
      if (completed && updatedProgress.tasks[taskId].subtasks) {
        Object.keys(updatedProgress.tasks[taskId].subtasks!).forEach(subtaskId => {
          updatedProgress.tasks[taskId].subtasks![subtaskId] = true;
        });
      }
      
      let completedCount = 0;
      Object.values(updatedProgress.tasks).forEach(task => {
        if (task.completed) {
          completedCount++;
        }
      });
      
      updatedProgress.totalCompleted = completedCount;
      updatedProgress.lastUpdated = new Date().toISOString();
      
      setProgress(updatedProgress);
      
      const { error } = await supabase
        .from('profiles')
        .update({ 
          onboarding_progress: updatedProgress as unknown as Json
        })
        .eq('privy_id', user.id);
      
      if (error) {
        throw error;
      }
      
      // If this is the directory opt-in task (#8), also update the opt_in_directory field
      if (taskId === "8") {
        const { error: directoryError } = await supabase
          .from('profiles')
          .update({
            opt_in_directory: completed
          })
          .eq('privy_id', user.id);
          
        if (directoryError) {
          throw directoryError;
        }
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

  const updateSubtaskStatus = async (taskId: string, subtaskId: string, completed: boolean) => {
    if (!user?.id || !progress) return;
    
    setIsSaving(true);
    
    try {
      const updatedProgress = JSON.parse(JSON.stringify(progress)) as OnboardingProgress;
      
      if (!updatedProgress.tasks[taskId].subtasks) {
        updatedProgress.tasks[taskId].subtasks = {};
      }
      updatedProgress.tasks[taskId].subtasks![subtaskId] = completed;
      
      const allSubtasksCompleted = Object.values(updatedProgress.tasks[taskId].subtasks!).every(status => status);
      
      if (allSubtasksCompleted) {
        updatedProgress.tasks[taskId].completed = true;
      } else {
        updatedProgress.tasks[taskId].completed = false;
      }
      
      let completedCount = 0;
      Object.values(updatedProgress.tasks).forEach(task => {
        if (task.completed) {
          completedCount++;
        }
      });
      
      updatedProgress.totalCompleted = completedCount;
      updatedProgress.lastUpdated = new Date().toISOString();
      
      setProgress(updatedProgress);
      
      const { error } = await supabase
        .from('profiles')
        .update({ 
          onboarding_progress: updatedProgress as unknown as Json 
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

  const handlePackingListClick = () => {
    setActiveTab("packing-list");
  };

  const handleHousingPreferencesClick = () => {
    navigate("/housing-preferences");
  };

  const handleDirectoryClick = () => {
    navigate("/directory");
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
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="tasks" className="flex items-center gap-2">
                <List className="h-4 w-4" />
                Tasks
              </TabsTrigger>
              <TabsTrigger value="packing-list" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Packing List
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="tasks" className="space-y-6">
              {progress && (
                <Card>
                  <CardContent className="p-6">
                    <OnboardingProgress 
                      completedCount={progress.totalCompleted} 
                      totalCount={progress.totalTasks} 
                    />
                  </CardContent>
                </Card>
              )}
              
              <div className="mt-4 space-y-2">
                {taskDefinitions.map((task) => {
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
                  
                  const isPackingListTask = task.id === "10";
                  const isHousingPreferencesTask = task.id === "4";
                  const isDirectoryTask = task.id === "8";
                  
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
                      onTaskClick={
                        isPackingListTask ? handlePackingListClick : 
                        isHousingPreferencesTask ? handleHousingPreferencesClick : 
                        isDirectoryTask ? handleDirectoryClick :
                        undefined
                      }
                      isLink={isPackingListTask || isHousingPreferencesTask || isDirectoryTask}
                    />
                  );
                })}
              </div>
              
              <p className="text-sm text-gray-500 mt-8">
                Complete all tasks to finish your onboarding. Need help? Contact support.
              </p>
            </TabsContent>
            
            <TabsContent value="packing-list">
              <Card>
                <CardContent className="p-6">
                  <PackingList />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;

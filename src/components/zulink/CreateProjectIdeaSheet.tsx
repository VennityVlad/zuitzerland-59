
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSupabaseJwt } from "@/components/SupabaseJwtProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";
import { SUBMISSION_TYPES, CONTRIBUTION_TYPES, FLAG_TYPES, SubmissionTypeValue, ContributionTypeValue, FlagTypeValue } from "@/lib/zulinkConstants";
import { TablesInsert } from "@/integrations/supabase/types"; // Will be auto-generated

interface CreateProjectIdeaSheetProps {
  onProjectCreated?: () => void;
  userId?: string; // Needed to associate project with user
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  editMode?: boolean;
  projectData?: {
    id: string;
    name: string;
    description: string;
    submission_type: SubmissionTypeValue;
    contribution_type: ContributionTypeValue;
    flag: FlagTypeValue;
    benefit_to_zuitzerland: string;
    support_needed?: string;
    github_link?: string;
    telegram_handle?: string;
  };
}

const projectIdeaFormSchema = z.object({
  submission_type: z.enum(SUBMISSION_TYPES.map(st => st.value) as [SubmissionTypeValue, ...SubmissionTypeValue[]], {
    required_error: "You need to select a submission type.",
  }),
  name: z.string().min(1, { message: "Project/Idea name is required" }),
  description: z.string().min(1, { message: "Project description/idea is required" }),
  contribution_type: z.enum([...CONTRIBUTION_TYPES] as [ContributionTypeValue, ...ContributionTypeValue[]], { // Spread into mutable array
    required_error: "You need to select a contribution type.",
  }),
  flag: z.enum([...FLAG_TYPES] as [FlagTypeValue, ...FlagTypeValue[]], { // Spread into mutable array
    required_error: "You need to select a flag.",
  }),
  benefit_to_zuitzerland: z.string().min(1, { message: "Benefit to Zuitzerland is required" }),
  support_needed: z.string().optional(),
  github_link: z.string().url({ message: "Please enter a valid URL or leave empty" }).optional().or(z.literal('')),
  telegram_handle: z.string().optional(),
});

type ProjectIdeaFormValues = z.infer<typeof projectIdeaFormSchema>;

export function CreateProjectIdeaSheet({ 
  onProjectCreated, 
  userId, 
  isOpen, 
  onOpenChange, 
  editMode = false, 
  projectData 
}: CreateProjectIdeaSheetProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(isOpen || false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { authenticatedSupabase } = useSupabaseJwt();

  // Use either the controlled or uncontrolled open state
  const effectiveIsOpen = isOpen !== undefined ? isOpen : internalIsOpen;
  const effectiveOnOpenChange = onOpenChange || setInternalIsOpen;

  const form = useForm<ProjectIdeaFormValues>({
    resolver: zodResolver(projectIdeaFormSchema),
    defaultValues: editMode && projectData ? {
      submission_type: projectData.submission_type,
      name: projectData.name,
      description: projectData.description,
      contribution_type: projectData.contribution_type,
      flag: projectData.flag,
      benefit_to_zuitzerland: projectData.benefit_to_zuitzerland,
      support_needed: projectData.support_needed || "",
      github_link: projectData.github_link || "",
      telegram_handle: projectData.telegram_handle || "",
    } : {
      submission_type: "project_idea",
      name: "",
      description: "",
      contribution_type: "Tooling",
      flag: "Green",
      benefit_to_zuitzerland: "",
      support_needed: "",
      github_link: "",
      telegram_handle: "",
    },
  });

  // Update form when projectData changes in edit mode
  useEffect(() => {
    if (editMode && projectData) {
      form.reset({
        submission_type: projectData.submission_type,
        name: projectData.name,
        description: projectData.description,
        contribution_type: projectData.contribution_type,
        flag: projectData.flag,
        benefit_to_zuitzerland: projectData.benefit_to_zuitzerland,
        support_needed: projectData.support_needed || "",
        github_link: projectData.github_link || "",
        telegram_handle: projectData.telegram_handle || "",
      });
    }
  }, [editMode, projectData, form]);

  const onSubmit = async (data: ProjectIdeaFormValues) => {
    if (!authenticatedSupabase || !userId) {
      toast({
        title: "Not authenticated",
        description: "Please sign in to submit a project or idea.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      if (editMode && projectData) {
        // Update existing project
        const { error } = await authenticatedSupabase
          .from('zulink_projects')
          .update({
            submission_type: data.submission_type,
            name: data.name,
            description: data.description,
            contribution_type: data.contribution_type,
            flag: data.flag,
            benefit_to_zuitzerland: data.benefit_to_zuitzerland,
            support_needed: data.support_needed || null,
            github_link: data.github_link || null,
            telegram_handle: data.telegram_handle || null,
          })
          .eq('id', projectData.id);

        if (error) {
          throw error;
        }

        toast({
          title: "Project/Idea Updated",
          description: "Your changes have been saved successfully.",
        });
      } else {
        // Create new project
        const projectData: TablesInsert<'zulink_projects'> = {
          profile_id: userId,
          submission_type: data.submission_type,
          name: data.name,
          description: data.description,
          contribution_type: data.contribution_type,
          flag: data.flag,
          benefit_to_zuitzerland: data.benefit_to_zuitzerland,
          support_needed: data.support_needed || null,
          github_link: data.github_link || null,
          telegram_handle: data.telegram_handle || null,
          status: 'pending', // default status
        };
        
        const { error } = await authenticatedSupabase
          .from('zulink_projects')
          .insert(projectData);

        if (error) {
          throw error;
        }

        toast({
          title: "Project/Idea Submitted",
          description: "Your submission has been received and is pending review.",
        });
      }

      form.reset();
      effectiveOnOpenChange(false);
      if (onProjectCreated) {
        onProjectCreated();
      }
    } catch (error) {
      toast({
        title: "Error Submitting",
        description: (error as Error).message || "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // This useEffect will show a toast and close the sheet if it's opened
  // while userId is still not available. Disabling the button makes this less likely.
  useEffect(() => {
    if (effectiveIsOpen && !userId) {
       toast({
        title: "User not identified",
        description: "Please wait a moment or try signing in again. The button will enable once your profile is loaded.",
        variant: "default",
      });
       effectiveOnOpenChange(false); // Close sheet if user is not identified
    }
  }, [effectiveIsOpen, userId, effectiveOnOpenChange]);


  return (
    <Sheet open={effectiveIsOpen} onOpenChange={effectiveOnOpenChange}>
      {!editMode && (
        <SheetTrigger asChild>
          <Button variant="default" disabled={!userId} title={!userId ? "Loading user information..." : "Submit Project or Idea"}>
            <Plus className="h-4 w-4 mr-2" />
            Submit Project or Idea
          </Button>
        </SheetTrigger>
      )}
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{editMode ? "Edit Project or Idea" : "Submit a Project or Idea"}</SheetTitle>
          <SheetDescription>
            {editMode 
              ? "Update your project or idea information."
              : "Share your project or idea with the Zuitzerland community."
            }
          </SheetDescription>
        </SheetHeader>

        <div className="py-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="submission_type"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>What is this?</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-1"
                      >
                        {SUBMISSION_TYPES.map(type => (
                          <FormItem key={type.value} className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value={type.value} />
                            </FormControl>
                            <FormLabel className="font-normal">{type.label}</FormLabel>
                          </FormItem>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter project or idea name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Description / What do you want to build?</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Detailed description of your project or idea..."
                        className="resize-none min-h-[100px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contribution_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type of Contribution</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a contribution type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CONTRIBUTION_TYPES.map(type => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="flag"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Flag <a 
                        href="https://docsend.com/view/gef3utaa236ewney" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-blue-600 hover:underline"
                      >
                        (based on guideline)
                      </a>
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a flag" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {FLAG_TYPES.map(type => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="benefit_to_zuitzerland"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>How will this benefit Zuitzerland?</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Explain the benefits..."
                        className="resize-none min-h-[100px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="support_needed"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Support Needed (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Funding, Mentorship, Collaborators" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="github_link"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>GitHub Link (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="https://github.com/your/project" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="telegram_handle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telegram Handle (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="@your_telegram" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2 pt-4">
                <SheetClose asChild>
                    <Button type="button" variant="outline">Cancel</Button>
                </SheetClose>
                <Button type="submit" disabled={isSubmitting || !userId}>
                  {isSubmitting ? "Submitting..." : editMode ? "Save Changes" : "Submit"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </SheetContent>
    </Sheet>
  );
}

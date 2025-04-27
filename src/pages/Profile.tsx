import { usePrivy } from "@privy-io/react-auth";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Upload, Users, Shield, ChevronRight } from "lucide-react";
import { PageTitle } from "@/components/PageTitle";
import { TeamBadge } from "@/components/TeamBadge";
import HousingPreferencesButton from "@/components/profile/HousingPreferencesButton";
import { Switch } from "@/components/ui/switch";
import { Json } from "@/integrations/supabase/types";

const profileFormSchema = z.object({
  username: z.string().min(3).max(50),
  description: z.string().max(500).optional(),
  opt_in_directory: z.boolean().default(false),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

const Profile = () => {
  const { user } = usePrivy();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [profileData, setProfileData] = useState<Record<string, any> | null>(null);
  const [uploading, setUploading] = useState(false);
  const [team, setTeam] = useState<any>(null);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      username: "",
      description: "",
      opt_in_directory: false,
    },
  });

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) return;

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*, teams:team_id(*)')
          .eq('privy_id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error fetching profile:', error);
          throw error;
        }

        if (data) {
          setProfileData(data);
          setTeam(data.teams);
          form.reset({
            username: data.username || "",
            description: data.description || "",
            opt_in_directory: data.opt_in_directory || false,
          });
        }
      } catch (error) {
        console.error('Error:', error);
        toast({
          title: "Error",
          description: "Failed to load profile data",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.id) {
      fetchProfile();
    }
  }, [user?.id]);

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!user?.id) return;
      setUploading(true);

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const filePath = `${crypto.randomUUID()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('privy_id', user.id);

      if (updateError) {
        throw updateError;
      }

      setProfileData(prev => ({ ...prev, avatar_url: publicUrl }));

      toast({
        title: "Success",
        description: "Avatar updated successfully",
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Error",
        description: "Error uploading avatar",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const updateDirectoryOptIn = async (value: boolean) => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ opt_in_directory: value })
        .eq('privy_id', user.id);

      if (error) {
        throw error;
      }

      const { data: onboardingData } = await supabase
        .from('profiles')
        .select('onboarding_progress')
        .eq('privy_id', user.id)
        .maybeSingle();
      
      if (onboardingData?.onboarding_progress) {
        const updatedProgress = JSON.parse(JSON.stringify(onboardingData.onboarding_progress));
        
        updatedProgress.tasks["8"].completed = value;
        
        if (value) {
          if (!updatedProgress.tasks["8"].completed) {
            updatedProgress.totalCompleted += 1;
          }
        } else {
          if (updatedProgress.tasks["8"].completed) {
            updatedProgress.totalCompleted -= 1;
          }
        }
        
        updatedProgress.lastUpdated = new Date().toISOString();
        
        await supabase
          .from('profiles')
          .update({ 
            onboarding_progress: updatedProgress as unknown as Json 
          })
          .eq('privy_id', user.id);
      }

      setProfileData(prev => prev ? { ...prev, opt_in_directory: value } : null);
      form.setValue("opt_in_directory", value);

      toast({
        title: "Success",
        description: value 
          ? "You've been added to the resident directory" 
          : "You've been removed from the resident directory",
      });
    } catch (error) {
      console.error('Error updating directory status:', error);
      toast({
        title: "Error",
        description: "Failed to update directory status",
        variant: "destructive",
      });
    }
  };

  const onSubmit = async (values: ProfileFormValues) => {
    if (!user?.id) return;

    try {
      const { data: existingProfile, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .eq('privy_id', user.id)
        .maybeSingle();

      if (checkError) {
        console.error('Error checking profile:', checkError);
        throw checkError;
      }

      let profileId;
      if (!existingProfile) {
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            id: crypto.randomUUID(),
            privy_id: user.id,
            email: user.email?.address || null,
            username: values.username,
            description: values.description,
            opt_in_directory: values.opt_in_directory,
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating profile:', createError);
          throw createError;
        }

        profileId = newProfile.id;
        setProfileData(newProfile);
      } else {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            username: values.username,
            description: values.description,
            email: user.email?.address || null,
            opt_in_directory: values.opt_in_directory,
          })
          .eq('privy_id', user.id);

        if (updateError) {
          console.error('Error updating profile:', updateError);
          throw updateError;
        }
        
        const { data: updatedProfile, error: fetchError } = await supabase
          .from('profiles')
          .select('*')
          .eq('privy_id', user.id)
          .maybeSingle();
          
        if (fetchError) {
          console.error('Error fetching updated profile:', fetchError);
          throw fetchError;
        }

        if (updatedProfile) {
          setProfileData(updatedProfile);
        }
      }

      if (existingProfile) {
        const { data: onboardingData } = await supabase
          .from('profiles')
          .select('onboarding_progress')
          .eq('privy_id', user.id)
          .maybeSingle();
        
        if (onboardingData?.onboarding_progress) {
          const updatedProgress = JSON.parse(JSON.stringify(onboardingData.onboarding_progress));
          
          updatedProgress.tasks["8"].completed = values.opt_in_directory;
          
          if (values.opt_in_directory && !updatedProgress.tasks["8"].completed) {
            updatedProgress.totalCompleted += 1;
          } else if (!values.opt_in_directory && updatedProgress.tasks["8"].completed) {
            updatedProgress.totalCompleted -= 1;
          }
          
          updatedProgress.lastUpdated = new Date().toISOString();
          
          await supabase
            .from('profiles')
            .update({ 
              onboarding_progress: updatedProgress as unknown as Json 
            })
            .eq('privy_id', user.id);
        }
      }

      toast({
        title: "Success",
        description: existingProfile ? "Profile updated successfully" : "Profile created successfully",
      });

    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <PageTitle title="Profile" />
        <div className="py-8 px-4 flex-grow">
          <div className="container max-w-4xl mx-auto">
            <div className="animate-pulse">Loading...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <PageTitle 
        title="Profile" 
        description={profileData?.email}
      />
      <div className="py-8 px-4 flex-grow">
        <div className="container max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="flex flex-col md:flex-row md:items-center gap-6 mb-8">
              <div className="relative">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={profileData?.avatar_url} />
                  <AvatarFallback>
                    {profileData?.username?.charAt(0) || profileData?.email?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <label 
                  className="absolute bottom-0 right-0 p-1 bg-white rounded-full shadow-lg cursor-pointer hover:bg-gray-100 transition-colors"
                  htmlFor="avatar-upload"
                >
                  <Upload className="h-4 w-4" />
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={uploadAvatar}
                    disabled={uploading}
                    className="hidden"
                  />
                </label>
              </div>
              <div className="flex flex-col gap-2">
                <h2 className="text-xl font-semibold">
                  {profileData?.username || 'Anonymous User'}
                </h2>
                {profileData?.role && (
                  <p className="text-sm text-primary font-medium capitalize">
                    {profileData.role.replace(/-/g, ' ')}
                  </p>
                )}
                {team && (
                  <div className="flex items-center gap-2 mt-1">
                    <TeamBadge team={team} />
                  </div>
                )}
              </div>
              <div className="ml-auto flex items-center">
                <HousingPreferencesButton 
                  profileId={profileData?.id} 
                  userEmail={profileData?.email}
                  userName={profileData?.username} 
                />
              </div>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input {...field} />
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
                      <FormLabel>About</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder="Tell us a bit about yourself..."
                          className="min-h-[100px]"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="opt_in_directory"
                  render={({ field }) => (
                    <FormItem className="flex flex-col space-y-4">
                      <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Resident Directory
                          </FormLabel>
                          <p className="text-sm text-muted-foreground">
                            Allow other residents to see your profile information in the directory
                          </p>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={(value) => {
                              field.onChange(value);
                              updateDirectoryOptIn(value);
                            }}
                          />
                        </FormControl>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full flex items-center justify-between"
                        onClick={() => navigate('/privacy')}
                      >
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          <span>Advanced Privacy Settings</span>
                        </div>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="w-full bg-hotel-navy hover:bg-hotel-navy/90"
                >
                  Save Changes
                </Button>
              </form>
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;

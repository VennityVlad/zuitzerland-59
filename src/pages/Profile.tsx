
import { usePrivy } from "@privy-io/react-auth";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Upload } from "lucide-react";

const profileFormSchema = z.object({
  username: z.string().min(3).max(50),
  description: z.string().max(500).optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

const Profile = () => {
  const { user } = usePrivy();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [profileData, setProfileData] = useState<any>(null);
  const [uploading, setUploading] = useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      username: "",
      description: "",
    },
  });

  const checkAuthState = async () => {
    console.log('--- Authentication Debug Info ---');
    console.log('Privy User:', user);
    console.log('Privy User ID:', user?.id);
    
    const { data: { session } } = await supabase.auth.getSession();
    console.log('Supabase Session:', session);
    
    if (session) {
      console.log('Supabase User ID:', session.user.id);
      
      const { data, error } = await supabase.rpc('get_auth_context');
      if (error) {
        console.error('Error getting auth context:', error);
      } else {
        console.log('Current auth.uid():', data);
      }
    } else {
      console.log('WARNING: No Supabase session found!');
      console.log('This means:');
      console.log('1. Supabase RLS policies will not work');
      console.log('2. Database operations requiring authentication will fail');
      console.log('3. auth.uid() will return null');
    }

    // Also log the profile data to compare IDs
    if (profileData) {
      console.log('Profile Data:', profileData);
      console.log('Profile privy_id:', profileData.privy_id);
      console.log('Profile supabase_uid:', profileData.supabase_uid);
    }

    toast({
      title: session ? "Authentication Active" : "No Supabase Session",
      description: session 
        ? "Check console for authentication details" 
        : "Warning: No active Supabase session found. Check console for details.",
      variant: session ? "default" : "destructive",
    });
  };

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) return;

      try {
        // First, set the auth context for Supabase
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          await supabase.auth.setSession(session);
        }

        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('privy_id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error fetching profile:', error);
          throw error;
        }

        if (!data) {
          // Create new profile if it doesn't exist
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert({
              id: crypto.randomUUID(),
              privy_id: user.id,
              email: user.email?.address || null,
              username: null,  // This will trigger the generate_username() function
              supabase_uid: session?.user.id // Add the Supabase user ID
            })
            .select()
            .single();

          if (createError) {
            console.error('Error creating profile:', createError);
            throw createError;
          }

          setProfileData(newProfile);
          form.reset({
            username: newProfile.username || "",
            description: newProfile.description || "",
          });
        } else {
          // Update existing profile with Supabase UID if not set
          if (!data.supabase_uid && session?.user.id) {
            const { error: updateError } = await supabase
              .from('profiles')
              .update({ supabase_uid: session.user.id })
              .eq('id', data.id);

            if (updateError) {
              console.error('Error updating supabase_uid:', updateError);
            }
          }

          setProfileData(data);
          form.reset({
            username: data.username || "",
            description: data.description || "",
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

      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await supabase.auth.setSession(session);
      }

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const filePath = `${crypto.randomUUID()}.${fileExt}`;

      console.log('Uploading file to path:', filePath);

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

  const onSubmit = async (values: ProfileFormValues) => {
    if (!user?.id) return;

    try {
      // Set auth context for Supabase
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await supabase.auth.setSession(session);
      }

      console.log('Updating profile with values:', values);
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          username: values.username,
          description: values.description,
          email: user.email?.address || null,
          supabase_uid: session?.user.id // Make sure Supabase UID is set
        })
        .eq('privy_id', user.id);

      if (updateError) {
        console.error('Error updating profile:', updateError);
        throw updateError;
      }

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
      
      // Refresh profile data after update
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
        console.log('Updated profile data:', updatedProfile);
        setProfileData(updatedProfile);
      }
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
      <div className="min-h-screen bg-secondary/30 py-12">
        <div className="container max-w-4xl mx-auto px-4">
          <div className="animate-pulse">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/30 py-12">
      <div className="container max-w-4xl mx-auto px-4">
        <img 
          src="/lovable-uploads/2796594c-9800-4554-b79d-a1da8992c369.png"
          alt="Switzerland Logo"
          className="logo mb-8"
        />
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <h2 className="text-lg font-semibold text-yellow-800 mb-2">Authentication Debug Section</h2>
          <Button 
            onClick={checkAuthState}
            variant="outline"
            className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800"
          >
            Check Authentication State
          </Button>
          <p className="mt-2 text-sm text-yellow-700">
            Click to check authentication status and log details to console
          </p>
          <p className="mt-1 text-xs text-yellow-600">
            Note: If there's no Supabase session, database operations will fail
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex items-center gap-6 mb-8">
            <div className="relative">
              <Avatar className="h-20 w-20">
                <AvatarImage src={profileData?.avatar_url} />
                <AvatarFallback>
                  {profileData?.full_name?.charAt(0) || profileData?.email?.charAt(0)}
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
            <div>
              <h1 className="text-2xl font-semibold text-hotel-navy">
                {profileData?.full_name || 'Your Profile'}
              </h1>
              <p className="text-gray-600">{profileData?.email}</p>
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
  );
};

export default Profile;

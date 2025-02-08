
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

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) return;

      try {
        console.log('Fetching profile for user:', user.id);
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error fetching profile:', error);
          throw error;
        }

        console.log('Profile data:', data);
        if (data) {
          setProfileData(data);
          form.reset({
            username: data.username || "",
            description: data.description || "",
          });
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        toast({
          title: "Error",
          description: "Failed to load profile data",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [user?.id]);

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const filePath = `${user?.id}/${crypto.randomUUID()}.${fileExt}`;

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
        .eq('id', user?.id);

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
      console.log('Updating profile with values:', values);
      const { error } = await supabase
        .from('profiles')
        .update({
          username: values.username,
          description: values.description,
          email: user.email?.address || null,
          full_name: user.google?.name || user.twitter?.username || user.email?.address?.split('@')[0] || null,
        })
        .eq('id', user.id);

      if (error) {
        console.error('Error updating profile:', error);
        throw error;
      }

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
      
      // Refresh profile data after update
      const { data: updatedProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
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

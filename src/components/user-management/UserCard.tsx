
import { useState } from "react";
import { MoreHorizontal, Mail, Edit, Trash, UserCheck, AlertCircle, UserX } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import EditUserDialog from "./EditUserDialog";

type Profile = {
  id: string;
  username: string;
  email: string | null;
  role: "admin" | "co-designer" | "co-curator" | "attendee" | null;
  avatar_url: string | null;
  full_name: string | null;
};

type UserCardProps = {
  profile: Profile;
  onRefresh: () => void;
};

const UserCard = ({ profile, onRefresh }: UserCardProps) => {
  const { toast } = useToast();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showRevokeAccessDialog, setShowRevokeAccessDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRevokingAccess, setIsRevokingAccess] = useState(false);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  const getRoleBadgeColor = (role: string | null) => {
    switch (role) {
      case 'admin':
        return 'bg-red-500 hover:bg-red-600';
      case 'co-designer':
        return 'bg-blue-500 hover:bg-blue-600';
      case 'co-curator':
        return 'bg-green-500 hover:bg-green-600';
      case 'attendee':
        return 'bg-purple-500 hover:bg-purple-600';
      default:
        return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  const handleDeleteUser = async () => {
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', profile.id);

      if (error) throw error;

      toast({
        title: "User deleted",
        description: `${profile.username || profile.email} has been removed`,
      });
      
      onRefresh();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleRevokeAccess = async () => {
    if (!profile.email) {
      toast({
        title: "Error",
        description: "No email address found for this user",
        variant: "destructive",
      });
      return;
    }

    setIsRevokingAccess(true);
    try {
      const { data, error } = await supabase.functions.invoke("revoke-privy-access", {
        body: { email: profile.email }
      });

      if (error) throw error;

      toast({
        title: "Access revoked",
        description: `${profile.email} has been permanently removed from Privy and can no longer access the application`,
      });
      
      onRefresh();
    } catch (error) {
      console.error('Error revoking access:', error);
      toast({
        title: "Error",
        description: "Failed to revoke user access",
        variant: "destructive",
      });
    } finally {
      setIsRevokingAccess(false);
      setShowRevokeAccessDialog(false);
    }
  };

  return (
    <>
      <Card className="overflow-hidden hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src={profile.avatar_url || undefined} />
                <AvatarFallback>
                  {profile.full_name 
                    ? getInitials(profile.full_name) 
                    : profile.username?.substring(0, 2).toUpperCase() || '??'}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-medium">
                  {profile.full_name || profile.username || 'Unnamed User'}
                </h3>
                <p className="text-sm text-muted-foreground">@{profile.username}</p>
              </div>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {profile.email && (
                  <DropdownMenuItem onClick={() => window.location.href = `mailto:${profile.email}`}>
                    <Mail className="mr-2 h-4 w-4" />
                    Email user
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit user
                </DropdownMenuItem>
                {profile.email && (
                  <DropdownMenuItem 
                    onClick={() => setShowRevokeAccessDialog(true)} 
                    className="text-amber-600"
                  >
                    <UserX className="mr-2 h-4 w-4" />
                    Revoke access
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem 
                  className="text-red-600" 
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash className="mr-2 h-4 w-4" />
                  Delete user
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          <div className="mt-4">
            {profile.email && (
              <p className="text-sm flex items-center mt-2">
                <Mail className="h-4 w-4 mr-2 text-gray-400" />
                {profile.email}
              </p>
            )}
          </div>
          
          <div className="flex items-center mt-4">
            {profile.role ? (
              <Badge className={getRoleBadgeColor(profile.role)} variant="secondary">
                <UserCheck className="h-3 w-3 mr-1" />
                {profile.role}
              </Badge>
            ) : (
              <Badge variant="outline" className="text-amber-500 border-amber-500">
                <AlertCircle className="h-3 w-3 mr-1" />
                No role
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the user "{profile.username || profile.email}".
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteUser} 
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showRevokeAccessDialog} onOpenChange={setShowRevokeAccessDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke User Access?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the user "{profile.email}" from Privy.
              The user will be immediately logged out and will not be able to log back in.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRevokingAccess}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleRevokeAccess} 
              disabled={isRevokingAccess}
              className="bg-amber-500 hover:bg-amber-600"
            >
              {isRevokingAccess ? "Revoking Access..." : "Revoke Access"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <EditUserDialog 
        open={showEditDialog} 
        onOpenChange={setShowEditDialog} 
        profile={profile}
        onUserUpdated={onRefresh}
      />
    </>
  );
};

export default UserCard;

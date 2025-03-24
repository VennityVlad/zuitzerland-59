
import { useState } from "react";
import { Edit, Trash, MoreHorizontal, Users } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import EditTeamDialog from "./EditTeamDialog";
import TeamMembersDialog from "./TeamMembersDialog";

type Team = {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
};

type TeamCardProps = {
  team: Team;
  onRefresh: () => void;
};

const TeamCard = ({ team, onRefresh }: TeamCardProps) => {
  const { toast } = useToast();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showMembersDialog, setShowMembersDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [memberCount, setMemberCount] = useState<number | null>(null);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };
  
  const fetchMemberCount = async () => {
    try {
      const { count, error } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('team_id', team.id);

      if (error) throw error;
      setMemberCount(count || 0);
    } catch (error) {
      console.error('Error fetching member count:', error);
    }
  };
  
  // Fetch member count when component mounts
  useState(() => {
    fetchMemberCount();
  });

  const handleDeleteTeam = async () => {
    setIsDeleting(true);
    try {
      // First, remove all team associations from profiles
      const { error: profilesError } = await supabase
        .from('profiles')
        .update({ team_id: null })
        .eq('team_id', team.id);

      if (profilesError) throw profilesError;
      
      // Then delete the team
      const { error } = await supabase
        .from('teams')
        .delete()
        .eq('id', team.id);

      if (error) throw error;

      toast({
        title: "Team deleted",
        description: `${team.name} has been removed`,
      });
      
      onRefresh();
    } catch (error) {
      console.error('Error deleting team:', error);
      toast({
        title: "Error",
        description: "Failed to delete team",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  return (
    <>
      <Card className="overflow-hidden hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src={team.logo_url || undefined} />
                <AvatarFallback>
                  {getInitials(team.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-medium">{team.name}</h3>
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
                <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit team
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="text-red-600" 
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash className="mr-2 h-4 w-4" />
                  Delete team
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          <div className="mt-4">
            {team.description && (
              <p className="text-sm text-gray-600">{team.description}</p>
            )}
          </div>
          
          <div className="flex items-center mt-4">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center gap-1"
              onClick={() => setShowMembersDialog(true)}
            >
              <Users className="h-4 w-4" />
              <span>View Members</span>
              {memberCount !== null && memberCount > 0 && (
                <span className="ml-1 text-xs bg-primary/20 text-primary rounded-full px-2 py-0.5">
                  {memberCount}
                </span>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the team "{team.name}".
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteTeam} 
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <EditTeamDialog 
        open={showEditDialog} 
        onOpenChange={setShowEditDialog} 
        team={team}
        onTeamUpdated={onRefresh}
      />
      
      <TeamMembersDialog
        open={showMembersDialog}
        onOpenChange={setShowMembersDialog}
        team={team}
        onMembersUpdated={() => {
          fetchMemberCount();
          onRefresh();
        }}
      />
    </>
  );
};

export default TeamCard;


import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, ThumbsUp, ThumbsDown, Edit3, CheckCircle, XCircle, Settings2 } from "lucide-react";
import { Tables } from '@/integrations/supabase/types'; // Will be auto-generated
import { useSupabaseJwt } from "@/components/SupabaseJwtProvider";
import { toast } from "@/hooks/use-toast";

type ZulinkProject = Tables<'zulink_projects'>;
type ZulinkProjectStatus = ZulinkProject['status']; // 'pending' | 'approved' | 'rejected' | 'implemented'

interface ProjectIdeaCardProps extends ZulinkProject {
  isAdmin: boolean;
  currentUserId?: string;
  onStatusUpdate?: () => void;
}

export function ProjectIdeaCard({
  id,
  name,
  description,
  submission_type,
  contribution_type,
  flag,
  benefit_to_zuitzerland,
  support_needed,
  github_link,
  telegram_handle,
  status,
  created_at,
  profile_id,
  isAdmin,
  currentUserId,
  onStatusUpdate,
}: ProjectIdeaCardProps) {
  const { authenticatedSupabase } = useSupabaseJwt();

  const handleStatusChange = async (newStatus: ZulinkProjectStatus) => { // Updated type to include 'pending'
    if (!authenticatedSupabase || !isAdmin) return;

    try {
      const { error } = await authenticatedSupabase
        .from('zulink_projects')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
      toast({ title: "Status Updated", description: `Project "${name}" has been ${newStatus}.` });
      if (onStatusUpdate) onStatusUpdate();
    } catch (error) {
      console.error("Error updating status:", error);
      toast({ title: "Error", description: "Failed to update status.", variant: "destructive" });
    }
  };

  const isOwner = profile_id === currentUserId;

  const getStatusBadgeVariant = (currentStatus: ZulinkProjectStatus): "default" | "destructive" | "outline" | "secondary" => {
    switch (currentStatus) {
      case 'approved': return 'default'; // Was 'success'
      case 'implemented': return 'default'; // Was 'success'
      case 'rejected': return 'destructive';
      case 'pending': return 'secondary';
      default: return 'outline';
    }
  };
  
  const formattedDate = new Date(created_at).toLocaleDateString();

  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{name}</CardTitle>
          <Badge variant={getStatusBadgeVariant(status)} className="capitalize">{status}</Badge>
        </div>
        <CardDescription className="text-xs text-gray-500">
          Submitted on {formattedDate}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow space-y-3">
        <p className="text-sm text-muted-foreground line-clamp-3">{description}</p>
        <div>
          <h4 className="font-semibold text-xs mb-1">Type:</h4>
          <Badge variant="outline" className="capitalize">{submission_type.replace('_', ' ')}</Badge>
        </div>
        <div>
          <h4 className="font-semibold text-xs mb-1">Contribution:</h4>
          <Badge variant="outline">{contribution_type}</Badge>
        </div>
        <div>
          <h4 className="font-semibold text-xs mb-1">Flag:</h4>
          <Badge variant="outline" style={{ 
            backgroundColor: flag === 'Green' ? 'hsl(var(--green-badge))' : flag === 'Yellow' ? 'hsl(var(--yellow-badge))' : 'hsl(var(--grey-badge))',
            color: flag === 'Yellow' ? 'hsl(var(--foreground))' : 'hsl(var(--background))'
            }}>
            {flag}
          </Badge>
        </div>
        <div>
          <h4 className="font-semibold text-xs mb-1">Benefit to Zuitzerland:</h4>
          <p className="text-sm text-muted-foreground line-clamp-2">{benefit_to_zuitzerland}</p>
        </div>
        {support_needed && (
          <div>
            <h4 className="font-semibold text-xs mb-1">Support Needed:</h4>
            <p className="text-sm text-muted-foreground">{support_needed}</p>
          </div>
        )}
        {telegram_handle && (
          <p className="text-xs text-gray-500">TG: {telegram_handle}</p>
        )}
      </CardContent>
      <CardFooter className="flex flex-col items-start gap-2 pt-4"> {/* Corrected gap-2_ to gap-2 */}
        {github_link && (
          <Button variant="outline" size="sm" asChild className="w-full">
            <a href={github_link} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" /> GitHub
            </a>
          </Button>
        )}
        {isAdmin && status === 'pending' && (
          <div className="flex gap-2 w-full">
            <Button variant="default" size="sm" onClick={() => handleStatusChange('approved')} className="flex-1"> {/* Was 'success' */}
              <ThumbsUp className="h-4 w-4 mr-2" /> Approve
            </Button>
            <Button variant="destructive" size="sm" onClick={() => handleStatusChange('rejected')} className="flex-1">
              <ThumbsDown className="h-4 w-4 mr-2" /> Reject
            </Button>
          </div>
        )}
        {isAdmin && status === 'approved' && (
            <Button variant="secondary" size="sm" onClick={() => handleStatusChange('implemented')} className="w-full">
                <CheckCircle className="h-4 w-4 mr-2" /> Mark as Implemented
            </Button>
        )}
        {isAdmin && status === 'rejected' && (
             <Button variant="outline" size="sm" onClick={() => handleStatusChange('pending')} className="w-full">
                <Settings2 className="h-4 w-4 mr-2" /> Re-evaluate (Set to Pending)
            </Button>
        )}
        {/* Placeholder for edit functionality for owners or admins */}
        {/* {(isAdmin || isOwner) && (
          <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground">
            <Edit3 className="h-4 w-4 mr-2" /> Edit (coming soon)
          </Button>
        )} */}
      </CardFooter>
    </Card>
  );
}
// Add some CSS vars for badge colors (can be added to index.css or a global style sheet)
// :root {
//   --green-badge: 142.1 76.2% 36.3%; /* Example green */
//   --yellow-badge: 47.9 95.8% 53.1%; /* Example yellow */
//   --grey-badge: 215.4 16.3% 56.9%; /* Example grey */
// }


import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Check, X, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { useSupabaseJwt } from "@/components/SupabaseJwtProvider";
import { toast } from "@/hooks/use-toast";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export interface AppCardProps {
  id: string;
  name: string;
  url: string;
  description: string | null;
  imageUrl: string | null;
  status: string;
  isAdmin: boolean;
  createdBy: string;
  onStatusUpdate?: () => void;
}

export function AppCard({
  id,
  name,
  url,
  description,
  imageUrl,
  status,
  isAdmin,
  createdBy,
  onStatusUpdate,
}: AppCardProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const { authenticatedSupabase } = useSupabaseJwt();

  const handleApprove = async () => {
    if (!isAdmin || !authenticatedSupabase) return;
    
    setIsUpdating(true);
    try {
      const { error } = await authenticatedSupabase
        .from('zulink_apps')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) {
        throw error;
      }

      toast({
        title: "App approved",
        description: "The app is now available in the App Store",
      });

      if (onStatusUpdate) {
        onStatusUpdate();
      }
    } catch (error) {
      console.error("Error approving app:", error);
      toast({
        title: "Error approving app",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleReject = async () => {
    if (!isAdmin || !authenticatedSupabase) return;
    
    setIsUpdating(true);
    try {
      const { error } = await authenticatedSupabase
        .from('zulink_apps')
        .update({
          status: 'rejected',
        })
        .eq('id', id);

      if (error) {
        throw error;
      }

      toast({
        title: "App rejected",
        description: "The app submission has been rejected",
      });

      if (onStatusUpdate) {
        onStatusUpdate();
      }
    } catch (error) {
      console.error("Error rejecting app:", error);
      toast({
        title: "Error rejecting app",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const isPending = status === 'pending';
  
  // Determine if description should be truncated
  const shouldTruncateDescription = description && description.length > 100;

  return (
    <Card className="overflow-hidden flex flex-col h-full">
      <div className="relative h-40 flex-shrink-0 overflow-hidden bg-gray-100">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-gray-200 dark:bg-gray-800">
            <span className="text-gray-500">{name.charAt(0).toUpperCase()}</span>
          </div>
        )}
        
        {isPending && isAdmin && (
          <div className="absolute top-2 right-2">
            <Badge variant="secondary" className="bg-yellow-200 text-yellow-800">Pending Review</Badge>
          </div>
        )}
      </div>

      <CardHeader className="pb-2">
        <CardTitle className="text-lg leading-tight">{name}</CardTitle>
        
        {/* Description with expand/collapse functionality - updated positioning */}
        {description && (
          <Collapsible 
            open={isDescriptionExpanded} 
            onOpenChange={setIsDescriptionExpanded}
            className="pt-1" 
          >
            {/* For collapsed state: show truncated text with "See more" at the end */}
            {!isDescriptionExpanded && (
              <div className="text-sm text-muted-foreground">
                {shouldTruncateDescription ? (
                  <>
                    {description.substring(0, 100)}...
                    <CollapsibleTrigger asChild>
                      <Button 
                        variant="link" 
                        size="sm" 
                        className="p-0 h-auto text-primary hover:text-primary/80 ml-1"
                      >
                        <span className="flex items-center">See more <ChevronDown className="h-3 w-3 ml-1" /></span>
                      </Button>
                    </CollapsibleTrigger>
                  </>
                ) : (
                  description
                )}
              </div>
            )}
            
            {/* For expanded state: show full text with "See less" at the bottom */}
            <CollapsibleContent className="text-sm text-muted-foreground">
              {description}
              {shouldTruncateDescription && (
                <div className="mt-2">
                  <CollapsibleTrigger asChild>
                    <Button 
                      variant="link" 
                      size="sm" 
                      className="p-0 h-auto text-primary hover:text-primary/80"
                    >
                      <span className="flex items-center">See less <ChevronUp className="h-3 w-3 ml-1" /></span>
                    </Button>
                  </CollapsibleTrigger>
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>
        )}
      </CardHeader>

      <CardContent className="flex-grow">
        {/* Content can be expanded later */}
      </CardContent>

      <CardFooter className="flex flex-col gap-2 pt-0">
        <Button asChild className="w-full" variant="default">
          <a href={url} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4 mr-2" />
            Open App
          </a>
        </Button>

        {isAdmin && isPending && (
          <div className="flex gap-2 w-full">
            <Button 
              onClick={handleApprove} 
              variant="outline" 
              className="flex-1 border-green-200 hover:bg-green-50 text-green-700"
              disabled={isUpdating}
            >
              <Check className="h-4 w-4 mr-2" />
              Approve
            </Button>
            <Button 
              onClick={handleReject} 
              variant="outline"
              className="flex-1 border-red-200 hover:bg-red-50 text-red-700"
              disabled={isUpdating}
            >
              <X className="h-4 w-4 mr-2" />
              Reject
            </Button>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}

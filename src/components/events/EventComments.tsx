
import React, { useState, useEffect } from "react";
import { User2, Trash2, Send, Edit, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { useSupabaseJwt } from "@/components/SupabaseJwtProvider";

interface Comment {
  id: string;
  content: string;
  created_at: string;
  updated_at: string;
  profiles: {
    id: string;
    username: string | null;
    avatar_url: string | null;
  };
}

interface EventCommentsProps {
  eventId: string;
  profileId: string | undefined;
}

export const EventComments: React.FC<EventCommentsProps> = ({ eventId, profileId }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const { toast } = useToast();
  const { authenticatedSupabase, isAuthenticated } = useSupabaseJwt();

  // Fetch comments
  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from("event_comments")
        .select(`
          id, 
          content, 
          created_at, 
          updated_at,
          profiles:profile_id (id, username, avatar_url)
        `)
        .eq("event_id", eventId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      
      setComments(data || []);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching comments:", error);
      setLoading(false);
    }
  };

  // Initial fetch of comments
  useEffect(() => {
    if (eventId) {
      fetchComments();
    }
  }, [eventId]);

  // Subscribe to real-time updates for comments
  useEffect(() => {
    if (!eventId) return;
    
    // Subscribe to comment changes
    const channel = supabase
      .channel('event_comments_channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'event_comments',
          filter: `event_id=eq.${eventId}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE' || payload.eventType === 'DELETE') {
            fetchComments(); // Refresh comments when changes occur
          }
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId]);

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !profileId) return;

    setSubmitting(true);
    try {
      const commentData = {
        event_id: eventId,
        profile_id: profileId,
        content: newComment.trim()
      };

      // Try with authenticated client first, fallback to regular client
      const client = (authenticatedSupabase && isAuthenticated) ? authenticatedSupabase : supabase;
      
      const { error } = await client
        .from("event_comments")
        .insert(commentData);

      if (error) throw error;
      
      // Clear the input immediately
      setNewComment("");
      
      toast({
        title: "Comment added",
        description: "Your comment has been added successfully."
      });
      
      // The real-time subscription will update the comments list
    } catch (error: any) {
      console.error("Error adding comment:", error);
      
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to add your comment: ${error?.message || "Unknown error"}`
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateComment = async (commentId: string) => {
    if (!editingContent.trim() || !profileId) return;
    
    try {
      const { error } = await supabase
        .from("event_comments")
        .update({ content: editingContent.trim() })
        .eq("id", commentId)
        .eq("profile_id", profileId);

      if (error) throw error;
      
      setEditingCommentId(null);
      setEditingContent("");
      
      toast({
        title: "Comment updated",
        description: "Your comment has been updated successfully."
      });
      
      // The real-time subscription will update the UI
    } catch (error) {
      console.error("Error updating comment:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update your comment. Please try again."
      });
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!profileId) return;
    
    try {
      const { error } = await supabase
        .from("event_comments")
        .delete()
        .eq("id", commentId)
        .eq("profile_id", profileId);

      if (error) throw error;
      
      toast({
        title: "Comment deleted",
        description: "Your comment has been deleted successfully."
      });
      
      // The real-time subscription will update the UI
    } catch (error) {
      console.error("Error deleting comment:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete your comment. Please try again."
      });
    }
  };

  const startEditing = (comment: Comment) => {
    setEditingCommentId(comment.id);
    setEditingContent(comment.content);
  };

  const cancelEditing = () => {
    setEditingCommentId(null);
    setEditingContent("");
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch (e) {
      return "recently";
    }
  };

  const getInitials = (username: string | null) => {
    if (!username) return "?";
    return username.substring(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold mb-4">Comments</h3>
      
      {loading ? (
        <div className="text-center py-4 text-muted-foreground">Loading comments...</div>
      ) : (
        <>
          {comments.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">No comments yet. Be the first to comment!</div>
          ) : (
            <div className="space-y-3">
              {comments.map((comment) => (
                <Card key={comment.id} className="p-4">
                  <div className="flex items-start space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={comment.profiles?.avatar_url || ""} alt={comment.profiles?.username || "User"} />
                      <AvatarFallback>{getInitials(comment.profiles?.username)}</AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{comment.profiles?.username || "Anonymous"}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatTimestamp(comment.created_at)}
                            {comment.updated_at !== comment.created_at && 
                              " (edited " + formatTimestamp(comment.updated_at) + ")"}
                          </p>
                        </div>
                        
                        {profileId === comment.profiles?.id && (
                          <div className="flex space-x-2">
                            {editingCommentId !== comment.id ? (
                              <>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => startEditing(comment)}
                                  aria-label="Edit comment"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => handleDeleteComment(comment.id)}
                                  aria-label="Delete comment"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            ) : (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={cancelEditing}
                                aria-label="Cancel editing"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {editingCommentId === comment.id ? (
                        <div className="mt-2 space-y-2">
                          <Textarea 
                            value={editingContent}
                            onChange={(e) => setEditingContent(e.target.value)}
                            className="w-full"
                            rows={3}
                          />
                          <div className="flex justify-end space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={cancelEditing}
                            >
                              Cancel
                            </Button>
                            <Button 
                              size="sm" 
                              onClick={() => handleUpdateComment(comment.id)}
                              disabled={!editingContent.trim()}
                            >
                              Update
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <p className="mt-1">{comment.content}</p>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
          
          {profileId ? (
            <div className="mt-6">
              <div className="flex items-start space-x-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback><User2 className="h-5 w-5" /></AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2">
                  <Textarea
                    placeholder="Write a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="w-full resize-none"
                    rows={3}
                  />
                  <div className="flex justify-end">
                    <Button 
                      onClick={handleSubmitComment} 
                      disabled={submitting || !newComment.trim()}
                    >
                      <Send className="mr-2 h-4 w-4" />
                      {submitting ? "Posting..." : "Post Comment"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              Sign in to leave a comment
            </div>
          )}
        </>
      )}
    </div>
  );
};

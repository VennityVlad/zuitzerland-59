import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { IssueReport, IssueStatus } from "@/types/issue";
import { 
  AlertCircle, Clock, CheckCircle, RotateCw, XCircle, ChevronLeft,
  Search, User, AlertTriangle, MapPin, FileText, MessageSquare, 
  Edit, Trash2
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'submitted':
      return <Clock className="h-5 w-5 text-blue-500" />;
    case 'in_review':
      return <Search className="h-5 w-5 text-amber-500" />;
    case 'in_progress':
      return <RotateCw className="h-5 w-5 text-purple-500" />;
    case 'resolved':
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    case 'closed':
      return <XCircle className="h-5 w-5 text-gray-500" />;
    default:
      return <AlertCircle className="h-5 w-5 text-gray-500" />;
  }
};

const getSeverityIcon = (severity: string) => {
  switch (severity) {
    case 'minor':
      return <AlertCircle className="h-5 w-5 text-blue-500" />;
    case 'moderate':
      return <AlertTriangle className="h-5 w-5 text-amber-500" />;
    case 'urgent':
      return <AlertTriangle className="h-5 w-5 text-red-500" />;
    default:
      return <AlertCircle className="h-5 w-5 text-gray-500" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'submitted':
      return "bg-blue-100 text-blue-800";
    case 'in_review':
      return "bg-amber-100 text-amber-800";
    case 'in_progress':
      return "bg-purple-100 text-purple-800";
    case 'resolved':
      return "bg-green-100 text-green-800";
    case 'closed':
      return "bg-gray-100 text-gray-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  }).format(date);
};

const getCategoryLabel = (category: string) => {
  const labels: Record<string, string> = {
    'technical': 'Technical Issue',
    'interpersonal': 'Interpersonal Conflict',
    'safety': 'Safety Concern',
    'resource': 'Resource Issue',
    'feedback': 'Feedback',
    'other': 'Other',
  };
  return labels[category] || category;
};

const getLocationLabel = (location: string) => {
  const labels: Record<string, string> = {
    'common_areas': 'Common Areas',
    'tent_cabin': 'Tent/Cabin',
    'event_venue': 'Event Venue',
    'not_sure': 'Not Sure',
    'other': 'Other',
  };
  return labels[location] || location;
};

const getSeverityLabel = (severity: string) => {
  const labels: Record<string, string> = {
    'minor': 'Minor',
    'moderate': 'Moderate',
    'urgent': 'Urgent',
  };
  return labels[severity] || severity;
};

const IssueDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [issue, setIssue] = useState<IssueReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<IssueStatus>("submitted");
  const [newComment, setNewComment] = useState("");
  const [comments, setComments] = useState<any[]>([]);
  const [attachments, setAttachments] = useState<any[]>([]);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      fetchIssue(id);
      fetchComments(id);
      fetchAttachments(id);
    }
  }, [id]);

  const fetchIssue = async (issueId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("issue_reports")
        .select("*")
        .eq("id", issueId)
        .single();

      if (error) throw error;
      
      setIssue(data as IssueReport);
      setStatus(data.status);
    } catch (error) {
      console.error("Error fetching issue:", error);
      toast({
        title: "Error loading issue",
        description: "Failed to load issue details. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async (issueId: string) => {
    try {
      const { data, error } = await supabase
        .from("issue_comments")
        .select(`
          *,
          profiles:profile_id (
            full_name,
            avatar_url,
            role
          )
        `)
        .eq("issue_id", issueId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      
      setComments(data || []);
    } catch (error) {
      console.error("Error fetching comments:", error);
    }
  };

  const fetchAttachments = async (issueId: string) => {
    try {
      const { data, error } = await supabase
        .from("issue_attachments")
        .select("*")
        .eq("issue_id", issueId);

      if (error) throw error;
      
      setAttachments(data || []);
    } catch (error) {
      console.error("Error fetching attachments:", error);
    }
  };

  const handleStatusChange = async () => {
    if (!issue || status === issue.status) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from("issue_reports")
        .update({ 
          status: status as IssueStatus,
          updated_at: new Date().toISOString()
        })
        .eq("id", issue.id);

      if (error) throw error;
      
      setIssue({
        ...issue,
        status: status as IssueStatus,
        updated_at: new Date().toISOString()
      });
      
      toast({
        title: "Status updated",
        description: `Issue status updated to ${status}`,
      });
      
      // Add system comment about the status change
      await supabase
        .from("issue_comments")
        .insert({
          issue_id: issue.id,
          comment: `Status changed to ${status}`,
          is_anonymous: false,
          profile_id: null // System comment
        });
      
      fetchComments(issue.id);
    } catch (error) {
      console.error("Error updating status:", error);
      toast({
        title: "Error updating status",
        description: "Failed to update issue status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAddComment = async () => {
    if (!issue || !newComment.trim()) return;
    
    try {
      const { error } = await supabase
        .from("issue_comments")
        .insert({
          issue_id: issue.id,
          comment: newComment,
          is_anonymous: false,
          profile_id: null // For now, assign null or get the current user ID
        });

      if (error) throw error;
      
      setNewComment("");
      fetchComments(issue.id);
      
      toast({
        title: "Comment added",
        description: "Your comment has been added to the issue",
      });
    } catch (error) {
      console.error("Error adding comment:", error);
      toast({
        title: "Error adding comment",
        description: "Failed to add comment. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteIssue = async () => {
    if (!issue) return;
    
    try {
      // Delete attachments from storage
      for (const attachment of attachments) {
        await supabase
          .storage
          .from('issue_attachments')
          .remove([attachment.file_path]);
      }
      
      // The issue record and related comments/attachments will be deleted 
      // automatically due to ON DELETE CASCADE
      const { error } = await supabase
        .from("issue_reports")
        .delete()
        .eq("id", issue.id);

      if (error) throw error;
      
      toast({
        title: "Issue deleted",
        description: "The issue has been permanently deleted",
      });
      
      navigate("/issues");
    } catch (error) {
      console.error("Error deleting issue:", error);
      toast({
        title: "Error deleting issue",
        description: "Failed to delete the issue. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const downloadAttachment = async (filePath: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('issue_attachments')
        .download(filePath);
        
      if (error) throw error;
      
      // Create a blob from the data
      const blob = new Blob([data]);
      const url = URL.createObjectURL(blob);
      
      // Create a link and click it to download
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.click();
      
      // Clean up
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading attachment:", error);
      toast({
        title: "Error downloading file",
        description: "Failed to download the attachment. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin">
          <RotateCw className="h-8 w-8 text-gray-400" />
        </div>
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <AlertCircle className="h-16 w-16 text-gray-400 mb-4" />
        <h3 className="font-medium text-lg">Issue not found</h3>
        <p className="text-muted-foreground mt-2">The issue you're looking for doesn't exist or has been deleted</p>
        <Button 
          variant="link" 
          className="mt-4"
          onClick={() => navigate("/issues")}
        >
          Back to Issues
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Button 
          variant="outline" 
          className="gap-2"
          onClick={() => navigate("/issues")}
        >
          <ChevronLeft className="h-4 w-4" /> Back to Issues
        </Button>
        
        <div className="flex gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="gap-2 text-red-600">
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the issue
                  and all associated comments and attachments.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteIssue} className="bg-red-600">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl">{issue.title}</CardTitle>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="font-normal">
                      {getCategoryLabel(issue.category)}
                    </Badge>
                    <Badge className={`flex items-center gap-1 ${getStatusColor(issue.status)}`}>
                      {getStatusIcon(issue.status)}
                      {issue.status.charAt(0).toUpperCase() + issue.status.slice(1)}
                    </Badge>
                    {issue.severity && (
                      <Badge variant="outline" className="gap-1 flex items-center font-normal">
                        {getSeverityIcon(issue.severity)}
                        {getSeverityLabel(issue.severity)}
                      </Badge>
                    )}
                    {issue.is_anonymous && (
                      <Badge variant="secondary">Anonymous</Badge>
                    )}
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  <div>Reported: {formatDate(issue.created_at)}</div>
                  <div>Updated: {formatDate(issue.updated_at)}</div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {issue.details && (
                <div className="prose max-w-none">
                  <h3 className="text-base font-medium">Details</h3>
                  <p className="whitespace-pre-wrap">{issue.details}</p>
                </div>
              )}
              
              {(issue.location || issue.location_detail) && (
                <div>
                  <h3 className="text-base font-medium mb-2">Location</h3>
                  <div className="flex items-start gap-2">
                    <MapPin className="h-5 w-5 text-gray-500 mt-0.5" />
                    <div>
                      {issue.location && (
                        <div>{getLocationLabel(issue.location)}</div>
                      )}
                      {issue.location_detail && (
                        <div className="text-muted-foreground">{issue.location_detail}</div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              {attachments.length > 0 && (
                <div>
                  <h3 className="text-base font-medium mb-2">Attachments</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {attachments.map((attachment) => {
                      const fileName = attachment.file_path.split('/').pop();
                      const isImage = attachment.file_type.startsWith('image/');
                      const publicUrl = supabase.storage.from('issue_attachments').getPublicUrl(attachment.file_path).data.publicUrl;
                      
                      return (
                        <Card 
                          key={attachment.id} 
                          className="overflow-hidden"
                          onClick={() => downloadAttachment(attachment.file_path, fileName)}
                        >
                          {isImage ? (
                            <div className="aspect-video bg-gray-100 flex items-center justify-center overflow-hidden">
                              <img 
                                src={publicUrl}
                                alt="Attachment preview"
                                className="object-cover w-full h-full"
                              />
                            </div>
                          ) : (
                            <div className="aspect-video bg-gray-100 flex items-center justify-center">
                              <FileText className="h-10 w-10 text-gray-400" />
                            </div>
                          )}
                          <div className="p-2 text-sm truncate">{fileName}</div>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageSquare className="h-5 w-5" /> Comments
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                {comments.length > 0 ? (
                  comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3">
                      <div className="flex-shrink-0 mt-1">
                        {comment.profile_id ? (
                          comment.profiles?.avatar_url ? (
                            <img 
                              src={comment.profiles.avatar_url} 
                              alt="Profile" 
                              className="h-8 w-8 rounded-full"
                            />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <User className="h-4 w-4 text-primary" />
                            </div>
                          )
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                            <MessageSquare className="h-4 w-4 text-gray-500" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {comment.profile_id 
                              ? (comment.profiles?.full_name || 'User') 
                              : 'System'}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(comment.created_at)}
                          </span>
                        </div>
                        <p className="text-sm">{comment.comment}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No comments yet
                  </div>
                )}
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <Textarea
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={3}
                />
                <div className="flex justify-end">
                  <Button 
                    onClick={handleAddComment} 
                    disabled={!newComment.trim()}
                  >
                    Add Comment
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Issue Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Status</h3>
                <div className="flex gap-3 items-center">
                  <Select
                    value={status}
                    onValueChange={(value: IssueStatus) => setStatus(value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="submitted">Submitted</SelectItem>
                      <SelectItem value="in_review">In Review</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button 
                    onClick={handleStatusChange} 
                    disabled={saving || status === issue.status}
                    size="sm"
                  >
                    Save
                  </Button>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Reference</h3>
                <div className="space-y-2">
                  <div className="text-sm">
                    <span className="font-medium">Tracking Code:</span>
                    <div className="bg-gray-100 px-2 py-1 mt-1 rounded">
                      <code className="text-xs">{issue.tracking_code}</code>
                    </div>
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Issue ID:</span>
                    <div className="bg-gray-100 px-2 py-1 mt-1 rounded">
                      <code className="text-xs break-all">{issue.id}</code>
                    </div>
                  </div>
                </div>
              </div>
              
              {!issue.is_anonymous && issue.contact_info && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Contact Information</h3>
                    {issue.contact_info.name && (
                      <div className="text-sm">
                        <span className="font-medium">Name:</span>{" "}
                        {issue.contact_info.name}
                      </div>
                    )}
                    {issue.contact_info.email && (
                      <div className="text-sm">
                        <span className="font-medium">Email:</span>{" "}
                        <a
                          href={`mailto:${issue.contact_info.email}`}
                          className="text-blue-600 hover:underline"
                        >
                          {issue.contact_info.email}
                        </a>
                      </div>
                    )}
                    {issue.contact_info.telegram && (
                      <div className="text-sm">
                        <span className="font-medium">Telegram:</span>{" "}
                        {issue.contact_info.telegram}
                      </div>
                    )}
                    {issue.contact_info.preferred_contact_method && (
                      <div className="text-sm">
                        <span className="font-medium">Preferred Method:</span>{" "}
                        {issue.contact_info.preferred_contact_method}
                      </div>
                    )}
                    {issue.contact_info.preferred_contact_time && (
                      <div className="text-sm">
                        <span className="font-medium">Preferred Time:</span>{" "}
                        {issue.contact_info.preferred_contact_time}
                      </div>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default IssueDetail;

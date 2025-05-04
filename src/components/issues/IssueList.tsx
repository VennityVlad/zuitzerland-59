
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { IssueReport } from "@/types/issue";
import { Search, Filter, RefreshCw, AlertCircle, Clock, CheckCircle, RotateCw, XCircle } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'technical':
      return "bg-gray-100 text-gray-800";
    case 'interpersonal':
      return "bg-yellow-100 text-yellow-800";
    case 'safety':
      return "bg-red-100 text-red-800";
    case 'resource':
      return "bg-green-100 text-green-800";
    case 'feedback':
      return "bg-blue-100 text-blue-800";
    case 'other':
      return "bg-purple-100 text-purple-800";
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

const IssueList = () => {
  const [issues, setIssues] = useState<IssueReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchIssues();
  }, []);

  const fetchIssues = async () => {
    setLoading(true);
    try {
      let query = supabase.from("issue_reports").select("*").order("created_at", { ascending: false });

      const { data, error } = await query;

      if (error) throw error;
      
      setIssues(data as IssueReport[]);
    } catch (error) {
      console.error("Error fetching issues:", error);
      toast({
        title: "Error loading issues",
        description: "Failed to load issues. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredIssues = issues.filter(issue => {
    const matchesSearch = searchQuery
      ? issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        issue.tracking_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (issue.details && issue.details.toLowerCase().includes(searchQuery.toLowerCase()))
      : true;
    
    const matchesStatus = statusFilter ? issue.status === statusFilter : true;
    const matchesCategory = categoryFilter ? issue.category === categoryFilter : true;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const handleViewIssue = (id: string) => {
    navigate(`/issues/${id}`);
  };

  const handleRefresh = () => {
    fetchIssues();
  };

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter(null);
    setCategoryFilter(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex-1 w-full sm:max-w-sm">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search issues..."
              className="pl-9 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                Filter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setStatusFilter('submitted')}>
                <Clock className="mr-2 h-4 w-4 text-blue-500" />
                Submitted
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('in_review')}>
                <Search className="mr-2 h-4 w-4 text-amber-500" />
                In Review
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('in_progress')}>
                <RotateCw className="mr-2 h-4 w-4 text-purple-500" />
                In Progress
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('resolved')}>
                <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                Resolved
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('closed')}>
                <XCircle className="mr-2 h-4 w-4 text-gray-500" />
                Closed
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Filter by Category</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setCategoryFilter('technical')}>
                Technical Issues
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setCategoryFilter('interpersonal')}>
                Interpersonal Conflicts
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setCategoryFilter('safety')}>
                Safety Concerns
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setCategoryFilter('resource')}>
                Resource Issues
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setCategoryFilter('feedback')}>
                Feedback
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setCategoryFilter('other')}>
                Other
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={clearFilters}>
                Clear Filters
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button variant="outline" size="icon" onClick={handleRefresh} title="Refresh">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Active filters display */}
      {(statusFilter || categoryFilter) && (
        <div className="flex gap-2">
          {statusFilter && (
            <Badge variant="outline" className="gap-1 flex items-center">
              Status: {statusFilter}
              <Button
                variant="ghost"
                className="h-4 w-4 p-0 ml-1"
                onClick={() => setStatusFilter(null)}
              >
                ×
              </Button>
            </Badge>
          )}
          
          {categoryFilter && (
            <Badge variant="outline" className="gap-1 flex items-center">
              Category: {getCategoryLabel(categoryFilter)}
              <Button
                variant="ghost"
                className="h-4 w-4 p-0 ml-1"
                onClick={() => setCategoryFilter(null)}
              >
                ×
              </Button>
            </Badge>
          )}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Issue Reports</CardTitle>
          <CardDescription>
            Review and manage reported issues
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin">
                <RefreshCw className="h-8 w-8 text-gray-400" />
              </div>
            </div>
          ) : filteredIssues.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Reported</TableHead>
                    <TableHead>Anonymous</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredIssues.map((issue) => (
                    <TableRow key={issue.id} onClick={() => handleViewIssue(issue.id)} className="cursor-pointer">
                      <TableCell className="font-medium">{issue.title}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(issue.category)}`}>
                          {getCategoryLabel(issue.category)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className={`px-2 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1 ${getStatusColor(issue.status)}`}>
                          {getStatusIcon(issue.status)}
                          {issue.status}
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(issue.created_at)}</TableCell>
                      <TableCell>
                        {issue.is_anonymous ? "Yes" : "No"}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No issues found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default IssueList;

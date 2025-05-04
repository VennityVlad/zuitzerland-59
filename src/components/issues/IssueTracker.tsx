
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Search, AlertCircle, Clock, CheckCircle, RotateCw, XCircle } from "lucide-react";
import { IssueReport } from "@/types/issue";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const trackingSchema = z.object({
  trackingCode: z.string().min(8, "Please enter a valid tracking code"),
});

type TrackingFormValues = z.infer<typeof trackingSchema>;

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

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    'submitted': 'Submitted',
    'in_review': 'In Review',
    'in_progress': 'In Progress',
    'resolved': 'Resolved',
    'closed': 'Closed',
  };
  return labels[status] || status;
};

const IssueTracker = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [issueReport, setIssueReport] = useState<IssueReport | null>(null);

  const form = useForm<TrackingFormValues>({
    resolver: zodResolver(trackingSchema),
    defaultValues: {
      trackingCode: "",
    },
  });

  const onSubmit = async (data: TrackingFormValues) => {
    setIsLoading(true);
    try {
      const { data: issueData, error } = await supabase
        .from("issue_reports")
        .select("*")
        .eq("tracking_code", data.trackingCode.toUpperCase())
        .single();

      if (error) {
        throw error;
      }

      if (!issueData) {
        toast({
          title: "Not found",
          description: "No report found with that tracking code",
          variant: "destructive",
        });
        return;
      }

      setIssueReport(issueData as IssueReport);
    } catch (error) {
      console.error("Error fetching issue report:", error);
      toast({
        title: "Error",
        description: "No report found with that tracking code",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Track Your Report</CardTitle>
        <CardDescription>
          Enter your tracking code to check the status of your report
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
          >
            <div className="flex gap-3">
              <FormField
                control={form.control}
                name="trackingCode"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Tracking Code</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter your tracking code"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="self-end"
                disabled={isLoading}
              >
                Track
              </Button>
            </div>
          </form>
        </Form>

        {issueReport && (
          <div className="border rounded-lg p-4 space-y-4 mt-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium text-lg">{issueReport.title}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline">
                    {getCategoryLabel(issueReport.category)}
                  </Badge>
                  <div className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(issueReport.status)}`}>
                    {getStatusIcon(issueReport.status)}
                    {getStatusLabel(issueReport.status)}
                  </div>
                </div>
              </div>
              <div className="text-sm text-gray-500">
                {formatDate(issueReport.created_at)}
              </div>
            </div>

            {issueReport.details && (
              <div className="border-t pt-3">
                <p className="text-sm text-gray-600 whitespace-pre-wrap">
                  {issueReport.details}
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-center">
        <Button variant="link" onClick={() => form.reset()}>
          Check another report
        </Button>
      </CardFooter>
    </Card>
  );
};

export default IssueTracker;

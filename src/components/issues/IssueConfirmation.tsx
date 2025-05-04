
import { useParams, Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Copy } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const IssueConfirmation = () => {
  const { trackingCode } = useParams<{ trackingCode: string }>();

  const handleCopyTrackingCode = () => {
    if (trackingCode) {
      navigator.clipboard.writeText(trackingCode);
      toast({
        title: "Copied to clipboard",
        description: "Tracking code has been copied to your clipboard",
      });
    }
  };

  return (
    <Card className="max-w-lg mx-auto">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <CheckCircle2 className="h-16 w-16 text-green-500" />
        </div>
        <CardTitle className="text-2xl">Report Submitted</CardTitle>
        <CardDescription>
          Thank you for reporting this issue. Your input helps us improve the experience for everyone.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-muted p-4 rounded-lg">
          <div className="text-sm text-muted-foreground mb-2">Tracking Code:</div>
          <div className="flex items-center gap-2">
            <code className="bg-gray-100 px-2 py-1 rounded text-md font-mono">
              {trackingCode}
            </code>
            <Button
              size="icon"
              variant="ghost"
              onClick={handleCopyTrackingCode}
              className="h-8 w-8"
              title="Copy tracking code"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="text-sm">
          <p className="mb-2">
            <strong>Save this code to check your report status later.</strong>
          </p>
          <p className="text-muted-foreground">
            Our team will review your report as soon as possible. If you provided contact information,
            we may reach out for additional details.
          </p>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-4">
        <Button asChild className="w-full">
          <Link to="/issues/track">Track Report Status</Link>
        </Button>
        <Button asChild variant="outline" className="w-full">
          <Link to="/events">Return to Events</Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default IssueConfirmation;

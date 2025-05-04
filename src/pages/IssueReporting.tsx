
import { useState } from "react";
import IssueReportForm from "@/components/issues/IssueReportForm";
import { usePrivy } from "@privy-io/react-auth";
import { Navigate } from "react-router-dom";

const IssueReporting = () => {
  const { ready, authenticated } = usePrivy();
  const [isLoading, setIsLoading] = useState(true);

  // Wait for Privy to initialize
  if (!ready) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  // Redirect to login if not authenticated
  if (ready && !authenticated) {
    return <Navigate to="/signin?redirect=/issues/report" replace />;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Report an Issue or Incident</h1>
      <IssueReportForm />
    </div>
  );
};

export default IssueReporting;


import { usePrivy } from "@privy-io/react-auth";
import { Navigate } from "react-router-dom";
import IssueTracker from "@/components/issues/IssueTracker";

const IssueTracking = () => {
  const { ready, authenticated } = usePrivy();

  // Wait for Privy to initialize
  if (!ready) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  // Redirect to login if not authenticated
  if (ready && !authenticated) {
    return <Navigate to="/signin?redirect=/issues/track" replace />;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Track Your Report</h1>
      <IssueTracker />
    </div>
  );
};

export default IssueTracking;

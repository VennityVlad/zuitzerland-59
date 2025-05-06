
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { Link } from "react-router-dom";
import IssueList from "@/components/issues/IssueList";

const IssueListPage = () => {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Issue Reports</h1>
        <Button asChild>
          <Link to="/issues/report" className="flex items-center gap-2">
            <PlusCircle className="h-5 w-5" />
            New Report
          </Link>
        </Button>
      </div>
      <IssueList />
    </div>
  );
};

export default IssueListPage;

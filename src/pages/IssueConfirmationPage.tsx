
import { useParams } from "react-router-dom";
import IssueConfirmation from "@/components/issues/IssueConfirmation";

const IssueConfirmationPage = () => {
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8 text-center">Report Submitted</h1>
      <IssueConfirmation />
    </div>
  );
};

export default IssueConfirmationPage;

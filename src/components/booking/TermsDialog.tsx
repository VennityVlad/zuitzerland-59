
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TermsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TermsDialog = ({ open, onOpenChange }: TermsDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Zuitzerland General Terms and Conditions</DialogTitle>
          <DialogDescription>Version 1 - Effective Date: February 10, 2025</DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[50vh] w-full pr-4">
          <div className="space-y-4 text-sm">
            <h3 className="font-semibold">About Zuitzerland</h3>
            <p>
              Zuitzerland is an ambitious decentralized project organized by For The Win Ventures Gmbh creating a network society driven by community innovation where for all of May, 2025, in Switzerland, participants will engage with new technology and ideas, integrating the philosophies of Lunarpunk and Solarpunk, forging a new path for future societies. Further information may be found in the following link: <a href="https://www.zuitzerland.ch/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">https://www.zuitzerland.ch/</a>.
            </p>

            <h3 className="font-semibold">Acceptance of Terms</h3>
            <p>
              By purchasing a ticket to Zuitzerland (the "Event"), You agree to these Terms and Conditions ("Terms"). If You do not sign these Terms at the time of purchase, You may be required to confirm Your acceptance upon arrival at the Event. Failure to do so may result in denial of entry without refund. These Terms constitute a binding agreement between You and For The Win Ventures Gmbh, including its affiliates, organizers, employees, managers, volunteers, contractors, and any associated entities (the "Company").
            </p>

            <h3 className="font-semibold">Ticket Purchase, Transferability, and Access</h3>
            <p>
              Your ticket grants access to the Event for the specified dates. Tickets are non-transferable. Unauthorized resale or transfer of tickets is strictly prohibited and may result in ticket cancellation without refund. Your ticket does not guarantee any specific experiences, services, or accommodations beyond general admission to the Event grounds.
            </p>

            <h3 className="font-semibold">Code of Conduct Agreement</h3>
            <p>
              Upon arrival, You will be required to review and sign a Code of Conduct ("Code"). The Code establishes behavioral expectations to ensure a safe and inclusive environment. If You refuse to sign, the Company reserve the right to deny entry without refund.
            </p>

            <h3 className="font-semibold">Assumption of Risk and Safety Measures</h3>
            <p>
              You acknowledge that participation in the Event carries inherent risks, including but not limited to personal injury, property damage, illness, or theft. By attending, You voluntarily assume all such risks.
            </p>

            <h3 className="font-semibold">Cancellation, Refund, and Force Majeure Policies</h3>
            <p>
              All ticket sales are final. The Company may offer credits for future events in case of cancellation. Force majeure events may affect the Company's ability to perform its obligations.
            </p>

            <h3 className="font-semibold">Governing Law and Dispute Resolution</h3>
            <p>
              These Terms are governed by the laws of Switzerland. Disputes shall be settled through binding arbitration in Zurich, Switzerland.
            </p>

            <h3 className="font-semibold">Contact Information</h3>
            <p>
              For questions or concerns, contact us at <a href="mailto:hello@zuitzerland.ch" className="text-primary hover:underline">hello@zuitzerland.ch</a>
            </p>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default TermsDialog;


import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

interface PaymentTypeSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

const PaymentTypeSelector = ({ value, onChange }: PaymentTypeSelectorProps) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="paymentType">Payment Method</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id="paymentType" className="w-full">
          <SelectValue placeholder="Select payment method" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="fiat">Fiat (Credit Card)</SelectItem>
          <SelectItem value="crypto">Crypto</SelectItem>
        </SelectContent>
      </Select>
      
      {value === 'crypto' && (
        <Alert variant="warning" className="mt-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please make sure to use the Request Finance user interface when paying with crypto. Do NOT send us the funds directly from your wallet.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default PaymentTypeSelector;

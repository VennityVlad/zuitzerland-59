
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"

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
          <SelectItem value="crypto">Crypto (Wallet)</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default PaymentTypeSelector;


import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { BookingFormData } from "@/types/booking";

interface PersonalInfoFieldsProps {
  formData: BookingFormData;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const PersonalInfoFields = ({ formData, handleInputChange }: PersonalInfoFieldsProps) => {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="firstName" className="text-gray-700">First Name</Label>
          <Input
            id="firstName"
            name="firstName"
            required
            value={formData.firstName}
            onChange={handleInputChange}
            className="py-5"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="lastName" className="text-gray-700">Last Name</Label>
          <Input
            id="lastName"
            name="lastName"
            required
            value={formData.lastName}
            onChange={handleInputChange}
            className="py-5"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email" className="text-gray-700">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          value={formData.email}
          onChange={handleInputChange}
          className="py-5"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="address" className="text-gray-700">Address</Label>
        <Input
          id="address"
          name="address"
          required
          value={formData.address}
          onChange={handleInputChange}
          className="py-5"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="city" className="text-gray-700">City</Label>
          <Input
            id="city"
            name="city"
            required
            value={formData.city}
            onChange={handleInputChange}
            className="py-5"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="zip" className="text-gray-700">ZIP Code</Label>
          <Input
            id="zip"
            name="zip"
            required
            value={formData.zip}
            onChange={handleInputChange}
            className="py-5"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="country" className="text-gray-700">Country</Label>
        <Input
          id="country"
          name="country"
          required
          value={formData.country}
          onChange={handleInputChange}
          className="py-5"
        />
      </div>
    </>
  );
};

export default PersonalInfoFields;

import { useState } from "react";
import { format, addDays, differenceInDays } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ROOM_TYPES, MIN_STAY_DAYS } from "@/lib/constants";
import type { BookingFormData } from "@/types/booking";

const BookingForm = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<BookingFormData>({
    name: "",
    email: "",
    address: "",
    city: "",
    zip: "",
    country: "",
    checkin: "",
    checkout: "",
    roomType: "",
    price: 0,
  });

  const calculatePrice = (checkin: string, checkout: string, roomType: string) => {
    if (!checkin || !checkout || !roomType) return 0;
    const room = ROOM_TYPES.find((r) => r.id === roomType);
    if (!room) return 0;
    const days = differenceInDays(new Date(checkout), new Date(checkin));
    return days * room.pricePerNight;
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const newData = { ...prev, [name]: value };
      if (
        (name === "checkin" || name === "checkout" || name === "roomType") &&
        newData.checkin &&
        newData.checkout &&
        newData.roomType
      ) {
        newData.price = calculatePrice(
          newData.checkin,
          newData.checkout,
          newData.roomType
        );
      }
      return newData;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Validate minimum stay
    const days = differenceInDays(
      new Date(formData.checkout),
      new Date(formData.checkin)
    );
    if (days < MIN_STAY_DAYS) {
      toast({
        title: "Validation Error",
        description: `Minimum stay is ${MIN_STAY_DAYS} days`,
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    // Generate additional fields
    const creationDate = new Date().toISOString();
    const dueDate = addDays(new Date(), 14).toISOString();
    const invoiceNumber = `INV-${formData.name.replace(/\s+/g, "")}`;

    const fullData = {
      ...formData,
      creationDate,
      dueDate,
      invoiceNumber,
      price: `$${formData.price}`,
    };

    try {
      const response = await fetch(
        "https://hooks.zapier.com/hooks/catch/YOUR_WEBHOOK_ID/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          mode: "no-cors",
          body: JSON.stringify(fullData),
        }
      );

      toast({
        title: "Booking Submitted",
        description: "Your booking has been successfully submitted!",
      });
    } catch (error) {
      console.error("Error submitting booking:", error);
      toast({
        title: "Error",
        description: "Failed to submit booking. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-2xl mx-auto p-6 space-y-8 bg-white rounded-lg shadow-lg"
    >
      <div className="space-y-2">
        <h2 className="text-3xl font-semibold text-hotel-navy">Hotel Booking</h2>
        <p className="text-gray-500">
          Please fill in your details to complete your booking
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="name">Full Name</Label>
          <Input
            id="name"
            name="name"
            required
            value={formData.name}
            onChange={handleInputChange}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            value={formData.email}
            onChange={handleInputChange}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">Address</Label>
          <Input
            id="address"
            name="address"
            required
            value={formData.address}
            onChange={handleInputChange}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            name="city"
            required
            value={formData.city}
            onChange={handleInputChange}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="zip">ZIP Code</Label>
          <Input
            id="zip"
            name="zip"
            required
            value={formData.zip}
            onChange={handleInputChange}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="country">Country</Label>
          <Input
            id="country"
            name="country"
            required
            value={formData.country}
            onChange={handleInputChange}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="checkin">Check-in Date</Label>
          <div className="relative">
            <Input
              id="checkin"
              name="checkin"
              type="date"
              required
              min={format(new Date(), "yyyy-MM-dd")}
              value={formData.checkin}
              onChange={handleInputChange}
              className="date-picker"
            />
            <CalendarIcon className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="checkout">Check-out Date</Label>
          <div className="relative">
            <Input
              id="checkout"
              name="checkout"
              type="date"
              required
              min={formData.checkin}
              value={formData.checkout}
              onChange={handleInputChange}
              className="date-picker"
            />
            <CalendarIcon className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="roomType">Room Type</Label>
          <Select
            name="roomType"
            value={formData.roomType}
            onValueChange={(value) =>
              handleInputChange({
                target: { name: "roomType", value },
              } as React.ChangeEvent<HTMLSelectElement>)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a room type" />
            </SelectTrigger>
            <SelectContent>
              {ROOM_TYPES.map((room) => (
                <SelectItem key={room.id} value={room.id}>
                  {room.name} - ${room.pricePerNight}/night
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Total Price</Label>
          <div className="h-10 px-3 py-2 rounded-md border bg-muted text-muted-foreground">
            ${formData.price}
          </div>
        </div>
      </div>

      <Button
        type="submit"
        className="w-full bg-hotel-navy hover:bg-hotel-navy/90"
        disabled={isLoading}
      >
        {isLoading ? "Submitting..." : "Complete Booking"}
      </Button>
    </form>
  );
};

export default BookingForm;

export interface BookingFormData {
  firstName: string;
  lastName: string;
  email: string;
  address: string;
  city: string;
  zip: string;
  country: string;
  checkin: string;
  checkout: string;
  roomType: string;
  price: number;
  paymentType: 'fiat' | 'crypto';
  profileId?: string; // Added for admin booking
}

export interface PaymentMethodOption {
  id: string;
  name: string;
  description: string;
  iconPath: string;
}

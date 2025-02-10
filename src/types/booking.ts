
export interface RoomType {
  id: string;
  name: string;
  pricePerNight: number;
  description: string;
}

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
}

// This type matches the Supabase table schema
export interface InvoiceData {
  user_id: string;
  invoice_uid: string;
  booking_details: Record<string, unknown>;
  price: number;
  room_type: string;
  checkin: string;
  checkout: string;
  first_name: string;
  last_name: string;
  email: string;
  payment_link: string;
}

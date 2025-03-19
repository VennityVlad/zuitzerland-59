
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

// Add the missing PriceData type that is imported in usePrices.ts
export interface PriceData {
  id: string;
  room_type: string;
  date: string;
  price: number;
  duration: number;
  created_at: string;
}

// Add the missing DatabaseRoomType type that is used in RoomTypes.tsx
export type DatabaseRoomType = 
  | 'hotel_room_queen'
  | 'apartment_3br_couples'
  | 'apartment_3_4br_queen'
  | 'apartment_3_4br_twin'
  | 'apartment_2br_twin'
  | 'apartment_2br_triple';

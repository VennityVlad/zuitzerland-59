
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
  paymentType: 'fiat' | 'crypto';
}

// Adding string to the DatabaseRoomType to make it more flexible
export type DatabaseRoomType = 
  | 'hotel_room_queen'
  | 'apartment_3br_couple'
  | 'apartment_3_4br_queen_single'
  | 'apartment_3_4br_twin_single'
  | 'apartment_2br_twin_single'
  | 'apartment_2br_triple'
  | string; // Added string to make it compatible with dynamic values from database

export interface PriceData {
  room_type: DatabaseRoomType;
  date: string;
  price: number;
}


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
  discountCode?: string;
  paymentType: 'fiat' | 'crypto';
}

export type DatabaseRoomType = 
  | 'hotel_room_queen'
  | 'apartment_3br_couple'
  | 'apartment_3_4br_queen_single'
  | 'apartment_3_4br_twin_single'
  | 'apartment_2br_twin_single'
  | 'apartment_2br_triple';

export interface PriceData {
  room_type: DatabaseRoomType;
  date: string;
  price: number;
}

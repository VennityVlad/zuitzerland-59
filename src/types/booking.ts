
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
  creationDate?: string;
  dueDate?: string;
  invoiceNumber?: string;
}

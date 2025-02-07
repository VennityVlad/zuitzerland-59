import { RoomType } from "@/types/booking";

export const ROOM_TYPES: RoomType[] = [
  {
    id: "standard",
    name: "Standard Room",
    pricePerNight: 280,
    description: "Comfortable room with queen-size bed",
  },
  {
    id: "deluxe",
    name: "Deluxe Suite",
    pricePerNight: 420,
    description: "Spacious suite with king-size bed and city view",
  },
  {
    id: "executive",
    name: "Executive Suite",
    pricePerNight: 640,
    description: "Luxury suite with separate living area and premium amenities",
  },
];

export const MIN_STAY_DAYS = 7;
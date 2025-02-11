
import { RoomType, DatabaseRoomType } from "@/types/booking";

export const ROOM_TYPE_MAPPING: { [key: string]: DatabaseRoomType } = {
  "hotel_room_queen": "hotel_room_queen",
  "apartment_3br_couple": "apartment_3br_couple",
  "apartment_3_4br_queen_single": "apartment_3_4br_queen_single",
  "apartment_3_4br_twin_single": "apartment_3_4br_twin_single",
  "apartment_2br_twin_single": "apartment_2br_twin_single",
  "apartment_2br_triple": "apartment_2br_triple",
};

export const ROOM_TYPES: RoomType[] = [
  {
    id: "hotel_room_queen",
    name: "Hotel room / Queen bed / Daily Cleaning",
    pricePerNight: 0, // Will be populated from database
    description: "2 people in private room incl. breakfast",
  },
  {
    id: "apartment_3br_couple",
    name: "3 bedroom apartment - couples room",
    pricePerNight: 0, // Will be populated from database
    description: "Two people incl. breakfast, private entrance",
  },
  {
    id: "apartment_3_4br_queen_single",
    name: "3 or 4 bedroom apartment - queen bed room",
    pricePerNight: 0, // Will be populated from database
    description: "Single person not sharing, two bathrooms between 6-8 people, includes breakfast",
  },
  {
    id: "apartment_3_4br_twin_single",
    name: "3 bedroom or 4 bedroom apartment - twin bed room",
    pricePerNight: 0, // Will be populated from database
    description: "Single person, two bathrooms between 6-8 people, includes breakfast",
  },
  {
    id: "apartment_2br_twin_single",
    name: "2 bedroom apartment - twin bed room",
    pricePerNight: 0, // Will be populated from database
    description: "Single person, one bathroom between five people, includes breakfast",
  },
  {
    id: "apartment_2br_triple",
    name: "2 bedroom apartment - triple bed room",
    pricePerNight: 0, // Will be populated from database
    description: "Single person, one bathroom between five people, includes breakfast",
  }
];

export const MIN_STAY_DAYS = 7; // Default minimum stay of 1 week

export const ROOM_MIN_STAY: { [key: string]: number } = {
  "apartment_2br_twin_single": 14, // 2 weeks minimum for 2 bedroom twin
  "apartment_2br_triple": 25, // Whole time (25 days) for 2 bedroom triple
};

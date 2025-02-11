
import { RoomType, DatabaseRoomType } from "@/types/booking";

export const ROOM_TYPE_MAPPING: { [key: string]: DatabaseRoomType } = {
  "queen-standard": "hotel_room_queen",
  "couples-suite": "apartment_3br_couple",
  "queen-shared": "apartment_3_4br_queen_single",
  "twin-shared": "apartment_3_4br_twin_single",
  "twin-bathroom": "apartment_2br_twin_single",
  "triple-room": "apartment_2br_triple",
};

export const ROOM_TYPES: RoomType[] = [
  {
    id: "queen-standard",
    name: "Hotel room / Queen bed / Daily Cleaning",
    pricePerNight: 0, // Will be populated from database
    description: "2 people in private room incl. breakfast",
  },
  {
    id: "couples-suite",
    name: "3 bedroom apartment - couples room",
    pricePerNight: 0, // Will be populated from database
    description: "Two people incl. breakfast, private entrance",
  },
  {
    id: "queen-shared",
    name: "3 or 4 bedroom apartment - queen bed room",
    pricePerNight: 0, // Will be populated from database
    description: "Single person not sharing, two bathrooms between 6-8 people, includes breakfast",
  },
  {
    id: "twin-shared",
    name: "3 bedroom or 4 bedroom apartment - twin bed room",
    pricePerNight: 0, // Will be populated from database
    description: "Single person, two bathrooms between 6-8 people, includes breakfast",
  },
  {
    id: "twin-bathroom",
    name: "2 bedroom apartment - twin bed room",
    pricePerNight: 0, // Will be populated from database
    description: "Single person, one bathroom between five people, includes breakfast",
  },
  {
    id: "triple-room",
    name: "2 bedroom apartment - triple bed room",
    pricePerNight: 0, // Will be populated from database
    description: "Single person, one bathroom between five people, includes breakfast",
  }
];

export const MIN_STAY_DAYS = 7; // Default minimum stay of 1 week

export const ROOM_MIN_STAY: { [key: string]: number } = {
  "twin-bathroom": 14, // 2 weeks minimum for 2 bedroom twin
  "triple-room": 25, // Whole time (25 days) for 2 bedroom triple
};

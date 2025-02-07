import { RoomType } from "@/types/booking";

type PricingTable = {
  [key: string]: number[];
};

export const PRICING_TABLE: PricingTable = {
  "queen-standard": [320, 320, 320, 320, 320, 320, 320, 315, 310, 305, 300, 295, 290, 285, 280, 275, 270, 265, 260, 255, 250, 245, 240, 235, 230],
  "couples-suite": [300, 315, 315, 315, 315, 315, 315, 312, 309, 306, 303, 300, 297, 294, 291, 288, 285, 282, 279, 276, 273, 270, 267, 264, 261],
  "queen-shared": [290, 290, 290, 290, 290, 290, 290, 284, 277, 271, 264, 258, 251, 245, 238, 232, 225, 219, 212, 206, 199, 193, 186, 180, 173],
  "twin-shared": [157, 157, 157, 157, 157, 157, 157, 155, 153, 151, 149, 147, 145, 143, 141, 139, 137, 135, 133, 131, 129, 127, 125, 123, 121],
  "twin-bathroom": [157, 157, 157, 157, 157, 157, 157, 157, 157, 157, 157, 157, 157, 100, 98, 97, 95, 93, 92, 90, 88, 86, 86, 86, 86],
  "triple-room": [157, 157, 157, 157, 157, 157, 157, 156, 154, 153, 151, 150, 148, 147, 145, 144, 143, 141, 140, 138, 85, 84, 83, 82, 81],
  "queen-deluxe": [360, 360, 360, 360, 360, 360, 360, 355, 350, 345, 340, 335, 330, 325, 320, 315, 310, 305, 300, 295, 290, 285, 280, 275, 270],
};

export const ROOM_TYPES: RoomType[] = [
  {
    id: "queen-standard",
    name: "Hotel Room - Queen Bed (Standard)",
    pricePerNight: PRICING_TABLE["queen-standard"][0],
    description: "2 people in private room with daily cleaning, includes breakfast",
  },
  {
    id: "couples-suite",
    name: "3 Bedroom Apartment - Couples Suite",
    pricePerNight: PRICING_TABLE["couples-suite"][0],
    description: "Private entrance, two people including breakfast",
  },
  {
    id: "queen-shared",
    name: "3-4 Bedroom Apartment - Queen Bed",
    pricePerNight: PRICING_TABLE["queen-shared"][0],
    description: "Single person, shared bathroom (2 bathrooms between 6-8 people), includes breakfast",
  },
  {
    id: "twin-shared",
    name: "3-4 Bedroom Apartment - Twin Bed",
    pricePerNight: PRICING_TABLE["twin-shared"][0],
    description: "Single person, shared bathroom (2 bathrooms between 6-8 people), includes breakfast",
  },
  {
    id: "twin-bathroom",
    name: "2 Bedroom Apartment - Twin Bed",
    pricePerNight: PRICING_TABLE["twin-bathroom"][0],
    description: "Single person, shared bathroom (1 bathroom between 5 people), includes breakfast",
  },
  {
    id: "triple-room",
    name: "2 Bedroom Apartment - Triple Bed",
    pricePerNight: PRICING_TABLE["triple-room"][0],
    description: "Single person, shared bathroom (1 bathroom between 5 people), includes breakfast",
  },
  {
    id: "queen-deluxe",
    name: "Hotel Room - Queen Bed (Deluxe)",
    pricePerNight: PRICING_TABLE["queen-deluxe"][0],
    description: "2 people in private room with daily cleaning, includes breakfast",
  },
];

export const MIN_STAY_DAYS = 7;
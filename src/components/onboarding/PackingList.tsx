
import React from "react";

interface PackingCategory {
  title: string;
  emoji: string;
  items: string[];
}

export const PackingList = () => {
  const packingCategories: PackingCategory[] = [
    {
      title: "What's in the apartment?",
      emoji: "🏠",
      items: [
        "See amenity list here."
      ]
    },
    {
      title: "Interdimensional Documentation",
      emoji: "🛂",
      items: [
        "Passport, visa, and Earthling identity credentials (for navigating nation-state protocols)",
        "Local currency / credit card (notify your space-bank in advance)"
      ]
    },
    {
      title: "Universal Power Access",
      emoji: "🔌",
      items: [
        "Type C or F adapters (standard in European quadrants)",
        "Power strip with your home-planet outlets (to connect multiple devices through one adapter)",
        "Extension cords (some outlets hide like shy meteorites)",
        "Voltage converter (if your tech isn't inter-voltage compatible)"
      ]
    },
    {
      title: "Biological Maintenance Kit",
      emoji: "🧴",
      items: [
        "Toiletries (toothbrush, toothpaste, soap, shampoo, skincare potions)",
        "Sunscreen (for solar flare protection)",
        "Medications & supplements (including all prescribed essentials)",
        "Sleeping needs: earplugs, eye mask",
        "Reusable water vessel"
      ]
    },
    {
      title: "Clothing – Earth Weather, Galactic Vibes",
      emoji: "👕",
      items: [
        "Thermal base layers (Alpine nights = space chill)",
        "Fleece or down jacket (for nebula-temperature mornings)",
        "Waterproof outerwear (Alps like to surprise)",
        "Hiking boots (terrain = 3D, not virtual)",
        "Warm socks (always bring extras — trust us)",
        "Beanie or space helmet hat",
        "Gloves (for frost or interstellar greetings)",
        "Hat & sunglasses (protect your optics from solar overload)",
        "Athletic wear / swimwear / comfy loungewear",
        "Alien-themed costume(s) – antennas, metallics, glow-up gear – go cosmic!"
      ]
    },
    {
      title: "Personal Touches",
      emoji: "🎒",
      items: [
        "Favorite book(s) (for fireside or spaceship reading)",
        "Journal or sketchbook (for stardust musings)",
        "Playing cards or games",
        "Blanket or shawl (for galactic sunset chill sessions)",
        "Bluetooth speaker (bring the beats across dimensions)",
        "Small first-aid kit",
        "Camera (for terrestrial and extraterrestrial moments)",
        "Map (of Earth… and the galaxy)",
        "Flag or emblem (represent your homeland/planet)",
        "Gifts or barter items (for interspecies diplomacy)"
      ]
    },
    {
      title: "Alien Accessories",
      emoji: "🛸",
      items: [
        "Face paint, body glitter",
        "Light-up gear (EL wire, LEDs, fiber optics = A++)"
      ]
    }
  ];

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold">Packing List</h2>
      <p className="text-gray-600">
        Make sure you have everything you need for your stay at Zuitzerland!
      </p>

      <div className="space-y-6">
        {packingCategories.map((category, index) => (
          <div key={index} className="border rounded-lg p-4 bg-white">
            <h3 className="text-xl font-medium mb-3 flex items-center">
              <span className="mr-2 text-2xl">{category.emoji}</span>
              {category.title}
            </h3>
            <ul className="space-y-2 pl-8">
              {category.items.map((item, itemIndex) => (
                <li key={itemIndex} className="list-disc text-gray-700">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};

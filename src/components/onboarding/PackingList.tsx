
import React, { useState, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { usePrivy } from "@privy-io/react-auth";
import { useToast } from "@/hooks/use-toast";

interface PackingItem {
  id: string;
  label: string;
  completed: boolean;
}

interface PackingCategory {
  title: string;
  emoji: string;
  items: PackingItem[];
}

export const PackingList = () => {
  const { user } = usePrivy();
  const { toast } = useToast();
  const [packingList, setPackingList] = useState<PackingCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Define the initial packing list structure
  const initialPackingList: PackingCategory[] = [
    {
      title: "What's in the apartment?",
      emoji: "🏠",
      items: [
        { id: "apartment-1", label: "See amenity list here.", completed: false }
      ]
    },
    {
      title: "Interdimensional Documentation",
      emoji: "🛂",
      items: [
        { id: "docs-1", label: "Passport, visa, and Earthling identity credentials (for navigating nation-state protocols)", completed: false },
        { id: "docs-2", label: "Local currency / credit card (notify your space-bank in advance)", completed: false }
      ]
    },
    {
      title: "Universal Power Access",
      emoji: "🔌",
      items: [
        { id: "power-1", label: "Type C or F adapters (standard in European quadrants)", completed: false },
        { id: "power-2", label: "Power strip with your home-planet outlets (to connect multiple devices through one adapter)", completed: false },
        { id: "power-3", label: "Extension cords (some outlets hide like shy meteorites)", completed: false },
        { id: "power-4", label: "Voltage converter (if your tech isn't inter-voltage compatible)", completed: false }
      ]
    },
    {
      title: "Biological Maintenance Kit",
      emoji: "🧴",
      items: [
        { id: "bio-1", label: "Toiletries (toothbrush, toothpaste, soap, shampoo, skincare potions)", completed: false },
        { id: "bio-2", label: "Sunscreen (for solar flare protection)", completed: false },
        { id: "bio-3", label: "Medications & supplements (including all prescribed essentials)", completed: false },
        { id: "bio-4", label: "Sleeping needs: earplugs, eye mask", completed: false },
        { id: "bio-5", label: "Reusable water vessel", completed: false }
      ]
    },
    {
      title: "Clothing – Earth Weather, Galactic Vibes",
      emoji: "👕",
      items: [
        { id: "clothing-1", label: "Thermal base layers (Alpine nights = space chill)", completed: false },
        { id: "clothing-2", label: "Fleece or down jacket (for nebula-temperature mornings)", completed: false },
        { id: "clothing-3", label: "Waterproof outerwear (Alps like to surprise)", completed: false },
        { id: "clothing-4", label: "Hiking boots (terrain = 3D, not virtual)", completed: false },
        { id: "clothing-5", label: "Warm socks (always bring extras — trust us)", completed: false },
        { id: "clothing-6", label: "Beanie or space helmet hat", completed: false },
        { id: "clothing-7", label: "Gloves (for frost or interstellar greetings)", completed: false },
        { id: "clothing-8", label: "Hat & sunglasses (protect your optics from solar overload)", completed: false },
        { id: "clothing-9", label: "Athletic wear / swimwear / comfy loungewear", completed: false },
        { id: "clothing-10", label: "Alien-themed costume(s) – antennas, metallics, glow-up gear – go cosmic!", completed: false }
      ]
    },
    {
      title: "Personal Touches",
      emoji: "🎒",
      items: [
        { id: "personal-1", label: "Favorite book(s) (for fireside or spaceship reading)", completed: false },
        { id: "personal-2", label: "Journal or sketchbook (for stardust musings)", completed: false },
        { id: "personal-3", label: "Playing cards or games", completed: false },
        { id: "personal-4", label: "Blanket or shawl (for galactic sunset chill sessions)", completed: false },
        { id: "personal-5", label: "Bluetooth speaker (bring the beats across dimensions)", completed: false },
        { id: "personal-6", label: "Small first-aid kit", completed: false },
        { id: "personal-7", label: "Camera (for terrestrial and extraterrestrial moments)", completed: false },
        { id: "personal-8", label: "Map (of Earth… and the galaxy)", completed: false },
        { id: "personal-9", label: "Flag or emblem (represent your homeland/planet)", completed: false },
        { id: "personal-10", label: "Gifts or barter items (for interspecies diplomacy)", completed: false }
      ]
    },
    {
      title: "Alien Accessories",
      emoji: "🛸",
      items: [
        { id: "alien-1", label: "Face paint, body glitter", completed: false },
        { id: "alien-2", label: "Light-up gear (EL wire, LEDs, fiber optics = A++)", completed: false }
      ]
    }
  ];

  // Load saved packing list from the user profile
  useEffect(() => {
    const fetchPackingList = async () => {
      if (!user?.id) return;
      
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('profiles')
          .select('packing_list')
          .eq('privy_id', user.id)
          .maybeSingle();

        if (error) {
          throw error;
        }

        if (data && data.packing_list) {
          // Use the saved packing list from the database
          setPackingList(data.packing_list as unknown as PackingCategory[]);
        } else {
          // Use the initial packing list if none is saved
          setPackingList(initialPackingList);
        }
      } catch (error) {
        console.error('Error fetching packing list:', error);
        // Fall back to initial list on error
        setPackingList(initialPackingList);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPackingList();
  }, [user?.id]);

  // Update an item's completion status
  const toggleItemCompletion = async (categoryIndex: number, itemIndex: number) => {
    if (!user?.id || isSaving) return;
    
    setIsSaving(true);
    
    try {
      // Create a deep copy of the current packing list
      const updatedPackingList = JSON.parse(JSON.stringify(packingList)) as PackingCategory[];
      
      // Toggle the completion status
      updatedPackingList[categoryIndex].items[itemIndex].completed = 
        !updatedPackingList[categoryIndex].items[itemIndex].completed;
      
      // Update local state
      setPackingList(updatedPackingList);
      
      // Save to the database
      const { error } = await supabase
        .from('profiles')
        .update({ 
          packing_list: updatedPackingList as any 
        })
        .eq('privy_id', user.id);
      
      if (error) {
        throw error;
      }
      
    } catch (error) {
      console.error('Error updating packing item:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update packing item"
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <h2 className="text-2xl font-bold">Packing List</h2>
        <div className="animate-pulse space-y-6">
          <div className="h-16 bg-gray-200 rounded"></div>
          <div className="h-16 bg-gray-200 rounded"></div>
          <div className="h-16 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold">Packing List</h2>
      <p className="text-gray-600">
        Make sure you have everything you need for your stay at Zuitzerland!
      </p>

      <div className="space-y-6">
        {packingList.map((category, categoryIndex) => (
          <div key={categoryIndex} className="border rounded-lg p-4 bg-white">
            <h3 className="text-xl font-medium mb-3 flex items-center">
              <span className="mr-2 text-2xl">{category.emoji}</span>
              {category.title}
            </h3>
            <div className="space-y-2 pl-8">
              {category.items.map((item, itemIndex) => (
                <div key={item.id} className="flex items-center space-x-2">
                  <Checkbox 
                    id={item.id}
                    checked={item.completed}
                    onCheckedChange={() => toggleItemCompletion(categoryIndex, itemIndex)}
                    className="data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                  />
                  <label 
                    htmlFor={item.id} 
                    className={`text-gray-700 ${item.completed ? 'line-through text-gray-400' : ''}`}
                  >
                    {item.label}
                  </label>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

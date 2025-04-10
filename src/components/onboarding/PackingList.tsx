
import { useState, useEffect } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { usePrivy } from "@privy-io/react-auth";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";

interface PackingItem {
  id: string;
  category: string;
  name: string;
  completed: boolean;
}

type PackingCategories = Record<string, PackingItem[]>;

export const PackingList = () => {
  const { user } = usePrivy();
  const { toast } = useToast();
  const [items, setItems] = useState<PackingCategories>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Define standard packing items
  const standardPackingItems: PackingCategories = {
    "Essential Documents": [
      { id: "doc1", category: "Essential Documents", name: "Passport/ID", completed: false },
      { id: "doc2", category: "Essential Documents", name: "Travel insurance details", completed: false },
      { id: "doc3", category: "Essential Documents", name: "Payment cards", completed: false },
      { id: "doc4", category: "Essential Documents", name: "Swiss Francs (CHF)", completed: false },
    ],
    "Clothing": [
      { id: "cloth1", category: "Clothing", name: "Weather-appropriate outdoor wear", completed: false },
      { id: "cloth2", category: "Clothing", name: "Hiking shoes/boots", completed: false },
      { id: "cloth3", category: "Clothing", name: "Comfortable walking shoes", completed: false },
      { id: "cloth4", category: "Clothing", name: "Rain jacket/waterproof outer layer", completed: false },
      { id: "cloth5", category: "Clothing", name: "Warm layers (even in summer)", completed: false },
      { id: "cloth6", category: "Clothing", name: "Casual evening wear", completed: false },
    ],
    "Tech & Electronics": [
      { id: "tech1", category: "Tech & Electronics", name: "Laptop & charger", completed: false },
      { id: "tech2", category: "Tech & Electronics", name: "Phone & charger", completed: false },
      { id: "tech3", category: "Tech & Electronics", name: "Camera (if desired)", completed: false },
      { id: "tech4", category: "Tech & Electronics", name: "Power adapters (Switzerland uses Type J plugs)", completed: false },
    ],
    "Health & Personal Care": [
      { id: "health1", category: "Health & Personal Care", name: "Personal medications", completed: false },
      { id: "health2", category: "Health & Personal Care", name: "Basic first aid items", completed: false },
      { id: "health3", category: "Health & Personal Care", name: "Sunscreen", completed: false },
      { id: "health4", category: "Health & Personal Care", name: "Insect repellent", completed: false },
      { id: "health5", category: "Health & Personal Care", name: "Personal hygiene items", completed: false },
    ],
    "Accessories": [
      { id: "acc1", category: "Accessories", name: "Daypack for hikes", completed: false },
      { id: "acc2", category: "Accessories", name: "Reusable water bottle", completed: false },
      { id: "acc3", category: "Accessories", name: "Sunglasses", completed: false },
      { id: "acc4", category: "Accessories", name: "Hat for sun protection", completed: false },
    ],
    "Miscellaneous": [
      { id: "misc1", category: "Miscellaneous", name: "Book(s) for the Zuitzerland library", completed: false },
      { id: "misc2", category: "Miscellaneous", name: "Journal/notebook", completed: false },
      { id: "misc3", category: "Miscellaneous", name: "Reusable shopping bag", completed: false },
    ],
  };

  useEffect(() => {
    const loadPackingList = async () => {
      if (!user?.id) return;
      
      setIsLoading(true);
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('packing_list')
          .eq('privy_id', user.id)
          .maybeSingle();

        if (error) {
          console.error("Error fetching packing list:", error);
          throw error;
        }

        if (data && data.packing_list) {
          // If user has saved packing list data
          setItems(data.packing_list as PackingCategories);
        } else {
          // Use default items if no saved data
          setItems(standardPackingItems);
        }
      } catch (error) {
        console.error("Error loading packing list:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load your packing list"
        });
        // Fall back to standard items
        setItems(standardPackingItems);
      } finally {
        setIsLoading(false);
      }
    };

    loadPackingList();
  }, [user?.id, toast]);

  const handleToggleItem = async (categoryName: string, itemId: string) => {
    if (!user?.id) return;
    
    setIsSaving(true);
    
    // Update local state first for responsive UI
    const updatedItems = { ...items };
    const categoryItems = [...(updatedItems[categoryName] || [])];
    const itemIndex = categoryItems.findIndex(item => item.id === itemId);
    
    if (itemIndex >= 0) {
      categoryItems[itemIndex] = {
        ...categoryItems[itemIndex],
        completed: !categoryItems[itemIndex].completed
      };
      updatedItems[categoryName] = categoryItems;
      setItems(updatedItems);
    }
    
    try {
      // Save to database
      const { error } = await supabase
        .from('profiles')
        .update({ 
          packing_list: updatedItems 
        })
        .eq('privy_id', user.id);
      
      if (error) throw error;
      
    } catch (error) {
      console.error("Error saving packing list:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save your packing list changes"
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold">Packing List</h2>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="space-y-2">
              <div className="h-5 bg-gray-200 rounded w-1/3"></div>
              <div className="space-y-2">
                {[1, 2, 3].map(j => (
                  <div key={j} className="h-10 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Packing List</h2>
        <p className="text-sm text-gray-500 mt-1">
          Check off items as you pack them. Your progress will be saved automatically.
        </p>
      </div>
      
      {Object.keys(items).map((category) => (
        <div key={category} className="space-y-2">
          <h3 className="font-medium text-lg">{category}</h3>
          <Separator />
          
          <div className="space-y-2 pt-2">
            {items[category]?.map((item) => (
              <div
                key={item.id}
                className={cn(
                  "flex items-center p-3 rounded-lg border",
                  item.completed ? "bg-green-50 border-green-200" : "bg-white border-gray-200"
                )}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={isSaving}
                  className={cn(
                    "h-6 w-6 rounded-full p-0 mr-3",
                    item.completed ? "bg-green-500 text-white hover:bg-green-600" : "border border-gray-300"
                  )}
                  onClick={() => handleToggleItem(category, item.id)}
                >
                  {item.completed && <Check className="h-3 w-3" />}
                </Button>
                <span className={cn(
                  "text-sm",
                  item.completed && "line-through text-gray-500"
                )}>
                  {item.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
      
      <div className="text-sm text-gray-500 italic pt-2">
        Note: This list includes general recommendations. You may need additional items based on your specific needs and planned activities.
      </div>
    </div>
  );
};

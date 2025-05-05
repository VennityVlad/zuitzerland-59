
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import { useAllPrices } from "@/hooks/usePrices";
import PageTitle from "@/components/PageTitle";
import { PriceData } from "@/types/booking";
import { 
  Edit, 
  Plus, 
  Search, 
  X, 
  Filter 
} from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

interface RoomTypeData {
  id: string;
  code: string;
  display_name: string;
}

const Pricing = () => {
  const { toast } = useToast();
  const { data: allPrices, isLoading: isPriceLoading, refetch } = useAllPrices();
  const [roomTypes, setRoomTypes] = useState<RoomTypeData[]>([]);
  const [isLoadingRoomTypes, setIsLoadingRoomTypes] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRoomType, setFilterRoomType] = useState<string | null>(null);
  const [newPrice, setNewPrice] = useState({
    room_type: "",
    duration: 1,
    price: 0,
    date: format(new Date(), "yyyy-MM-dd"),
  });
  const [editingPrice, setEditingPrice] = useState<PriceData | null>(null);

  useEffect(() => {
    const fetchRoomTypes = async () => {
      try {
        const { data, error } = await supabase
          .from("room_types")
          .select("id, code, display_name")
          .eq("active", true);
        
        if (error) {
          throw error;
        }
        
        setRoomTypes(data || []);
      } catch (error) {
        console.error("Error fetching room types:", error);
        toast({
          title: "Error",
          description: "Failed to fetch room types",
          variant: "destructive",
        });
      } finally {
        setIsLoadingRoomTypes(false);
      }
    };

    fetchRoomTypes();
  }, [toast]);

  const handleAddPrice = async (closeSheet: () => void) => {
    try {
      const { error } = await supabase
        .from("prices")
        .insert({
          room_type: newPrice.room_type,
          duration: newPrice.duration,
          price: newPrice.price,
          date: newPrice.date,
        });
      
      if (error) throw error;
      
      toast({
        title: "Price Added",
        description: "The new price has been added successfully",
      });
      
      // Reset form
      setNewPrice({
        room_type: "",
        duration: 1,
        price: 0,
        date: format(new Date(), "yyyy-MM-dd"),
      });
      
      refetch();
      closeSheet();
    } catch (error) {
      console.error("Error adding price:", error);
      toast({
        title: "Error",
        description: "Failed to add price",
        variant: "destructive",
      });
    }
  };

  const handleUpdatePrice = async (closeSheet: () => void) => {
    if (!editingPrice) return;
    
    try {
      const { error } = await supabase
        .from("prices")
        .update({
          room_type: editingPrice.room_type,
          duration: editingPrice.duration,
          price: editingPrice.price,
        })
        .eq("id", editingPrice.id);
      
      if (error) throw error;
      
      toast({
        title: "Price Updated",
        description: "The price has been updated successfully",
      });
      
      refetch();
      setEditingPrice(null);
      closeSheet();
    } catch (error) {
      console.error("Error updating price:", error);
      toast({
        title: "Error",
        description: "Failed to update price",
        variant: "destructive",
      });
    }
  };

  const filteredPrices = allPrices
    ? allPrices.filter((price) => {
        const matchesSearch = searchQuery === "" || 
          price.room_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (roomTypes.find(rt => rt.code === price.room_type)?.display_name || "")
            .toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesRoomType = filterRoomType === null || price.room_type === filterRoomType;
        
        return matchesSearch && matchesRoomType;
      })
    : [];

  // Group prices by room type for the tabbed view
  const pricesByRoomType = filteredPrices.reduce((acc, price) => {
    if (!acc[price.room_type]) {
      acc[price.room_type] = [];
    }
    acc[price.room_type].push(price);
    return acc;
  }, {} as Record<string, PriceData[]>);

  const uniqueRoomTypes = Object.keys(pricesByRoomType);

  return (
    <div className="container py-8 max-w-6xl">
      <PageTitle
        title="Pricing Management"
        description="View and manage pricing for room types"
      />

      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
          <Input
            placeholder="Search pricing..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-3 w-full sm:w-auto">
          <Select 
            value={filterRoomType || ""} 
            onValueChange={(value) => setFilterRoomType(value || null)}
          >
            <SelectTrigger className="w-full sm:w-40 flex-shrink-0">
              <SelectValue placeholder="All room types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All room types</SelectItem>
              {roomTypes.map((roomType) => (
                <SelectItem key={roomType.code} value={roomType.code}>
                  {roomType.display_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Sheet>
            {(close) => (
              <>
                <SheetTrigger asChild>
                  <Button className="gap-2 whitespace-nowrap">
                    <Plus className="h-4 w-4" /> Add Price
                  </Button>
                </SheetTrigger>
                <SheetContent className="sm:max-w-md">
                  <SheetHeader>
                    <SheetTitle>Add New Price</SheetTitle>
                    <SheetDescription>
                      Define a new price for a specific room type and duration.
                    </SheetDescription>
                  </SheetHeader>
                  <div className="mt-8 grid gap-4">
                    <div className="grid gap-2">
                      <label htmlFor="room_type">Room Type</label>
                      <Select 
                        value={newPrice.room_type} 
                        onValueChange={(value) => setNewPrice({...newPrice, room_type: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select room type" />
                        </SelectTrigger>
                        <SelectContent>
                          {roomTypes.map((roomType) => (
                            <SelectItem key={roomType.code} value={roomType.code}>
                              {roomType.display_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="grid gap-2">
                      <label htmlFor="duration">Stay Duration (days)</label>
                      <Input
                        type="number"
                        value={newPrice.duration}
                        onChange={(e) => setNewPrice({...newPrice, duration: Number(e.target.value)})}
                        min={1}
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <label htmlFor="price">Price (CHF)</label>
                      <Input
                        type="number"
                        value={newPrice.price}
                        onChange={(e) => setNewPrice({...newPrice, price: Number(e.target.value)})}
                        min={0}
                        step="0.01"
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <label htmlFor="date">Date</label>
                      <Input
                        type="date"
                        value={newPrice.date}
                        onChange={(e) => setNewPrice({...newPrice, date: e.target.value})}
                      />
                    </div>
                  </div>
                  <SheetFooter className="mt-6">
                    <SheetClose asChild>
                      <Button variant="outline" type="button">Cancel</Button>
                    </SheetClose>
                    <Button 
                      onClick={() => handleAddPrice(() => close())} 
                      disabled={!newPrice.room_type || newPrice.price <= 0}
                    >
                      Save
                    </Button>
                  </SheetFooter>
                </SheetContent>
              </>
            )}
          </Sheet>
        </div>
      </div>

      {isPriceLoading || isLoadingRoomTypes ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : filteredPrices.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-lg text-muted-foreground">No pricing data found</p>
            <p className="text-sm text-muted-foreground mt-2">
              Try adjusting your filters or add new prices using the "Add Price" button.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Price List</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="table" className="w-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="table">Table View</TabsTrigger>
                  <TabsTrigger value="roomTypes">Room Type View</TabsTrigger>
                </TabsList>
                
                <TabsContent value="table" className="space-y-4">
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Room Type</TableHead>
                          <TableHead>Duration (days)</TableHead>
                          <TableHead className="text-right">Price (CHF)</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead className="w-[100px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredPrices.map((price) => (
                          <TableRow key={price.id}>
                            <TableCell>
                              {roomTypes.find(rt => rt.code === price.room_type)?.display_name || price.room_type}
                            </TableCell>
                            <TableCell>{price.duration}</TableCell>
                            <TableCell className="text-right font-mono">
                              {price.price.toFixed(2)}
                            </TableCell>
                            <TableCell>
                              {price.date ? format(new Date(price.date), "dd MMM yyyy") : "N/A"}
                            </TableCell>
                            <TableCell>
                              <Sheet>
                                {(close) => (
                                  <>
                                    <SheetTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setEditingPrice({...price})}
                                      >
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                    </SheetTrigger>
                                    {editingPrice && (
                                      <SheetContent className="sm:max-w-md">
                                        <SheetHeader>
                                          <SheetTitle>Edit Price</SheetTitle>
                                          <SheetDescription>
                                            Update the price details.
                                          </SheetDescription>
                                        </SheetHeader>
                                        <div className="mt-8 grid gap-4">
                                          <div className="grid gap-2">
                                            <label htmlFor="room_type">Room Type</label>
                                            <Select 
                                              value={editingPrice.room_type} 
                                              onValueChange={(value) => setEditingPrice({
                                                ...editingPrice,
                                                room_type: value
                                              })}
                                            >
                                              <SelectTrigger>
                                                <SelectValue placeholder="Select room type" />
                                              </SelectTrigger>
                                              <SelectContent>
                                                {roomTypes.map((roomType) => (
                                                  <SelectItem key={roomType.code} value={roomType.code}>
                                                    {roomType.display_name}
                                                  </SelectItem>
                                                ))}
                                              </SelectContent>
                                            </Select>
                                          </div>
                                          
                                          <div className="grid gap-2">
                                            <label htmlFor="duration">Stay Duration (days)</label>
                                            <Input
                                              type="number"
                                              value={editingPrice.duration}
                                              onChange={(e) => setEditingPrice({
                                                ...editingPrice,
                                                duration: Number(e.target.value)
                                              })}
                                              min={1}
                                            />
                                          </div>
                                          
                                          <div className="grid gap-2">
                                            <label htmlFor="price">Price (CHF)</label>
                                            <Input
                                              type="number"
                                              value={editingPrice.price}
                                              onChange={(e) => setEditingPrice({
                                                ...editingPrice,
                                                price: Number(e.target.value)
                                              })}
                                              min={0}
                                              step="0.01"
                                            />
                                          </div>
                                          
                                          <div className="grid gap-2">
                                            <label htmlFor="date">Date</label>
                                            <Input
                                              type="date"
                                              value={editingPrice.date || ""}
                                              disabled
                                            />
                                            <p className="text-xs text-muted-foreground">
                                              Date cannot be modified
                                            </p>
                                          </div>
                                        </div>
                                        <SheetFooter className="mt-6">
                                          <SheetClose asChild>
                                            <Button variant="outline" type="button">Cancel</Button>
                                          </SheetClose>
                                          <Button 
                                            onClick={() => handleUpdatePrice(() => close())}
                                            disabled={!editingPrice.room_type || editingPrice.price <= 0}
                                          >
                                            Update
                                          </Button>
                                        </SheetFooter>
                                      </SheetContent>
                                    )}
                                  </>
                                )}
                              </Sheet>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>
                
                <TabsContent value="roomTypes">
                  <div className="space-y-6">
                    {uniqueRoomTypes.length === 0 ? (
                      <p className="text-center text-muted-foreground">No room types found</p>
                    ) : (
                      uniqueRoomTypes.map((roomType) => (
                        <Card key={roomType} className="overflow-hidden">
                          <CardHeader className="bg-muted/50 py-3">
                            <CardTitle className="text-base">
                              {roomTypes.find(rt => rt.code === roomType)?.display_name || roomType}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-0">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Duration (days)</TableHead>
                                  <TableHead className="text-right">Price (CHF)</TableHead>
                                  <TableHead>Date</TableHead>
                                  <TableHead className="w-[100px]">Actions</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {pricesByRoomType[roomType]
                                  .sort((a, b) => a.duration - b.duration)
                                  .map((price) => (
                                  <TableRow key={price.id}>
                                    <TableCell>{price.duration}</TableCell>
                                    <TableCell className="text-right font-mono">
                                      {price.price.toFixed(2)}
                                    </TableCell>
                                    <TableCell>
                                      {price.date ? format(new Date(price.date), "dd MMM yyyy") : "N/A"}
                                    </TableCell>
                                    <TableCell>
                                      <Sheet>
                                        {(close) => (
                                          <>
                                            <SheetTrigger asChild>
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => setEditingPrice({...price})}
                                              >
                                                <Edit className="h-4 w-4" />
                                              </Button>
                                            </SheetTrigger>
                                            {editingPrice && editingPrice.id === price.id && (
                                              <SheetContent className="sm:max-w-md">
                                                <SheetHeader>
                                                  <SheetTitle>Edit Price</SheetTitle>
                                                  <SheetDescription>
                                                    Update the price details.
                                                  </SheetDescription>
                                                </SheetHeader>
                                                <div className="mt-8 grid gap-4">
                                                  <div className="grid gap-2">
                                                    <label htmlFor="room_type">Room Type</label>
                                                    <Select 
                                                      value={editingPrice.room_type} 
                                                      onValueChange={(value) => setEditingPrice({
                                                        ...editingPrice,
                                                        room_type: value
                                                      })}
                                                    >
                                                      <SelectTrigger>
                                                        <SelectValue placeholder="Select room type" />
                                                      </SelectTrigger>
                                                      <SelectContent>
                                                        {roomTypes.map((roomType) => (
                                                          <SelectItem key={roomType.code} value={roomType.code}>
                                                            {roomType.display_name}
                                                          </SelectItem>
                                                        ))}
                                                      </SelectContent>
                                                    </Select>
                                                  </div>
                                                  
                                                  <div className="grid gap-2">
                                                    <label htmlFor="duration">Stay Duration (days)</label>
                                                    <Input
                                                      type="number"
                                                      value={editingPrice.duration}
                                                      onChange={(e) => setEditingPrice({
                                                        ...editingPrice,
                                                        duration: Number(e.target.value)
                                                      })}
                                                      min={1}
                                                    />
                                                  </div>
                                                  
                                                  <div className="grid gap-2">
                                                    <label htmlFor="price">Price (CHF)</label>
                                                    <Input
                                                      type="number"
                                                      value={editingPrice.price}
                                                      onChange={(e) => setEditingPrice({
                                                        ...editingPrice,
                                                        price: Number(e.target.value)
                                                      })}
                                                      min={0}
                                                      step="0.01"
                                                    />
                                                  </div>
                                                </div>
                                                <SheetFooter className="mt-6">
                                                  <SheetClose asChild>
                                                    <Button variant="outline" type="button">Cancel</Button>
                                                  </SheetClose>
                                                  <Button 
                                                    onClick={() => handleUpdatePrice(() => close())}
                                                    disabled={!editingPrice.room_type || editingPrice.price <= 0}
                                                  >
                                                    Update
                                                  </Button>
                                                </SheetFooter>
                                              </SheetContent>
                                            )}
                                          </>
                                        )}
                                      </Sheet>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Pricing;

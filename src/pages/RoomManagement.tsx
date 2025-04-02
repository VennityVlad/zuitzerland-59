
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import PageTitle from "@/components/PageTitle";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ApartmentList from "@/components/room-management/ApartmentList";
import RoomAssignments from "@/components/room-management/RoomAssignments";
import { toast } from "@/hooks/use-toast";

const RoomManagement = () => {
  const { data: apartments, isLoading: isLoadingApartments, error: apartmentsError } = useQuery({
    queryKey: ['apartments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('apartments')
        .select('*')
        .order('name');
      
      if (error) {
        console.error('Error fetching apartments:', error);
        toast({
          title: "Error",
          description: "Could not load apartments. Please try again.",
          variant: "destructive",
        });
        throw error;
      }
      
      return data || [];
    }
  });

  return (
    <div className="container mx-auto py-8 px-4">
      <PageTitle title="Room Management" />
      
      <Tabs defaultValue="apartments" className="mt-6">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="apartments">Apartments & Rooms</TabsTrigger>
          <TabsTrigger value="assignments">Room Assignments</TabsTrigger>
        </TabsList>
        
        <TabsContent value="apartments">
          <ApartmentList apartments={apartments || []} isLoading={isLoadingApartments} />
        </TabsContent>
        
        <TabsContent value="assignments">
          <RoomAssignments />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RoomManagement;

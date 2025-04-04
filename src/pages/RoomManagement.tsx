
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageTitle } from "@/components/PageTitle";
import RoomsPage from "./rooms/RoomsPage";
import AssignmentsPage from "./rooms/AssignmentsPage";

const RoomManagement = () => {
  const [activeTab, setActiveTab] = useState("rooms");

  return (
    <div className="container py-6 space-y-6">
      <PageTitle title="Room Management" />
      
      <Tabs defaultValue="rooms" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full md:w-[400px] grid-cols-2">
          <TabsTrigger value="rooms">Apartments</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
        </TabsList>
        
        <TabsContent value="rooms" className="mt-6">
          <RoomsPage />
        </TabsContent>
        
        <TabsContent value="assignments" className="mt-6">
          <AssignmentsPage />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RoomManagement;


import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Calendar, Grid } from "lucide-react";
import AssignmentGrid from "@/components/rooms/AssignmentGrid";
import RoomAssignments from "@/components/rooms/RoomAssignments";

const AssignmentsPage = () => {
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid");

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Room Assignments</h2>
        
        <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as "list" | "grid")} className="w-[250px]">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="grid">
              <Grid className="h-4 w-4 mr-2" />
              Grid
            </TabsTrigger>
            <TabsTrigger value="list">
              <Calendar className="h-4 w-4 mr-2" />
              List
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <Card>
        <CardContent className="p-4">
          <TabsContent value="grid" className="mt-0">
            <AssignmentGrid />
          </TabsContent>
          
          <TabsContent value="list" className="mt-0">
            <RoomAssignments />
          </TabsContent>
        </CardContent>
      </Card>
    </div>
  );
};

export default AssignmentsPage;

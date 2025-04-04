
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Calendar, User, BedDouble, Home, Building } from "lucide-react";

type Assignment = {
  id: string;
  profile_id: string;
  apartment_id: string | null;
  bedroom_id: string | null;
  bed_id: string | null;
  start_date: string;
  end_date: string;
  notes: string | null;
  apartment: {
    name: string;
  } | null;
  bedroom: {
    name: string;
  } | null;
  bed: {
    name: string;
    bed_type: string;
  } | null;
  profile: {
    full_name: string | null;
    email: string | null;
  };
};

type AssignmentCardProps = {
  assignment: Assignment;
  onDelete: () => void;
};

const AssignmentCard = ({ assignment, onDelete }: AssignmentCardProps) => {
  return (
    <Card>
      <CardContent className="p-0">
        <div className="grid grid-cols-[1fr_auto] border-b">
          <div className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <User className="h-4 w-4 text-primary" />
              <h3 className="font-medium">
                {assignment.profile.full_name || assignment.profile.email || "Unnamed user"}
              </h3>
            </div>
            
            {assignment.profile.email && (
              <p className="text-sm text-muted-foreground mb-2">{assignment.profile.email}</p>
            )}
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Check-in</p>
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-muted-foreground" />
                  <span>{format(new Date(assignment.start_date), 'MMM d, yyyy')}</span>
                </div>
              </div>
              
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Check-out</p>
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-muted-foreground" />
                  <span>{format(new Date(assignment.end_date), 'MMM d, yyyy')}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center p-4">
            <Button variant="ghost" size="sm" onClick={onDelete}>
              Delete
            </Button>
          </div>
        </div>
        
        <div className="p-4 bg-muted/30">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Room</p>
              <div className="flex items-center gap-1">
                <Building className="h-3 w-3 text-muted-foreground" />
                <span>{assignment.apartment?.name || "Not assigned"}</span>
              </div>
            </div>
            
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Bedroom</p>
              <div className="flex items-center gap-1">
                <Home className="h-3 w-3 text-muted-foreground" />
                <span>{assignment.bedroom?.name || "Not assigned"}</span>
              </div>
            </div>
            
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Bed</p>
              <div className="flex items-center gap-1">
                <BedDouble className="h-3 w-3 text-muted-foreground" />
                <span>{assignment.bed?.name || "Not assigned"}</span>
                {assignment.bed?.bed_type && (
                  <span className="text-xs px-1 py-0.5 bg-primary/10 text-primary rounded ml-1">
                    {assignment.bed.bed_type}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          {assignment.notes && (
            <div className="mt-3">
              <p className="text-xs text-muted-foreground">Notes</p>
              <p className="text-sm">{assignment.notes}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AssignmentCard;

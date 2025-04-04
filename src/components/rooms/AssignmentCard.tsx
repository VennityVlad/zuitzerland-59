
import { format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { CalendarDays, Building, BedDouble, Trash2, Edit } from "lucide-react";

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
  onEdit: () => void;
  onDelete: () => void;
};

const AssignmentCard = ({ assignment, onEdit, onDelete }: AssignmentCardProps) => {
  return (
    <Card className="overflow-hidden border-l-4 border-l-primary/70 hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar>
              <AvatarFallback>
                {assignment.profile.full_name?.charAt(0) || '?'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h4 className="font-semibold text-lg">
                {assignment.profile.full_name || "Unnamed"}
              </h4>
              <p className="text-sm text-muted-foreground">
                {assignment.profile.email || "No email"}
              </p>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <Button size="sm" variant="outline" onClick={onEdit}>
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Button>
            <Button size="sm" variant="outline" className="text-destructive hover:bg-destructive/10" onClick={onDelete}>
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Delete</span>
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div className="flex items-center gap-2">
            <Building className="h-4 w-4 text-primary" />
            <div className="text-sm">
              <p className="font-medium">Apartment</p>
              <p>{assignment.apartment?.name || "Not assigned"}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <BedDouble className="h-4 w-4 text-primary" />
            <div className="text-sm">
              <p className="font-medium">Room & Bed</p>
              <p>
                {assignment.bedroom?.name 
                  ? `${assignment.bedroom.name} (${assignment.bed?.name || 'No bed'})` 
                  : "Not assigned"}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-primary" />
            <div className="text-sm">
              <p className="font-medium">Stay Period</p>
              <p>
                {format(new Date(assignment.start_date), 'PP')} - {format(new Date(assignment.end_date), 'PP')}
              </p>
            </div>
          </div>
        </div>
        
        {assignment.notes && (
          <div className="mt-3 pt-3 border-t">
            <p className="text-sm font-medium">Notes</p>
            <p className="text-sm text-muted-foreground mt-1">{assignment.notes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AssignmentCard;

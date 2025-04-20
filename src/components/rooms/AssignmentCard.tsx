
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Trash, Calendar, User, Home, Building, BedDouble, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format, isValid } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type Assignment = {
  id: string;
  profile_id: string;
  location_id: string | null;
  bedroom_id: string | null;
  bed_id: string | null;
  start_date: string;
  end_date: string;
  notes: string | null;
  location: {
    name: string;
    type: string;
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
    avatar_url: string | null;
  };
};

type AssignmentCardProps = {
  assignment: Assignment;
  onEdit: () => void;
  onDelete: () => void;
};

const AssignmentCard: React.FC<AssignmentCardProps> = ({ assignment, onEdit, onDelete }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return isValid(date) ? format(date, "MMM d, yyyy") : "Invalid date";
  };

  const getLocationIcon = (type: string | undefined) => {
    if (!type) return <Building className="h-5 w-5 text-primary" />;
    
    switch (type.toLowerCase()) {
      case 'apartment':
        return <Home className="h-5 w-5 text-primary" />;
      case 'meeting room':
        return <MapPin className="h-5 w-5 text-indigo-500" />;
      default:
        return <Building className="h-5 w-5 text-primary" />;
    }
  };

  const getLocationTypeBadge = (type: string | undefined) => {
    if (!type) return null;
    
    switch (type.toLowerCase()) {
      case 'apartment':
        return <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-200">Apartment</Badge>;
      case 'meeting room':
        return <Badge variant="outline" className="bg-indigo-50 text-indigo-800 border-indigo-200">Meeting Room</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="flex flex-col-reverse sm:flex-row">
          {/* Assignment details */}
          <div className="flex-1 p-4 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={assignment.profile?.avatar_url || undefined} />
                  <AvatarFallback>
                    {assignment.profile?.full_name?.charAt(0) || '?'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold">{assignment.profile.full_name || "Unknown User"}</h3>
                  <p className="text-sm text-muted-foreground">{assignment.profile.email || ""}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="h-8" onClick={onEdit}>
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button variant="ghost" size="sm" className="h-8 text-destructive" onClick={onDelete}>
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-sm font-medium text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Date Range</span>
                </div>
                <p className="text-sm">
                  {formatDate(assignment.start_date)} - {formatDate(assignment.end_date)}
                </p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-1 text-sm font-medium text-muted-foreground">
                  {assignment.location?.type && getLocationIcon(assignment.location.type)}
                  <span>Location</span>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-sm">{assignment.location?.name || "No location"}</p>
                  {assignment.location?.type && getLocationTypeBadge(assignment.location.type)}
                </div>
              </div>

              {assignment.bedroom && (
                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-sm font-medium text-muted-foreground">
                    <BedDouble className="h-4 w-4" />
                    <span>Bed</span>
                  </div>
                  <p className="text-sm">
                    {assignment.bedroom.name} 
                    {assignment.bed && ` / ${assignment.bed.name} (${assignment.bed.bed_type})`}
                  </p>
                </div>
              )}
            </div>

            {assignment.notes && (
              <div className="mt-3 pt-3 border-t">
                <p className="text-sm text-muted-foreground">{assignment.notes}</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AssignmentCard;

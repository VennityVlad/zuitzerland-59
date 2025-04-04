
import { useState, useEffect } from "react";
import { format, addDays } from "date-fns";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, User, Building, BedDouble, Save } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
};

type Apartment = {
  id: string;
  name: string;
  bedrooms: {
    id: string;
    name: string;
    beds: {
      id: string;
      name: string;
      bed_type: string;
    }[];
  }[];
};

type Assignment = {
  id: string;
  profile_id: string;
  apartment_id: string | null;
  bedroom_id: string | null;
  bed_id: string | null;
  start_date: string;
  end_date: string;
  notes: string | null;
  apartment?: {
    name: string;
  } | null;
  bedroom?: {
    name: string;
  } | null;
  bed?: {
    name: string;
    bed_type: string;
  } | null;
  profile?: {
    full_name: string | null;
    email: string | null;
  };
};

type EditAssignmentPanelProps = {
  assignment: Assignment | null;
  initialData?: {
    profileId?: string;
    apartmentId?: string;
    bedroomId?: string;
    bedId?: string;
    startDate?: Date;
    endDate?: Date;
  } | null;
  onClose: () => void;
};

const EditAssignmentPanel = ({ assignment, initialData, onClose }: EditAssignmentPanelProps) => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [bedrooms, setBedrooms] = useState<Apartment["bedrooms"][0][]>([]);
  const [beds, setBeds] = useState<Apartment["bedrooms"][0]["beds"]>([]);

  const [profileId, setProfileId] = useState<string>("");
  const [apartmentId, setApartmentId] = useState<string>("");
  const [bedroomId, setBedroomId] = useState<string>("");
  const [bedId, setBedId] = useState<string>("");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [notes, setNotes] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { toast } = useToast();
  const isEditMode = !!assignment;

  const title = isEditMode ? "Edit Room Assignment" : "Create Room Assignment";
  const description = isEditMode 
    ? "Make changes to the existing room assignment." 
    : "Create a new room assignment for a profile.";

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await Promise.all([
        fetchProfiles(),
        fetchApartments()
      ]);
      setLoading(false);
    };

    fetchData();
  }, []);

  useEffect(() => {
    // For edit mode, set the initial values from the assignment
    if (assignment) {
      setProfileId(assignment.profile_id);
      if (assignment.apartment_id) setApartmentId(assignment.apartment_id);
      if (assignment.bedroom_id) setBedroomId(assignment.bedroom_id);
      if (assignment.bed_id) setBedId(assignment.bed_id);
      setStartDate(new Date(assignment.start_date));
      setEndDate(new Date(assignment.end_date));
      setNotes(assignment.notes || "");
    } 
    // For create mode with initialData
    else if (initialData) {
      if (initialData.profileId) setProfileId(initialData.profileId);
      if (initialData.apartmentId) setApartmentId(initialData.apartmentId);
      if (initialData.bedroomId) setBedroomId(initialData.bedroomId);
      if (initialData.bedId) setBedId(initialData.bedId);
      if (initialData.startDate) setStartDate(initialData.startDate);
      if (initialData.endDate) setEndDate(initialData.endDate);
    }
  }, [assignment, initialData]);

  useEffect(() => {
    if (apartmentId) {
      const selectedApartment = apartments.find(apt => apt.id === apartmentId);
      setBedrooms(selectedApartment?.bedrooms || []);
      if (!selectedApartment?.bedrooms.some(br => br.id === bedroomId)) {
        setBedroomId("");
        setBedId("");
      }
    } else {
      setBedrooms([]);
      setBedroomId("");
      setBedId("");
    }
  }, [apartmentId, apartments, bedroomId]);

  useEffect(() => {
    if (bedroomId) {
      const selectedBedroom = bedrooms.find(br => br.id === bedroomId);
      setBeds(selectedBedroom?.beds || []);
      if (!selectedBedroom?.beds.some(bed => bed.id === bedId)) {
        setBedId("");
      }
    } else {
      setBeds([]);
      setBedId("");
    }
  }, [bedroomId, bedrooms, bedId]);

  const fetchProfiles = async () => {
    try {
      // Only fetch profiles that don't already have an assignment if creating new
      let query = supabase
        .from('profiles')
        .select('id, full_name, email')
        .order('full_name');
      
      if (!isEditMode) {
        // Get all profile IDs that already have assignments
        const { data: assignedProfiles, error: assignedError } = await supabase
          .from('room_assignments')
          .select('profile_id');
        
        if (!assignedError && assignedProfiles) {
          const assignedIds = assignedProfiles.map(ap => ap.profile_id);
          if (assignedIds.length > 0) {
            query = query.not('id', 'in', assignedIds);
          }
        }
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      setProfiles(data || []);
    } catch (error: any) {
      console.error("Error fetching profiles:", error);
      toast({
        variant: "destructive",
        title: "Error fetching profiles",
        description: error.message,
      });
    }
  };

  const fetchApartments = async () => {
    try {
      const { data, error } = await supabase
        .from('apartments')
        .select(`
          id, 
          name,
          bedrooms:bedrooms (
            id, 
            name,
            beds:beds (
              id, 
              name,
              bed_type
            )
          )
        `)
        .order('name');
      
      if (error) throw error;
      
      setApartments(data || []);
    } catch (error: any) {
      console.error("Error fetching apartments:", error);
      toast({
        variant: "destructive",
        title: "Error fetching apartments",
        description: error.message,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      if (isEditMode) {
        // Update existing assignment
        const { error } = await supabase
          .from('room_assignments')
          .update({
            profile_id: profileId,
            apartment_id: apartmentId,
            bedroom_id: bedroomId || null,
            bed_id: bedId || null,
            start_date: startDate?.toISOString().split('T')[0],
            end_date: endDate?.toISOString().split('T')[0],
            notes: notes || null,
          })
          .eq('id', assignment?.id);
        
        if (error) throw error;
        
        toast({
          title: "Assignment updated",
          description: "The room assignment has been updated successfully.",
        });
      } else {
        // Create new assignment
        const { error } = await supabase
          .from('room_assignments')
          .insert({
            profile_id: profileId,
            apartment_id: apartmentId,
            bedroom_id: bedroomId || null,
            bed_id: bedId || null,
            start_date: startDate?.toISOString().split('T')[0],
            end_date: endDate?.toISOString().split('T')[0],
            notes: notes || null,
          });
        
        if (error) throw error;
        
        toast({
          title: "Assignment created",
          description: "The room assignment has been created successfully.",
        });
      }
      
      onClose();
    } catch (error: any) {
      console.error("Error saving assignment:", error);
      toast({
        variant: "destructive",
        title: `Error ${isEditMode ? 'updating' : 'creating'} assignment`,
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const validateForm = () => {
    if (!profileId) {
      toast({
        variant: "destructive",
        title: "Missing profile",
        description: "Please select a profile for this assignment.",
      });
      return false;
    }
    
    if (!apartmentId) {
      toast({
        variant: "destructive",
        title: "Missing apartment",
        description: "Please select an apartment for this assignment.",
      });
      return false;
    }
    
    if (!startDate || !endDate) {
      toast({
        variant: "destructive",
        title: "Missing dates",
        description: "Please select both start and end dates for this assignment.",
      });
      return false;
    }
    
    if (endDate < startDate) {
      toast({
        variant: "destructive",
        title: "Invalid dates",
        description: "End date must be after start date.",
      });
      return false;
    }
    
    return true;
  };

  return (
    <>
      <SheetHeader className="pb-4">
        <SheetTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          {title}
        </SheetTitle>
        <SheetDescription>{description}</SheetDescription>
      </SheetHeader>
      
      <form onSubmit={handleSubmit} className="space-y-6 py-4">
        <ScrollArea className="h-[calc(100vh-240px)] pr-4">
          <div className="space-y-6">
            {/* Profile selection */}
            <div className="space-y-2">
              <Label htmlFor="profile-select" className="flex items-center gap-1">
                <User className="h-4 w-4" />
                Profile
              </Label>
              <Select 
                value={profileId}
                onValueChange={setProfileId}
                disabled={isEditMode || loading}
              >
                <SelectTrigger id="profile-select">
                  <SelectValue placeholder="Select a profile" />
                </SelectTrigger>
                <SelectContent>
                  {profiles.map(profile => (
                    <SelectItem key={profile.id} value={profile.id}>
                      {profile.full_name || profile.email || "Unnamed profile"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Apartment selection */}
            <div className="space-y-2">
              <Label htmlFor="apartment-select" className="flex items-center gap-1">
                <Building className="h-4 w-4" />
                Apartment
              </Label>
              <Select 
                value={apartmentId}
                onValueChange={setApartmentId}
                disabled={loading}
              >
                <SelectTrigger id="apartment-select">
                  <SelectValue placeholder="Select an apartment" />
                </SelectTrigger>
                <SelectContent>
                  {apartments.map(apartment => (
                    <SelectItem key={apartment.id} value={apartment.id}>
                      {apartment.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Bedroom selection */}
            <div className="space-y-2">
              <Label htmlFor="bedroom-select" className="flex items-center gap-1">
                <BedDouble className="h-4 w-4" />
                Bedroom
              </Label>
              <Select 
                value={bedroomId}
                onValueChange={setBedroomId}
                disabled={!apartmentId || bedrooms.length === 0 || loading}
              >
                <SelectTrigger id="bedroom-select">
                  <SelectValue placeholder={bedrooms.length === 0 ? "No bedrooms available" : "Select a bedroom"} />
                </SelectTrigger>
                <SelectContent>
                  {bedrooms.map(bedroom => (
                    <SelectItem key={bedroom.id} value={bedroom.id}>
                      {bedroom.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Bed selection */}
            <div className="space-y-2">
              <Label htmlFor="bed-select" className="flex items-center gap-1">
                <BedDouble className="h-4 w-4" />
                Bed
              </Label>
              <Select 
                value={bedId}
                onValueChange={setBedId}
                disabled={!bedroomId || beds.length === 0 || loading}
              >
                <SelectTrigger id="bed-select">
                  <SelectValue placeholder={beds.length === 0 ? "No beds available" : "Select a bed"} />
                </SelectTrigger>
                <SelectContent>
                  {beds.map(bed => (
                    <SelectItem key={bed.id} value={bed.id}>
                      {bed.name} ({bed.bed_type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Date selections */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Start Date
                </Label>
                <DatePicker
                  date={startDate}
                  onDateChange={setStartDate}
                  disabled={loading}
                />
              </div>
              
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  End Date
                </Label>
                <DatePicker
                  date={endDate}
                  onDateChange={setEndDate}
                  disabled={loading}
                />
              </div>
            </div>
            
            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes" className="flex items-center gap-1">
                Notes (optional)
              </Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any additional notes about this assignment"
                disabled={loading}
                rows={3}
              />
            </div>
          </div>
        </ScrollArea>
        
        <SheetFooter>
          <Button 
            type="button" 
            variant="outline" 
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            type="submit"
            disabled={loading || isSubmitting}
          >
            <Save className="h-4 w-4 mr-2" />
            {isSubmitting ? "Saving..." : isEditMode ? "Update Assignment" : "Create Assignment"}
          </Button>
        </SheetFooter>
      </form>
    </>
  );
};

export default EditAssignmentPanel;

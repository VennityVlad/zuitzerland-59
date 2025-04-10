
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { format, parse } from "date-fns";
import { useToast } from "@/components/ui/use-toast";
import { CalendarIcon, Loader2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type Assignment = {
  id: string;
  profile_id: string;
  apartment_id: string;
  bedroom_id: string | null;
  bed_id: string | null;
  start_date: string;
  end_date: string;
  notes: string | null;
  profile: {
    full_name: string | null;
    avatar_url: string | null;
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
  onClose: (wasChanged?: boolean) => void;
};

const EditAssignmentPanel = ({ assignment, initialData, onClose }: EditAssignmentPanelProps) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [apartments, setApartments] = useState<any[]>([]);
  const [bedrooms, setBedrooms] = useState<any[]>([]);
  const [beds, setBeds] = useState<any[]>([]);
  
  const [selectedProfileId, setSelectedProfileId] = useState<string | undefined>(
    assignment?.profile_id || initialData?.profileId
  );
  const [selectedApartmentId, setSelectedApartmentId] = useState<string | undefined>(
    assignment?.apartment_id || initialData?.apartmentId
  );
  const [selectedBedroomId, setSelectedBedroomId] = useState<string | undefined>(
    assignment?.bedroom_id || initialData?.bedroomId
  );
  const [selectedBedId, setSelectedBedId] = useState<string | undefined>(
    assignment?.bed_id || initialData?.bedId
  );
  const [startDate, setStartDate] = useState<Date | undefined>(
    assignment ? new Date(assignment.start_date) : initialData?.startDate
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    assignment ? new Date(assignment.end_date) : initialData?.endDate
  );
  const [notes, setNotes] = useState<string>(assignment?.notes || '');
  
  const { toast } = useToast();
  
  console.log("Initial assignment data:", { assignment, initialData });
  
  useEffect(() => {
    fetchFormData();
    
    // Set initial form state when assignment or initialData changes
    if (assignment) {
      setSelectedProfileId(assignment.profile_id);
      setSelectedApartmentId(assignment.apartment_id);
      setSelectedBedroomId(assignment.bedroom_id || undefined);
      setSelectedBedId(assignment.bed_id || undefined);
      setStartDate(new Date(assignment.start_date));
      setEndDate(new Date(assignment.end_date));
      setNotes(assignment.notes || '');
    } else if (initialData) {
      setSelectedProfileId(initialData.profileId);
      setSelectedApartmentId(initialData.apartmentId);
      setSelectedBedroomId(initialData.bedroomId);
      setSelectedBedId(initialData.bedId);
      setStartDate(initialData.startDate);
      setEndDate(initialData.endDate);
    }
  }, [assignment, initialData]);
  
  const fetchFormData = async () => {
    setLoading(true);
    try {
      // Fetch profiles with paid invoices first
      const { data: profilesWithPaidInvoices, error: invoiceError } = await supabase
        .from('invoices')
        .select('profile_id')
        .eq('status', 'paid')
        .not('profile_id', 'is', null);
      
      if (invoiceError) throw invoiceError;
      
      const paidProfileIds = profilesWithPaidInvoices
        .map(invoice => invoice.profile_id)
        .filter(Boolean)
        .filter((value, index, self) => self.indexOf(value) === index); // Remove duplicates
      
      let profilesQuery = supabase
        .from('profiles')
        .select('id, full_name, avatar_url, email')
        .order('full_name');
      
      // If we have a specific profile ID from the assignment, include it regardless
      if (selectedProfileId && !paidProfileIds.includes(selectedProfileId)) {
        paidProfileIds.push(selectedProfileId);
      }
      
      // Only fetch profiles with paid invoices
      if (paidProfileIds.length > 0) {
        profilesQuery = profilesQuery.in('id', paidProfileIds);
      }
      
      const { data: profilesData, error: profilesError } = await profilesQuery;
      
      if (profilesError) throw profilesError;
      
      const { data: apartmentsData, error: apartmentsError } = await supabase
        .from('apartments')
        .select('id, name')
        .order('name');
      
      if (apartmentsError) throw apartmentsError;

      setProfiles(profilesData || []);
      setApartments(apartmentsData || []);
      
      if (selectedApartmentId) {
        await fetchBedroomsByApartment(selectedApartmentId);
      }
      
      if (selectedBedroomId) {
        await fetchBedsByBedroom(selectedBedroomId);
      }
      
      setLoading(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error fetching data",
        description: error.message,
      });
      setLoading(false);
    }
  };
  
  const fetchBedroomsByApartment = async (apartmentId: string) => {
    try {
      console.log("Fetching bedrooms for apartment:", apartmentId);
      const { data, error } = await supabase
        .from('bedrooms')
        .select('id, name')
        .eq('apartment_id', apartmentId)
        .order('name');
      
      if (error) throw error;
      
      console.log("Bedrooms fetched:", data);
      setBedrooms(data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error fetching bedrooms",
        description: error.message,
      });
    }
  };
  
  const fetchBedsByBedroom = async (bedroomId: string) => {
    try {
      console.log("Fetching beds for bedroom:", bedroomId);
      const { data, error } = await supabase
        .from('beds')
        .select('id, name, bed_type')
        .eq('bedroom_id', bedroomId)
        .order('name');
      
      if (error) throw error;
      
      console.log("Beds fetched:", data);
      setBeds(data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error fetching beds",
        description: error.message,
      });
    }
  };
  
  const handleApartmentChange = async (apartmentId: string) => {
    setSelectedApartmentId(apartmentId);
    setSelectedBedroomId(undefined);
    setSelectedBedId(undefined);
    setBedrooms([]);
    setBeds([]);
    await fetchBedroomsByApartment(apartmentId);
  };
  
  const handleBedroomChange = async (bedroomId: string) => {
    setSelectedBedroomId(bedroomId);
    setSelectedBedId(undefined);
    setBeds([]);
    await fetchBedsByBedroom(bedroomId);
  };
  
  const saveAssignment = async () => {
    if (!selectedProfileId || !selectedApartmentId || !selectedBedroomId || !selectedBedId || !startDate || !endDate) {
      toast({
        variant: "destructive",
        title: "Missing information",
        description: "Please fill out all required fields.",
      });
      return;
    }
    
    setSaving(true);
    try {
      // Format dates correctly for database using local date string format YYYY-MM-DD
      const formattedStartDate = format(startDate, 'yyyy-MM-dd');
      const formattedEndDate = format(endDate, 'yyyy-MM-dd');
      
      const assignmentData = {
        profile_id: selectedProfileId,
        apartment_id: selectedApartmentId,
        bedroom_id: selectedBedroomId,
        bed_id: selectedBedId,
        start_date: formattedStartDate,
        end_date: formattedEndDate,
        notes: notes || null
      };
      
      console.log("Saving assignment:", assignmentData);
      
      if (assignment) {
        // Update existing assignment
        const { error } = await supabase
          .from('room_assignments')
          .update(assignmentData)
          .eq('id', assignment.id);
        
        if (error) throw error;
        
        toast({
          title: "Assignment updated",
          description: "The assignment has been updated successfully.",
        });
      } else {
        // Create new assignment
        const { error } = await supabase
          .from('room_assignments')
          .insert([assignmentData]);
        
        if (error) throw error;
        
        toast({
          title: "Assignment created",
          description: "The assignment has been created successfully.",
        });
      }
      
      setSaving(false);
      onClose(true); // Pass true to indicate changes were made
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error saving assignment",
        description: error.message,
      });
      setSaving(false);
    }
  };
  
  const deleteAssignment = async () => {
    if (!assignment) return;
    if (!confirm("Are you sure you want to delete this assignment?")) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('room_assignments')
        .delete()
        .eq('id', assignment.id);
      
      if (error) throw error;
      
      toast({
        title: "Assignment deleted",
        description: "The assignment has been deleted successfully.",
      });
      
      setSaving(false);
      onClose(true); // Pass true to indicate changes were made
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error deleting assignment",
        description: error.message,
      });
      setSaving(false);
    }
  };
  
  // Find the selected profile
  const selectedProfile = profiles.find(profile => profile.id === selectedProfileId);
  // Find apartment and bedroom details for display
  const selectedApartment = apartments.find(apt => apt.id === selectedApartmentId);
  const selectedBedroom = bedrooms.find(bedroom => bedroom.id === selectedBedroomId);
  const selectedBed = beds.find(bed => bed.id === selectedBedId);

  // Handle the button click event properly
  const handleCancelClick = () => {
    onClose(false);
  };
  
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">
          {assignment ? "Edit Assignment" : "Create Assignment"}
        </h2>
        <p className="text-muted-foreground">
          {assignment ? "Modify the room assignment details" : "Assign a person to a room"}
        </p>
      </div>
      
      {loading ? (
        <div className="flex justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <div className="space-y-6 overflow-y-auto max-h-[calc(100vh-200px)]">
          {/* Profile Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="profile">Person</Label>
              {selectedProfile && (
                <div className="flex items-center gap-2 bg-muted px-2 py-1 rounded">
                  <Avatar className="h-5 w-5">
                    <AvatarImage src={selectedProfile.avatar_url || undefined} />
                    <AvatarFallback className="text-xs">
                      {selectedProfile.full_name?.charAt(0) || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">{selectedProfile.full_name}</span>
                  <span className="text-xs text-muted-foreground">{selectedProfile.email}</span>
                </div>
              )}
            </div>
            <Select
              value={selectedProfileId}
              onValueChange={setSelectedProfileId}
              disabled={!!assignment || profiles.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a person" />
              </SelectTrigger>
              <SelectContent>
                {profiles.length === 0 ? (
                  <div className="p-2 text-center text-sm text-muted-foreground">
                    No profiles with paid invoices available
                  </div>
                ) : (
                  profiles.map(profile => (
                    <SelectItem key={profile.id} value={profile.id}>
                      <div className="flex items-center gap-2">
                        <span>{profile.full_name}</span>
                        <span className="text-xs text-muted-foreground">({profile.email})</span>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          
          {/* Apartment Selection */}
          <div className="space-y-2">
            <Label htmlFor="apartment">Apartment</Label>
            <Select
              value={selectedApartmentId}
              onValueChange={handleApartmentChange}
              disabled={apartments.length === 0}
            >
              <SelectTrigger>
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
          
          {/* Bedroom Selection */}
          <div className="space-y-2">
            <Label htmlFor="bedroom">Bedroom</Label>
            <Select
              value={selectedBedroomId}
              onValueChange={handleBedroomChange}
              disabled={bedrooms.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a bedroom" />
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
          
          {/* Bed Selection */}
          <div className="space-y-2">
            <Label htmlFor="bed">Bed</Label>
            <Select
              value={selectedBedId}
              onValueChange={setSelectedBedId}
              disabled={beds.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a bed" />
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
          
          {/* Date Range Selection */}
          <div className="space-y-2">
            <Label>Date Range</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Start Date</p>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left truncate"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
                      {startDate ? (
                        <span className="truncate">{format(startDate, "MMMM d, yyyy")}</span>
                      ) : (
                        <span>Select start date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">End Date</p>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left truncate"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
                      {endDate ? (
                        <span className="truncate">{format(endDate, "MMMM d, yyyy")}</span>
                      ) : (
                        <span>Select end date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      disabled={(date) => (
                        startDate ? date < startDate : false
                      )}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
          
          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Add any additional notes here..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          
          {/* Action Buttons - Updated layout with Delete button in a separate row */}
          <div className="flex flex-col space-y-4">
            {/* Cancel/Update buttons */}
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={handleCancelClick} 
                disabled={saving}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button 
                onClick={saveAssignment} 
                disabled={saving}
                className="w-full sm:w-auto"
              >
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {assignment ? "Update" : "Create"} Assignment
              </Button>
            </div>
            
            {/* Delete button in a separate row */}
            {assignment && (
              <div className="border-t pt-4">
                <Button
                  variant="destructive"
                  onClick={deleteAssignment}
                  disabled={saving}
                  className="w-full sm:w-auto"
                >
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Delete Assignment
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EditAssignmentPanel;

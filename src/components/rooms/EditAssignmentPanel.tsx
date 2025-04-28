import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { useToast } from "@/components/ui/use-toast";
import { CalendarIcon, Loader2, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type Assignment = {
  id: string;
  location_id: string;
  bedroom_id: string | null;
  bed_id: string | null;
  start_date: string;
  end_date: string;
  notes: string | null;
  profiles?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    email: string | null;
  }[];
};

type EditAssignmentPanelProps = {
  assignment: Assignment | null;
  initialData?: {
    profileId?: string;
    locationId?: string;
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
  const [locations, setLocations] = useState<any[]>([]);
  const [bedrooms, setBedrooms] = useState<any[]>([]);
  const [beds, setBeds] = useState<any[]>([]);
  
  const [selectedLocationId, setSelectedLocationId] = useState<string | undefined>(
    assignment?.location_id || initialData?.locationId
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
  const [selectedProfileIds, setSelectedProfileIds] = useState<string[]>(
    assignment?.profiles?.map(p => p.id) || 
    (initialData?.profileId ? [initialData.profileId] : [])
  );
  
  const { toast } = useToast();
  
  console.log("Initial assignment data:", { assignment, initialData });
  
  useEffect(() => {
    fetchFormData();
    
    // Set initial form state when assignment or initialData changes
    if (assignment) {
      //setSelectedProfileId(assignment.profile_id);
      setSelectedLocationId(assignment.location_id);
      setSelectedBedroomId(assignment.bedroom_id || undefined);
      setSelectedBedId(assignment.bed_id || undefined);
      setStartDate(new Date(assignment.start_date));
      setEndDate(new Date(assignment.end_date));
      setNotes(assignment.notes || '');
      const fetchAssignmentProfiles = async () => {
        const { data: assignmentProfiles } = await supabase
          .from('room_assignment_profiles')
          .select('profile_id')
          .eq('room_assignment_id', assignment.id);
        
        if (assignmentProfiles) {
          setSelectedProfileIds(assignmentProfiles.map(ap => ap.profile_id));
        }
      }
      fetchAssignmentProfiles();
    } else if (initialData) {
      //setSelectedProfileId(initialData.profileId);
      setSelectedLocationId(initialData.locationId);
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
      if (selectedProfileIds && selectedProfileIds.length > 0) {
        selectedProfileIds.forEach(selectedProfileId => {
          if (selectedProfileId && !paidProfileIds.includes(selectedProfileId)) {
            paidProfileIds.push(selectedProfileId);
          }
        });
      }
      
      // Only fetch profiles with paid invoices
      if (paidProfileIds.length > 0) {
        profilesQuery = profilesQuery.in('id', paidProfileIds);
      }
      
      const { data: profilesData, error: profilesError } = await profilesQuery;
      
      if (profilesError) throw profilesError;
      
      const { data: locationsData, error: locationsError } = await supabase
        .from('locations')
        .select('id, name')
        .order('name');
      
      if (locationsError) throw locationsError;

      setProfiles(profilesData || []);
      setLocations(locationsData || []);
      
      if (selectedLocationId) {
        await fetchBedroomsByLocation(selectedLocationId);
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
  
  const fetchBedroomsByLocation = async (locationId: string) => {
    try {
      console.log("Fetching bedrooms for location:", locationId);
      const { data, error } = await supabase
        .from('bedrooms')
        .select('id, name')
        .eq('location_id', locationId)
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
  
  const handleLocationChange = async (locationId: string) => {
    setSelectedLocationId(locationId);
    setSelectedBedroomId(undefined);
    setSelectedBedId(undefined);
    setBedrooms([]);
    setBeds([]);
    await fetchBedroomsByLocation(locationId);
  };
  
  const handleBedroomChange = async (bedroomId: string) => {
    setSelectedBedroomId(bedroomId);
    setSelectedBedId(undefined);
    setBeds([]);
    await fetchBedsByBedroom(bedroomId);
  };
  
  const saveAssignment = async () => {
    if (!selectedProfileIds.length || !selectedLocationId || !startDate || !endDate) {
      toast({
        variant: "destructive",
        title: "Missing information",
        description: "Please fill out all required fields and select at least one profile.",
      });
      return;
    }
    
    setSaving(true);
    try {
      // Format dates correctly for database using local date string format YYYY-MM-DD
      const formattedStartDate = format(startDate, 'yyyy-MM-dd');
      const formattedEndDate = format(endDate, 'yyyy-MM-dd');
      
      const assignmentData = {
        location_id: selectedLocationId,
        bedroom_id: selectedBedroomId,
        bed_id: selectedBedId,
        start_date: formattedStartDate,
        end_date: formattedEndDate,
        notes: notes || null
      };
      
      let assignmentId;
      if (assignment) {
        // Update existing assignment
        const { error: updateError } = await supabase
          .from('room_assignments')
          .update(assignmentData)
          .eq('id', assignment.id);
        
        if (updateError) throw updateError;
        assignmentId = assignment.id;
      } else {
        // Create new assignment
        const { data: newAssignment, error: createError } = await supabase
          .from('room_assignments')
          .insert([assignmentData])
          .select()
          .single();
        
        if (createError) throw createError;
        assignmentId = newAssignment.id;
      }

      // Update profile assignments
      if (assignment) {
        // Delete existing profile assignments
        await supabase
          .from('room_assignment_profiles')
          .delete()
          .eq('room_assignment_id', assignmentId);
      }

      // Insert new profile assignments
      const { error: profileError } = await supabase
        .from('room_assignment_profiles')
        .insert(
          selectedProfileIds.map(profileId => ({
            room_assignment_id: assignmentId,
            profile_id: profileId
          }))
        );
      
      if (profileError) throw profileError;
      
      toast({
        title: "Success",
        description: assignment ? "Assignment updated successfully" : "Assignment created successfully",
      });
      
      setSaving(false);
      onClose(true);
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
  //const selectedProfile = profiles.find(profile => profile.id === selectedProfileId);
  // Find location and bedroom details for display
  const selectedLocation = locations.find(loc => loc.id === selectedLocationId);
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
            <Label>Assigned Profiles</Label>
            <div className="space-y-2">
              {selectedProfileIds.map(profileId => {
                const profile = profiles.find(p => p.id === profileId);
                return profile ? (
                  <div key={profile.id} className="flex items-center justify-between p-2 border rounded-md">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={profile.avatar_url || undefined} />
                        <AvatarFallback>{profile.full_name?.charAt(0) || '?'}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{profile.full_name}</p>
                        <p className="text-xs text-muted-foreground">{profile.email}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedProfileIds(prev => prev.filter(id => id !== profile.id))}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : null;
              })}
              
              <Select
                onValueChange={value => {
                  if (!selectedProfileIds.includes(value)) {
                    setSelectedProfileIds(prev => [...prev, value]);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Add a profile..." />
                </SelectTrigger>
                <SelectContent>
                  {profiles
                    .filter(profile => !selectedProfileIds.includes(profile.id))
                    .map(profile => (
                      <SelectItem key={profile.id} value={profile.id}>
                        <div className="flex items-center gap-2">
                          <span>{profile.full_name}</span>
                          <span className="text-xs text-muted-foreground">({profile.email})</span>
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Location Selection */}
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Select
              value={selectedLocationId}
              onValueChange={handleLocationChange}
              disabled={locations.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a location" />
              </SelectTrigger>
              <SelectContent>
                {locations.map(location => (
                  <SelectItem key={location.id} value={location.id}>
                    {location.name}
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

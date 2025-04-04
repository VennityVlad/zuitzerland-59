import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar } from "lucide-react";
import { DatePicker } from "@/components/ui/date-picker";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

type AddAssignmentDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: () => void;
};

type User = {
  id: string;
  full_name: string | null;
  email: string | null;
};

type Room = {
  id: string;
  name: string;
  building: string | null;
  floor: string | null;
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

const AddAssignmentDialog = ({ open, onOpenChange, onSubmit }: AddAssignmentDialogProps) => {
  const [users, setUsers] = useState<User[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bedrooms, setBedrooms] = useState<Room['bedrooms'][0][]>([]);
  const [beds, setBeds] = useState<Room['bedrooms'][0]['beds']>([]);
  
  const [profileId, setProfileId] = useState<string>("");
  const [roomId, setRoomId] = useState<string>("");
  const [bedroomId, setBedroomId] = useState<string>("");
  const [bedId, setBedId] = useState<string>("");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [notes, setNotes] = useState<string>("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const { toast } = useToast();
  
  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .order('full_name');
      
      if (error) throw error;
      
      setUsers(data || []);
    } catch (error: any) {
      console.error("Error fetching users:", error);
    }
  };
  
  const fetchRooms = async () => {
    try {
      const { data, error } = await supabase
        .from('apartments')
        .select(`
          id, 
          name, 
          building,
          floor,
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
      
      setRooms(data || []);
    } catch (error: any) {
      console.error("Error fetching rooms:", error);
    }
  };
  
  useEffect(() => {
    if (open) {
      fetchUsers();
      fetchRooms();
      resetForm();
    }
  }, [open]);
  
  useEffect(() => {
    if (roomId) {
      const selectedRoom = rooms.find(room => room.id === roomId);
      setBedrooms(selectedRoom?.bedrooms || []);
      setBedroomId("");
      setBedId("");
    } else {
      setBedrooms([]);
    }
  }, [roomId, rooms]);
  
  useEffect(() => {
    if (bedroomId) {
      const selectedBedroom = bedrooms.find(bedroom => bedroom.id === bedroomId);
      setBeds(selectedBedroom?.beds || []);
      setBedId("");
    } else {
      setBeds([]);
    }
  }, [bedroomId, bedrooms]);
  
  const resetForm = () => {
    setProfileId("");
    setRoomId("");
    setBedroomId("");
    setBedId("");
    setStartDate(undefined);
    setEndDate(undefined);
    setNotes("");
    setErrors({});
  };
  
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!profileId) {
      newErrors.profileId = "Please select a user";
    }
    
    if (!roomId) {
      newErrors.roomId = "Please select a room";
    }
    
    if (!startDate) {
      newErrors.startDate = "Please select a start date";
    }
    
    if (!endDate) {
      newErrors.endDate = "Please select an end date";
    } else if (startDate && endDate && endDate <= startDate) {
      newErrors.endDate = "End date must be after start date";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('room_assignments')
        .insert({
          profile_id: profileId,
          apartment_id: roomId,
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
      
      onSubmit();
      resetForm();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error creating assignment",
        description: error.message,
      });
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Create Room Assignment
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="profile-select">User *</Label>
            <Select 
              value={profileId}
              onValueChange={(value) => {
                setProfileId(value);
                if (errors.profileId) {
                  setErrors({ ...errors, profileId: "" });
                }
              }}
            >
              <SelectTrigger id="profile-select" className={errors.profileId ? "border-destructive" : ""}>
                <SelectValue placeholder="Select a user" />
              </SelectTrigger>
              <SelectContent>
                {users.map(user => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.full_name || user.email || user.id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.profileId && (
              <p className="text-sm text-destructive">{errors.profileId}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="room-select">Room *</Label>
            <Select 
              value={roomId}
              onValueChange={(value) => {
                setRoomId(value);
                if (errors.roomId) {
                  setErrors({ ...errors, roomId: "" });
                }
              }}
            >
              <SelectTrigger id="room-select" className={errors.roomId ? "border-destructive" : ""}>
                <SelectValue placeholder="Select a room" />
              </SelectTrigger>
              <SelectContent>
                {rooms.map(room => (
                  <SelectItem key={room.id} value={room.id}>
                    {room.name} {room.building && `(${room.building}${room.floor ? `, Floor ${room.floor}` : ''})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.roomId && (
              <p className="text-sm text-destructive">{errors.roomId}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="bedroom-select">Bedroom (Optional)</Label>
            <Select 
              value={bedroomId}
              onValueChange={setBedroomId}
              disabled={!roomId || bedrooms.length === 0}
            >
              <SelectTrigger id="bedroom-select">
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
          
          <div className="space-y-2">
            <Label htmlFor="bed-select">Bed (Optional)</Label>
            <Select 
              value={bedId}
              onValueChange={setBedId}
              disabled={!bedroomId || beds.length === 0}
            >
              <SelectTrigger id="bed-select">
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
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Check-in Date *</Label>
              <DatePicker
                date={startDate}
                onDateChange={setStartDate}
              />
              {errors.startDate && (
                <p className="text-sm text-destructive">{errors.startDate}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label>Check-out Date *</Label>
              <DatePicker
                date={endDate}
                onDateChange={setEndDate}
              />
              {errors.endDate && (
                <p className="text-sm text-destructive">{errors.endDate}</p>
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="assignment-notes">Notes</Label>
            <Textarea
              id="assignment-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes about this assignment"
              rows={3}
            />
          </div>
          
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Create Assignment</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddAssignmentDialog;


import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Building } from "lucide-react";

type RoomFormData = {
  name: string;
  building: string;
  floor: string;
  description: string;
  max_occupancy: number | null;
};

type AddRoomDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: RoomFormData) => void;
};

const AddRoomDialog = ({ open, onOpenChange, onSubmit }: AddRoomDialogProps) => {
  const [formData, setFormData] = useState<RoomFormData>({
    name: "",
    building: "",
    floor: "",
    description: "",
    max_occupancy: null,
  });
  
  const [errors, setErrors] = useState<Partial<Record<keyof RoomFormData, string>>>({});
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'max_occupancy' ? (value ? parseInt(value) : null) : value,
    }));
    
    // Clear error for this field
    if (errors[name as keyof RoomFormData]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };
  
  const validateForm = () => {
    const newErrors: Partial<Record<keyof RoomFormData, string>> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = "Room name is required";
    }
    
    if (formData.max_occupancy !== null && formData.max_occupancy <= 0) {
      newErrors.max_occupancy = "Occupancy must be greater than 0";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
      setFormData({
        name: "",
        building: "",
        floor: "",
        description: "",
        max_occupancy: null,
      });
      onOpenChange(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Add New Room
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="name">Room Name *</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., Room 101, Suite A"
              className={errors.name ? "border-destructive" : ""}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name}</p>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="building">Building</Label>
              <Input
                id="building"
                name="building"
                value={formData.building}
                onChange={handleChange}
                placeholder="e.g., Main Building"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="floor">Floor</Label>
              <Input
                id="floor"
                name="floor"
                value={formData.floor}
                onChange={handleChange}
                placeholder="e.g., 1st, Ground"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="max_occupancy">Maximum Occupancy</Label>
            <Input
              id="max_occupancy"
              name="max_occupancy"
              type="number"
              value={formData.max_occupancy === null ? "" : formData.max_occupancy}
              onChange={handleChange}
              placeholder="Maximum number of occupants"
              min="1"
              className={errors.max_occupancy ? "border-destructive" : ""}
            />
            {errors.max_occupancy && (
              <p className="text-sm text-destructive">{errors.max_occupancy}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe the room (features, location, etc.)"
              rows={3}
            />
          </div>
          
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Add Room</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddRoomDialog;

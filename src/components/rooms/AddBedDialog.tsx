
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { BedDouble } from "lucide-react";

type Bedroom = {
  id: string;
  apartment_id: string;
  name: string;
  description: string | null;
};

type AddBedDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bedroom: Bedroom | null;
  onSubmit: (data: { name: string; bed_type: string; description: string }) => void;
};

const AddBedDialog = ({ open, onOpenChange, bedroom, onSubmit }: AddBedDialogProps) => {
  const [name, setName] = useState("");
  const [bedType, setBedType] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  
  useEffect(() => {
    if (open) {
      setName("");
      setBedType("");
      setDescription("");
      setError("");
    }
  }, [open]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError("Bed name is required");
      return;
    }
    
    if (!bedType) {
      setError("Bed type is required");
      return;
    }
    
    onSubmit({ name, bed_type: bedType, description });
    onOpenChange(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BedDouble className="h-5 w-5" />
            Add New Bed to {bedroom?.name}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="bed-name">Bed Name *</Label>
            <Input
              id="bed-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError("");
              }}
              placeholder="e.g., Bed 1, King Bed"
              className={error ? "border-destructive" : ""}
            />
            {error && error.includes("name") && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="bed-type">Bed Type *</Label>
            <Select 
              value={bedType}
              onValueChange={(value) => {
                setBedType(value);
                if (error) setError("");
              }}
            >
              <SelectTrigger id="bed-type" className={error && error.includes("type") ? "border-destructive" : ""}>
                <SelectValue placeholder="Select bed type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="single">Single Bed</SelectItem>
                <SelectItem value="twin">Twin Bed</SelectItem>
                <SelectItem value="double">Double Bed</SelectItem>
                <SelectItem value="queen">Queen Bed</SelectItem>
                <SelectItem value="king">King Bed</SelectItem>
                <SelectItem value="bunk">Bunk Bed</SelectItem>
                <SelectItem value="sofa">Sofa Bed</SelectItem>
              </SelectContent>
            </Select>
            {error && error.includes("type") && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="bed-description">Description</Label>
            <Textarea
              id="bed-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the bed (features, size, etc.)"
              rows={3}
            />
          </div>
          
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Add Bed</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddBedDialog;

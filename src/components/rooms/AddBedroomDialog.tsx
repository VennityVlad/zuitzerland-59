
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Home } from "lucide-react";

type AddBedroomDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { name: string; description: string }) => void;
};

const AddBedroomDialog = ({ open, onOpenChange, onSubmit }: AddBedroomDialogProps) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError("Bedroom name is required");
      return;
    }
    
    onSubmit({ name, description });
    setName("");
    setDescription("");
    setError("");
    onOpenChange(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Home className="h-5 w-5" />
            Add New Bedroom
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="bedroom-name">Bedroom Name *</Label>
            <Input
              id="bedroom-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError("");
              }}
              placeholder="e.g., Master Bedroom, Bedroom 1"
              className={error ? "border-destructive" : ""}
            />
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="bedroom-description">Description</Label>
            <Textarea
              id="bedroom-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the bedroom (features, size, etc.)"
              rows={3}
            />
          </div>
          
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => {
              setName("");
              setDescription("");
              setError("");
              onOpenChange(false);
            }}>
              Cancel
            </Button>
            <Button type="submit">Add Bedroom</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddBedroomDialog;

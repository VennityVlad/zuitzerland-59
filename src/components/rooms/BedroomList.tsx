
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Trash, BedDouble, Home } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

type Bedroom = {
  id: string;
  location_id: string;
  name: string;
  description: string | null;
  beds?: Bed[];
};

type Bed = {
  id: string;
  bedroom_id: string;
  name: string;
  bed_type: string;
  description: string | null;
};

type BedroomListProps = {
  bedrooms: Bedroom[];
  onAddBed: (bedroom: Bedroom) => void;
  onDeleteBedroom: (id: string, name: string) => void;
  onDeleteBed: (id: string, name: string) => void;
};

const BedroomList = ({ bedrooms, onAddBed, onDeleteBedroom, onDeleteBed }: BedroomListProps) => {
  if (!bedrooms || bedrooms.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          No bedrooms found. Click "Add Bedroom" to create your first bedroom.
        </CardContent>
      </Card>
    );
  }

  return (
    <Accordion type="multiple" className="space-y-2">
      {bedrooms.map((bedroom) => (
        <AccordionItem key={bedroom.id} value={bedroom.id} className="border rounded-lg">
          <div className="flex items-center justify-between pr-2">
            <AccordionTrigger className="py-3 px-4 hover:no-underline">
              <div className="flex items-center gap-2 text-left">
                <Home className="h-4 w-4 text-primary" />
                <span className="font-medium">{bedroom.name}</span>
                <span className="text-sm text-muted-foreground ml-2">
                  ({bedroom.beds?.length || 0} beds)
                </span>
              </div>
            </AccordionTrigger>
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  onAddBed(bedroom);
                }}
              >
                <Plus className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteBedroom(bedroom.id, bedroom.name);
                }}
              >
                <Trash className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
          <AccordionContent className="px-4 pb-3">
            {bedroom.description && (
              <p className="text-sm text-muted-foreground mb-3">{bedroom.description}</p>
            )}
            
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Beds</h4>
              
              {!bedroom.beds || bedroom.beds.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No beds in this bedroom yet. Add one to get started.
                </p>
              ) : (
                <div className="space-y-2">
                  {bedroom.beds.map((bed) => (
                    <div 
                      key={bed.id} 
                      className="flex items-center justify-between p-2 bg-secondary/50 rounded"
                    >
                      <div className="flex items-center gap-2">
                        <BedDouble className="h-4 w-4 text-primary" />
                        <span className="font-medium">{bed.name}</span>
                        <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded">
                          {bed.bed_type}
                        </span>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => onDeleteBed(bed.id, bed.name)}
                      >
                        <Trash className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
};

export default BedroomList;

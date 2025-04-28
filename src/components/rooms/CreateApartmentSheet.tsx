
import { useState } from "react";
import { Building, BedDouble, Plus, Minus, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

import { 
  Sheet, 
  SheetContent, 
  SheetDescription, 
  SheetHeader, 
  SheetTitle,
  SheetFooter
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription
} from "@/components/ui/card";

type Location = {
  id?: string;
  name: string;
  building: string;
  floor: string;
  description: string;
  max_occupancy: number | null;
  type: string;
};

type Bedroom = {
  id?: string;
  name: string;
  description: string;
  beds: Bed[];
};

type Bed = {
  id?: string;
  name: string;
  bed_type: string;
  description: string;
};

interface CreateLocationSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: () => void;
  apartment?: Location;
  isEditing?: boolean;
}

export function CreateLocationSheet({ 
  open, 
  onOpenChange, 
  onSubmit, 
  apartment,
  isEditing = false
}: CreateLocationSheetProps) {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Location details
  const [newLocation, setNewLocation] = useState<Location>(
    apartment || {
      name: "",
      building: "",
      floor: "",
      description: "",
      max_occupancy: null,
      type: "Apartment"
    }
  );

  // Bedrooms state
  const [bedrooms, setBedrooms] = useState<Bedroom[]>(
    [{
      name: "Bedroom 1",
      description: "",
      beds: [
        {
          name: "Bed 1",
          bed_type: "Single",
          description: ""
        }
      ]
    }]
  );

  const locationTypes = ["Apartment", "Meeting Room"];

  const steps = [
    { title: "Location Details", description: "Enter the basic information about the location" },
    { title: "Bedrooms & Beds", description: "Configure bedrooms and beds in this location" },
    { title: "Review", description: "Review all information before saving" }
  ];

  const validateLocationDetails = () => {
    if (!newLocation.name.trim()) {
      toast({
        title: "Error",
        description: "Location name is required",
        variant: "destructive",
      });
      return false;
    }
    
    if (!newLocation.type) {
      toast({
        title: "Error",
        description: "Location type is required",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const validateBedroomsAndBeds = () => {
    if (newLocation.type === "Meeting Room") {
      return true; // No bedrooms/beds validation needed for meeting rooms
    }
    
    for (const bedroom of bedrooms) {
      if (!bedroom.name.trim()) {
        toast({
          title: "Error",
          description: "All bedrooms must have a name",
          variant: "destructive",
        });
        return false;
      }
      
      if (bedroom.beds.length === 0) {
        toast({
          title: "Error",
          description: `Bedroom "${bedroom.name}" must have at least one bed`,
          variant: "destructive",
        });
        return false;
      }
      
      for (const bed of bedroom.beds) {
        if (!bed.name.trim()) {
          toast({
            title: "Error",
            description: "All beds must have a name",
            variant: "destructive",
          });
          return false;
        }
        
        if (!bed.bed_type.trim()) {
          toast({
            title: "Error",
            description: "All beds must have a bed type",
            variant: "destructive",
          });
          return false;
        }
      }
    }
    
    return true;
  };

  const handleNext = () => {
    if (currentStep === 0 && !validateLocationDetails()) {
      return;
    }
    
    if (currentStep === 1 && !validateBedroomsAndBeds()) {
      return;
    }

    // Skip bedroom step for meeting rooms
    if (currentStep === 0 && newLocation.type === "Meeting Room") {
      setCurrentStep(2); // Skip to review step
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    // Handle skipping bedroom step when going back from review for meeting rooms
    if (currentStep === 2 && newLocation.type === "Meeting Room") {
      setCurrentStep(0);
    } else {
      setCurrentStep(prev => prev - 1);
    }
  };

  const addBedroom = () => {
    setBedrooms([
      ...bedrooms,
      {
        name: `Bedroom ${bedrooms.length + 1}`,
        description: "",
        beds: [
          {
            name: "Bed 1",
            bed_type: "Single",
            description: ""
          }
        ]
      }
    ]);
  };

  const removeBedroom = (index: number) => {
    if (bedrooms.length <= 1) {
      toast({
        title: "Error",
        description: "At least one bedroom is required",
        variant: "destructive",
      });
      return;
    }
    
    const updatedBedrooms = [...bedrooms];
    updatedBedrooms.splice(index, 1);
    setBedrooms(updatedBedrooms);
  };

  const addBed = (bedroomIndex: number) => {
    const updatedBedrooms = [...bedrooms];
    const bedroomBeds = updatedBedrooms[bedroomIndex].beds;
    
    updatedBedrooms[bedroomIndex].beds = [
      ...bedroomBeds,
      {
        name: `Bed ${bedroomBeds.length + 1}`,
        bed_type: "Single",
        description: ""
      }
    ];
    
    setBedrooms(updatedBedrooms);
  };

  const removeBed = (bedroomIndex: number, bedIndex: number) => {
    const updatedBedrooms = [...bedrooms];
    const bedroomBeds = updatedBedrooms[bedroomIndex].beds;
    
    if (bedroomBeds.length <= 1) {
      toast({
        title: "Error",
        description: "At least one bed is required in each bedroom",
        variant: "destructive",
      });
      return;
    }
    
    bedroomBeds.splice(bedIndex, 1);
    setBedrooms(updatedBedrooms);
  };

  const updateBedroomField = (bedroomIndex: number, field: keyof Bedroom, value: string) => {
    const updatedBedrooms = [...bedrooms];
    // @ts-ignore - we know the field is a string field
    updatedBedrooms[bedroomIndex][field] = value;
    setBedrooms(updatedBedrooms);
  };

  const updateBedField = (bedroomIndex: number, bedIndex: number, field: keyof Bed, value: string) => {
    const updatedBedrooms = [...bedrooms];
    // @ts-ignore - we know the field is a string field
    updatedBedrooms[bedroomIndex].beds[bedIndex][field] = value;
    setBedrooms(updatedBedrooms);
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      
      if (!validateLocationDetails()) {
        setIsSubmitting(false);
        return;
      }
      
      if (newLocation.type === "Apartment" && !validateBedroomsAndBeds()) {
        setIsSubmitting(false);
        return;
      }

      // 1. Create or update location
      let locationId = apartment?.id;
      
      if (isEditing && locationId) {
        // Update existing location
        const { error: updateError } = await supabase
          .from('locations')
          .update({
            name: newLocation.name,
            building: newLocation.building || null,
            floor: newLocation.floor || null,
            description: newLocation.description || null,
            max_occupancy: newLocation.max_occupancy || null,
            type: newLocation.type
          })
          .eq('id', locationId);

        if (updateError) throw updateError;
      } else {
        // Create new location
        const { data: locationData, error: locationError } = await supabase
          .from('locations')
          .insert({
            name: newLocation.name,
            building: newLocation.building || null,
            floor: newLocation.floor || null,
            description: newLocation.description || null,
            max_occupancy: newLocation.max_occupancy || null,
            type: newLocation.type
          })
          .select('id')
          .single();

        if (locationError) throw locationError;
        locationId = locationData.id;
      }
      
      // In edit mode, we don't want to add/remove bedrooms and beds
      // It could lead to data loss if users already assigned to those beds
      if (!isEditing && locationId && newLocation.type === "Apartment") {
        // 2. Create bedrooms and beds for each bedroom
        for (const bedroom of bedrooms) {
          // Create bedroom
          const { data: bedroomData, error: bedroomError } = await supabase
            .from('bedrooms')
            .insert({
              location_id: locationId,
              name: bedroom.name,
              description: bedroom.description || null
            })
            .select('id')
            .single();

          if (bedroomError) throw bedroomError;
          
          // Create beds for this bedroom
          for (const bed of bedroom.beds) {
            const { error: bedError } = await supabase
              .from('beds')
              .insert({
                bedroom_id: bedroomData.id,
                name: bed.name,
                bed_type: bed.bed_type,
                description: bed.description || null
              });

            if (bedError) throw bedError;
          }
        }
      }

      toast({
        title: "Success",
        description: isEditing 
          ? "Location updated successfully" 
          : `${newLocation.type} created successfully${newLocation.type === "Apartment" ? " with bedrooms and beds" : ""}`,
      });
      
      onOpenChange(false);
      onSubmit();
    } catch (error) {
      console.error('Error saving location:', error);
      toast({
        title: "Error",
        description: `Failed to save location: ${error instanceof Error ? error.message : "Unknown error"}`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Location Name *</Label>
              <Input 
                id="name" 
                value={newLocation.name}
                onChange={(e) => setNewLocation({...newLocation, name: e.target.value})}
                placeholder="e.g., Apartment 101, Conference Room A"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="type">Location Type *</Label>
              <Select
                value={newLocation.type}
                onValueChange={(value) => setNewLocation({...newLocation, type: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select location type" />
                </SelectTrigger>
                <SelectContent>
                  {locationTypes.map(type => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="building">Building</Label>
                <Input 
                  id="building" 
                  value={newLocation.building}
                  onChange={(e) => setNewLocation({...newLocation, building: e.target.value})}
                  placeholder="e.g., Main Building"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="floor">Floor</Label>
                <Input 
                  id="floor" 
                  value={newLocation.floor}
                  onChange={(e) => setNewLocation({...newLocation, floor: e.target.value})}
                  placeholder="e.g., 1st, Ground"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="max_occupancy">Maximum Occupancy</Label>
              <Input
                id="max_occupancy"
                type="number"
                value={newLocation.max_occupancy === null ? "" : newLocation.max_occupancy}
                onChange={(e) => setNewLocation({
                  ...newLocation, 
                  max_occupancy: e.target.value ? parseInt(e.target.value) : null
                })}
                placeholder="Maximum number of occupants"
                min="1"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newLocation.description}
                onChange={(e) => setNewLocation({...newLocation, description: e.target.value})}
                placeholder="Describe the location (features, location, etc.)"
                rows={3}
              />
            </div>
          </div>
        );
      case 1:
        return (
          <div className="space-y-6">
            {!isEditing && (
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Bedrooms</h3>
                <Button 
                  onClick={addBedroom} 
                  size="sm" 
                  variant="outline"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Bedroom
                </Button>
              </div>
            )}
            
            {isEditing ? (
              <div className="text-center py-4 border rounded-md bg-muted/20">
                <p className="text-muted-foreground">
                  Bedroom and bed configuration cannot be modified in edit mode to prevent data loss.
                </p>
                <p className="text-muted-foreground text-sm mt-1">
                  Please use the room management interface to manage bedrooms and beds.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {bedrooms.map((bedroom, bedroomIndex) => (
                  <Card key={bedroomIndex} className="border">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-base">
                          <div className="flex items-center">
                            <Building className="h-4 w-4 mr-2 text-muted-foreground" />
                            {bedroom.name}
                          </div>
                        </CardTitle>
                        <Button 
                          onClick={() => removeBedroom(bedroomIndex)} 
                          variant="ghost" 
                          size="sm"
                          className="h-8 w-8 p-0"
                        >
                          <Minus className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor={`bedroom-name-${bedroomIndex}`}>Bedroom Name *</Label>
                        <Input 
                          id={`bedroom-name-${bedroomIndex}`}
                          value={bedroom.name}
                          onChange={(e) => updateBedroomField(bedroomIndex, 'name', e.target.value)}
                          placeholder="e.g., Master Bedroom"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor={`bedroom-desc-${bedroomIndex}`}>Description</Label>
                        <Input 
                          id={`bedroom-desc-${bedroomIndex}`}
                          value={bedroom.description}
                          onChange={(e) => updateBedroomField(bedroomIndex, 'description', e.target.value)}
                          placeholder="Description (optional)"
                        />
                      </div>
                      
                      <div className="pt-2">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="text-sm font-medium">Beds in this bedroom</h4>
                          <Button 
                            onClick={() => addBed(bedroomIndex)} 
                            size="sm" 
                            variant="outline"
                            className="h-7"
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Add Bed
                          </Button>
                        </div>
                        
                        <div className="space-y-3">
                          {bedroom.beds.map((bed, bedIndex) => (
                            <Card key={bedIndex} className="border p-3">
                              <div className="flex justify-between items-center mb-2">
                                <div className="flex items-center">
                                  <BedDouble className="h-4 w-4 mr-2 text-muted-foreground" />
                                  <span className="text-sm font-medium">{bed.name}</span>
                                </div>
                                <Button 
                                  onClick={() => removeBed(bedroomIndex, bedIndex)} 
                                  variant="ghost" 
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                >
                                  <Minus className="h-3 w-3 text-destructive" />
                                </Button>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <Label 
                                    htmlFor={`bed-name-${bedroomIndex}-${bedIndex}`}
                                    className="text-xs mb-1 block"
                                  >
                                    Bed Name *
                                  </Label>
                                  <Input 
                                    id={`bed-name-${bedroomIndex}-${bedIndex}`}
                                    value={bed.name}
                                    onChange={(e) => updateBedField(bedroomIndex, bedIndex, 'name', e.target.value)}
                                    placeholder="e.g., Bed 1"
                                    className="h-8 text-sm"
                                  />
                                </div>
                                
                                <div>
                                  <Label 
                                    htmlFor={`bed-type-${bedroomIndex}-${bedIndex}`}
                                    className="text-xs mb-1 block"
                                  >
                                    Bed Type *
                                  </Label>
                                  <Input 
                                    id={`bed-type-${bedroomIndex}-${bedIndex}`}
                                    value={bed.bed_type}
                                    onChange={(e) => updateBedField(bedroomIndex, bedIndex, 'bed_type', e.target.value)}
                                    placeholder="e.g., Single, Double"
                                    className="h-8 text-sm"
                                  />
                                </div>
                              </div>
                            </Card>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        );
      case 2:
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Location Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium">Name</p>
                    <p className="text-sm text-muted-foreground">{newLocation.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Type</p>
                    <p className="text-sm text-muted-foreground">{newLocation.type}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Building</p>
                    <p className="text-sm text-muted-foreground">{newLocation.building || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Floor</p>
                    <p className="text-sm text-muted-foreground">{newLocation.floor || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Max Occupancy</p>
                    <p className="text-sm text-muted-foreground">{newLocation.max_occupancy || 'N/A'}</p>
                  </div>
                </div>
                {newLocation.description && (
                  <div className="pt-2">
                    <p className="text-sm font-medium">Description</p>
                    <p className="text-sm text-muted-foreground">{newLocation.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {!isEditing && newLocation.type === "Apartment" && (
              <Card>
                <CardHeader>
                  <CardTitle>Bedrooms and Beds</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {bedrooms.map((bedroom, bedroomIndex) => (
                      <div key={bedroomIndex} className="border-b pb-4 last:border-b-0 last:pb-0">
                        <h4 className="font-medium">{bedroom.name}</h4>
                        {bedroom.description && (
                          <p className="text-sm text-muted-foreground mb-2">{bedroom.description}</p>
                        )}
                        <div className="pl-4 mt-2 space-y-1">
                          {bedroom.beds.map((bed, bedIndex) => (
                            <div key={bedIndex} className="flex items-center">
                              <BedDouble className="h-4 w-4 mr-2 text-muted-foreground" />
                              <span className="text-sm">{bed.name} ({bed.bed_type})</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md md:max-w-lg overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle>{isEditing ? "Edit Location" : "Create New Location"}</SheetTitle>
          <SheetDescription>
            {steps[currentStep].description}
          </SheetDescription>
        </SheetHeader>

        <div className="mb-6">
          <div className="flex justify-between mb-2">
            {steps.map((step, index) => {
              // Skip the bedroom step badge for meeting rooms
              if (index === 1 && newLocation.type === "Meeting Room") {
                return null;
              }
              
              return (
                <div 
                  key={index} 
                  className={`flex flex-col items-center ${index === currentStep ? 'text-primary' : 'text-muted-foreground'}`}
                >
                  <div 
                    className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 
                    ${index === currentStep ? 'bg-primary text-white' : 
                      index < currentStep ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}
                  >
                    {index === 1 && newLocation.type === "Meeting Room" ? 3 : index + 1}
                  </div>
                  <span className="text-xs">{step.title}</span>
                </div>
              );
            })}
          </div>
          <div className="w-full h-2 bg-muted rounded-full">
            <div 
              className="h-2 bg-primary rounded-full transition-all" 
              style={{ 
                width: `${((currentStep + 1) / (newLocation.type === "Meeting Room" ? 2 : steps.length)) * 100}%` 
              }}
            ></div>
          </div>
        </div>

        <div className="space-y-6 mt-6">
          {renderStepContent()}
        </div>

        <SheetFooter className="mt-8 flex-col sm:flex-row gap-2">
          {currentStep > 0 && (
            <Button 
              onClick={handlePrevious} 
              variant="outline"
              disabled={isSubmitting}
            >
              Previous
            </Button>
          )}
          
          {currentStep < (newLocation.type === "Meeting Room" ? 2 : steps.length - 1) ? (
            <Button onClick={handleNext}>
              Next
            </Button>
          ) : (
            <Button 
              onClick={handleSubmit} 
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              {isSubmitting ? "Saving..." : (isEditing ? "Update Location" : "Create Location")}
            </Button>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

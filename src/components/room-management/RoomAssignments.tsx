
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PlusCircle, Calendar, User, Building, Bed, DoorClosed, Trash } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
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
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface RoomAssignment {
  id: string;
  profile_id: string;
  apartment_id: string | null;
  bedroom_id: string | null;
  bed_id: string | null;
  start_date: string;
  end_date: string;
  notes: string | null;
  profile: {
    username: string;
    full_name: string | null;
    email: string | null;
  };
  apartment: {
    name: string;
  } | null;
  bedroom: {
    name: string;
  } | null;
  bed: {
    name: string;
  } | null;
}

interface Profile {
  id: string;
  username: string;
  full_name: string | null;
  email: string | null;
}

interface Apartment {
  id: string;
  name: string;
}

interface Bedroom {
  id: string;
  name: string;
  apartment_id: string;
}

interface Bed {
  id: string;
  name: string;
  bedroom_id: string;
  bed_type: string;
}

const RoomAssignments: React.FC = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedApartmentId, setSelectedApartmentId] = useState<string | null>(null);
  const [selectedBedroomId, setSelectedBedroomId] = useState<string | null>(null);
  const [newAssignment, setNewAssignment] = useState({
    profile_id: '',
    apartment_id: '',
    bedroom_id: '',
    bed_id: '',
    start_date: format(new Date(), 'yyyy-MM-dd'),
    end_date: format(new Date(new Date().setMonth(new Date().getMonth() + 1)), 'yyyy-MM-dd'),
    notes: '',
    assignment_type: 'bed', // 'apartment', 'bedroom', 'bed'
  });

  const queryClient = useQueryClient();

  // Fetch room assignments with profile and location details
  const { data: assignments, isLoading: isLoadingAssignments } = useQuery({
    queryKey: ['room_assignments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('room_assignments')
        .select(`
          id,
          profile_id,
          apartment_id,
          bedroom_id,
          bed_id,
          start_date,
          end_date,
          notes,
          profile:profiles(username, full_name, email),
          apartment:apartments(name),
          bedroom:bedrooms(name),
          bed:beds(name)
        `)
        .order('start_date', { ascending: false });
      
      if (error) {
        console.error('Error fetching room assignments:', error);
        toast({
          title: "Error",
          description: "Could not load room assignments. Please try again.",
          variant: "destructive",
        });
        throw error;
      }
      
      return data || [];
    }
  });

  // Fetch profiles for assignment
  const { data: profiles } = useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, full_name, email')
        .order('username');
      
      if (error) {
        console.error('Error fetching profiles:', error);
        throw error;
      }
      
      return data || [];
    }
  });

  // Fetch apartments
  const { data: apartments } = useQuery({
    queryKey: ['apartments_select'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('apartments')
        .select('id, name')
        .order('name');
      
      if (error) {
        console.error('Error fetching apartments:', error);
        throw error;
      }
      
      return data || [];
    }
  });

  // Fetch bedrooms based on selected apartment
  const { data: bedrooms } = useQuery({
    queryKey: ['bedrooms_select', selectedApartmentId],
    queryFn: async () => {
      if (!selectedApartmentId) return [];
      
      const { data, error } = await supabase
        .from('bedrooms')
        .select('id, name, apartment_id')
        .eq('apartment_id', selectedApartmentId)
        .order('name');
      
      if (error) {
        console.error('Error fetching bedrooms:', error);
        throw error;
      }
      
      return data || [];
    },
    enabled: !!selectedApartmentId
  });

  // Fetch beds based on selected bedroom
  const { data: beds } = useQuery({
    queryKey: ['beds_select', selectedBedroomId],
    queryFn: async () => {
      if (!selectedBedroomId) return [];
      
      const { data, error } = await supabase
        .from('beds')
        .select('id, name, bedroom_id, bed_type')
        .eq('bedroom_id', selectedBedroomId)
        .order('name');
      
      if (error) {
        console.error('Error fetching beds:', error);
        throw error;
      }
      
      return data || [];
    },
    enabled: !!selectedBedroomId
  });

  const createAssignmentMutation = useMutation({
    mutationFn: async (assignmentData: any) => {
      // Filter out unnecessary fields based on assignment type
      const dataToSubmit = {
        profile_id: assignmentData.profile_id,
        start_date: assignmentData.start_date,
        end_date: assignmentData.end_date,
        notes: assignmentData.notes || null
      } as any;

      // Add the appropriate location fields based on assignment type
      if (assignmentData.assignment_type === 'apartment') {
        dataToSubmit.apartment_id = assignmentData.apartment_id;
      } else if (assignmentData.assignment_type === 'bedroom') {
        dataToSubmit.apartment_id = assignmentData.apartment_id;
        dataToSubmit.bedroom_id = assignmentData.bedroom_id;
      } else if (assignmentData.assignment_type === 'bed') {
        dataToSubmit.apartment_id = assignmentData.apartment_id;
        dataToSubmit.bedroom_id = assignmentData.bedroom_id;
        dataToSubmit.bed_id = assignmentData.bed_id;
      }

      const { data, error } = await supabase
        .from('room_assignments')
        .insert(dataToSubmit)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['room_assignments'] });
      setIsCreateDialogOpen(false);
      resetAssignmentForm();
      toast({
        title: "Success",
        description: "Room assignment created successfully",
      });
    },
    onError: (error) => {
      console.error('Error creating room assignment:', error);
      toast({
        title: "Error",
        description: "Failed to create room assignment",
        variant: "destructive",
      });
    }
  });

  const deleteAssignmentMutation = useMutation({
    mutationFn: async (assignmentId: string) => {
      const { error } = await supabase
        .from('room_assignments')
        .delete()
        .eq('id', assignmentId);
      
      if (error) throw error;
      return assignmentId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['room_assignments'] });
      toast({
        title: "Success",
        description: "Room assignment deleted successfully",
      });
    },
    onError: (error) => {
      console.error('Error deleting room assignment:', error);
      toast({
        title: "Error",
        description: "Failed to delete room assignment",
        variant: "destructive",
      });
    }
  });

  const resetAssignmentForm = () => {
    setNewAssignment({
      profile_id: '',
      apartment_id: '',
      bedroom_id: '',
      bed_id: '',
      start_date: format(new Date(), 'yyyy-MM-dd'),
      end_date: format(new Date(new Date().setMonth(new Date().getMonth() + 1)), 'yyyy-MM-dd'),
      notes: '',
      assignment_type: 'bed',
    });
    setSelectedApartmentId(null);
    setSelectedBedroomId(null);
  };

  const handleCreateAssignment = () => {
    // Validate form
    if (!newAssignment.profile_id) {
      toast({
        title: "Error",
        description: "Please select a resident",
        variant: "destructive",
      });
      return;
    }
    
    if (!newAssignment.apartment_id) {
      toast({
        title: "Error",
        description: "Please select an apartment",
        variant: "destructive",
      });
      return;
    }
    
    if ((newAssignment.assignment_type === 'bedroom' || newAssignment.assignment_type === 'bed') && !newAssignment.bedroom_id) {
      toast({
        title: "Error",
        description: "Please select a bedroom",
        variant: "destructive",
      });
      return;
    }
    
    if (newAssignment.assignment_type === 'bed' && !newAssignment.bed_id) {
      toast({
        title: "Error",
        description: "Please select a bed",
        variant: "destructive",
      });
      return;
    }
    
    if (!newAssignment.start_date || !newAssignment.end_date) {
      toast({
        title: "Error",
        description: "Please specify start and end dates",
        variant: "destructive",
      });
      return;
    }
    
    createAssignmentMutation.mutate(newAssignment);
  };

  const handleDeleteAssignment = (assignmentId: string) => {
    if (confirm("Are you sure you want to delete this room assignment?")) {
      deleteAssignmentMutation.mutate(assignmentId);
    }
  };

  const handleApartmentChange = (apartmentId: string) => {
    setSelectedApartmentId(apartmentId);
    setSelectedBedroomId(null);
    setNewAssignment({
      ...newAssignment,
      apartment_id: apartmentId,
      bedroom_id: '',
      bed_id: '',
    });
  };

  const handleBedroomChange = (bedroomId: string) => {
    setSelectedBedroomId(bedroomId);
    setNewAssignment({
      ...newAssignment,
      bedroom_id: bedroomId,
      bed_id: '',
    });
  };

  if (isLoadingAssignments) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">Room Assignments</h2>
        </div>
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-6 w-1/2 mb-4" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Room Assignments</h2>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" /> New Assignment
        </Button>
      </div>

      {!assignments || assignments.length === 0 ? (
        <Card className="bg-gray-50 border border-dashed border-gray-300">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bed className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-lg text-gray-500 mb-4">No room assignments found</p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" /> Create First Assignment
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {assignments.map((assignment) => (
            <Card key={assignment.id} className="shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold mb-3">
                      {assignment.profile?.full_name || assignment.profile?.username || 'Unknown Resident'}
                    </h3>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex items-start space-x-2">
                        <User className="h-4 w-4 text-gray-500 mt-0.5" />
                        <div>
                          <span className="text-gray-500">Resident:</span>{' '}
                          <span>{assignment.profile?.full_name || assignment.profile?.username}</span>
                          {assignment.profile?.email && (
                            <div className="text-gray-500 text-xs">{assignment.profile.email}</div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-2">
                        <Building className="h-4 w-4 text-gray-500 mt-0.5" />
                        <div>
                          <span className="text-gray-500">Apartment:</span>{' '}
                          <span>{assignment.apartment?.name || 'N/A'}</span>
                        </div>
                      </div>
                      
                      {assignment.bedroom_id && (
                        <div className="flex items-start space-x-2">
                          <DoorClosed className="h-4 w-4 text-gray-500 mt-0.5" />
                          <div>
                            <span className="text-gray-500">Bedroom:</span>{' '}
                            <span>{assignment.bedroom?.name || 'N/A'}</span>
                          </div>
                        </div>
                      )}
                      
                      {assignment.bed_id && (
                        <div className="flex items-start space-x-2">
                          <Bed className="h-4 w-4 text-gray-500 mt-0.5" />
                          <div>
                            <span className="text-gray-500">Bed:</span>{' '}
                            <span>{assignment.bed?.name || 'N/A'}</span>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-start space-x-2">
                        <Calendar className="h-4 w-4 text-gray-500 mt-0.5" />
                        <div>
                          <span className="text-gray-500">Duration:</span>{' '}
                          <span>
                            {format(new Date(assignment.start_date), 'MMM d, yyyy')} - {format(new Date(assignment.end_date), 'MMM d, yyyy')}
                          </span>
                        </div>
                      </div>
                      
                      {assignment.notes && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-md border border-gray-100 text-sm">
                          {assignment.notes}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                    onClick={() => handleDeleteAssignment(assignment.id)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Assignment Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New Room Assignment</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="profile">Resident</Label>
              <Select 
                value={newAssignment.profile_id} 
                onValueChange={(value) => setNewAssignment({...newAssignment, profile_id: value})}
              >
                <SelectTrigger id="profile">
                  <SelectValue placeholder="Select resident" />
                </SelectTrigger>
                <SelectContent>
                  {profiles?.map((profile) => (
                    <SelectItem key={profile.id} value={profile.id}>
                      {profile.full_name || profile.username}{profile.email ? ` (${profile.email})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="assignment-type">Assignment Type</Label>
              <Select 
                value={newAssignment.assignment_type} 
                onValueChange={(value) => setNewAssignment({...newAssignment, assignment_type: value})}
              >
                <SelectTrigger id="assignment-type">
                  <SelectValue placeholder="Select assignment type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="apartment">Entire Apartment</SelectItem>
                  <SelectItem value="bedroom">Bedroom</SelectItem>
                  <SelectItem value="bed">Specific Bed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="apartment">Apartment</Label>
              <Select 
                value={newAssignment.apartment_id} 
                onValueChange={handleApartmentChange}
              >
                <SelectTrigger id="apartment">
                  <SelectValue placeholder="Select apartment" />
                </SelectTrigger>
                <SelectContent>
                  {apartments?.map((apartment) => (
                    <SelectItem key={apartment.id} value={apartment.id}>
                      {apartment.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {(newAssignment.assignment_type === 'bedroom' || newAssignment.assignment_type === 'bed') && (
              <div className="grid gap-2">
                <Label htmlFor="bedroom">Bedroom</Label>
                <Select 
                  value={newAssignment.bedroom_id} 
                  onValueChange={handleBedroomChange}
                  disabled={!selectedApartmentId}
                >
                  <SelectTrigger id="bedroom">
                    <SelectValue placeholder={selectedApartmentId ? "Select bedroom" : "Select an apartment first"} />
                  </SelectTrigger>
                  <SelectContent>
                    {bedrooms?.map((bedroom) => (
                      <SelectItem key={bedroom.id} value={bedroom.id}>
                        {bedroom.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {newAssignment.assignment_type === 'bed' && (
              <div className="grid gap-2">
                <Label htmlFor="bed">Bed</Label>
                <Select 
                  value={newAssignment.bed_id} 
                  onValueChange={(value) => setNewAssignment({...newAssignment, bed_id: value})}
                  disabled={!selectedBedroomId}
                >
                  <SelectTrigger id="bed">
                    <SelectValue placeholder={selectedBedroomId ? "Select bed" : "Select a bedroom first"} />
                  </SelectTrigger>
                  <SelectContent>
                    {beds?.map((bed) => (
                      <SelectItem key={bed.id} value={bed.id}>
                        {bed.name} ({bed.bed_type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="start-date">Start Date</Label>
              <Input 
                id="start-date" 
                type="date" 
                value={newAssignment.start_date} 
                onChange={(e) => setNewAssignment({...newAssignment, start_date: e.target.value})}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="end-date">End Date</Label>
              <Input 
                id="end-date" 
                type="date" 
                value={newAssignment.end_date} 
                onChange={(e) => setNewAssignment({...newAssignment, end_date: e.target.value})}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea 
                id="notes" 
                value={newAssignment.notes} 
                onChange={(e) => setNewAssignment({...newAssignment, notes: e.target.value})}
                placeholder="Any additional information about this assignment"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsCreateDialogOpen(false);
              resetAssignmentForm();
            }}>
              Cancel
            </Button>
            <Button onClick={handleCreateAssignment}>Create Assignment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RoomAssignments;

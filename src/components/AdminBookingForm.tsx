
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { useBookingForm } from "@/hooks/useBookingForm";
import BookingDetailsPanel from "./booking/BookingDetailsPanel";
import { BookingFormHeader } from "./booking/BookingFormHeader";
import { Checkbox } from "@/components/ui/checkbox";
import TermsDialog from "./booking/TermsDialog";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { differenceInDays, parse } from "date-fns";
import { useIsMobile } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const AdminBookingForm = () => {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  const {
    formData,
    isLoading,
    isFormValid,
    validationWarning,
    discountAmount,
    isRoleBasedDiscount,
    discountName,
    discountPercentage,
    discountMonth,
    handleInputChange,
    handleSubmit,
    handleCountryChange,
    handlePaymentTypeChange,
  } = useBookingForm();

  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [customPrice, setCustomPrice] = useState<string>('');
  const [selectedProfile, setSelectedProfile] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [userSearchOpen, setUserSearchOpen] = useState(false);

  const minDate = "2025-05-01";
  const maxDate = "2025-05-25";

  // Query to fetch profiles for the dropdown
  const { data: profiles, isLoading: profilesLoading, error: profilesError } = useQuery({
    queryKey: ['adminProfilesList'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, username')
        .order('full_name', { ascending: true });
      
      if (error) throw error;
      return data || [];
    }
  });

  // Filter profiles based on search term - with proper null checking
  const filteredProfiles = profiles ? profiles.filter(profile => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (profile.full_name && profile.full_name.toLowerCase().includes(searchLower)) ||
      (profile.email && profile.email.toLowerCase().includes(searchLower)) ||
      (profile.username && profile.username.toLowerCase().includes(searchLower))
    );
  }) : [];

  // Handle profile selection
  const handleProfileSelect = (profile: any) => {
    setSelectedProfile(profile);
    setUserSearchOpen(false);
    
    // Update form data with the selected profile's information
    const updatedFormData = {
      ...formData,
      firstName: profile.full_name ? profile.full_name.split(' ')[0] : '',
      lastName: profile.full_name && profile.full_name.split(' ').length > 1 
        ? profile.full_name.split(' ').slice(1).join(' ') 
        : '',
      email: profile.email || '',
    };
    
    // Simulate input change events for each field
    Object.entries(updatedFormData).forEach(([name, value]) => {
      if (value && name in formData && value !== formData[name as keyof typeof formData]) {
        handleInputChange({
          target: { name, value }
        } as React.ChangeEvent<HTMLInputElement>);
      }
    });
  };

  const { data: roomTypeDetails } = useQuery({
    queryKey: ['roomTypeDetails', formData.roomType],
    queryFn: async () => {
      if (!formData.roomType) return null;
      
      const { data, error } = await supabase
        .from('room_types')
        .select('min_stay_days, display_name')
        .eq('code', formData.roomType)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: Boolean(formData.roomType)
  });

  const meetsMinimumStay = (): boolean => {
    if (!formData.checkin || !formData.checkout || !formData.roomType || !roomTypeDetails) {
      return false;
    }

    const startDate = parse(formData.checkin, 'yyyy-MM-dd', new Date());
    const endDate = parse(formData.checkout, 'yyyy-MM-dd', new Date());
    const days = differenceInDays(endDate, startDate);
    
    return days >= (roomTypeDetails.min_stay_days || 0);
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!selectedProfile) {
      toast({
        title: "Error",
        description: "Please select a user to create a booking for",
        variant: "destructive"
      });
      return;
    }
    
    if (!termsAccepted || !meetsMinimumStay()) {
      toast({
        title: "Error",
        description: !termsAccepted 
          ? "Please accept the terms and conditions" 
          : "Please ensure your stay meets the minimum stay requirements",
        variant: "destructive"
      });
      return;
    }
    
    try {
      // Create a modified form submission with the custom price if set
      const customizedFormData = { 
        ...formData,
        profileId: selectedProfile.id 
      };
      
      // Override the price if custom price is set
      if (customPrice && parseFloat(customPrice) > 0) {
        customizedFormData.price = parseFloat(customPrice);
      }
      
      await handleSubmit(e, customizedFormData, true);
    } catch (error) {
      console.error("Form submission error:", error);
      toast({
        title: "Error",
        description: "There was a problem submitting the booking. Please try again.",
        variant: "destructive"
      });
    }
  };

  const isSubmitEnabled = 
    isFormValid && 
    termsAccepted && 
    meetsMinimumStay() && 
    !isLoading &&
    selectedProfile;

  return (
    <form
      onSubmit={onSubmit}
      className={`${
        isMobile 
          ? 'p-4 mt-0 space-y-6 bg-white mobile-full-width' 
          : 'max-w-6xl mx-auto p-8 mt-16 sm:mt-0 space-y-8 bg-white rounded-xl shadow-lg border border-secondary'
      }`}
    >
      <BookingFormHeader
        title="Admin Booking Form"
        description="Create a booking for a user"
      />

      {validationWarning && (
        <Alert variant="destructive">
          <AlertDescription>{validationWarning}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-6">
        <div className="pb-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900 mb-1">Select User</h3>
          <p className="text-sm text-gray-500">Search for a user to create a booking for</p>
        </div>

        <div className="space-y-4">
          <Popover open={userSearchOpen} onOpenChange={setUserSearchOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={userSearchOpen}
                className="w-full justify-between"
              >
                {selectedProfile ? (
                  <span>
                    {selectedProfile.full_name || selectedProfile.email || selectedProfile.username}
                  </span>
                ) : (
                  "Search for a user..."
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
              <Command>
                <CommandInput 
                  placeholder="Search users..." 
                  value={searchTerm}
                  onValueChange={setSearchTerm}
                />
                {profilesLoading ? (
                  <div className="py-6 text-center text-sm text-muted-foreground">
                    Loading users...
                  </div>
                ) : profilesError ? (
                  <div className="py-6 text-center text-sm text-destructive">
                    Error loading users
                  </div>
                ) : (
                  <>
                    <CommandEmpty>No users found.</CommandEmpty>
                    <CommandGroup className="max-h-60 overflow-y-auto">
                      {filteredProfiles.map((profile) => (
                        <CommandItem
                          key={profile.id}
                          value={profile.id}
                          onSelect={() => handleProfileSelect(profile)}
                          className="flex flex-col items-start"
                        >
                          <div className="font-medium">
                            {profile.full_name || profile.username || "Unnamed User"}
                          </div>
                          {profile.email && (
                            <div className="text-sm text-muted-foreground">{profile.email}</div>
                          )}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </>
                )}
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {selectedProfile && (
          <div className="space-y-6">
            <div className="flex flex-col lg:flex-row gap-8">
              <div className="flex-1 space-y-6">
                <div className="pb-6 border-b border-gray-200">
                  <h3 className="text-xl font-semibold text-gray-900 mb-1">Custom Price (Optional)</h3>
                  <p className="text-sm text-gray-500">Override the automatically calculated price</p>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="customPrice">Custom Price (CHF)</Label>
                    <Input
                      id="customPrice"
                      type="number"
                      step="0.01"
                      min="0"
                      value={customPrice}
                      onChange={(e) => setCustomPrice(e.target.value)}
                      placeholder={`Default: ${formData.price?.toFixed(2) || '0.00'} CHF`}
                      className="py-5"
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Leave empty to use the calculated price based on dates and room type
                    </p>
                  </div>
                </div>
              </div>

              <div className={`${isMobile ? 'w-full' : 'lg:w-[400px]'} space-y-6`}>
                <BookingDetailsPanel
                  formData={formData}
                  handleInputChange={handleInputChange}
                  handlePaymentTypeChange={handlePaymentTypeChange}
                  minDate={minDate}
                  maxDate={maxDate}
                  discountAmount={discountAmount}
                  isRoleBasedDiscount={isRoleBasedDiscount}
                  discountName={discountName}
                  discountPercentage={discountPercentage}
                  discountMonth={discountMonth}
                  customPrice={customPrice ? parseFloat(customPrice) : undefined}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-start space-x-2 mt-6">
        <Checkbox
          id="terms"
          checked={termsAccepted}
          onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
          className="mt-1"
        />
        <label htmlFor="terms" className="text-sm text-gray-600">
          I accept the{" "}
          <button
            type="button"
            onClick={() => setShowTerms(true)}
            className="text-primary hover:underline font-medium"
          >
            Terms and Conditions
          </button>
        </label>
      </div>

      <Button
        type="submit"
        className="w-full bg-primary hover:bg-primary/90 text-white text-lg py-6"
        disabled={!isSubmitEnabled}
      >
        {isLoading ? "Processing..." : "Create Booking"}
      </Button>

      <TermsDialog open={showTerms} onOpenChange={setShowTerms} />
    </form>
  );
};

export default AdminBookingForm;


import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
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
import PersonalInfoFields from "./booking/PersonalInfoFields";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

  const minDate = "2025-05-01";
  const maxDate = "2025-05-25";

  // Query to fetch profiles for the dropdown
  const { data: profiles, isLoading: profilesLoading, error: profilesError } = useQuery({
    queryKey: ['adminProfilesList'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, username')
        .order('email', { ascending: true });
      
      if (error) throw error;
      return data || [];
    }
  });

  // Handle profile selection
  const handleProfileSelect = (profileId: string) => {
    if (!profiles) return;
    
    const profile = profiles.find(p => p.id === profileId);
    if (!profile) return;
    
    setSelectedProfile(profile);
    
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
          <p className="text-sm text-gray-500">Choose a user by email</p>
        </div>

        <div className="space-y-4">
          {profilesError ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>Error loading users. Please try again.</AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-2">
              <Select
                value={selectedProfile?.id || ""}
                onValueChange={handleProfileSelect}
                disabled={profilesLoading}
              >
                <SelectTrigger className="w-full py-5">
                  <SelectValue placeholder="Select a user by email" />
                </SelectTrigger>
                <SelectContent>
                  {profilesLoading ? (
                    <div className="p-2 text-center text-sm text-muted-foreground">
                      Loading users...
                    </div>
                  ) : profiles && profiles.length > 0 ? (
                    profiles.map((profile) => (
                      profile.email ? (
                        <SelectItem key={profile.id} value={profile.id} className="py-2">
                          <div className="font-medium">{profile.email}</div>
                          {profile.full_name && (
                            <div className="text-xs text-muted-foreground">{profile.full_name}</div>
                          )}
                        </SelectItem>
                      ) : null
                    ))
                  ) : (
                    <div className="p-2 text-center text-sm text-muted-foreground">
                      No users found
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {selectedProfile && (
          <div className="space-y-6">
            <div className="flex flex-col lg:flex-row gap-8">
              <div className="flex-1 space-y-6">
                <div className="pb-6 border-b border-gray-200">
                  <h3 className="text-xl font-semibold text-gray-900 mb-1">Contact Information</h3>
                  <p className="text-sm text-gray-500">All fields are required for the booking</p>
                </div>
                <div className="space-y-4">
                  <PersonalInfoFields
                    formData={formData}
                    handleInputChange={handleInputChange}
                    onCountryChange={handleCountryChange}
                  />
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
                >
                  {/* Custom price field moved inside BookingDetailsPanel */}
                  <div className="space-y-2 mt-4">
                    <label htmlFor="customPrice" className="text-sm font-medium text-gray-700">
                      Custom Price (CHF)
                    </label>
                    <input
                      id="customPrice"
                      type="number"
                      step="0.01"
                      min="0"
                      value={customPrice}
                      onChange={(e) => setCustomPrice(e.target.value)}
                      placeholder={`Default: ${formData.price?.toFixed(2) || '0.00'} CHF`}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm py-5"
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Leave empty to use the calculated price
                    </p>
                  </div>
                </BookingDetailsPanel>
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

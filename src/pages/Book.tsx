
import { useState, useEffect } from "react";
import BookingForm from "@/components/BookingForm";
import AdminBookingForm from "@/components/AdminBookingForm";
import { PageTitle } from "@/components/PageTitle";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePrivy } from "@privy-io/react-auth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Invoice } from "@/types/invoice";
import { UserInvoiceView } from "@/components/booking/UserInvoiceView";
import { useBookingSettings } from "@/hooks/useBookingSettings";

const Book = () => {
  const isMobile = useIsMobile();
  const { user } = usePrivy();
  const [isAdmin, setIsAdmin] = useState(false);
  const { settings: bookingSettings } = useBookingSettings();
  
  // Check if user is admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user?.id) {
        setIsAdmin(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('privy_id', user.id)
          .maybeSingle();

        if (error) throw error;
        
        setIsAdmin(data?.role === 'admin' || false);
      } catch (error) {
        console.error('Error fetching profile:', error);
        setIsAdmin(false);
      }
    };

    checkAdminStatus();
  }, [user?.id]);

  // Fetch user's invoice if they have one
  const { data: userInvoice, isLoading } = useQuery({
    queryKey: ['userInvoice', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      try {
        // First get the profile id for the current user
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id')
          .eq('privy_id', user.id)
          .maybeSingle();

        if (profileError) throw profileError;
        if (!profileData) return null;

        // Get the user's invoice
        const { data, error } = await supabase
          .from('invoices')
          .select('*')
          .eq('profile_id', profileData.id)
          .neq('status', 'cancelled')
          .order('created_at', { ascending: false })
          .limit(1);

        if (error) throw error;
        return data && data.length > 0 ? data[0] as Invoice : null;
      } catch (error) {
        console.error('Error fetching invoice:', error);
        return null;
      }
    },
    enabled: Boolean(user?.id),
    retry: false,
    refetchOnWindowFocus: false
  });
  
  return (
    <div className="flex flex-col h-full">
      <PageTitle title={userInvoice && !isAdmin ? "Your Booking" : isAdmin ? "Admin Booking Form" : "Book Your Stay"} />
      <div className={`py-4 ${isMobile ? 'px-0' : 'px-4 md:px-8'} flex-grow`}>
        <div className={`container ${isMobile ? 'mx-0 max-w-none' : 'max-w-4xl mx-auto'}`}>
          {isLoading ? (
            <div className="flex justify-center p-8">
              <div className="animate-pulse">Loading your booking information...</div>
            </div>
          ) : isAdmin ? (
            <AdminBookingForm />
          ) : userInvoice ? (
            <UserInvoiceView invoice={userInvoice} />
          ) : (
            <BookingForm bookingBlockEnabled={bookingSettings?.blockEnabled ?? true} />
          )}
        </div>
      </div>
    </div>
  );
};

export default Book;


import BookingForm from "@/components/BookingForm";
import { PageTitle } from "@/components/PageTitle";
import { useIsMobile } from "@/hooks/use-mobile";

const Book = () => {
  const isMobile = useIsMobile();
  
  return (
    <div className="flex flex-col h-full">
      <PageTitle title="Book Your Stay" />
      <div className={`py-4 ${isMobile ? 'px-0' : 'px-4 md:px-8'} flex-grow`}>
        <div className={`container ${isMobile ? 'mx-0 max-w-none' : 'max-w-4xl mx-auto'}`}>
          <BookingForm />
        </div>
      </div>
    </div>
  );
};

export default Book;

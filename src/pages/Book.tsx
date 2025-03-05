
import BookingForm from "@/components/BookingForm";
import { PageTitle } from "@/components/PageTitle";

const Book = () => {
  return (
    <div className="flex flex-col h-full">
      <PageTitle title="Book Your Stay" />
      <div className="py-8 px-4 md:px-8 flex-grow">
        <div className="container max-w-4xl mx-auto">
          <BookingForm />
        </div>
      </div>
    </div>
  );
};

export default Book;

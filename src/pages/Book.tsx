
import BookingForm from "@/components/BookingForm";

const Book = () => {
  return (
    <div className="min-h-screen bg-secondary/30 py-12">
      <div className="container max-w-4xl mx-auto px-4">
        <img 
          src="/lovable-uploads/2796594c-9800-4554-b79d-a1da8992c369.png"
          alt="Switzerland Logo"
          className="logo mb-8"
        />
        <BookingForm />
      </div>
    </div>
  );
};

export default Book;


interface BookingFormHeaderProps {
  title: string;
  description: string;
}

export const BookingFormHeader = ({ title, description }: BookingFormHeaderProps) => {
  return (
    <div className="space-y-2">
      <h2 className="text-3xl font-semibold text-primary">{title}</h2>
      <p className="text-gray-500">{description}</p>
    </div>
  );
};

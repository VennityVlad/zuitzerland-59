
import { format } from "date-fns";

interface DateDisplayProps {
  date: string;
}

export const DateDisplay = ({ date }: DateDisplayProps) => {
  const dateObj = new Date(date);
  const month = format(dateObj, "MMM").toUpperCase();
  const day = format(dateObj, "d");

  return (
    <div className="flex flex-col items-center justify-center bg-secondary/20 rounded-lg p-2 w-16 h-16">
      <span className="text-sm font-medium text-gray-600">{month}</span>
      <span className="text-2xl font-bold">{day}</span>
    </div>
  );
};


import { format } from "date-fns";

interface EventDateBadgeProps {
  date: Date;
}

export const EventDateBadge = ({ date }: EventDateBadgeProps) => {
  const month = format(date, "MMM").toUpperCase();
  const day = format(date, "d");

  return (
    <div className="flex flex-col items-center justify-center w-14 h-14 bg-[#1A1F2C] text-white rounded-lg">
      <span className="text-xs font-semibold">{month}</span>
      <span className="text-xl font-bold">{day}</span>
    </div>
  );
};

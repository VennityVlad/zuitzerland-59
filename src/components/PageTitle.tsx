
import { ReactNode } from "react";

interface PageTitleProps {
  title: string;
  description?: ReactNode;
}

export const PageTitle = ({ title, description }: PageTitleProps) => {
  return (
    <div className="py-4 px-6 bg-secondary/10 border-b">
      <h1 className="text-2xl font-semibold text-hotel-navy">{title}</h1>
      {description && <p className="text-gray-500 mt-1">{description}</p>}
    </div>
  );
};

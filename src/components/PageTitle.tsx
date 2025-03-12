
import { ReactNode } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

interface PageTitleProps {
  title: string;
  description?: ReactNode;
}

export const PageTitle = ({ title, description }: PageTitleProps) => {
  const isMobile = useIsMobile();
  
  return (
    <div className={`py-4 ${isMobile ? 'px-4 bg-white border-b border-gray-200' : 'px-6 bg-secondary/10 border-b'}`}>
      <div className={`${isMobile ? 'text-left' : ''}`}>
        <h1 className="text-2xl font-semibold text-hotel-navy">{title}</h1>
        {description && <p className="text-gray-500 mt-1">{description}</p>}
      </div>
    </div>
  );
};


import { ReactNode } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

interface PageTitleProps {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
  noBackground?: boolean;
}

export const PageTitle = ({ 
  title, 
  description, 
  actions, 
  className = "",
  noBackground = false
}: PageTitleProps) => {
  const isMobile = useIsMobile();
  
  const bgClass = noBackground 
    ? "" 
    : `${isMobile ? 'bg-white border-b border-gray-200' : 'bg-secondary/10 border-b'}`;
  
  return (
    <div className={`py-4 ${isMobile ? 'px-4' : 'px-6'} ${bgClass} ${className}`}>
      <div className={`${isMobile ? '' : 'container mx-auto'} flex flex-col sm:flex-row justify-between items-start sm:items-center`}>
        <div>
          <h1 className="text-2xl font-semibold text-hotel-navy">{title}</h1>
          {description && <p className="text-gray-500 mt-1">{description}</p>}
        </div>
        {actions && (
          <div className="mt-4 sm:mt-0 flex gap-2">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

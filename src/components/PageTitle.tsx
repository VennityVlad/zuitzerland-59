
import { ReactNode } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

interface PageTitleProps {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  icon?: ReactNode;
}

export const PageTitle = ({ title, description, actions, icon }: PageTitleProps) => {
  const isMobile = useIsMobile();
  
  return (
    <div className={`py-4 ${isMobile ? 'px-4 bg-white border-b border-gray-200' : 'px-6 bg-white border-b'}`}>
      <div className={`${isMobile ? '' : 'container mx-auto'} flex flex-col sm:flex-row justify-between items-start sm:items-center`}>
        <div className="flex items-center gap-3">
          {icon && <div className="text-purple">{icon}</div>}
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
            {description && <p className="text-gray-500 mt-1">{description}</p>}
          </div>
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

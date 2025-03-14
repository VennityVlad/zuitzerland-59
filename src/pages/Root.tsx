
import React from 'react';
import { Outlet } from 'react-router-dom';
import NavMenu from '@/components/NavMenu';
import BottomNav from '@/components/BottomNav';
import { useIsMobile } from '@/hooks/use-mobile';

const Root: React.FC = () => {
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {!isMobile && <NavMenu />}
      <main className="flex-1">
        <Outlet />
      </main>
      {isMobile && <BottomNav />}
    </div>
  );
};

export default Root;

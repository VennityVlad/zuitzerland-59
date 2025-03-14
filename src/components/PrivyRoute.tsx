
import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { usePrivy } from '@privy-io/react-auth';

interface PrivyRouteProps {
  children: ReactNode;
}

const PrivyRoute = ({ children }: PrivyRouteProps) => {
  const { ready, authenticated } = usePrivy();

  if (!ready) {
    return <div>Loading...</div>;
  }

  if (!authenticated) {
    return <Navigate to="/signin" replace />;
  }

  return <>{children}</>;
};

export default PrivyRoute;

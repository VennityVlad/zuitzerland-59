
import React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Root from '@/pages/Root';
import Book from './pages/Book';
import Invoices from './pages/Invoices';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';
import Discounts from './pages/Discounts';
import RoomTypes from './pages/RoomTypes';
import Reports from './pages/Reports';

const router = createBrowserRouter([
  {
    path: "/",
    element: <Root />,
    errorElement: <NotFound />,
    children: [
      {
        path: "/",
        element: <Book />,
      },
      {
        path: "/book",
        element: <Book />,
      },
      {
        path: "/invoices",
        element: <Invoices />,
      },
      {
        path: "/profile",
        element: <Profile />,
      },
      {
        path: "/discounts",
        element: <Discounts />,
      },
      {
        path: "/room-types",
        element: <RoomTypes />,
      },
      {
        path: "/reports",
        element: <Reports />,
      },
    ],
  },
]);

function App() {
  return (
    <React.StrictMode>
      <RouterProvider router={router} />
    </React.StrictMode>
  );
}

export default App;

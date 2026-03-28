import { lazy, Suspense } from 'react';
import {
  createBrowserRouter,
  Navigate,
} from 'react-router-dom';
import App from './App';
import { StationView } from './views/StationView';

const ExpeditorDashboard = lazy(
  () =>
    import('./views/expeditor/ExpeditorDashboard').then((m) => ({
      default: m.ExpeditorDashboard,
    })),
);

const CustomerTracker = lazy(
  () =>
    import('./views/customer/CustomerTracker').then((m) => ({
      default: m.CustomerTracker,
    })),
);

const DeliveryBoard = lazy(
  () =>
    import('./views/delivery/DeliveryBoard').then((m) => ({
      default: m.DeliveryBoard,
    })),
);

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
  },
  {
    path: '/station',
    element: <StationView />,
  },
  {
    path: '/expeditor',
    element: (
      <Suspense fallback={<div>Loading...</div>}>
        <ExpeditorDashboard />
      </Suspense>
    ),
  },
  {
    path: '/track/:token',
    element: (
      <Suspense fallback={<div>Loading...</div>}>
        <CustomerTracker />
      </Suspense>
    ),
  },
  {
    path: '/delivery',
    element: (
      <Suspense fallback={<div>Loading...</div>}>
        <DeliveryBoard />
      </Suspense>
    ),
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);

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

const OnboardingWizard = lazy(
  () =>
    import('./views/admin/OnboardingWizard').then((m) => ({
      default: m.OnboardingWizard,
    })),
);

const SimulatorPanel = lazy(
  () =>
    import('./views/admin/SimulatorPanel').then((m) => ({
      default: m.SimulatorPanel,
    })),
);

const ManagementConsole = lazy(
  () =>
    import('./views/management/ManagementConsole').then((m) => ({
      default: m.ManagementConsole,
    })),
);

const AdoptionDashboard = lazy(
  () =>
    import('./views/admin/AdoptionDashboard').then((m) => ({
      default: m.AdoptionDashboard,
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
    path: '/admin',
    element: (
      <Suspense fallback={<div>Loading...</div>}>
        <OnboardingWizard />
      </Suspense>
    ),
  },
  {
    path: '/admin/simulator',
    element: (
      <Suspense fallback={<div>Loading...</div>}>
        <SimulatorPanel />
      </Suspense>
    ),
  },
  {
    path: '/management',
    element: (
      <Suspense fallback={<div>Loading...</div>}>
        <ManagementConsole />
      </Suspense>
    ),
  },
  {
    path: '/admin/adoption',
    element: (
      <Suspense fallback={<div>Loading...</div>}>
        <AdoptionDashboard />
      </Suspense>
    ),
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);

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
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);

import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AdminLayout } from '../layouts/AdminLayout';
import { Login } from '../pages/Login';
import { ModulePage } from '../pages/ModulePage';
import { RiskWatchlistPage } from '../pages/RiskWatchlist';
import { SystemConfig } from '../pages/SystemConfig';
import { adminModules } from './modules';

function moduleElement(module: (typeof adminModules)[number]) {
  if (module.page === 'system-config') {
    return <SystemConfig />;
  }

  if (module.page === 'risk-watchlist') {
    return <RiskWatchlistPage />;
  }

  if (!module.module) {
    return <ModulePage title={module.label} description={module.description} module="dashboard" />;
  }

  return <ModulePage title={module.label} description={module.description} module={module.module} />;
}

export const router = createBrowserRouter([
  { path: '/login', element: <Login /> },
  {
    path: '/',
    element: <AdminLayout />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      ...adminModules.map((module) => ({
        path: module.path.slice(1),
        element: moduleElement(module),
      })),
    ],
  },
]);

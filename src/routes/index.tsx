import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AdminLayout } from '../layouts/AdminLayout';
import { Login } from '../pages/Login';
import { ModulePage } from '../pages/ModulePage';
import { RefundManagement } from '../pages/RefundManagement';
import { SystemConfig } from '../pages/SystemConfig';
import { adminModules } from './modules';

function renderModule(module: (typeof adminModules)[number]) {
  if (module.module === 'config') {
    return <SystemConfig />;
  }

  if (module.module === 'refunds') {
    return <RefundManagement />;
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
        element: renderModule(module),
      })),
    ],
  },
]);

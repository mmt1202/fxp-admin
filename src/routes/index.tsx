import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AdminLayout } from '../layouts/AdminLayout';
import { Login } from '../pages/Login';
import { ModulePage } from '../pages/ModulePage';
import { SystemConfig } from '../pages/SystemConfig';
import { CityConfig } from '../pages/CityConfig';
import { adminModules } from './modules';

const moduleElement = (module: (typeof adminModules)[number]) => {
  if (module.module === 'config') {
    return <SystemConfig />;
  }

  if (module.module === 'city-config') {
    return <CityConfig />;
  }

  return <ModulePage title={module.label} description={module.description} module={module.module} />;
};

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

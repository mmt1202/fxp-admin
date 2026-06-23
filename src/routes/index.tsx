import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AdminLayout } from '../layouts/AdminLayout';
import { Login } from '../pages/Login';
import { ModulePage } from '../pages/ModulePage';
import { PropertyGovernance } from '../pages/PropertyGovernance';
import { PropertyManagement } from '../pages/PropertyManagement';
import { SystemConfig } from '../pages/SystemConfig';
import { adminModules } from './modules';

function getModuleElement(module: typeof adminModules[number]) {
  if (module.path === '/config') {
    return <SystemConfig />;
  }

  if (module.path === '/properties') {
    return <PropertyManagement />;
  }

  if (module.path === '/property-governance') {
    return <PropertyGovernance />;
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
        element: getModuleElement(module),
      })),
    ],
  },
]);

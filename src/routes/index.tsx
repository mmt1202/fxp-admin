import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AdminLayout } from '../layouts/AdminLayout';
import { Login } from '../pages/Login';
import { ModulePage } from '../pages/ModulePage';
import { SystemConfig } from '../pages/SystemConfig';
import { AiCostMonitor } from '../pages/AiCostMonitor';
import { adminModules, type AdminModule } from './modules';

function renderModule(module: AdminModule) {
  if (module.path === '/config') {
    return <SystemConfig />;
  }

  if (module.path === '/ai-costs') {
    return <AiCostMonitor />;
  }

  return <ModulePage title={module.label} description={module.description} module={module.module as Exclude<AdminModule['module'], 'config' | 'ai-costs'>} />;
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

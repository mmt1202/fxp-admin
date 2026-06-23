import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AdminLayout } from '../layouts/AdminLayout';
import { Login } from '../pages/Login';
import { MarketingCampaigns } from '../pages/MarketingCampaigns';
import { ModulePage } from '../pages/ModulePage';
import { SystemConfig } from '../pages/SystemConfig';
import { adminModules, type AdminModule } from './modules';

function renderModulePage(module: AdminModule) {
  switch (module.module) {
    case 'config':
      return <SystemConfig />;
    case 'marketing':
      return <MarketingCampaigns />;
    default:
      return <ModulePage title={module.label} description={module.description} module={module.module} />;
  }
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
        element: renderModulePage(module),
      })),
    ],
  },
]);

import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AdminLayout } from '../layouts/AdminLayout';
import { Login } from '../pages/Login';
import { ContentModeration } from '../pages/ContentModeration';
import { AnalyticsPage, DashboardPage } from '../pages/AnalyticsPages';
import { MarketingCampaigns } from '../pages/MarketingCampaigns';
import { ContentModeration } from '../pages/ContentModeration';
import { ModulePage } from '../pages/ModulePage';
import { RecommendationPools } from '../pages/RecommendationPools';
import { CmsArticles } from '../pages/CmsArticles';
import { RecallTasks } from '../pages/RecallTasks';
import { RecallTasks } from '../pages/RecallTasks';
import { PropertyGovernance } from '../pages/PropertyGovernance';
import { PropertyManagement } from '../pages/PropertyManagement';
import { SystemConfig } from '../pages/SystemConfig';
import { RiskConfig } from '../pages/RiskConfig';
import { UserDetailPage } from '../pages/UserDetailPage';
import { UserListPage } from '../pages/UserListPage';
import { MembershipPlans } from '../pages/MembershipPlans';
import { SystemHealth } from '../pages/SystemHealth';
import { UserLifecycle } from '../pages/UserLifecycle';
import { PermissionRoute } from './PermissionRoute';
import { adminModules, type AdminModule } from './modules';
import { ContentQuality } from '../pages/ContentQuality';

function renderModulePage(module: AdminModule) {
      if (module.path === '/properties') {
        return <PropertyManagement />;
      }

      if (module.path === '/property-governance') {
        return <PropertyGovernance />;
      }
  switch (module.module) {
    case 'config':
      return <SystemConfig />;
    case 'marketing':
      return <MarketingCampaigns />;
    case 'content-quality' :
       return <ContentQuality />
    default:
      return <ModulePage title={module.label} description={module.description} module={module.module} />;
  }

}
import { OperationLogs } from '../pages/OperationLogs';
import { ModerationPage } from '../pages/ModerationPage';
import { UsersPage } from '../pages/UsersPage';
import { Properties } from '../pages/Properties';
import { PropertyManagement } from '../pages/PropertyManagement';
import { UserDetail } from '../pages/UserDetail';
import { adminModules } from './modules';

export const router = createBrowserRouter([
  { path: '/login', element: <Login /> },
  {
      path: '/',
      element: <AdminLayout />,
      children: [
        { index: true, element: <Navigate to="/dashboard" replace /> },
        ...adminModules.map((module) => ({
          path: module.path.slice(1),
          element: module.path === '/content-moderation'
            ? <ContentModeration />
            : <ModulePage title={module.label} description={module.description} />,
        })),
      ],
    },
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
  {
    path: '/',
    element: <AdminLayout />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'analytics', element: <AnalyticsPage /> },
      ...adminModules
        .filter((module) => !['/dashboard', '/analytics'].includes(module.path))
        .map((module) => ({
          path: module.path.slice(1),
          element: <ModulePage title={module.label} description={module.description} />,
        })),
    ],
  },
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
  {
      path: '/',
      element: <AdminLayout />,
      children: [
        { index: true, element: <Navigate to="/dashboard" replace /> },
        ...adminModules.map((module) => ({
          path: module.path.slice(1),
          element: module.path === '/content-moderation'
            ? <ContentModeration />
            : <ModulePage title={module.label} description={module.description} />,
        })),
      ],
    }
  {
      path: '/',
      element: <AdminLayout />,
      children: [
        { index: true, element: <Navigate to="/dashboard" replace /> },
        ...adminModules.map((module) => ({
          path: module.path.slice(1),
          element: module.path === '/membership/plans'
            ? <MembershipPlans />
            : <ModulePage title={module.label} description={module.description} />,
        })),
      ],
    },
  {
      path: '/',
      element: <AdminLayout />,
      children: [
        { index: true, element: <Navigate to="/dashboard" replace /> },
        ...adminModules.map((module) => ({
          path: module.path.slice(1),
          element: module.path === '/users'
            ? <UserListPage />
            : <ModulePage title={module.label} description={module.description} />,
        })),
        { path: 'users/:userId', element: <UserDetailPage /> },
      ],
    },
  {
      path: '/',
      element: <AdminLayout />,
      children: [
        { index: true, element: <Navigate to="/dashboard" replace /> },
        ...adminModules.map((module) => ({
          path: module.path.slice(1),
          element: <PermissionRoute module={module} />,
        })),
      ],
    },
    {
        path: '/',
        element: <AdminLayout />,
        children: [
          { index: true, element: <Navigate to="/dashboard" replace /> },
          ...adminModules.map((module) => ({
            path: module.path.slice(1),
            element: module.path === '/users'
              ? <UserDetail />
              : <ModulePage title={module.label} description={module.description} />,
          })),
        ],
      },
  {
      path: '/',
      element: <AdminLayout />,
      children: [
        { index: true, element: <Navigate to="/dashboard" replace /> },
        ...adminModules.map((module) => ({
          path: module.path.slice(1),
          element: module.path === '/risk'
            ? <RiskConfig />
            : <ModulePage title={module.label} description={module.description} />,
        })),
      ],
    },
{
    path: '/',
    element: <AdminLayout />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      ...adminModules.map((module) => ({
        path: module.path.slice(1),
        element: module.path === '/config'
          ? <SystemConfig />
          : module.path === '/user-segments'
            ? <UserSegments />
            : <ModulePage title={module.label} description={module.description} module={module.module ?? 'dashboard'} />,
      })),
    ],
  },
  {
      path: '/',
      element: <AdminLayout />,
      children: [
        { index: true, element: <Navigate to="/dashboard" replace /> },
        ...adminModules.map((module) => ({
          path: module.path.slice(1),
          element: module.element ?? <ModulePage title={module.label} description={module.description} />,
        })),
      ],
    },
    {
        path: '/',
        element: <AdminLayout />,
        children: [
          { index: true, element: <Navigate to="/dashboard" replace /> },
          ...adminModules.map((module) => ({
            path: module.path.slice(1),
            element: module.path === '/config'
              ? <SystemConfig />
              : module.path === '/recommendation-pools'
                ? <RecommendationPools />
                : <ModulePage title={module.label} description={module.description} module={module.module} />,
          })),
        ],
      },
  {
      path: '/',
      element: <AdminLayout />,
      children: [
        { index: true, element: <Navigate to="/dashboard" replace /> },
        ...adminModules.map((module) => ({
          path: module.path.slice(1),
          element: module.module === 'config'
            ? <SystemConfig />
            : module.module === 'cms'
              ? <CmsArticles />
              : <ModulePage title={module.label} description={module.description} module={module.module} />,
        })),
      ],
    },
    {
        path: '/',
        element: <AdminLayout />,
        children: [
          { index: true, element: <Navigate to="/dashboard" replace /> },
          ...adminModules.map((module) => ({
            path: module.path.slice(1),
            element: module.path === '/system-health'
              ? <SystemHealth />
              : <ModulePage title={module.label} description={module.description} />,
          })),
        ],
      },
  {
      path: '/',
      element: <AdminLayout />,
      children: [
        { index: true, element: <Navigate to="/dashboard" replace /> },
        ...adminModules.map((module) => ({
          path: module.path.slice(1),
          element: module.module === 'config'
            ? <SystemConfig />
            : module.module === 'recall-tasks'
              ? <RecallTasks />
              : <ModulePage title={module.label} description={module.description} module={module.module} />,
        })),
      ],
    },
{
    path: '/',
    element: <AdminLayout />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      ...adminModules.map((module) => ({
        path: module.path.slice(1),
        element: module.path === '/properties'
          ? <PropertyManagement />
          : <ModulePage title={module.label} description={module.description} />,
      })),
    ],
  },
{
    path: '/',
    element: <AdminLayout />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      ...adminModules.map((module) => ({
        path: module.path.slice(1),
        element: module.module === 'config'
          ? <SystemConfig />
          : module.module === 'user-lifecycle'
            ? <UserLifecycle />
            : <ModulePage title={module.label} description={module.description} module={module.module} />,
      })),
    ],
  },
  {
      path: '/',
      element: <AdminLayout />,
      children: [
        { index: true, element: <Navigate to="/dashboard" replace /> },
        ...adminModules.map((module) => ({
          path: module.path.slice(1),
          element: module.module === 'config'
            ? <SystemConfig />
            : module.module === 'recall-tasks'
              ? <RecallTasks />
              : <ModulePage title={module.label} description={module.description} module={module.module} />,
        })),
      ],
    },
  {
    path: '/',
    element: <AdminLayout />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      ...adminModules.map((module) => ({
        path: module.path.slice(1),
        element: module.path === '/operation-logs'
          ? <OperationLogs />
          : <ModulePage title={module.label} description={module.description} />,
      })),
    ],
  },
  {
      path: '/',
      element: <AdminLayout />,
      children: [
        { index: true, element: <Navigate to="/dashboard" replace /> },
        ...adminModules.map((module) => ({
          path: module.path.slice(1),
          element: module.path === '/users'
            ? <UsersPage />
            : module.path === '/moderation'
              ? <ModerationPage />
              : <ModulePage title={module.label} description={module.description} />,
        })),
      ],
    },
 {
    path: '/',
    element: <AdminLayout />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      ...adminModules.map((module) => ({
        path: module.path.slice(1),
        element: module.path === '/properties'
          ? <Properties />
          : <ModulePage title={module.label} description={module.description} />,
      })),
    ],
  },
]);

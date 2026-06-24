import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AdminLayout } from '../layouts/AdminLayout';
import { Login } from '../pages/Login';
import { AdminUsers } from '../pages/AdminUsers';
import { AnalyticsPage, DashboardPage } from '../pages/AnalyticsPages';
import { CmsArticles } from '../pages/CmsArticles';
import { ContentModeration } from '../pages/ContentModeration';
import { ContentQuality } from '../pages/ContentQuality';
import { MarketingCampaigns } from '../pages/MarketingCampaigns';
import { MarketingTools } from '../pages/MarketingTools';
import { MembershipPlans } from '../pages/MembershipPlans';
import { ModerationPage } from '../pages/ModerationPage';
import { ModulePage } from '../pages/ModulePage';
import { OperationLogs } from '../pages/OperationLogs';
import { PropertyGovernance } from '../pages/PropertyGovernance';
import { PropertyManagement } from '../pages/PropertyManagement';
import { RecallTasks } from '../pages/RecallTasks';
import { RecommendationPools } from '../pages/RecommendationPools';
import { RegionalHeatPage } from '../pages/RegionalHeatPage';
import { RiskConfig } from '../pages/RiskConfig';
import { SystemConfig } from '../pages/SystemConfig';
import { SystemHealth } from '../pages/SystemHealth';
import { UserDetailPage } from '../pages/UserDetailPage';
import { UserLifecycle } from '../pages/UserLifecycle';
import { UserMembershipsPage } from '../pages/UserMembershipsPage';
import { UserListPage } from '../pages/UserListPage';
import { UserSegments } from '../pages/UserSegments';
import { PermissionRoute } from './PermissionRoute';
import { adminModules, type AdminModule } from './modules';

function moduleElement(module: AdminModule) {
  switch (module.path) {
    case '/dashboard': return <DashboardPage />;
    case '/analytics': return <AnalyticsPage />;
    case '/users': return <UserListPage />;
    case '/users/:userId': return <UserDetailPage />;
    case '/properties': return <PropertyManagement />;
    case '/property-governance': return <PropertyGovernance />;
    case '/content-moderation': return <ContentModeration />;
    case '/moderation':
    case '/reports': return <ModerationPage />;
    case '/membership': return <UserMembershipsPage />;
    case '/membership/plans': return <MembershipPlans />;
    case '/marketing': return <MarketingCampaigns />;
    case '/marketing/tools': return <MarketingTools />;
    case '/marketing/recall-tasks': return <RecallTasks />;
    case '/recommendation-pools': return <RecommendationPools />;
    case '/content-quality': return <ContentQuality />;
    case '/user-lifecycle': return <UserLifecycle />;
    case '/user-segments': return <UserSegments />;
    case '/cms': return <CmsArticles />;
    case '/operation-logs': return <OperationLogs />;
    case '/regional-heat': return <RegionalHeatPage />;
    case '/system-health': return <SystemHealth />;
    case '/config':
    case '/settings': return <SystemConfig />;
    case '/risk': return <RiskConfig />;
    case '/admin-users': return <AdminUsers />;
    default: return <ModulePage title={module.label} description={module.description} module={module.module} />;
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
        element: module.permission ? <PermissionRoute module={module}>{moduleElement(module)}</PermissionRoute> : moduleElement(module),
      })),
    ],
  },
]);

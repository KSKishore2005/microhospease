import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import Layout from '../components/common/Layout';

import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import LandingPage from '../pages/LandingPage';
import ToastProvider from '../components/common/ToastProvider';

import GuestDashboard from '../pages/guest/GuestDashboard';
import Reservations from '../pages/guest/Reservations';
import Invoices from '../pages/guest/Invoices';
import ServiceRequests from '../pages/guest/ServiceRequests';
import LoyaltyPoints from '../pages/guest/LoyaltyPoints';

import FrontDeskDashboard from '../pages/frontdesk/FrontDeskDashboard';
import ReservationManagement from '../pages/frontdesk/ReservationManagement';
import CheckInOut from '../pages/frontdesk/CheckInOut';
import GuestCommunications from '../pages/frontdesk/GuestCommunications';

import HousekeepingDashboard from '../pages/housekeeping/HousekeepingDashboard';
import TaskList from '../pages/housekeeping/TaskList';
import RoomStatus from '../pages/housekeeping/RoomStatus';

import ServiceStaffDashboard from '../pages/servicestaff/ServiceStaffDashboard';
import FBOrders from '../pages/servicestaff/FBOrders';
import SpaGymBookings from '../pages/servicestaff/SpaGymBookings';
import ServiceFulfillment from '../pages/servicestaff/ServiceFulfillment';

import FinanceDashboard from '../pages/finance/FinanceDashboard';
import InvoicesPayments from '../pages/finance/InvoicesPayments';
import Refunds from '../pages/finance/Refunds';
import Reconciliation from '../pages/finance/Reconciliation';

import ManagerDashboard from '../pages/manager/ManagerDashboard';
import StaffScheduling from '../pages/manager/StaffScheduling';
import PerformanceMonitoring from '../pages/manager/PerformanceMonitoring';
import OccupancyReports from '../pages/manager/OccupancyReports';

import AdminDashboard from '../pages/admin/AdminDashboard';
import UserRoleManagement from '../pages/admin/UserRoleManagement';
import PropertyConfiguration from '../pages/admin/PropertyConfiguration';
import AuditPackage from '../pages/admin/AuditPackage';

import ReportingDashboard from '../pages/reporting/ReportingDashboard';
import KPIs from '../pages/reporting/KPIs';
import ScheduledReports from '../pages/reporting/ScheduledReports';
import ComplianceExports from '../pages/reporting/ComplianceExports';


function Unauthorized() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-navy-900 mb-4">403</h1>
        <p className="text-gray-600">You don't have permission to access this page.</p>
      </div>
    </div>
  );
}

const router = createBrowserRouter([
  { path: '/', element: <LandingPage /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  { path: '/unauthorized', element: <Unauthorized /> },

  // ── Guest Portal ─────────────────────────────────────────────────────────
  {
    path: '/guest',
    element: <ProtectedRoute allowedRoles={['GUEST']}><Layout /></ProtectedRoute>,
    children: [
      { index: true, element: <GuestDashboard /> },
      { path: 'reservations', element: <Reservations /> },
      { path: 'invoices', element: <Invoices /> },
      { path: 'service-requests', element: <ServiceRequests /> },
      { path: 'loyalty', element: <LoyaltyPoints /> },
    ],
  },

  // ── Front Desk ───────────────────────────────────────────────────────────
  {
    path: '/frontdesk',
    element: <ProtectedRoute allowedRoles={['FRONT_DESK', 'MANAGER', 'ADMIN']}><Layout /></ProtectedRoute>,
    children: [
      { index: true, element: <FrontDeskDashboard /> },
      { path: 'reservations', element: <ReservationManagement /> },
      { path: 'checkinout', element: <CheckInOut /> },
      { path: 'communications', element: <GuestCommunications /> },
    ],
  },

  // ── Housekeeping ──────────────────────────────────────────────────────────
  {
    path: '/housekeeping',
    element: <ProtectedRoute allowedRoles={['HOUSEKEEPING', 'MANAGER', 'ADMIN']}><Layout /></ProtectedRoute>,
    children: [
      { index: true, element: <HousekeepingDashboard /> },
      { path: 'tasks', element: <TaskList /> },
      { path: 'room-status', element: <RoomStatus /> },
    ],
  },

  // ── Service Staff ─────────────────────────────────────────────────────────
  {
    path: '/servicestaff',
    element: <ProtectedRoute allowedRoles={['SERVICE_STAFF', 'MANAGER', 'ADMIN']}><Layout /></ProtectedRoute>,
    children: [
      { index: true, element: <ServiceStaffDashboard /> },
      { path: 'orders', element: <FBOrders /> },
      { path: 'spa-gym', element: <SpaGymBookings /> },
      { path: 'fulfillment', element: <ServiceFulfillment /> },
    ],
  },

  // ── Finance ───────────────────────────────────────────────────────────────
  {
    path: '/finance',
    element: <ProtectedRoute allowedRoles={['FINANCE', 'MANAGER', 'ADMIN']}><Layout /></ProtectedRoute>,
    children: [
      { index: true, element: <FinanceDashboard /> },
      { path: 'invoices', element: <InvoicesPayments /> },
      { path: 'refunds', element: <Refunds /> },
      { path: 'reconciliation', element: <Reconciliation /> },
    ],
  },

  // ── Manager ───────────────────────────────────────────────────────────────
  {
    path: '/manager',
    element: <ProtectedRoute allowedRoles={['MANAGER', 'ADMIN']}><Layout /></ProtectedRoute>,
    children: [
      { index: true, element: <ManagerDashboard /> },
      { path: 'scheduling', element: <StaffScheduling /> },
      { path: 'performance', element: <PerformanceMonitoring /> },
      { path: 'occupancy', element: <OccupancyReports /> },
    ],
  },

  // ── Admin ─────────────────────────────────────────────────────────────────
  {
    path: '/admin',
    element: <ProtectedRoute allowedRoles={['ADMIN']}><Layout /></ProtectedRoute>,
    children: [
      { index: true, element: <AdminDashboard /> },
      { path: 'users', element: <UserRoleManagement /> },
      { path: 'property', element: <PropertyConfiguration /> },
      { path: 'audit', element: <AuditPackage /> },
    ],
  },

  // ── Reporting ─────────────────────────────────────────────────────────────
  {
    path: '/reporting',
    element: <ProtectedRoute allowedRoles={['REPORTING', 'MANAGER', 'ADMIN']}><Layout /></ProtectedRoute>,
    children: [
      { index: true, element: <ReportingDashboard /> },
      { path: 'kpis', element: <KPIs /> },
      { path: 'scheduled', element: <ScheduledReports /> },
      { path: 'compliance', element: <ComplianceExports /> },
    ],
  },
]);

export default function AppRouter() {
  return (
    <>
      <RouterProvider router={router} />
      <ToastProvider />
    </>
  );
}

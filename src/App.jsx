import { Navigate, Route, Routes } from 'react-router-dom'
import AdminLayout from './components/admin/AdminLayout'
import ProtectedRoute from './components/ProtectedRoute'
import PartnerLayout from './components/partner/PartnerLayout'
import VerificationGate from './components/VerificationGate'
import ClientLayout from './components/client/ClientLayout'
import { AuthProvider } from './context/AuthContext'
import ActivityLogsPage from './pages/admin/ActivityLogsPage'
import CatalogPage from './pages/admin/CatalogPage'
import CommissionsPage from './pages/admin/CommissionsPage'
import DashboardPage from './pages/admin/DashboardPage'
import MarketingKitPage from './pages/admin/MarketingKitPage'
import NotificationsPage from './pages/admin/NotificationsPage'
import OrderDetailPage from './pages/admin/OrderDetailPage'
import OrdersPage from './pages/admin/OrdersPage'
import PaymentsPage from './pages/admin/PaymentsPage'
import PartnerDetailPage from './pages/admin/PartnerDetailPage'
import PartnersPage from './pages/admin/PartnersPage'
import ReportsPage from './pages/admin/ReportsPage'
import ClientCatalogPage from './pages/client/CatalogPage'
import ClientDashboardPage from './pages/client/DashboardPage'
import ClientRegisterPage from './pages/ClientRegisterPage'
import OrderEntryPage from './pages/OrderEntryPage'
import ClientCreateOrderPage from './pages/client/CreateOrderPage'
import ClientOrderDetailPage from './pages/client/OrderDetailPage'
import ClientInvitationDetailPage from './pages/client/InvitationDetailPage'
import ClientInvitationsPage from './pages/client/InvitationsPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import PartnerCommissionsPage from './pages/partner/CommissionsPage'
import PartnerDashboardPage from './pages/partner/DashboardPage'
import PartnerHelpCenterPage from './pages/partner/HelpCenterPage'
import PartnerMarketingKitPage from './pages/partner/MarketingKitPage'
import PartnerNotificationsPage from './pages/partner/NotificationsPage'
import PartnerOrderDetailPage from './pages/partner/OrderDetailPage'
import PartnerOrdersPage from './pages/partner/OrdersPage'
import PartnerProfilePage from './pages/partner/ProfilePage'

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/daftar" element={<ClientRegisterPage />} />
        <Route path="/order/baru" element={<OrderEntryPage />} />

        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRole="admin">
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="partners" element={<PartnersPage />} />
          <Route path="partners/:id" element={<PartnerDetailPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="orders/:id" element={<OrderDetailPage />} />
          <Route path="payments" element={<PaymentsPage />} />
          <Route path="commissions" element={<CommissionsPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="activity-logs" element={<ActivityLogsPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="marketing-kit" element={<MarketingKitPage />} />
          <Route path="catalog" element={<CatalogPage />} />
        </Route>

        <Route
          path="/partner"
          element={
            <ProtectedRoute allowedRole="partner">
              <PartnerLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<PartnerDashboardPage />} />
          <Route
            path="orders"
            element={
              <VerificationGate title="Orders">
                <PartnerOrdersPage />
              </VerificationGate>
            }
          />
          <Route
            path="orders/:id"
            element={
              <VerificationGate title="Orders">
                <PartnerOrderDetailPage />
              </VerificationGate>
            }
          />
          <Route
            path="commissions"
            element={
              <VerificationGate title="Commissions">
                <PartnerCommissionsPage />
              </VerificationGate>
            }
          />
          <Route path="notifications" element={<PartnerNotificationsPage />} />
          <Route path="profile" element={<PartnerProfilePage />} />
          <Route path="help-center" element={<PartnerHelpCenterPage />} />
          <Route
            path="marketing-kit"
            element={
              <VerificationGate title="Marketing Kit">
                <PartnerMarketingKitPage />
              </VerificationGate>
            }
          />
        </Route>

        <Route
          path="/client"
          element={
            <ProtectedRoute allowedRole="client">
              <ClientLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<ClientDashboardPage />} />
          <Route path="katalog" element={<ClientCatalogPage />} />
          <Route path="order/baru" element={<ClientCreateOrderPage />} />
          <Route path="orders/:id" element={<ClientOrderDetailPage />} />
          <Route path="undangan" element={<ClientInvitationsPage />} />
          <Route path="undangan/:id" element={<ClientInvitationDetailPage />} />
        </Route>

        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  )
}

export default App

import React, { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

// Layouts
import MainLayout from "../layouts/MainLayout";
import RouteFallback from "../components/RouteFallback";
import PrefetchManager from "./PrefetchManager";
import { loaders } from "./routeModules";
import TitleManager from "./TitleManager";
import RouterBridge from "./RouterBridge";
import AdminLayout from "../layouts/AdminLayout";
import OwnerLayout from "../layouts/OwnerLayout";

// Route guards
import ProtectedRoute from "../components/auth/ProtectedRoute";
import UserRoleRoute from "./UserRoleRoute"; // kept — has custom guest+customer logic

// Utility
import UnAuthorized from "../pages/UnAuthorized";
import PasswordResetFlow from "../components/auth/PasswordResetFlow";

// Lazy loaded pages
const LoginPage = lazy(loaders.LoginPage);
const RegisterPage = lazy(loaders.RegisterPage);
const LandingPage = lazy(loaders.LandingPage);
const EsewaReturnPage = lazy(loaders.EsewaReturnPage);
const AboutUs = lazy(loaders.AboutUs);
const TermsPage = lazy(loaders.TermsPage);
const PrivacyPage = lazy(loaders.PrivacyPage);
const ContactUs = lazy(loaders.ContactUs);
const ListYourVenuePage = lazy(loaders.ListYourVenuePage);
const ListVenueApplyPage = lazy(loaders.ListVenueApplyPage);
const VenuesPage = lazy(loaders.VenuesPage);
const FavoritesPage = lazy(loaders.FavoritesPage);
const MyBookings = lazy(loaders.MyBookings);
const VenueDetails = lazy(loaders.VenueDetails);
const InquiryPage = lazy(loaders.InquiryPage);
const MyInquiriesPage = lazy(loaders.MyInquiriesPage);
const InquiryDetailPage = lazy(loaders.InquiryDetailPage);
const OwnerInquiriesPage = lazy(loaders.OwnerInquiriesPage);
const OwnerInquiryDetailPage = lazy(loaders.OwnerInquiryDetailPage);
const ChatPage = lazy(loaders.ChatPage);
const ProfilePage = lazy(loaders.ProfilePage);

// Admin Pages
const AdminDashboard = lazy(loaders.AdminDashboard);
const AdminUsersPage = lazy(loaders.AdminUsersPage);
const AdminVenuePage = lazy(loaders.AdminVenuePage);
const AdminVenueOwnerPage = lazy(loaders.AdminVenueOwnerPage);
const AdminReviewsPage = lazy(loaders.AdminReviewsPage);
const AdminApplicationsPage = lazy(loaders.AdminApplicationsPage);
const AdminApplicationDetailPage = lazy(loaders.AdminApplicationDetailPage);
const SetPasswordPage = lazy(loaders.SetPasswordPage);
const AdminContactPage = lazy(loaders.AdminContactPage);

// Owner Pages
const OwnerDashboard = lazy(loaders.OwnerDashboard);
const OwnerAnalyticsPage = lazy(loaders.OwnerAnalyticsPage);
const OwnerVenueReviewsPage = lazy(loaders.OwnerVenueReviewsPage);
const OwnerBookingsPage = lazy(loaders.OwnerBookingsPage);
const OwnerVenuePage = lazy(loaders.OwnerVenuePage);
const OwnerChatPage = lazy(loaders.OwnerChatPage);
const OwnerPaymentPage = lazy(loaders.OwnerPaymentPage);

// 404 Page
const NotFound = lazy(loaders.NotFound);

// Outer fallback: only for pages that have no layout of their own (sign-in, 404, ...) on a cold load. Layout pages
// have a boundary inside the layout, so their header and footer never disappear.
const PageFallback = () => (
  <div className="min-h-dvh bg-cream">
    <RouteFallback />
  </div>
);

export default function AppRouter() {
  return (
    <BrowserRouter>
      <TitleManager />
      <RouterBridge />
      <PrefetchManager />
      <Suspense fallback={<PageFallback />}>
        <Routes>
          {/* Public pages accessible by all (no guard) */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/about" element={<AboutUs />} />
            <Route path="/contact" element={<ContactUs />} />
            <Route path="/list-your-venue" element={<ListYourVenuePage />} />
            <Route path="/list-your-venue/apply" element={<ListVenueApplyPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            {/* Testimonials were replaced by reviews of completed bookings */}
            <Route path="/testimonial" element={<Navigate to="/my-bookings" replace />} />

            {/* Routes restricted to guests and customers only. One MainLayout wraps both groups, so the header and
                footer stay mounted when moving between a public page and a customer page. */}
            <Route element={<UserRoleRoute />}>
              <Route path="/venues" element={<VenuesPage />} />
              <Route path="/venue/:id" element={<VenueDetails />} />
              <Route path="/venue/:id/inquire" element={<InquiryPage />} />

              <Route path="/favorites" element={<FavoritesPage />} />
              <Route path="/my-bookings" element={<MyBookings />} />
              <Route path="/my-inquiries" element={<MyInquiriesPage />} />
              <Route path="/my-inquiries/:id" element={<InquiryDetailPage />} />
              <Route path="/payment/esewa/success" element={<EsewaReturnPage outcome="success" />} />
              <Route path="/payment/esewa/failure" element={<EsewaReturnPage outcome="failure" />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/chat" element={<ChatPage />} />
            </Route>
          </Route>

          {/* Guest-only routes — authenticated users are bounced to their dashboard */}
          <Route element={<ProtectedRoute guestOnly />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Route>
          <Route path="/password-reset" element={<PasswordResetFlow />} />
          {/* The emailed link for an approved venue owner: reachable whether or not someone is signed in */}
          <Route path="/set-password" element={<SetPasswordPage />} />

          {/* Admin Protected Routes */}
          <Route element={<ProtectedRoute requiredRole="Admin" />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/user" element={<AdminUsersPage />} />
              <Route path="/admin/venue" element={<AdminVenuePage />} />
              <Route path="/admin/contact" element={<AdminContactPage />} />
              <Route path="/admin/owner" element={<AdminVenueOwnerPage />} />
              <Route path="/admin/applications" element={<AdminApplicationsPage />} />
              <Route path="/admin/applications/:id" element={<AdminApplicationDetailPage />} />
              <Route path="/admin/reviews" element={<AdminReviewsPage />} />
              <Route path="/admin/testimonial" element={<Navigate to="/admin/reviews" replace />} />
            </Route>
          </Route>

          {/* Owner Protected Routes */}
          <Route element={<ProtectedRoute requiredRole="VenueOwner" />}>
            <Route element={<OwnerLayout />}>
              <Route path="/owner/dashboard" element={<OwnerDashboard />} />
              <Route path="/owner/analytics" element={<OwnerAnalyticsPage />} />
              <Route
                path="/owner/reviews"
                element={<OwnerVenueReviewsPage />}
              />
              <Route path="/owner/bookings" element={<OwnerBookingsPage />} />
              <Route path="/owner/inquiries" element={<OwnerInquiriesPage />} />
              <Route path="/owner/inquiries/:id" element={<OwnerInquiryDetailPage />} />
              <Route path="/owner/venues" element={<OwnerVenuePage />} />
              <Route path="/owner/chat" element={<OwnerChatPage />} />
              <Route path="/owner/payments" element={<OwnerPaymentPage />} />
            </Route>
          </Route>

          {/* Unauthorized route accessible by everyone */}
          <Route path="/unauthorized" element={<UnAuthorized />} />

          {/* Global 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

import React, { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

// Layouts
import MainLayout from "../layouts/MainLayout";
import LoadingPage from "../components/LoadingPage";
import AdminLayout from "../layouts/AdminLayout";
import OwnerLayout from "../layouts/OwnerLayout";

// Route guards
import ProtectedRoute from "../components/auth/ProtectedRoute";
import UserRoleRoute from "./UserRoleRoute"; // kept — has custom guest+customer logic

// Utility
import UnAuthorized from "../pages/UnAuthorized";
import PasswordResetFlow from "../components/auth/PasswordResetFlow";

// Lazy loaded pages
const LoginPage = lazy(() => import("../pages/LoginPage"));
const RegisterPage = lazy(() => import("../pages/RegisterPage"));
const LandingPage = lazy(() => import("../pages/user/LandingPage"));
const AboutUs = lazy(() => import("../pages/user/AboutUs"));
const ContactUs = lazy(() => import("../pages/user/ContactUs"));
const VenueList = lazy(() => import("../components/user/VenueList"));
const FavoriteSection = lazy(() =>
  import("../components/user/FavoriteSection")
);
const MyBookings = lazy(() => import("../pages/user/MyBookingsPage"));
const VenueDetails = lazy(() => import("../pages/user/VenueDetails"));
const InquiryPage = lazy(() => import("../pages/user/InquiryPage"));
const MyInquiriesPage = lazy(() => import("../pages/user/MyInquiriesPage"));
const InquiryDetailPage = lazy(() => import("../pages/user/InquiryDetailPage"));
const OwnerInquiriesPage = lazy(() => import("../pages/venueOwner/OwnerInquiriesPage"));
const OwnerInquiryDetailPage = lazy(() => import("../pages/venueOwner/OwnerInquiryDetailPage"));
const BookingPage = lazy(() => import("../pages/user/BookingPage"));
const DateAndTimeSelectionPage = lazy(() =>
  import("../components/user/DateandTimeSelection")
);
const GuestDetailsPage = lazy(() => import("../components/user/GuestDetails"));
const AddOnsSelectionPage = lazy(() =>
  import("../components/user/AddonSelection")
);
const PaymentInformationPage = lazy(() =>
  import("../components/user/PaymentInformation")
);
const ChatPage = lazy(() => import("../pages/user/ChatPage"));
const ProfilePage = lazy(() => import("../pages/user/ProfilePage"));

// Admin Pages
const AdminDashboard = lazy(() => import("../pages/admin/AdminDashboard"));
const AdminUsersPage = lazy(() => import("../pages/admin/AdminUsersPage"));
const AdminVenuePage = lazy(() => import("../pages/admin/AdminVenuePage"));
const AdminVenueOwnerPage = lazy(() =>
  import("../pages/admin/AddVenueOwnerPage")
);
const AdminTestimonialPage = lazy(() =>
  import("../pages/admin/AdminTestimonialPage")
);
const AdminContactPage = lazy(() => import("../pages/admin/AdminContactPage"));

// Owner Pages
const OwnerDashboard = lazy(() => import("../pages/venueOwner/OwnerDashboard"));
const OwnerAnalyticsPage = lazy(() =>
  import("../pages/venueOwner/OwnerAnalyticsPage")
);
const OwnerVenueReviewsPage = lazy(() =>
  import("../pages/venueOwner/OwnerVenueReviewsPage")
);
const OwnerBookingsPage = lazy(() =>
  import("../pages/venueOwner/OwnerBookingsPage")
);
const OwnerVenuePage = lazy(() => import("../pages/venueOwner/OwnerVenuePage"));
const OwnerChatPage = lazy(() => import("../pages/venueOwner/OwnerChatPage"));
const OwnerPaymentPage = lazy(() =>
  import("../pages/venueOwner/OwnerPaymentPage")
);

// 404 Page
const NotFound = lazy(() => import("../pages/NotFound"));

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingPage />}>
        <Routes>
          {/* Public pages accessible by all (no guard) */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/about" element={<AboutUs />} />
            <Route path="/contact" element={<ContactUs />} />
            {/* Testimonials were replaced by reviews of completed bookings */}
            <Route path="/testimonial" element={<Navigate to="/my-bookings" replace />} />
          </Route>

          {/* Routes restricted to guests and customers only */}
          <Route element={<UserRoleRoute />}>
            <Route element={<MainLayout />}>
              <Route path="/venues" element={<VenueList />} />
              <Route path="/venue/:id" element={<VenueDetails />} />
              <Route path="/venue/:id/inquire" element={<InquiryPage />} />

              <Route path="/favorites" element={<FavoriteSection />} />
              <Route path="/my-bookings" element={<MyBookings />} />
              <Route path="/my-inquiries" element={<MyInquiriesPage />} />
              <Route path="/my-inquiries/:id" element={<InquiryDetailPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/checkout/:id" element={<BookingPage />}>
                <Route index element={<DateAndTimeSelectionPage />} />
                <Route path="guests" element={<GuestDetailsPage />} />
                <Route path="addons" element={<AddOnsSelectionPage />} />
                <Route path="payment" element={<PaymentInformationPage />} />
              </Route>
              <Route path="/chat" element={<ChatPage />} />
            </Route>
          </Route>

          {/* Guest-only routes — authenticated users are bounced to their dashboard */}
          <Route element={<ProtectedRoute guestOnly />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Route>
          <Route path="/password-reset" element={<PasswordResetFlow />} />

          {/* Admin Protected Routes */}
          <Route element={<ProtectedRoute requiredRole="Admin" />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/user" element={<AdminUsersPage />} />
              <Route path="/admin/venue" element={<AdminVenuePage />} />
              <Route path="/admin/contact" element={<AdminContactPage />} />
              <Route path="/admin/owner" element={<AdminVenueOwnerPage />} />
              <Route
                path="/admin/testimonial"
                element={<AdminTestimonialPage />}
              />
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

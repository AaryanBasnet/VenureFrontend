import React, { useContext, useState } from "react";
import MonthlyEarningsChart from "../../components/owner/MonthlyEarningsChart";
import { useGetMonthlyEarningsForOwner } from "../../hooks/owner/useGetMonthlyEarningForOwner";
import useOwnerBookings from "../../hooks/owner/useOwnerBookings";
import { StatCard } from "../../components/common/StatCard";
import { AuthContext } from "../../auth/AuthProvider";
import useActiveVenueCount from "../../hooks/owner/useGetActiveVenueCount";
import { useGetTotalBookingsForOwner } from "../../hooks/owner/useGetTotalBookingsForOwner";
import NotificationDropdown from "../../components/NotificationDropdown";
import {
  Building2,
  Calendar,
  CheckCircle,
  Clock,
  Banknote,
  TrendingUp,
  Users,
  XCircle,
} from "lucide-react";

export default function OwnerDashboard() {
  const {
    data: bookings = [],
    isLoading: isLoadingBookings,
  } = useOwnerBookings();
  const { data, isLoading, error } = useGetMonthlyEarningsForOwner();

  const { user } = useContext(AuthContext);
  const ownerId = user?._id;
  const {
    data: activeVenueCountData,
    isLoading: isLoadingActiveVenueCount,
  } = useActiveVenueCount(ownerId);

  const {
    data: monthlyEarningsData,
    isLoading: isLoadingEarnings,
  } = useGetMonthlyEarningsForOwner();
  const currentMonthIndex = new Date().getMonth();
  const currentMonthEarnings =
    monthlyEarningsData?.[currentMonthIndex]?.totalEarnings ?? 0;
  const { data: totalBookingCountData, isLoading: isLoadingBookingCount } =
    useGetTotalBookingsForOwner();

  const itemsPerPage = 5;
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(bookings.length / itemsPerPage);

  const paginatedBookings = bookings.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getStatusIcon = (status) => {
    switch (status) {
      case "confirmed":
      case "approved":
        return <CheckCircle className="w-4 h-4" />;
      case "cancelled":
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "confirmed":
      case "completed":
      case "approved":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-amber-100 text-amber-800 border-amber-200";
    }
  };
  const BookingRow = ({ booking }) => {
    const date = new Date(booking.startTime).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    return (
      <div className="group flex items-center justify-between p-4 rounded-xl hover:bg-indigo-50/50 transition-all duration-200 border border-transparent hover:border-indigo-100">
        <div className="flex items-center gap-3 flex-1">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-gray-900 group-hover:text-indigo-900 transition-colors">
              {booking.venue?.venueName || "Venue Name"}
            </p>
            <div className="flex items-center gap-4 mt-1">
              <p className="text-sm text-gray-500 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {date}
              </p>
              {booking.customer?.name && (
                <p className="text-sm text-gray-500 flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {booking.customer.name}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="text-right">
          <p className="font-bold text-gray-900 mb-2">
            NPR {booking.totalPrice?.toLocaleString() ?? 0}
          </p>
          <span
            className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium border ${getStatusColor(
              booking.status
            )}`}
          >
            {getStatusIcon(booking.status)}
            {String(booking.status ?? "pending").replace("_", " ")}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
              <p className="text-sm text-gray-600">
                Welcome back! Here's your venue performance overview.
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <NotificationDropdown />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Monthly Revenue"
            value={
              isLoadingEarnings
                ? "Loading..."
                : `NPR ${currentMonthEarnings.toLocaleString()}`
            }
            subtitle="This month"
            icon={Banknote}
            trend={12.5}
            color="green"
          />
          <StatCard
            title="Total Bookings"
            value={
              isLoadingBookingCount ? "Loading..." : totalBookingCountData || 0
            }
            subtitle="This month"
            icon={Calendar}
            trend={8.2}
            color="blue"
          />
          <StatCard
            title="Active Venues"
            value={
              isLoadingActiveVenueCount
                ? "Loading..."
                : activeVenueCountData || 0
            }
            subtitle="Currently listed"
            icon={Building2}
            color="purple"
          />
          
        </div>

        {/* Charts and Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Monthly Earnings Chart */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Monthly Earnings
                </h2>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-3 text-gray-600">
                    Loading earnings data...
                  </span>
                </div>
              ) : error ? (
                <div className="flex items-center justify-center h-64 text-red-600">
                  <div className="text-center">
                    <p className="text-lg font-medium">
                      Error loading chart data
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Please try refreshing the page
                    </p>
                    <button className="mt-3 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors">
                      Retry
                    </button>
                  </div>
                </div>
              ) : (
                <div className="h-64">
                  <MonthlyEarningsChart
                    data={data ?? []}
                    isLoading={isLoading}
                    error={error}
                  />{" "}
                </div>
              )}
            </div>
          </div>
          {/* Recent Bookings */}
          <div className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 overflow-hidden">
            <div className="p-8 pb-0">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Recent Bookings
                  </h2>
                  <p className="text-gray-600 text-sm mt-1">
                    Latest venue reservations
                  </p>
                </div>
              </div>
            </div>

            <div className="px-4 pb-6">
              {isLoadingBookings ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                  <span className="ml-3 text-gray-600">
                    Loading bookings...
                  </span>
                </div>
              ) : paginatedBookings.length > 0 ? (
                <div className="space-y-2">
                  {paginatedBookings.map((booking) => (
                    <BookingRow key={booking._id} booking={booking} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="font-medium text-gray-900">
                    No recent bookings
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    New bookings will appear here
                  </p>
                </div>
              )}
            </div>
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-end items-center gap-2 mt-4 text-sm text-gray-700">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                  className="px-2 py-1 rounded hover:bg-gray-100 disabled:opacity-50"
                >
                  Prev
                </button>
                <span className="px-2">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className="px-2 py-1 rounded hover:bg-gray-100 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

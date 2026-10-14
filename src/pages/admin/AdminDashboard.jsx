import React, { useMemo } from "react";
import {
  FaUsers,
  FaChartLine,
  FaDollarSign,
  FaShoppingCart,
  FaCalendarCheck,
  FaUserPlus,
  FaEye,
} from "react-icons/fa";
import { FiArrowUp, FiArrowDown, FiSearch } from "react-icons/fi";
import { FaBuildingColumns } from "react-icons/fa6";
import RecentActivity from "../../components/admin/RecentActivity";
import { useGetCustomerCount } from "../../hooks/admin/useGetCustomerCount";
import { useGetApprovedVenuesCount } from "../../hooks/admin/useGetApprovedVenuesCount";
import useGetTotalEarnings from "../../hooks/admin/useGetTotalEarnings";
import { useGetTotalBookingsForAdmin } from "../../hooks/admin/useGetTotalBookings";
import NotificationDropdown from "../../components/NotificationDropdown";
import { useTopVenuesByBooking } from "../../hooks/admin/useTopVenuesByBooking";

import clsx from "clsx";

// StatCard component: memoized
const StatCard = React.memo(({ stat }) => {
  const TrendIcon = stat.trend === "up" ? FiArrowUp : FiArrowDown;

  // Dynamic colors with Tailwind + clsx
  const iconBgClass = clsx({
    [`bg-${stat.color}-100`]: true,
  });
  const iconColorClass = clsx({
    [`text-${stat.color}-600`]: true,
  });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className={`p-3 rounded-lg ${iconBgClass}`}>
          <stat.icon className={`w-6 h-6 ${iconColorClass}`} />
        </div>
        <div
          className={clsx(
            "flex items-center gap-1 text-sm",
            stat.trend === "up" ? "text-green-600" : "text-red-600"
          )}
        ></div>
      </div>
      <div className="mt-4">
        <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
        <p className="text-sm text-gray-600 mt-1">{stat.title}</p>
        <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
      </div>
    </div>
  );
});

// TopVenueItem component: memoized for list performance
const TopVenueItem = React.memo(({ venue, index }) => (
  <div
    key={venue.venueId}
    className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors"
  >
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
        <span className="text-sm font-medium text-blue-600">#{index + 1}</span>
      </div>
      <div>
        <p className="font-medium text-gray-900">{venue.venueName}</p>
        <p className="text-sm text-gray-600">
          {venue.bookingCount} bookings • {venue.location?.city},{" "}
          {venue.location?.state}
        </p>
      </div>
    </div>
    <div className="text-right">
      <div className="flex items-center gap-1">
        <span className="text-yellow-400 text-base">★</span>
        <span className="text-sm text-gray-600">
          {venue.averageRating != null ? venue.averageRating : "N/A"}
        </span>
      </div>
    </div>
  </div>
));

const AdminDashboard = () => {

  const {
    data: topVenues = [],
    isLoading: isTopVenuesLoading,
    isError: isTopVenuesError,
  } = useTopVenuesByBooking();

  const { data: bookingCount, isLoading: isBookingLoading } =
    useGetTotalBookingsForAdmin();

  const { data: customerCount, isLoading: isCustomerLoading } =
    useGetCustomerCount();

  const { data: venueCount, isLoading: isVenueLoading } =
    useGetApprovedVenuesCount();

  const { data: totalRevenue, isLoading: isRevenueLoading } =
    useGetTotalEarnings();

  const currentMonthIndex = new Date().getMonth();
  const currentMonthEarnings = useMemo(() => {
    return totalRevenue?.[currentMonthIndex]?.totalEarnings ?? 0;
  }, [totalRevenue, currentMonthIndex]);

  // Compose stats data only when dependencies change
  const statsData = useMemo(
    () => [
      {
        title: "Total Users",
        value: isCustomerLoading ? "Loading..." : customerCount ?? 0,
        icon: FaUsers,
        color: "blue",
        description: "Registered users",
      },
      {
        title: "Total Revenue",
        value: isRevenueLoading
          ? "Loading..."
          : `NPR ${currentMonthEarnings.toLocaleString()}`,

        icon: FaDollarSign,
        color: "green",
        description: "This month",
      },
      {
        title: "Active Venues",
        value: isVenueLoading ? "Loading..." : venueCount ?? 0,

        icon: FaBuildingColumns,
        color: "purple",
        description: "Currently listed",
      },
      {
        title: "Today's Bookings",
        value: isBookingLoading ? "Loading..." : bookingCount ?? 0,

        icon: FaCalendarCheck,
        color: "orange",
        description: "New bookings today",
      },
    ],
    [
      customerCount,
      currentMonthEarnings,
      venueCount,
      bookingCount,
      isCustomerLoading,
      isRevenueLoading,
      isVenueLoading,
      isBookingLoading,
    ]
  );

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      {/* Header Section */}
      <header className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Dashboard Overview
            </h1>
            <p className="text-gray-600 mt-1">
              Welcome back! Here's what's happening with your platform.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start  sm:items-center gap-2 sm:gap-4">
            {/* Search Bar */}
            {/* Notifications */}
            <NotificationDropdown />
          </div>
        </div>
      </header>

      {/* Stats Cards */}
      <section
        aria-label="Platform statistics"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
      >
        {statsData.map((stat, index) => (
          <StatCard key={stat.title + index} stat={stat} />
        ))}
      </section>

      {/* Bottom Section */}
      <section
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        aria-label="Dashboard details"
      >
        {/* Recent Activities */}
        <RecentActivity />

        {/* Top Venues */}
        <section
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
          aria-labelledby="top-venues-heading"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3
                id="top-venues-heading"
                className="text-lg font-semibold text-gray-900"
              >
                Top Performing Venues
              </h3>
              <p className="text-sm text-gray-600">Based on bookings</p>
            </div>
            <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              View All
            </button>
          </div>

          {isTopVenuesLoading ? (
            <p className="text-sm text-gray-500">Loading top venues...</p>
          ) : isTopVenuesError ? (
            <p className="text-sm text-red-500">Failed to load top venues.</p>
          ) : topVenues.length === 0 ? (
            <p className="text-sm text-gray-500">No venues available.</p>
          ) : (
            <div className="space-y-4">
              {topVenues.map((venue, index) => (
                <TopVenueItem key={venue.venueId} venue={venue} index={index} />
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  );
};

export default AdminDashboard;

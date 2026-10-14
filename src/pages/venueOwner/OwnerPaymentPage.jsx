import React, { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import {
  TrendingUp,
  Users,
  Banknote,
  ChevronLeft,
  ChevronRight,
  Filter,
  Download,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import { useGetMonthlyEarningsForOwner } from "../../hooks/owner/useGetMonthlyEarningForOwner";
import useOwnerBookings from "../../hooks/owner/useOwnerBookings";
import { Calendar } from "lucide-react";
const ITEMS_PER_PAGE = 5;

export default function OwnerPaymentPage() {
  const { data: bookings = [], isLoading: loadingBookings } =
    useOwnerBookings();
  const { data: earnings = [], isLoading: loadingEarnings } =
    useGetMonthlyEarningsForOwner();

  const [currentPage, setCurrentPage] = useState(1);

  const totalBookings = bookings.length;
  const totalEarnings =
    earnings?.reduce((sum, month) => sum + month.totalEarnings, 0) || 0;
  const approvedBookings = bookings.filter(
    (b) => b.status === "approved"
  ).length;
  const avgEarnings = Math.round(totalEarnings / earnings.length);

  const totalPages = Math.ceil(bookings.length / ITEMS_PER_PAGE);
  const paginatedBookings = bookings.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handlePageChange = (direction) => {
    if (direction === "prev" && currentPage > 1) {
      setCurrentPage((p) => p - 1);
    } else if (direction === "next" && currentPage < totalPages) {
      setCurrentPage((p) => p + 1);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
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
      case "approved":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-amber-100 text-amber-800 border-amber-200";
    }
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="font-medium text-gray-900">{`${label}`}</p>
          <p className="text-indigo-600 font-semibold">
            {`NPR ${payload[0].value.toLocaleString()}`}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              Payment Dashboard
            </h1>
            <p className="text-gray-600 mt-1">
              Track your earnings and manage bookings
            </p>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity"></div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-indigo-100 text-sm font-medium">
                  Total Bookings
                </p>
                <h2 className="text-3xl font-bold mt-1">{totalBookings}</h2>
                
              </div>
              <div className="p-3 bg-white bg-opacity-20 rounded-xl backdrop-blur-sm">
                <Calendar className="w-6 h-6 text-purple-500" />
              </div>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-500 p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity"></div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-sm font-medium">
                  Total Earnings
                </p>
                <h2 className="text-3xl font-bold mt-1">
                  NPR {totalEarnings.toLocaleString()}
                </h2>
                <p className="text-emerald-100 text-xs mt-2">
                  this month
                </p>
              </div>
              <div className="p-3 bg-white bg-opacity-20 rounded-xl backdrop-blur-sm">
                <Banknote className="w-6 h-6 text-green-500" />
              </div>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500 via-red-500 to-pink-500 p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity"></div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm font-medium">Approved</p>
                <h2 className="text-3xl font-bold mt-1">{approvedBookings}</h2>
                <p className="text-orange-100 text-xs mt-2">
                  approval 
                </p>
              </div>
              <div className="p-3 bg-white bg-opacity-20 rounded-xl backdrop-blur-sm">
                <Users className="w-6 h-6 text-orange-500" />
              </div>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-500 via-purple-600 to-indigo-500 p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity"></div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-violet-100 text-sm font-medium">
                  Avg Monthly
                </p>
                <h2 className="text-3xl font-bold mt-1">
                  NPR {avgEarnings.toLocaleString()}
                </h2>
                <p className="text-violet-100 text-xs mt-2">
                  Consistent growth
                </p>
              </div>
              <div className="p-3 bg-white bg-opacity-20 rounded-xl backdrop-blur-sm">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Bar Chart */}
        <div className="bg-white/70 backdrop-blur-sm p-8 rounded-3xl shadow-xl border border-white/20">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                Monthly Earnings
              </h3>
              <p className="text-gray-600 text-sm mt-1">
                Track your revenue over time
              </p>
            </div>
            
          </div>
          {loadingEarnings ? (
            <div className="flex items-center justify-center h-80">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={350}>
              <BarChart
                data={earnings}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4f46e5" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="#7c3aed" stopOpacity={0.6} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#e5e7eb"
                  strokeOpacity={0.5}
                />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#6b7280", fontSize: 12 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#6b7280", fontSize: 12 }}
                  tickFormatter={(value) => `NPR ${value / 1000}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="totalEarnings"
                  fill="url(#barGradient)"
                  radius={[6, 6, 0, 0]}
                  className="hover:opacity-80 transition-opacity"
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Enhanced Bookings Table */}
        <div className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 overflow-hidden">
          <div className="p-8 pb-0">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  Recent Bookings
                </h3>
                <p className="text-gray-600 text-sm mt-1">
                  Manage your venue bookings and payments
                </p>
              </div>
              
            </div>
          </div>

          {loadingBookings ? (
            <div className="flex items-center justify-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50/50 border-y border-gray-200/50">
                      <th className="text-left p-6 text-sm font-semibold text-gray-900">
                        Customer
                      </th>
                      <th className="text-left p-6 text-sm font-semibold text-gray-900">
                        Venue
                      </th>
                      <th className="text-left p-6 text-sm font-semibold text-gray-900">
                        Date
                      </th>
                      <th className="text-left p-6 text-sm font-semibold text-gray-900">
                        Amount
                      </th>
                      <th className="text-left p-6 text-sm font-semibold text-gray-900">
                        Payment
                      </th>
                      <th className="text-left p-6 text-sm font-semibold text-gray-900">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedBookings.map((booking, index) => (
                      <tr
                        key={booking._id}
                        className={`border-b border-gray-100 hover:bg-indigo-50/30 transition-all duration-200 ${
                          index % 2 === 0 ? "bg-white/50" : "bg-gray-50/30"
                        }`}
                      >
                        <td className="p-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-semibold text-sm">
                              {booking.customer?.name?.charAt(0) || "N"}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                {booking.customer?.name || "N/A"}
                              </p>
                              <p className="text-xs text-gray-500">Customer</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-6">
                          <p className="font-medium text-gray-900">
                            {booking.venue?.venueName || "N/A"}
                          </p>
                          <p className="text-xs text-gray-500">Venue booking</p>
                        </td>
                        <td className="p-6">
                          <p className="font-medium text-gray-900">
                            {new Date(booking.bookingDate).toLocaleDateString(
                              "en-IN",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              }
                            )}
                          </p>
                          <p className="text-xs text-gray-500">Booking date</p>
                        </td>
                        <td className="p-6">
                          <p className="font-bold text-gray-900">
                            NPR {booking.totalPrice?.toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-500">Total amount</p>
                        </td>
                        <td className="p-6">
                          <span
                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium border ${
                              booking.paymentDetails?.status === "completed"
                                ? "bg-green-50 text-green-700 border-green-200"
                                : "bg-amber-50 text-amber-700 border-amber-200"
                            }`}
                          >
                            {booking.paymentDetails?.status || "N/A"}
                          </span>
                        </td>
                        <td className="p-6">
                          <span
                            className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border ${getStatusColor(
                              booking.status
                            )}`}
                          >
                            {getStatusIcon(booking.status)}
                            {booking.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {bookings.length === 0 && (
                      <tr>
                        <td
                          colSpan="6"
                          className="text-center text-gray-500 p-12"
                        >
                          <div className="flex flex-col items-center gap-2">
                            <Calendar className="w-12 h-12 text-gray-300" />
                            <p className="font-medium">No bookings available</p>
                            <p className="text-sm">
                              Bookings will appear here once customers start
                              booking your venues
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Enhanced Pagination */}
              {bookings.length > ITEMS_PER_PAGE && (
                <div className="flex justify-between items-center p-6 bg-gray-50/50 border-t border-gray-200/50">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span>Showing</span>
                    <span className="font-medium text-gray-900">
                      {(currentPage - 1) * ITEMS_PER_PAGE + 1}-
                      {Math.min(currentPage * ITEMS_PER_PAGE, bookings.length)}
                    </span>
                    <span>of</span>
                    <span className="font-medium text-gray-900">
                      {bookings.length}
                    </span>
                    <span>bookings</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePageChange("prev")}
                      disabled={currentPage === 1}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all ${
                        currentPage === 1
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : "bg-white text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 shadow-sm border border-gray-200"
                      }`}
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Previous
                    </button>
                    <div className="flex items-center gap-1">
                      {[...Array(totalPages)].map((_, index) => (
                        <button
                          key={index + 1}
                          onClick={() => setCurrentPage(index + 1)}
                          className={`w-10 h-10 rounded-lg font-medium text-sm transition-all ${
                            currentPage === index + 1
                              ? "bg-indigo-600 text-white shadow-sm"
                              : "bg-white text-gray-600 hover:bg-indigo-50 hover:text-indigo-700 border border-gray-200"
                          }`}
                        >
                          {index + 1}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => handlePageChange("next")}
                      disabled={currentPage === totalPages}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all ${
                        currentPage === totalPages
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : "bg-white text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 shadow-sm border border-gray-200"
                      }`}
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

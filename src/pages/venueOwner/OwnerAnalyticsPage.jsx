import React, { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area,
} from "recharts";
import {
  Calendar,
  TrendingUp,
  Users,
  Banknote,
  MapPin,
  BarChart3,
  Activity,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Download,
  Eye,
} from "lucide-react";

import useOwnerBookings from "../../hooks/owner/useOwnerBookings";
import { useGetMonthlyEarningsForOwner } from "../../hooks/owner/useGetMonthlyEarningForOwner";
import { useGetTotalBookingsForOwner } from "../../hooks/owner/useGetTotalBookingsForOwner";

const StatCard = ({
  icon: Icon,
  title,
  value,
  color = "blue",
  trend,
  trendValue,
}) => {
  const colorClasses = {
    blue: "from-blue-500 to-indigo-600",
    green: "from-emerald-500 to-green-600",
    purple: "from-purple-500 to-indigo-600",
    orange: "from-orange-500 to-red-500",
  };

  return (
    <div className="group relative overflow-hidden rounded-2xl bg-white shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
      <div
        className="absolute inset-0 bg-gradient-to-br opacity-5 group-hover:opacity-10 transition-opacity"
        style={{
          background: `linear-gradient(135deg, var(--tw-gradient-stops))`,
        }}
      ></div>

      <div className="relative p-6">
        <div className="flex items-center justify-between mb-4">
          <div
            className={`p-3 rounded-xl bg-gradient-to-br ${colorClasses[color]} shadow-lg`}
          >
            <Icon className="w-6 h-6 text-white" />
          </div>
          {trend && (
            <div
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${
                trend === "up"
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              {trend === "up" ? (
                <ArrowUpRight className="w-3 h-3" />
              ) : (
                <ArrowDownRight className="w-3 h-3" />
              )}
              {trendValue}
            </div>
          )}
        </div>

        <div>
          <p className="text-sm text-gray-600 font-medium mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
};

const OwnerAnalyticsPage = () => {
  const { data: totalBookings } = useGetTotalBookingsForOwner();
  const { data: monthlyEarnings } = useGetMonthlyEarningsForOwner();
  const { data: allBookings } = useOwnerBookings();

  const totalEarnings = useMemo(() => {
    return monthlyEarnings?.reduce((sum, m) => sum + m.totalEarnings, 0) ?? 0;
  }, [monthlyEarnings]);

  const mostBookedMonth = useMemo(() => {
    return monthlyEarnings?.reduce(
      (max, m) => (m.bookingCount > max.bookingCount ? m : max),
      monthlyEarnings?.[0]
    );
  }, [monthlyEarnings]);

  const avgBookingsPerMonth = Math.round((totalBookings ?? 0) / 12);

  const [currentPage, setCurrentPage] = useState(1);
  const bookingsPerPage = 5;

  const totalPages = Math.ceil((allBookings?.length ?? 0) / bookingsPerPage);
  const paginatedBookings = allBookings?.slice(
    (currentPage - 1) * bookingsPerPage,
    currentPage * bookingsPerPage
  );

  const getStatusIcon = (status) => {
    switch (status) {
      case "approved":
      case "confirmed":
      case "completed":
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
      case "confirmed":
      case "completed":
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
        <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-200">
          <p className="font-semibold text-gray-900 mb-2">{label}</p>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              ></div>
              <p className="text-sm">
                <span className="font-medium">{entry.name}:</span>
                <span className="ml-1 font-bold">
                  {entry.name === "totalEarnings"
                    ? `NPR ${entry.value.toLocaleString()}`
                    : entry.value}
                </span>
              </p>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Enhanced Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              Analytics Dashboard
            </h1>
            <p className="text-gray-600 mt-2 text-lg">
              Monitor your venue performance and revenue insights
            </p>
          </div>
          
        </div>

        {/* Enhanced KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon={Calendar}
            title="Total Bookings"
            value={totalBookings ?? 0}
            color="blue"
          />
          <StatCard
            icon={Banknote}
            title="Total Revenue (This Year)"
            value={`NPR ${totalEarnings.toLocaleString()}`}
            color="green"
          />
          <StatCard
            icon={TrendingUp}
            title="Peak Month"
            value={mostBookedMonth?.month ?? "N/A"}
            color="purple"
            trendValue={`${mostBookedMonth?.bookingCount} bookings`}
          />
          <StatCard
            icon={BarChart3}
            title="Monthly Average"
            value={`${avgBookingsPerMonth} bookings`}
            color="orange"
          />
        </div>

        {/* Enhanced Earnings Chart */}
        <div className="bg-white/70 backdrop-blur-sm p-8 rounded-3xl shadow-xl border border-white/20">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Revenue Analytics
              </h2>
              <p className="text-gray-600 mt-1">
                Track your monthly earnings and booking trends
              </p>
            </div>
            
          </div>

          <ResponsiveContainer width="100%" height={400}>
            <AreaChart
              data={monthlyEarnings}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <defs>
                <linearGradient
                  id="earningsGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#4F46E5" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient
                  id="bookingsGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.05} />
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
              <Area
                type="monotone"
                dataKey="totalEarnings"
                stroke="#4F46E5"
                strokeWidth={3}
                fill="url(#earningsGradient)"
                name="Revenue"
              />
              <Line
                type="monotone"
                dataKey="bookingCount"
                stroke="#10B981"
                strokeWidth={2}
                name="Bookings"
                yAxisId="right"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Enhanced Recent Bookings */}
        <div className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 overflow-hidden">
          <div className="p-8 pb-0">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Recent Bookings
                </h2>
                <p className="text-gray-600 mt-1">
                  Latest venue bookings and their status
                </p>
              </div>
              <button className="flex items-center gap-2 px-4 py-2 text-sm bg-indigo-50 text-indigo-700 rounded-xl hover:bg-indigo-100 transition-colors">
                <Activity className="w-4 h-4" />
                View All Activity
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50/50 border-y border-gray-200/50">
                  <th className="text-left p-6 text-sm font-semibold text-gray-900">
                    Venue
                  </th>
                  <th className="text-left p-6 text-sm font-semibold text-gray-900">
                    Customer
                  </th>
                  <th className="text-left p-6 text-sm font-semibold text-gray-900">
                    Date & Time
                  </th>
                  <th className="text-left p-6 text-sm font-semibold text-gray-900">
                    Status
                  </th>
                  <th className="text-left p-6 text-sm font-semibold text-gray-900">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedBookings?.map((booking, index) => (
                  <tr
                    key={booking._id}
                    className={`border-b border-gray-100 hover:bg-indigo-50/30 transition-all duration-200 ${
                      index % 2 === 0 ? "bg-white/50" : "bg-gray-50/30"
                    }`}
                  >
                    <td className="p-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-semibold text-sm">
                          <MapPin className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {booking.venue?.venueName}
                          </p>
                          <p className="text-xs text-gray-500">
                            Venue location
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center text-white font-semibold text-sm">
                          {booking.customer?.name?.charAt(0) || "N"}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {booking.customer?.name ?? "N/A"}
                          </p>
                          <p className="text-xs text-gray-500">Customer</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-6">
                      <div>
                        <p className="font-medium text-gray-900">
                          {new Date(booking.startTime).toLocaleDateString(
                            "en-IN",
                            {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            }
                          )}
                        </p>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {booking.shift ? booking.shift.replace("_", " ") : ""}
                        </p>
                      </div>
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
                    <td className="p-6">
                      <div>
                        <p className="font-bold text-gray-900">
                          NPR {booking.totalPrice.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500">Total amount</p>
                      </div>
                    </td>
                  </tr>
                ))}
                {allBookings?.length === 0 && (
                  <tr>
                    <td colSpan="5" className="text-center text-gray-500 p-12">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                          <Calendar className="w-8 h-8 text-gray-400" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            No bookings found
                          </p>
                          <p className="text-sm text-gray-500">
                            Your recent bookings will appear here
                          </p>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            {totalPages > 1 && (
              <div className="flex justify-between items-center p-6 border-t border-gray-200 bg-white/70">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
                >
                  Previous
                </button>

                <span className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
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
};

export default OwnerAnalyticsPage;

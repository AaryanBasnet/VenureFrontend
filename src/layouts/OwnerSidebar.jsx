import React, { useContext, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../auth/AuthProvider";
import { FiLogOut, FiBarChart2, FiMessageSquare, FiStar, FiInbox } from "react-icons/fi";
import { FaBuildingColumns } from "react-icons/fa6";
import { MdDashboard, MdPayment } from "react-icons/md";
import { BiCalendarEvent } from "react-icons/bi";
import SidebarToggle from "../components/SidebarToggle";

import useActiveVenueCount from "../hooks/owner/useGetActiveVenueCount";
import { useGetMonthlyEarningsForOwner } from "../hooks/owner/useGetMonthlyEarningForOwner";

const OwnerSidebar = ({ sidebarOpen, setSidebarOpen }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useContext(AuthContext);
  const ownerId = user?._id;

  const { data: activeVenueCountData } = useActiveVenueCount(ownerId);
  const { data: monthlyEarningsData } = useGetMonthlyEarningsForOwner();
  const currentMonthIndex = new Date().getMonth();
  const currentMonthEarnings =
    monthlyEarningsData?.[currentMonthIndex]?.totalEarnings ?? 0;

  const [hoveredItem, setHoveredItem] = useState(null);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navigationSections = [
    {
      title: "Overview",
      items: [
        {
          Icon: MdDashboard,
          title: "Dashboard",
          path: "/owner/dashboard",
          description: "Main overview",
        },
        {
          Icon: FiBarChart2,
          title: "Analytics",
          path: "/owner/analytics",
          description: "Performance metrics",
        },
      ],
    },
    {
      title: "Venue Management",
      items: [
        {
          Icon: FaBuildingColumns,
          title: "My Venues",
          path: "/owner/venues",
          description: "Manage your venues",
        },
        {
          Icon: FiStar,
          title: "Reviews",
          path: "/owner/reviews",
          description: "Customer feedback",
        },
      ],
    },
    {
      title: "Bookings & Revenue",
      items: [
        {
          Icon: FiInbox,
          title: "Inquiries",
          path: "/owner/inquiries",
          description: "Requests and quotations",
        },
        {
          Icon: BiCalendarEvent,
          title: "Bookings",
          path: "/owner/bookings",
          description: "Manage reservations",
        },
        {
          Icon: MdPayment,
          title: "Payments",
          path: "/owner/payments",
          description: "Revenue & payouts",
        },
      ],
    },
    {
      title: "Communication",
      items: [
        {
          Icon: FiMessageSquare,
          title: "Messages",
          path: "/owner/chat",
          description: "Customer inquiries",
        },
      ],
    },
  ];

  return (
    <>
      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <nav
        className={`
          fixed lg:relative top-0 left-0 h-screen flex flex-col
          bg-white border-r border-gray-200 shadow-lg z-50 transition-all duration-300
          ${sidebarOpen ? "w-72" : "w-20"}
        `}
      >
        {/* User Info + Stats */}
        <div className="px-4 pt-6 pb-4 border-b border-gray-200">
          {sidebarOpen && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg border w-full border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                  {(user?.name || "O").charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 overflow-hidden">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {user?.name || "Owner"}
                  </div>
                  <div className="text-xs text-gray-600 truncate">
                    {user?.email || "owner@example.com"}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Quick Stats */}
          {sidebarOpen && (
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div className="bg-gray-50 rounded-lg p-2 text-center border border-gray-200">
                <div className="text-lg font-bold text-gray-900">
                  {activeVenueCountData || 0}
                </div>
                <div className="text-xs text-gray-600">Active Venues</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-2 text-center border border-gray-200">
                <div className="text-lg font-bold text-blue-600">
                  NPR {currentMonthEarnings}
                </div>
                <div className="text-xs text-gray-600">This Month</div>
              </div>
            </div>
          )}
        </div>

        {/* Nav Links */}
        <div className="flex-1 overflow-y-auto py-4 scrollbar-thin scrollbar-thumb-gray-300">
          {navigationSections.map((section, i) => (
            <div key={section.title} className={i > 0 ? "mt-6" : ""}>
              {sidebarOpen && (
                <div className="px-4 mb-2">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {section.title}
                  </h3>
                </div>
              )}
              <div className="space-y-1 px-2">
                {section.items.map((item) => (
                  <div
                    key={item.path}
                    onMouseEnter={() => setHoveredItem(item.path)}
                    onMouseLeave={() => setHoveredItem(null)}
                    onClick={() => navigate(item.path)}
                    className={`
                      relative transition-all duration-200 rounded-lg mx-1 cursor-pointer
                      ${
                        location.pathname === item.path
                          ? "bg-blue-50 text-blue-600 border border-blue-200"
                          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                      }
                    `}
                  >
                    <div
                      className={`flex items-center gap-3 px-3 py-3 ${
                        !sidebarOpen ? "justify-center" : ""
                      }`}
                    >
                      <item.Icon className="w-5 h-5 flex-shrink-0" />
                      {sidebarOpen && (
                        <span className="font-medium truncate">
                          {item.title}
                        </span>
                      )}
                    </div>

                    {/* Tooltip for collapsed sidebar */}
                    {!sidebarOpen && hoveredItem === item.path && (
                      <div className="absolute left-16 top-1/2 transform -translate-y-1/2 z-50">
                        <div className="bg-gray-900 text-white px-3 py-2 rounded-lg shadow-lg whitespace-nowrap">
                          <div className="font-medium">{item.title}</div>
                          <div className="text-xs text-gray-300">
                            {item.description}
                          </div>
                          <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1">
                            <div className="w-2 h-2 bg-gray-900 rotate-45"></div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 flex items-center justify-between gap-2">
          {/* Logout */}
          <button
            onClick={handleLogout}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-red-600 hover:text-white hover:bg-red-500 transition-all duration-200 ${
              !sidebarOpen ? "w-full justify-center" : ""
            }`}
          >
            <FiLogOut className="w-5 h-5" />
            {sidebarOpen && <span className="text-sm">Logout</span>}
          </button>

          {/* Sidebar Toggle */}
          <SidebarToggle
            open={sidebarOpen}
            setOpen={setSidebarOpen}
            className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg p-2 transition-all duration-200"
          />
        </div>
      </nav>
    </>
  );
};

export default OwnerSidebar;

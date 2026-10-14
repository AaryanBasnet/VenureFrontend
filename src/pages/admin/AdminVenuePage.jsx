import { assetUrl } from "../../utils/assetUrl";
import React, { useState } from "react";
import {
  FiMapPin,
  FiUsers,
  FiDollarSign,
  FiCheck,
  FiX,
  FiClock,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";
import { FaWifi, FaParking, FaSwimmingPool } from "react-icons/fa";
import { MdOutlineLocalBar } from "react-icons/md";
import SearchInput from "../../components/common/SearchInput";
import { useGetVenues } from "../../hooks/admin/useGetVenues";
import { useChangeVenueStatus } from "../../hooks/admin/useChangeVenueStatus";
import { toast } from "react-toastify";


const getImageUrl = (path) =>
  path ? assetUrl(path) : "";

const amenityIcons = {
  WiFi: <FaWifi />,
  Parking: <FaParking />,
  Pool: <FaSwimmingPool />,
  Bar: <MdOutlineLocalBar />,
  AC: <span className="font-bold text-xs">AC</span>,
};

const statusColors = {
  pending: "bg-yellow-100 text-yellow-500",
  approved: "bg-green-100 text-green-500",
  rejected: "bg-red-100 text-red-500",
};

const statusConfig = {
  pending: { text: "Pending", Icon: FiClock },
  approved: { text: "Approved", Icon: FiCheck },
  rejected: { text: "Rejected", Icon: FiX },
};

const AdminVenuePage = () => {
  const [activeTab, setActiveTab] = useState("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const [page, setPage] = useState(1);
  const limit = 10;

  const { data, isLoading, isError, error } = useGetVenues(
    page,
    limit,
    activeTab,
    searchQuery
  );

  const changeStatusMutation = useChangeVenueStatus();

  // Data and pagination info from backend
  const venues = data?.data || [];
  const totalVenues = data?.pagination?.total || 0;
  const totalPages = Math.ceil(totalVenues / limit);

  // Reset page when search or tab changes
  React.useEffect(() => {
    setPage(1);
  }, [activeTab, searchQuery]);

  // Modal image navigation
  const nextImage = () => {
    if (!selectedVenue) return;
    setCurrentImageIndex(
      (prev) => (prev + 1) % selectedVenue.venueImages.length
    );
  };

  const prevImage = () => {
    if (!selectedVenue) return;
    setCurrentImageIndex(
      (prev) =>
        (prev - 1 + selectedVenue.venueImages.length) %
        selectedVenue.venueImages.length
    );
  };

  // Handle venue status change (approve/reject)
  const handleStatusChange = (venueId, status) => {
    changeStatusMutation.mutate(
      { venueId, status },
      {
        onSuccess: () => {
          toast.success(`Venue ${status} successfully.`);
          setSelectedVenue(null); // close modal on success
        },
        onError: (err) => {
          toast.error("Update failed: " + (err.message || "Unknown error"));
        },
      }
    );
  };

  // Open venue detail modal and reset image index
  const openModal = (venue) => {
    setSelectedVenue(venue);
    setCurrentImageIndex(0);
  };

  const tabs = ["pending", "approved", "rejected", "all"];

  return (
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen font-poppins">
      {/* Header and Search */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-gray-800">Venue Applications</h1>
        <SearchInput
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by venue or city"
        />
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium capitalize transition-colors ${
              activeTab === tab
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Loading/Error/Empty */}
      {isLoading && (
        <div className="text-center py-12 text-blue-600 font-semibold">
          Loading venues...
        </div>
      )}

      {isError && (
        <div className="text-center py-12 text-red-600 font-semibold">
          Error loading venues: {error?.message || "Unknown error"}
        </div>
      )}

      {!isLoading && venues.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No venues found matching your criteria.
        </div>
      )}

      {/* Venue Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {venues.map((venue) => (
          <div
            data-testid="venue-card"
            key={venue._id}
            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300"
          >
            <img
              src={
                venue.venueImages && venue.venueImages.length > 0
                  ? getImageUrl(venue.venueImages[0].url)
                  : "https://via.placeholder.com/600x400?text=Venue+Image"
              }
              alt={venue.venueName}
              className="w-full h-48 object-cover"
            />
            <div className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold text-gray-800">
                    {venue.venueName}
                  </h2>
                  <p className="text-sm text-gray-500">
                    by {venue.owner?.name || "Unknown Owner"}
                  </p>
                </div>
                <div
                  className={`flex items-center gap-2 text-xs font-semibold px-2 py-1 rounded-full ${
                    statusColors[venue.status]
                  }`}
                >
                  {React.createElement(statusConfig[venue.status].Icon)}
                  {statusConfig[venue.status].text}
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-2 flex items-center gap-2">
                <FiMapPin /> {venue.location?.city || "Unknown City"},{" "}
                {venue.location?.state || "Unknown State"}
              </p>
              <p className="text-xs text-gray-400 mt-2">
                Submitted:{" "}
                {venue.createdAt
                  ? new Date(venue.createdAt).toLocaleDateString()
                  : "N/A"}
              </p>
              <button
                onClick={() => openModal(venue)}
                className="w-full mt-4 bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination Controls */}
      <div className="mt-8 flex justify-center items-center space-x-4">
        <button
          onClick={() => setPage((old) => Math.max(old - 1, 1))}
          disabled={page === 1}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FiChevronLeft />
          Prev
        </button>
        <span className="font-semibold">
          Page {page} of {totalPages}
        </span>
        <button
          onClick={() => setPage((old) => Math.min(old + 1, totalPages))}
          disabled={page === totalPages}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
          <FiChevronRight />
        </button>
      </div>

      {/* Venue Detail Modal */}
      {selectedVenue && (
        <div
          data-testid="venue-modal"
          className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4"
          onClick={() => setSelectedVenue(null)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col md:flex-row overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Image Carousel */}
            <div className="w-full md:w-1/2 relative bg-gray-100">
              <img
                src={
                  selectedVenue.venueImages &&
                  selectedVenue.venueImages.length > 0
                    ? getImageUrl(
                        selectedVenue.venueImages[currentImageIndex].url
                      )
                    : "https://via.placeholder.com/600x400?text=Venue+Image"
                }
                alt="Venue"
                className="w-full h-64 md:h-full object-cover"
              />
              {selectedVenue.venueImages.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      prevImage();
                    }}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/70 p-2 rounded-full hover:bg-white"
                  >
                    <FiChevronLeft />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      nextImage();
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/70 p-2 rounded-full hover:bg-white"
                  >
                    <FiChevronRight />
                  </button>
                </>
              )}
            </div>

            {/* Details & Status Buttons */}
            <div className="w-full md:w-1/2 p-6 flex flex-col overflow-y-auto">
              <div className="flex-grow">
                <span
                  className={`text-xs font-semibold px-2 py-1 rounded-full inline-block ${
                    statusColors[selectedVenue.status]
                  }`}
                >
                  {statusConfig[selectedVenue.status].text}
                </span>
                <h2 className="text-3xl font-bold text-gray-800 mt-2">
                  {selectedVenue.venueName}
                </h2>
                <p className="text-sm text-gray-500 mb-4">
                  by {selectedVenue.owner?.name || "Unknown Owner"}
                </p>
                <p className="text-gray-700 mb-6">
                  {selectedVenue.description || "No description"}
                </p>

                <div className="grid grid-cols-2 gap-4 text-sm mb-6">
                  <div className="flex items-center gap-2 text-gray-600">
                    <FiMapPin size={20} className="text-blue-500" />
                    <div>
                      <strong>Location</strong>
                      <p>
                        {selectedVenue.location?.address || "Unknown Address"},{" "}
                        {selectedVenue.location?.city || "Unknown City"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <FiUsers size={20} className="text-blue-500" />
                    <div>
                      <strong>Capacity</strong>
                      <p>{selectedVenue.capacity || "N/A"} people</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <FiDollarSign size={20} className="text-blue-500" />
                    <div>
                      <strong>Price</strong>
                      <p>
                        $
                        {selectedVenue.pricePerHour !== undefined
                          ? selectedVenue.pricePerHour
                          : "N/A"}
                        /hour
                      </p>
                    </div>
                  </div>
                </div>

                <h3 className="font-semibold text-gray-800 mb-2">Amenities</h3>
                <div className="flex flex-wrap gap-4 mb-6">
                  {selectedVenue.amenities &&
                  selectedVenue.amenities.length > 0 ? (
                    selectedVenue.amenities.map((amenity) => (
                      <div
                        key={amenity}
                        className="flex items-center gap-2 text-gray-700 bg-gray-100 px-3 py-1 rounded-full text-sm"
                      >
                        {amenityIcons[amenity] || amenity}
                        <span className="ml-1">{amenity}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500">No amenities listed</p>
                  )}
                </div>
              </div>

              {/* Approve/Reject buttons only if status is pending */}
              {selectedVenue.status === "pending" && (
                <div className="mt-auto pt-6 border-t flex gap-4">
                  <button
                    disabled={changeStatusMutation.isLoading}
                    onClick={() =>
                      handleStatusChange(selectedVenue._id, "approved")
                    }
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-semibold transition-colors ${
                      changeStatusMutation.isLoading
                        ? "bg-green-300 cursor-not-allowed"
                        : "bg-green-500 text-white hover:bg-green-600"
                    }`}
                  >
                    <FiCheck /> Approve
                  </button>
                  <button
                    disabled={changeStatusMutation.isLoading}
                    onClick={() =>
                      handleStatusChange(selectedVenue._id, "rejected")
                    }
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-semibold transition-colors ${
                      changeStatusMutation.isLoading
                        ? "bg-red-300 cursor-not-allowed"
                        : "bg-red-500 text-white hover:bg-red-600"
                    }`}
                  >
                    <FiX /> Reject
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminVenuePage;

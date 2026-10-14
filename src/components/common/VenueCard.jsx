import React from "react";
import { useState } from "react";
import {
  FaStar,
  FaMapMarkerAlt,
  FaUserFriends,
  FaEye,
  FaEdit,
  FaTrash,
} from "react-icons/fa";
import { FiPlus, FiAlertTriangle } from "react-icons/fi";

// Custom Button Component
const Button = ({ children, onClick, className = "", ...props }) => {
  return (
    <button
      onClick={onClick}
      className={`px-2 py-1 rounded-md transition-colors duration-200 focus:outline-none ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
const VenueCard = ({ venue, onEdit, onDelete, onManageSpaces, isDeleting }) => {
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    venueName,
    averageRating,
    description,
    location,
    amenities,
    venueImages,
    packages = [],
  } = venue;

  // Venue photos are stored as full Cloudinary URLs.
  const imageUrl = venueImages?.[0]?.url || "https://via.placeholder.com/400x200?text=Venue+Image";
  const cheapest = packages.length ? Math.min(...packages.map((p) => p.pricePerPlate)) : 0;

  const statusColors = {
    approved: "bg-green-100 text-green-700",
    pending: "bg-yellow-100 text-yellow-700",
    rejected: "bg-red-100 text-red-700",
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col">
        <div className="relative">
          <img
            src={imageUrl}
            alt={venueName}
            className="w-full h-48 object-cover"
          />
          <div className="absolute top-3 left-3 bg-white bg-opacity-90 px-2 py-1 rounded-full text-sm font-medium flex items-center">
            <FaStar className="mr-1 text-yellow-500" /> {averageRating}
          </div>
          {/* <div
            className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-semibold ${statusColors[status]}`}
          >
            {status}
          </div> */}
        </div>

        <div className="p-5 flex-grow flex flex-col justify-between">
          <div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              {venueName}
            </h3>
            <p className="text-gray-600 text-sm mb-3 line-clamp-2">
              {description}
            </p>
            <div className="flex items-center text-gray-500 text-sm mb-1">
              <FaMapMarkerAlt className="mr-1" />
              {[
                location?.address,
                location?.city,
                location?.state,
                location?.country,
              ]
                .filter(Boolean)
                .join(", ")}
            </div>
            <div className="text-purple-600 font-semibold text-lg mb-1">
              {cheapest > 0 ? `From Nrs. ${cheapest.toLocaleString("en-IN")} per plate` : "No packages yet"}
            </div>
            {onManageSpaces && (
              <button
                type="button"
                onClick={() => onManageSpaces(venue)}
                className="mb-4 flex items-center text-sm text-purple-700 hover:underline"
              >
                <FaUserFriends className="mr-1" /> Halls &amp; spaces
              </button>
            )}
            <div className="flex flex-wrap gap-2 mb-4">
              {amenities.slice(0, 3).map((amenity, index) => (
                <span
                  key={index}
                  className="bg-gray-100 text-gray-700 text-xs px-3 py-1 rounded-full"
                >
                  {amenity}
                </span>
              ))}
              {amenities.length > 3 && (
                <span className="bg-gray-100 text-gray-700 text-xs px-3 py-1 rounded-full">
                  +{amenities.length - 3} more
                </span>
              )}
            </div>
          </div>
          <div className="mt-auto pt-4 border-t border-gray-200 flex justify-between items-center text-sm text-gray-600">
            <div
              className={`inline-block px-4 py-1 rounded-full border text-sm font-medium ${
                statusColors[venue.status] ||
                "bg-gray-100 text-gray-700 border-gray-300"
              }`}
            >
              {venue.status}
            </div>

            <div className="flex space-x-3">
              <Button
                className="text-gray-500 hover:text-gray-700 p-1"
                onClick={() => onEdit(venue)}
                aria-label={`Edit venue ${venue.venueName}`}
                title="Edit venue"
              >
                <FaEdit />
              </Button>
              <Button
                className="text-red-500 hover:text-red-700 p-1 flex items-center"
                onClick={() => setShowConfirm(true)}
                disabled={isDeleting}
                aria-label={`Delete venue ${venue.venueName}`}
                title="Delete venue"
              >
                <FaTrash />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-8 text-center animate-scaleIn">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-5">
              <FiAlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              Confirm Deletion
            </h3>
            <p className="mt-2 text-md text-gray-600 leading-relaxed">
              Are you sure you want to delete{" "}
              <strong className="text-red-700">{venueName}</strong>? This action
              is permanent and cannot be undone.
            </p>
            <div className="mt-8 flex justify-center space-x-4">
              <button
                className="flex-1 px-5 py-2.5 text-lg font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-100"
                onClick={() => setShowConfirm(false)}
              >
                Cancel
              </button>
              <button
                className="flex-1 px-5 py-2.5 text-lg font-medium text-white bg-red-600 rounded-lg shadow-md hover:bg-red-700"
                onClick={() => {
                  onDelete();
                  setShowConfirm(false);
                }}
              >
                {isDeleting ? (
                  <span className="animate-spin border-2 border-white border-t-transparent rounded-full w-4 h-4 inline-block mr-2" />
                ) : (
                  <FaTrash className="inline-block mr-2" />
                )}
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default VenueCard;

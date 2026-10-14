import React, { useState, useEffect, useContext } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { AuthContext } from "../../auth/AuthProvider";
import useAddVenue from "../../hooks/owner/useAddVenue";
import { useUpdateVenue } from "../../hooks/owner/useUpdateVenue";
import { venueTypes } from "../../features/landing/content/landingContent";
import { DrinkOptionsEditor, PackagesEditor } from "./MenuEditors";
import { drinksFromVenue, drinksToPayload, menuError, packagesFromVenue, packagesToPayload } from "./menuEditorUtils";

const amenitiesOptions = ["WiFi", "Parking", "AC", "Music", "Catering", "Stage"];

export default function VenueRegisterForm({ onSuccess, mode = "create", initialData = null }) {
  const addVenueMutation = useAddVenue();
  const updateVenueMutation = useUpdateVenue();

  const { user } = useContext(AuthContext);

  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [venueImages, setVenueImages] = useState([]);
  const [previewImages, setPreviewImages] = useState([]);
  const [existingVenueImages, setExistingVenueImages] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [packageRows, setPackageRows] = useState([]);
  const [drinkRows, setDrinkRows] = useState([]);
  const [menuProblem, setMenuProblem] = useState("");

  // Load initial data for edit mode
  useEffect(() => {
    if (mode === "edit" && initialData) {
      setSelectedAmenities(Array.isArray(initialData.amenities) ? initialData.amenities : []);
      setPackageRows(packagesFromVenue(initialData.packages));
      setDrinkRows(drinksFromVenue(initialData.drinkOptions));

      const images = Array.isArray(initialData.venueImages)
        ? initialData.venueImages
            .map((img) => {
              if (img && typeof img.url === "string") {
                return img.url.startsWith("http")
                  ? img.url
                  : `http://localhost:5050/${img.url.replace(/^\/+/, "")}`;
              }
              return null;
            })
            .filter(Boolean)
        : [];

      setExistingVenueImages(images);
    } else {
      setSelectedAmenities([]);
      setPackageRows([]);
      setDrinkRows([]);
      setExistingVenueImages([]);
    }
  }, [initialData, mode]);

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      venueName: initialData?.venueName || "",
      category: initialData?.category || "",
      contactPhone: initialData?.contactPhone || "",
      description: initialData?.description || "",
      address: initialData?.location?.address || "",
      city: initialData?.location?.city || "",
      state: initialData?.location?.state || "",
      country: initialData?.location?.country || "",
    },
    validationSchema: Yup.object({
      venueName: Yup.string().required("Required"),
      category: Yup.string().required("Required"),
      contactPhone: Yup.string().matches(/^(\+?[\d\s-]{7,16})?$/, "Enter a valid phone number"),
      description: Yup.string().required("Required"),
      address: Yup.string().required("Required"),
      city: Yup.string().required("Required"),
      state: Yup.string().required("Required"),
      country: Yup.string().required("Required"),
    }),
    onSubmit: async (values, { resetForm }) => {
      if (!user?._id) return;

      const problem = menuError(packageRows);
      setMenuProblem(problem);
      if (problem) return;

      setIsSubmitting(true);

      try {
        if (mode === "edit" && initialData?._id) {
          // Prepare FormData for update (with files)
          const { address, city, state, country, ...rest } = values;
          const formData = new FormData();
          Object.entries(rest).forEach(([key, val]) => formData.append(key, val));
          formData.append("location", JSON.stringify({ address, city, state, country }));
          formData.append("amenities", JSON.stringify(selectedAmenities));
          formData.append("packages", JSON.stringify(packagesToPayload(packageRows)));
          formData.append("drinkOptions", JSON.stringify(drinksToPayload(drinkRows)));
          venueImages.forEach((file) => formData.append("venueImages", file));

          await updateVenueMutation.mutateAsync({ venueId: initialData._id, updatedData: formData });

          resetForm();
          setVenueImages([]);
          setPreviewImages([]);
          setSelectedAmenities([]);

          onSuccess?.(values);
        } else {
          // Create new venue
          const created = await addVenueMutation.mutateAsync({
            form: values,
            amenities: selectedAmenities,
            images: venueImages,
            packages: packagesToPayload(packageRows),
            drinkOptions: drinksToPayload(drinkRows),
          });

          resetForm();
          setVenueImages([]);
          setPreviewImages([]);
          setSelectedAmenities([]);
          setPackageRows([]);
          setDrinkRows([]);

          onSuccess?.(created?.data);
        }
      } catch {
        // error surfaced via toast in the mutation's onError handler
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  const handleAmenitiesChange = (e) => {
    const { value } = e.target;
    setSelectedAmenities((prev) =>
      prev.includes(value) ? prev.filter((a) => a !== value) : [...prev, value]
    );
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setVenueImages(files);
    setPreviewImages(files.map((file) => URL.createObjectURL(file)));
  };

  if (mode === "edit" && !initialData) {
    return <div className="text-red-500 font-semibold">Venue data missing, cannot edit.</div>;
  }

  const isLoading = isSubmitting || addVenueMutation.isLoading || updateVenueMutation.isLoading;

  return (
    <div className="p-2 font-poppins">
      <h2 className="text-center text-lg font-semibold text-gray-800 mb-4">
        {mode === "edit" ? "Edit Venue" : "New Venue"}
      </h2>
      <form
        onSubmit={formik.handleSubmit}
        className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar"
      >
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Category <span className="text-red-500">*</span>
          </label>
          <select
            name="category"
            className="w-full px-2 py-1.5 text-sm border rounded-md focus:ring-purple-500 focus:outline-none"
            {...formik.getFieldProps("category")}
            disabled={isLoading}
          >
            <option value="" disabled>
              Select a category
            </option>
            {venueTypes.map((type) => (
              <option key={type.slug} value={type.slug}>
                {type.name}
              </option>
            ))}
          </select>
          {formik.touched.category && formik.errors.category && (
            <div className="text-red-500 text-xs mt-1">{formik.errors.category}</div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { label: "Name", name: "venueName" },
            { label: "City", name: "city" },
            { label: "State", name: "state" },
            { label: "Country", name: "country" },
          ].map(({ label, name, type = "text" }) => (
            <div key={name}>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                {label} <span className="text-red-500">*</span>
              </label>
              <input
                type={type}
                name={name}
                placeholder={label}
                className="w-full px-2 py-1.5 text-sm border rounded-md focus:ring-purple-500 focus:outline-none"
                {...formik.getFieldProps(name)}
                disabled={isLoading}
              />
              {formik.touched[name] && formik.errors[name] && (
                <div className="text-red-500 text-xs mt-1">{formik.errors[name]}</div>
              )}
            </div>
          ))}
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Address <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="address"
            placeholder="Street address"
            className="w-full px-2 py-1.5 text-sm border rounded-md focus:ring-purple-500 focus:outline-none"
            {...formik.getFieldProps("address")}
            disabled={isLoading}
          />
          {formik.touched.address && formik.errors.address && (
            <div className="text-red-500 text-xs mt-1">{formik.errors.address}</div>
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            rows={2}
            name="description"
            placeholder="Short description..."
            className="w-full px-2 py-1.5 text-sm border rounded-md focus:ring-purple-500 focus:outline-none resize-none"
            {...formik.getFieldProps("description")}
            disabled={isLoading}
          />
          {formik.touched.description && formik.errors.description && (
            <div className="text-red-500 text-xs mt-1">{formik.errors.description}</div>
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Contact phone for customers</label>
          <input
            type="tel"
            name="contactPhone"
            placeholder="98XXXXXXXX (shown as Call and WhatsApp buttons)"
            className="w-full px-2 py-1.5 text-sm border rounded-md focus:ring-purple-500 focus:outline-none"
            {...formik.getFieldProps("contactPhone")}
            disabled={isLoading}
          />
          {formik.touched.contactPhone && formik.errors.contactPhone && (
            <div className="text-red-500 text-xs mt-1">{formik.errors.contactPhone}</div>
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-2">Amenities</label>
          <div className="flex flex-wrap gap-2">
            {amenitiesOptions.map((item) => (
              <label
                key={item}
                className="flex items-center gap-1 border px-2 py-1 rounded-md text-xs text-gray-700 bg-gray-50 hover:bg-purple-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  value={item}
                  checked={selectedAmenities.includes(item)}
                  onChange={handleAmenitiesChange}
                  className="accent-purple-500"
                  disabled={isLoading}
                />
                {item}
              </label>
            ))}
          </div>
        </div>

        <PackagesEditor rows={packageRows} onChange={setPackageRows} disabled={isLoading} />
        <DrinkOptionsEditor rows={drinkRows} onChange={setDrinkRows} disabled={isLoading} />
        {menuProblem && <div role="alert" className="text-red-500 text-xs">{menuProblem}</div>}

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Venue Images</label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageChange}
            className="block w-full text-xs file:px-3 file:py-1 file:rounded file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
            disabled={isLoading}
          />

          {/* Preview new images */}
          {previewImages.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mt-2">
              {previewImages.map((src, idx) => (
                <img
                  key={idx}
                  src={src}
                  alt={`Preview ${idx + 1}`}
                  className="h-16 w-full object-cover rounded shadow"
                />
              ))}
            </div>
          )}

          {/* Show existing images when editing */}
          {existingVenueImages.length > 0 && (
            <div className="mt-3">
              <p className="text-xs font-medium text-gray-600 mb-1">Existing</p>
              <div className="grid grid-cols-3 gap-2">
                {existingVenueImages.map((src, idx) => (
                  <img
                    key={idx}
                    src={src}
                    className="h-16 w-full object-cover rounded shadow"
                    alt={`Image ${idx + 1}`}
                    onError={(e) => (e.target.style.display = "none")}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="pt-2 text-right">
          <button
            type="submit"
            disabled={isLoading}
            className={`px-5 py-2 text-sm rounded-md font-semibold transition ${
              isLoading
                ? "bg-purple-400 cursor-not-allowed"
                : "bg-purple-600 hover:bg-purple-700 text-white"
            }`}
          >
            {mode === "edit" ? (isLoading ? "Updating..." : "Update") : isLoading ? "Creating..." : "Create"}
          </button>
        </div>
      </form>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #c4b5fd;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f0f0f0;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}

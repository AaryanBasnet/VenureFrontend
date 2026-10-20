import React, { useState, useEffect, useContext } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { AuthContext } from "../../auth/AuthProvider";
import useAddVenue from "../../hooks/owner/useAddVenue";
import { useUpdateVenue } from "../../hooks/owner/useUpdateVenue";
import { assetUrl } from "../../utils/assetUrl";
import { VENUE_TYPES } from "../../features/venues/venueTypes";
import FileThumb from "../common/FileThumb";
import { errorClass, inputClass, labelClass } from "../ui/formStyles";
import { btnPrimary } from "../dashboard/styles";
import { DrinkOptionsEditor, PackagesEditor } from "./MenuEditors";
import { drinksFromVenue, drinksToPayload, menuError, packagesFromVenue, packagesToPayload } from "./menuEditorUtils";
import Select from "../ui/Select";

const amenitiesOptions = ["WiFi", "Parking", "AC", "Music", "Catering", "Stage"];

export default function VenueRegisterForm({ onSuccess, mode = "create", initialData = null }) {
  const addVenueMutation = useAddVenue();
  const updateVenueMutation = useUpdateVenue();

  const { user } = useContext(AuthContext);

  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [venueImages, setVenueImages] = useState([]);
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
                return assetUrl(img.url);
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
  };

  if (mode === "edit" && !initialData) {
    return <p role="alert" className="font-body text-small text-red-700">Venue data missing, cannot edit.</p>;
  }

  const isLoading = isSubmitting || addVenueMutation.isLoading || updateVenueMutation.isLoading;

  // One labelled control with its validation message.
  const field = (name, label, { required = true, hint, as, children, ...rest } = {}) => {
    const id = `venue-${name}`;
    const err = formik.touched[name] && formik.errors[name];
    const props = {
      id,
      name,
      disabled: isLoading,
      "aria-invalid": err ? "true" : undefined,
      "aria-describedby": err ? `${id}-err` : hint ? `${id}-hint` : undefined,
      ...formik.getFieldProps(name),
      ...rest,
    };
    return (
      <div key={name}>
        <label htmlFor={id} className={labelClass}>
          {label}
          {required && <span aria-hidden="true"> *</span>}
        </label>
        {as === "select" ? (
          <Select className={inputClass} {...props}>{children}</Select>
        ) : as === "textarea" ? (
          <textarea className={`${inputClass} resize-none`} {...props} />
        ) : (
          <input className={inputClass} {...props} />
        )}
        {hint && !err && <p id={`${id}-hint`} className="mt-1.5 font-body text-caption text-taupe">{hint}</p>}
        {err && <p id={`${id}-err`} role="alert" className={errorClass}>{formik.errors[name]}</p>}
      </div>
    );
  };

  const heading = "mb-4 font-display text-h4 font-light text-ink";

  return (
    <form onSubmit={formik.handleSubmit} className="space-y-10" noValidate>
      <section aria-labelledby="venue-basics">
        <h2 id="venue-basics" className={heading}>The basics</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {field("venueName", "Venue name", { placeholder: "e.g. Hotel Himalaya Banquet" })}
          {field("category", "Venue type", {
            as: "select",
            children: (
              <>
                <option value="" disabled>Select a venue type</option>
                {VENUE_TYPES.map(([slug, name]) => (
                  <option key={slug} value={slug}>{name}</option>
                ))}
              </>
            ),
          })}
          <div className="sm:col-span-2">
            {field("description", "Description", { as: "textarea", rows: 3, placeholder: "A few lines on the venue, its setting and what it does best." })}
          </div>
          <div className="sm:col-span-2">
            {field("contactPhone", "Contact phone for customers", {
              required: false,
              type: "tel",
              placeholder: "98XXXXXXXX",
              hint: "Shown to customers as Call and WhatsApp buttons.",
            })}
          </div>
        </div>
      </section>

      <section aria-labelledby="venue-location">
        <h2 id="venue-location" className={heading}>Location</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">{field("address", "Street address", { placeholder: "Street address" })}</div>
          {field("city", "City")}
          {field("state", "State")}
          {field("country", "Country")}
        </div>
      </section>

      <fieldset>
        <legend className={heading}>Amenities</legend>
        <div className="flex flex-wrap gap-2">
          {amenitiesOptions.map((item) => {
            const on = selectedAmenities.includes(item);
            return (
              <label
                key={item}
                className={`inline-flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2 font-body text-small has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ink ${
                  on ? "border-gold bg-gold-100 text-ink" : "border-border-strong bg-white text-taupe hover:border-ink"
                }`}
              >
                <input
                  type="checkbox"
                  value={item}
                  checked={on}
                  onChange={handleAmenitiesChange}
                  className="size-4 accent-ink"
                  disabled={isLoading}
                />
                {item}
              </label>
            );
          })}
        </div>
      </fieldset>

      <section aria-labelledby="venue-menu" className="space-y-5">
        <h2 id="venue-menu" className={heading.replace("mb-4", "mb-0")}>Food and drinks</h2>
        <PackagesEditor rows={packageRows} onChange={setPackageRows} disabled={isLoading} />
        <DrinkOptionsEditor rows={drinkRows} onChange={setDrinkRows} disabled={isLoading} />
        {menuProblem && <p role="alert" className={errorClass}>{menuProblem}</p>}
      </section>

      <section aria-labelledby="venue-photos">
        <h2 id="venue-photos" className={heading}>Photos</h2>
        <label htmlFor="venue-images" className={labelClass}>Venue images</label>
        <input
          id="venue-images"
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageChange}
          className="block w-full rounded-card-sm border border-dashed border-border-strong bg-cream p-3 font-body text-small text-taupe file:mr-4 file:cursor-pointer file:rounded-full file:border-0 file:bg-ink file:px-4 file:py-2 file:font-body file:text-button file:uppercase file:text-gold-50 hover:file:bg-gold-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          disabled={isLoading}
        />

        {venueImages.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 font-body text-caption text-taupe">New photos to upload</p>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {venueImages.map((file, idx) => (
                <FileThumb key={idx} file={file} label={`Preview ${idx + 1}`} className="aspect-[4/3] w-full rounded-card-sm border border-line" />
              ))}
            </div>
          </div>
        )}

        {existingVenueImages.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 font-body text-caption text-taupe">Current photos</p>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {existingVenueImages.map((src, idx) => (
                <img
                  key={idx}
                  src={src}
                  className="aspect-[4/3] w-full rounded-card-sm border border-line object-cover"
                  alt={`Image ${idx + 1}`}
                  onError={(e) => (e.target.style.display = "none")}
                />
              ))}
            </div>
          </div>
        )}
      </section>

      <div className="flex justify-end border-t border-line pt-6">
        <button type="submit" disabled={isLoading} className={btnPrimary}>
          {mode === "edit" ? (isLoading ? "Saving..." : "Save changes") : isLoading ? "Creating..." : "Create venue"}
        </button>
      </div>
    </form>
  );
}

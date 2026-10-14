// Public contact details come from the environment, so no placeholder numbers ever ship.
// Set any of these in .env (all optional). Missing ones are simply not shown.
//   VITE_CONTACT_EMAIL, VITE_CONTACT_PHONE, VITE_CONTACT_ADDRESS, VITE_CONTACT_HOURS
const env = import.meta.env;

export const contactDetails = {
  email: env.VITE_CONTACT_EMAIL || "",
  phone: env.VITE_CONTACT_PHONE || "",
  address: env.VITE_CONTACT_ADDRESS || "",
  hours: env.VITE_CONTACT_HOURS || "",
};

export const hasContactDetails = Object.values(contactDetails).some(Boolean);

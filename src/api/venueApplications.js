import instance from "./api";

// Public: a venue owner applies. Multipart: text fields, applicationPhotos[], registrationCert, panCert.
export const submitVenueApplicationApi = (formData) => instance.post("/venue-applications", formData);

// Admin review
export const listApplicationsApi = async (params) => (await instance.get("/venue-applications", { params })).data.data;
export const getApplicationApi = async (id) => (await instance.get(`/venue-applications/${id}`)).data.data;
// A signed link that works for a few minutes; asked for only when the document is opened.
export const getApplicationDocumentLinkApi = async (id, kind) => (await instance.get(`/venue-applications/${id}/documents/${kind}/link`)).data.data.url;
export const approveApplicationApi = async (id, category) => (await instance.post(`/venue-applications/${id}/approve`, { category })).data;
export const resendApplicationLinkApi = async (id) => (await instance.post(`/venue-applications/${id}/resend-link`)).data;
export const rejectApplicationApi = async (id, reason) => (await instance.post(`/venue-applications/${id}/reject`, { reason })).data;

// The approved owner chooses a password from the emailed one-time link
export const setupPasswordApi = async (token, password) => (await instance.post("/auth/setup-password", { token, password })).data.data;

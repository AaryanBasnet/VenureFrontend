import instance from "../api";

// POST /inquiries. The backend validates: venue, optional space, preferredDate (ISO),
// optional preferredShift (day | night | full_day), numberOfGuests, eventType, message,
// contactName, phoneNumber.
export const createInquiryApi = (payload) => instance.post("/inquiries", payload);

// One page of the customer's requests: { items, total, page, pages, counts }. params: { group, page, limit, venue }
export const getMyInquiriesApi = async (params = {}) => (await instance.get("/inquiries/my", { params: { page: 1, ...params } })).data.data;
export const getInquiryApi = async (id) => (await instance.get(`/inquiries/${id}`)).data.data;
// Both take { id, reason }; the reason is optional for the customer
export const cancelInquiryApi = async ({ id, reason }) => (await instance.put(`/inquiries/${id}/cancel`, { reason: reason || undefined })).data.data;

export const getQuotationApi = async (id) => (await instance.get(`/quotations/${id}`)).data.data;
// Accepting also starts the deposit payment: { quotation, payment: { formUrl, formData, ... } }
// where formUrl/formData are what the browser posts to eSewa.
export const acceptQuotationApi = async (id) => (await instance.put(`/quotations/${id}/accept`)).data.data;
export const rejectQuotationApi = async ({ id, reason }) => (await instance.put(`/quotations/${id}/reject`, { reason: reason || undefined })).data.data;

// eSewa sends the customer back with ?data=<base64>. The server checks it with eSewa
// and creates the confirmed booking.
export const verifyEsewaPaymentApi = async (data) => (await instance.post("/payment/esewa/verify", { data })).data.data;

// Files on a request (a menu card, a guest list). Sent as multipart under the field name "attachments".
export const uploadInquiryAttachmentsApi = async (id, files) => {
  const form = new FormData();
  files.forEach((file) => form.append("attachments", file));
  return (await instance.post(`/inquiries/${id}/attachments`, form)).data.data;
};
export const removeInquiryAttachmentApi = async (id, attachmentId) => (await instance.delete(`/inquiries/${id}/attachments/${attachmentId}`)).data.data;
// A signed link that works for a few minutes; ask for it only when the file is opened.
export const getInquiryAttachmentLinkApi = async (id, attachmentId) => (await instance.get(`/inquiries/${id}/attachments/${attachmentId}/link`)).data.data.url;

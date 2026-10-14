import instance from "../api";

// POST /inquiries. The backend validates: venue, optional space, preferredDate (ISO),
// optional preferredShift (day | night | full_day), numberOfGuests, eventType, message,
// contactName, phoneNumber.
export const createInquiryApi = (payload) => instance.post("/inquiries", payload);

export const getMyInquiriesApi = async () => (await instance.get("/inquiries/my")).data.data;
export const getInquiryApi = async (id) => (await instance.get(`/inquiries/${id}`)).data.data;
export const cancelInquiryApi = async (id) => (await instance.put(`/inquiries/${id}/cancel`)).data.data;

export const getQuotationApi = async (id) => (await instance.get(`/quotations/${id}`)).data.data;
// Accepting also starts the deposit payment: { quotation, payment: { formUrl, formData, ... } }
// where formUrl/formData are what the browser posts to eSewa.
export const acceptQuotationApi = async (id) => (await instance.put(`/quotations/${id}/accept`)).data.data;
export const rejectQuotationApi = async (id) => (await instance.put(`/quotations/${id}/reject`)).data.data;

// eSewa sends the customer back with ?data=<base64>. The server checks it with eSewa
// and creates the confirmed booking.
export const verifyEsewaPaymentApi = async (data) => (await instance.post("/payment/esewa/verify", { data })).data.data;

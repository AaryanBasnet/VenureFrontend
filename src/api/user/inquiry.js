import instance from "../api";

// POST /inquiries. The backend validates: venue, optional space, preferredDate (ISO),
// optional preferredShift (day | night | full_day), numberOfGuests, eventType, message,
// contactName, phoneNumber.
export const createInquiryApi = (payload) => instance.post("/inquiries", payload);

export const getMyInquiriesApi = async () => (await instance.get("/inquiries/my")).data.data;
export const getInquiryApi = async (id) => (await instance.get(`/inquiries/${id}`)).data.data;
export const cancelInquiryApi = async (id) => (await instance.put(`/inquiries/${id}/cancel`)).data.data;

export const getQuotationApi = async (id) => (await instance.get(`/quotations/${id}`)).data.data;
// Accepting also starts the deposit payment: { quotation, payment: { provider, clientSecret, ... } }
export const acceptQuotationApi = async (id, provider = "stripe") =>
  (await instance.put(`/quotations/${id}/accept`, { provider })).data.data;
export const rejectQuotationApi = async (id) => (await instance.put(`/quotations/${id}/reject`)).data.data;

// Finalises the booking once the deposit has been paid.
export const createBookingFromQuotationApi = async ({ quotationId, paymentIntentId }) =>
  (await instance.post("/bookings/from-quotation", { quotationId, paymentIntentId })).data.data;

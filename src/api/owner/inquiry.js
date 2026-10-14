import instance from "../api";

export const getOwnerInquiriesApi = async () => (await instance.get("/inquiries/owner")).data.data;
export const declineInquiryApi = async (id) => (await instance.put(`/inquiries/${id}/decline`)).data.data;

// Body: { space, eventDate (ISO), shift, numberOfGuests, lineItems[], depositType, depositValue, notes? }.
// The server recomputes every amount; the client totals are only a preview.
export const createQuotationApi = async ({ inquiryId, ...payload }) =>
  (await instance.post(`/inquiries/${inquiryId}/quotations`, payload)).data.data;
export const withdrawQuotationApi = async (id) => (await instance.put(`/quotations/${id}/withdraw`)).data.data;

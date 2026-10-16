import { getAllContacts } from "../../api/contact";

// Backend: { success, data: [contacts, newest first] }
export const getAllContactsService = async () => {
  const res = await getAllContacts();
  return Array.isArray(res.data?.data) ? res.data.data : [];
};

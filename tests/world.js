// Set-up for the booking-lifecycle specs: a throwaway approved venue with two halls, a second customer, and builders for
// inquiries, quotations and paid bookings. Real eSewa payment cannot be completed in a test, so a paid booking is written
// straight into the local database in the same shape bookingService.createBookingFromQuotation creates it.
import { expect } from "@playwright/test";
import { apiAs, creds, deleteOwnerVenues, unique } from "./helpers.js";
import { insertCustomer, withDb } from "./db.js";

const TIERS = [
  { minDaysBefore: 30, refundPercentage: 100 },
  { minDaysBefore: 15, refundPercentage: 75 },
  { minDaysBefore: 7, refundPercentage: 50 },
  { minDaysBefore: 0, refundPercentage: 0 },
];

// Noon in Kathmandu on the day that is n days from today, as the site's date picker sends it.
export function eventIso(daysFromNow) {
  const target = new Date(Date.now() + daysFromNow * 86400000);
  const [y, m, d] = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kathmandu", year: "numeric", month: "2-digit", day: "2-digit" })
    .format(target)
    .split("-")
    .map(Number);
  return new Date(Date.UTC(y, m - 1, d, 6, 15)).toISOString();
}

export const npr = (n) => `NPR ${Math.round(n).toLocaleString("en-IN")}`;

export async function createWorld(playwright, label) {
  const prefix = `E2E ${label}`;
  const venueName = unique(label);
  const stamp = Date.now().toString(36);
  const other = { email: `e2e-${label.toLowerCase()}-${stamp}@example.com`, password: "Lifecycle1!x", name: `Guest ${stamp}` };

  const ownerApi = await apiAs(playwright, creds.owner);
  const adminApi = await apiAs(playwright, creds.admin);
  const customerApi = await apiAs(playwright, creds.customer);
  await deleteOwnerVenues(ownerApi, prefix);

  await insertCustomer({ name: other.name, email: other.email, password: other.password });
  const otherApi = await apiAs(playwright, other);

  const created = await ownerApi.post("venues", {
    data: {
      venueName,
      category: "banquet-party-palace",
      description: "Created by the booking lifecycle end to end suite.",
      location: { address: "3 Test Road", city: "Lalitpur", state: "Bagmati", country: "Nepal" },
      amenities: ["Parking"],
      packages: [{ name: "Silver", pricePerPlate: 1500, minPlates: 50 }],
    },
  });
  expect(created.status()).toBe(201);
  const venueId = (await created.json()).data._id;
  const spaces = {};
  for (const [key, name] of [["a", "Glass Hall"], ["b", "Pine Lawn"]]) {
    const res = await ownerApi.post(`venues/${venueId}/spaces`, { data: { name, spaceType: "garden-estates", capacity: 300 } });
    expect(res.status()).toBe(201);
    spaces[key] = (await res.json()).data._id;
  }
  const approved = await adminApi.patch(`venues/${venueId}/status`, { data: { status: "approved" } });
  expect(approved.ok()).toBeTruthy();

  const me = async (ctx) => (await (await ctx.get("user/profile")).json()).user;
  const customerId = (await me(customerApi))._id;
  const otherId = (await me(otherApi))._id;

  const world = {
    prefix,
    venueName,
    venueId,
    spaces,
    other,
    customerId,
    otherId,
    api: { owner: ownerApi, admin: adminApi, customer: customerApi, other: otherApi },

    // A request from a customer for a date and shift. Returns the inquiry.
    async inquiry(who, { days, shift = "night", space = "a", guests = 60, eventType = "Birthday", message = "" }) {
      const res = await world.api[who].post("inquiries", {
        data: {
          venue: venueId,
          space: spaces[space],
          preferredDate: eventIso(days),
          preferredShift: shift,
          numberOfGuests: guests,
          eventType,
          message,
          contactName: who === "other" ? other.name : "E2E Customer",
          phoneNumber: "9800000000",
        },
      });
      expect(res.status(), await res.text()).toBe(201);
      return (await res.json()).data;
    },

    // The owner's quotation for an inquiry. Returns the quotation.
    async quote(inquiry, { days, shift = "night", space = "a", price = 100000, deposit = 20, guests = 60 }) {
      const res = await ownerApi.post(`inquiries/${inquiry._id}/quotations`, {
        data: {
          space: spaces[space],
          eventDate: eventIso(days),
          shift,
          numberOfGuests: guests,
          lineItems: [{ label: "Venue hire", unitPrice: price, quantity: 1 }],
          depositType: "percentage",
          depositValue: deposit,
        },
      });
      expect(res.status(), await res.text()).toBe(201);
      return (await res.json()).data;
    },

    // An inquiry and its quotation, as the customer and the owner would have left them.
    async quoted(who, opts) {
      const inquiry = await world.inquiry(who, opts);
      const quotation = await world.quote(inquiry, opts);
      return { inquiry, quotation };
    },

    // A confirmed booking with its paid deposit, the way the eSewa callback leaves it.
    async pay(who, inquiry, quotation) {
      const customerObjectId = who === "other" ? otherId : customerId;
      return withDb(async ({ db, ObjectId }) => {
        const bookingId = new ObjectId();
        await db.collection("bookings").insertOne({
          _id: bookingId,
          inquiry: new ObjectId(inquiry._id),
          quotation: new ObjectId(quotation._id),
          customer: new ObjectId(customerObjectId),
          venue: new ObjectId(venueId),
          space: new ObjectId(quotation.space),
          eventDate: new Date(quotation.eventDate),
          shift: quotation.shift,
          startTime: new Date(quotation.startTime),
          endTime: new Date(quotation.endTime),
          numberOfGuests: quotation.numberOfGuests,
          eventType: inquiry.eventType,
          specialRequirements: inquiry.message || "",
          contactName: inquiry.contactName,
          phoneNumber: inquiry.phoneNumber,
          totalPrice: quotation.totalPrice,
          depositAmount: quotation.depositAmount,
          balanceAmount: quotation.balanceAmount,
          balanceSettled: false,
          cancellationPolicy: TIERS,
          status: "confirmed",
          createdAt: new Date(),
          updatedAt: new Date(),
          __v: 0,
        });
        const transactionId = `E2E-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
        await db.collection("payments").insertOne({
          booking: bookingId,
          type: "deposit",
          provider: "esewa",
          transactionId,
          amountReceived: quotation.depositAmount,
          currency: "npr",
          amountNPR: quotation.depositAmount,
          status: "succeeded",
          verifiedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          __v: 0,
        });
        await db.collection("quotations").updateOne({ _id: new ObjectId(quotation._id) }, { $set: { status: "accepted", respondedAt: new Date() } });
        await db.collection("inquiries").updateOne({ _id: new ObjectId(inquiry._id) }, { $set: { status: "accepted", booking: bookingId } });
        return { inquiry, quotation, bookingId: String(bookingId), transactionId };
      });
    },

    async booked(who, opts) {
      const { inquiry, quotation } = await world.quoted(who, opts);
      return world.pay(who, inquiry, quotation);
    },

    // Reads from the local database for assertions.
    async payments(bookingId) {
      return withDb(async ({ db, ObjectId }) => db.collection("payments").find({ booking: new ObjectId(bookingId) }).toArray());
    },
    async booking(bookingId) {
      return withDb(async ({ db, ObjectId }) => db.collection("bookings").findOne({ _id: new ObjectId(bookingId) }));
    },
    async setQuotation(quotationId, patch) {
      return withDb(async ({ db, ObjectId }) => db.collection("quotations").updateOne({ _id: new ObjectId(quotationId) }, { $set: patch }));
    },
    async setBooking(bookingId, patch) {
      return withDb(async ({ db, ObjectId }) => db.collection("bookings").updateOne({ _id: new ObjectId(bookingId) }, { $set: patch }));
    },

    async dispose() {
      await withDb(async ({ db, ObjectId }) => {
        const venue = new ObjectId(venueId);
        const bookings = await db.collection("bookings").find({ venue }).project({ _id: 1 }).toArray();
        const quotations = await db.collection("quotations").find({ venue }).project({ _id: 1 }).toArray();
        await db.collection("payments").deleteMany({ booking: { $in: bookings.map((b) => b._id) } });
        await db.collection("paymentattempts").deleteMany({ quotation: { $in: quotations.map((q) => q._id) } });
        await db.collection("reviews").deleteMany({ venue });
        await db.collection("bookings").deleteMany({ venue });
        await db.collection("quotations").deleteMany({ venue });
        await db.collection("inquiries").deleteMany({ venue });
        await db.collection("spaces").deleteMany({ venue });
        await db.collection("venues").deleteMany({ _id: venue });
        const escaped = venueName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        await db.collection("notifications").deleteMany({ message: { $regex: `"${escaped}"` } });
        const users = await db.collection("users").find({ email: other.email }).project({ _id: 1 }).toArray();
        await db.collection("refreshtokens").deleteMany({ userId: { $in: users.map((u) => u._id) } });
        await db.collection("users").deleteMany({ email: other.email });
      });
      await Promise.all(Object.values(world.api).map((ctx) => ctx.dispose()));
    },
  };
  return world;
}

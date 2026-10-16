// The date picker and the availability behind it, through the real pages: AD and BS views, booked shifts and days,
// held (pending deposit) days, the 24 month horizon, keyboard movement, and the exact instant a request is stored with.
// Halls, bookings and customers are set up on a throwaway venue in the LOCAL database (tests/world.js) and removed afterwards.
import { test, expect } from "@playwright/test";
import { creds, login, missingCreds, dayLabel } from "./helpers.js";
import { dbAvailable, withDb } from "./db.js";
import { createWorld, eventIso } from "./world.js";

test.skip(missingCreds("customer", "owner", "admin"), "Set the E2E_* environment variables (see tests/helpers.js)");
test.skip(!dbAvailable, "The local test database is not reachable (set E2E_MONGO_URL to a local MongoDB)");

test.describe.configure({ mode: "serial" });

let world;
test.beforeAll(async ({ playwright }) => {
  world = await createWorld(playwright, "Calendar");
});
test.afterAll(async () => {
  await world?.dispose();
});

// The calendar day that is n days from now in Kathmandu, as the local-midnight date the picker shows
const ktmDay = (n) => {
  const [y, m, d] = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kathmandu", year: "numeric", month: "2-digit", day: "2-digit" })
    .format(new Date(Date.now() + n * 86400000))
    .split("-")
    .map(Number);
  return new Date(y, m - 1, d);
};
const monthTitle = (date) => date.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
const BS_MONTH = /Baisakh|Jestha|Ashadh|Shrawan|Bhadra|Ashwin|Kartik|Mangsir|Poush|Magh|Falgun|Chaitra/;

const openForm = async (page) => {
  await page.goto(`/venue/${world.venueId}/inquire`);
  await expect(page.getByRole("heading", { level: 1, name: "When is your event?" })).toBeVisible();
};
const grid = (page) => page.getByRole("grid");
const dayButton = (page, date, suffix = "") => grid(page).getByRole("button", { name: `${dayLabel(date)}${suffix}`, exact: true });
const heading = (page) => page.getByRole("heading", { level: 3 }).filter({ hasText: /\d{4}$/ });
const showMonthOf = async (page, date) => {
  for (let i = 0; i < 26 && !(await heading(page).innerText()).includes(monthTitle(date)); i++) {
    await page.getByRole("button", { name: "Next month" }).click();
  }
  await expect(heading(page)).toHaveText(monthTitle(date));
};
const hall = (page, name) => page.locator("label", { hasText: name }).locator('input[name="space"]');
const shiftRadio = (page, index) => page.locator('input[name="shift"]').nth(index); // day, night, full day, flexible

// A booking that holds a hall on a day without going through eSewa
const rawBooking = (status, space, days, shift, extra = {}) =>
  withDb(async ({ db, ObjectId }) => {
    const hours = { day: [10, 15], night: [17, 22], full_day: [10, 22] }[shift];
    const [y, m, d] = [ktmDay(days).getFullYear(), ktmDay(days).getMonth(), ktmDay(days).getDate()];
    const at = (h) => new Date(Date.UTC(y, m, d, h) - 345 * 60000);
    const now = new Date();
    await db.collection("bookings").insertOne({
      customer: new ObjectId(world.otherId),
      venue: new ObjectId(world.venueId),
      space: new ObjectId(world.spaces[space]),
      eventDate: at(12),
      shift,
      startTime: at(hours[0]),
      endTime: at(hours[1]),
      numberOfGuests: 50,
      eventType: "Birthday",
      contactName: "Calendar Guest",
      phoneNumber: "9800000000",
      totalPrice: 100000,
      depositAmount: 20000,
      balanceAmount: 80000,
      balanceSettled: false,
      cancellationPolicy: [],
      status,
      createdAt: now,
      updatedAt: now,
      __v: 0,
      ...extra,
    });
  });

test.describe("customer", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, creds.customer);
  });

  test("switching between AD and BS keeps the chosen date and shows both calendars for it", async ({ page }) => {
    const target = ktmDay(9);
    await openForm(page);
    await showMonthOf(page, target);
    await dayButton(page, target).click();
    const selected = grid(page).locator('[role="gridcell"][aria-selected="true"] button');
    await expect(selected).toHaveAttribute("aria-label", dayLabel(target));
    await expect(page.getByText(/ BS$/).last()).toBeVisible();

    await page.getByRole("button", { name: /नेपाली/ }).click();
    await expect(heading(page)).toContainText(BS_MONTH);
    await expect(selected).toHaveAttribute("aria-label", new RegExp(`^\\d+ (?:${BS_MONTH.source}) \\d{4} BS, ${dayLabel(target)}$`));
    // the English months the Nepali month covers are printed under the title
    await expect(page.getByText(/^[A-Z][a-z]{2}( to [A-Z][a-z]{2})? \d{4}$/).first()).toBeVisible();

    await page.getByRole("button", { name: /English \(AD\)/ }).click();
    await expect(heading(page)).toHaveText(monthTitle(target));
    await expect(selected).toHaveAttribute("aria-label", dayLabel(target));
    await expect(page.getByText(dayLabel(target)).last()).toBeVisible();
  });

  test("a hall booked for the day shift disables the day and full day shifts, and only those", async ({ page }) => {
    const day = 14;
    await world.booked("other", { days: day, shift: "day", space: "a" });
    const target = ktmDay(day);
    await openForm(page);
    await showMonthOf(page, target);
    await hall(page, "Glass Hall").check({ force: true });
    await dayButton(page, target).click(); // another shift is free, so the date itself can be chosen

    await expect(shiftRadio(page, 0)).toBeDisabled(); // Day
    await expect(shiftRadio(page, 1)).toBeEnabled(); // Night
    await expect(shiftRadio(page, 2)).toBeDisabled(); // Full day
    await expect(shiftRadio(page, 3)).toBeEnabled(); // Flexible
    await expect(page.getByText("Booked on this date")).toHaveCount(2);

    // The other hall is untouched: its day shift is free again
    await hall(page, "Pine Lawn").check({ force: true });
    await expect(shiftRadio(page, 0)).toBeEnabled();
    await expect(shiftRadio(page, 2)).toBeEnabled();
  });

  test("a hall booked for the night leaves the day shift open (back to back is allowed)", async ({ page }) => {
    const day = 16;
    await world.booked("other", { days: day, shift: "night", space: "a" });
    const target = ktmDay(day);
    await openForm(page);
    await showMonthOf(page, target);
    await hall(page, "Glass Hall").check({ force: true });
    await dayButton(page, target).click();
    await expect(shiftRadio(page, 0)).toBeEnabled(); // Day ends at 3:00 pm, the night starts at 5:00 pm
    await expect(shiftRadio(page, 1)).toBeDisabled();
    await expect(shiftRadio(page, 2)).toBeDisabled();
  });

  test("a fully booked date is struck through and cannot be chosen", async ({ page }) => {
    const day = 18;
    await world.booked("other", { days: day, shift: "full_day", space: "a" });
    await world.booked("other", { days: day, shift: "full_day", space: "b" });
    const target = ktmDay(day);
    await openForm(page);
    await showMonthOf(page, target);

    const booked = dayButton(page, target, " (already booked)");
    await expect(booked).toBeVisible();
    await expect(booked).toHaveAttribute("aria-disabled", "true");
    await expect(booked).toHaveCSS("text-decoration-line", "line-through");
    await booked.click({ force: true });
    await expect(booked.locator("..")).toHaveAttribute("aria-selected", "false");
    // the neighbours are fine
    await expect(dayButton(page, ktmDay(day + 1))).not.toHaveAttribute("aria-disabled", "true");
    await expect(dayButton(page, ktmDay(day - 1))).not.toHaveAttribute("aria-disabled", "true");

    // pressing Enter on it does not choose it either
    await booked.focus();
    await page.keyboard.press("Enter");
    await expect(booked.locator("..")).toHaveAttribute("aria-selected", "false");
  });

  test("a date is struck through only for the hall that is booked", async ({ page }) => {
    const day = 20;
    await world.booked("other", { days: day, shift: "full_day", space: "a" });
    const target = ktmDay(day);
    await openForm(page);
    await showMonthOf(page, target);

    await expect(dayButton(page, target)).toBeVisible(); // another hall is free
    await hall(page, "Glass Hall").check({ force: true });
    await expect(dayButton(page, target, " (already booked)")).toBeVisible();
    await hall(page, "Pine Lawn").check({ force: true });
    await expect(dayButton(page, target)).toBeVisible();
  });

  test("a date held by a deposit in progress is unavailable, and one whose hold has run out is not", async ({ page }) => {
    const held = 22;
    const lapsed = 24;
    for (const space of ["a", "b"]) {
      await rawBooking("pending_deposit", space, held, "full_day", { holdClaimExpiresAt: new Date(Date.now() + 5 * 60000) });
      await rawBooking("pending_deposit", space, lapsed, "full_day", { holdClaimExpiresAt: new Date(Date.now() - 60000) });
    }
    await openForm(page);
    await showMonthOf(page, ktmDay(held));
    await expect(dayButton(page, ktmDay(held), " (already booked)")).toBeVisible();
    await expect(dayButton(page, ktmDay(lapsed))).toBeVisible(); // the claim expired: the day is free again, even before the database cleans it up
  });

  test("a cancelled booking frees its day at once", async ({ page }) => {
    const day = 26;
    const booking = await world.booked("other", { days: day, shift: "full_day", space: "a" });
    await world.booked("other", { days: day, shift: "full_day", space: "b" });
    const target = ktmDay(day);
    await openForm(page);
    await showMonthOf(page, target);
    await expect(dayButton(page, target, " (already booked)")).toBeVisible();

    await world.api.other.put(`bookings/${booking.bookingId}/cancel`);
    await page.reload();
    await showMonthOf(page, target);
    await expect(dayButton(page, target)).toBeVisible(); // hall A is free again
  });

  test("the calendar reaches exactly 24 months ahead and stops there", async ({ page }) => {
    await openForm(page);
    const previous = page.getByRole("button", { name: "Previous month" });
    const next = page.getByRole("button", { name: "Next month" });
    await expect(previous).toBeDisabled();

    const first = new Date(ktmDay(0).getFullYear(), ktmDay(0).getMonth(), 1);
    for (let i = 1; i <= 24; i++) {
      await expect(next).toBeEnabled();
      await next.click();
      const month = new Date(first.getFullYear(), first.getMonth() + i, 1);
      await expect(heading(page)).toHaveText(monthTitle(month));
    }
    await expect(next).toBeDisabled();
    await expect(previous).toBeEnabled();

    // the last day of the last month can be chosen, nothing in it is "too far ahead"
    const last = new Date(first.getFullYear(), first.getMonth() + 25, 0);
    await dayButton(page, last).click();
    await expect(dayButton(page, last).locator("..")).toHaveAttribute("aria-selected", "true");

    for (let i = 0; i < 24; i++) await previous.click();
    await expect(heading(page)).toHaveText(monthTitle(first));
    await expect(previous).toBeDisabled();
  });

  test("the Nepali calendar also stops at the same horizon", async ({ page }) => {
    await openForm(page);
    await page.getByRole("button", { name: /नेपाली/ }).click();
    const previous = page.getByRole("button", { name: "Previous month" });
    const next = page.getByRole("button", { name: "Next month" });
    await expect(previous).toBeDisabled();
    let steps = 0;
    while (await next.isEnabled()) {
      await next.click();
      steps++;
      expect(steps).toBeLessThan(30);
    }
    expect(steps).toBeGreaterThanOrEqual(23);
    expect(steps).toBeLessThanOrEqual(25);
    await expect(previous).toBeEnabled();
  });

  test("keyboard: arrows, Page keys and Home/End move across month boundaries and stop at tomorrow", async ({ page }) => {
    await openForm(page);
    const roving = grid(page).locator('button[tabindex="0"]');
    const tomorrow = ktmDay(1);
    await roving.focus();
    await expect(roving).toHaveAttribute("aria-label", dayLabel(tomorrow));

    // before tomorrow there is nowhere to go
    await page.keyboard.press("ArrowLeft");
    await expect(roving).toHaveAttribute("aria-label", dayLabel(tomorrow));
    await page.keyboard.press("PageUp");
    await expect(roving).toHaveAttribute("aria-label", dayLabel(tomorrow));
    await page.keyboard.press("Home");
    await expect(roving).toBeFocused();
    if (tomorrow.getDay() !== 0) await expect(roving).toHaveAttribute("aria-label", dayLabel(tomorrow)); // the week starts before tomorrow

    // a week at a time until the month changes
    const startMonth = await heading(page).innerText();
    for (let i = 0; i < 6 && (await heading(page).innerText()) === startMonth; i++) await page.keyboard.press("ArrowDown");
    await expect(heading(page)).not.toHaveText(startMonth);
    const nextMonth = new Date(ktmDay(0).getFullYear(), ktmDay(0).getMonth() + 1, 1);
    await expect(heading(page)).toHaveText(monthTitle(nextMonth));
    await expect(roving).toBeFocused();
    await expect(roving).toHaveAttribute("aria-label", new RegExp(` ${monthTitle(nextMonth)}`));

    // and back, a day at a time, across the boundary again
    for (let i = 0; i < 40 && (await heading(page).innerText()) !== startMonth; i++) await page.keyboard.press("ArrowLeft");
    await expect(heading(page)).toHaveText(startMonth);
    await expect(roving).toBeFocused();

    // Page keys keep the day of the month
    await page.keyboard.press("PageDown");
    await expect(heading(page)).toHaveText(monthTitle(nextMonth));
    await expect(roving).toBeFocused();
    // (this venue has a few booked days from the tests above: step over them)
    for (let i = 0; i < 10 && (await roving.getAttribute("aria-disabled")) === "true"; i++) await page.keyboard.press("ArrowRight");
    await page.keyboard.press("Enter");
    await expect(roving.locator("..")).toHaveAttribute("aria-selected", "true");
  });

  test("keyboard: the same movement works in the Nepali calendar", async ({ page }) => {
    await openForm(page);
    await page.getByRole("button", { name: /नेपाली/ }).click();
    const roving = grid(page).locator('button[tabindex="0"]');
    await roving.focus();
    const startMonth = await heading(page).innerText();
    await page.keyboard.press("PageDown");
    await expect(heading(page)).not.toHaveText(startMonth);
    await expect(roving).toBeFocused();
    await expect(roving).toHaveAttribute("aria-label", / BS, /);
    await page.keyboard.press("PageUp");
    await expect(heading(page)).toHaveText(startMonth);
    await page.keyboard.press("End");
    await expect(roving).toHaveAttribute("aria-label", /Saturday/);
    await page.keyboard.press("Home");
    await expect(roving).toHaveAttribute("aria-label", /Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday/);
  });

  test("today cannot be chosen, and neither can anything earlier or later than the window", async ({ page }) => {
    await openForm(page);
    await expect(dayButton(page, ktmDay(0), " (today, requests need at least a day's notice)")).toHaveAttribute("aria-disabled", "true");
    await expect(dayButton(page, ktmDay(1))).not.toHaveAttribute("aria-disabled", "true");
    const earlier = ktmDay(-1);
    if (earlier.getMonth() === ktmDay(0).getMonth()) await expect(dayButton(page, earlier, " (past date)")).toHaveAttribute("aria-disabled", "true");
  });

  test("choosing a date and a shift stores the request with the right instant: noon in Kathmandu", async ({ page }) => {
    const day = 30;
    const tag = `cal ${Date.now().toString(36)}`;
    const target = ktmDay(day);
    await openForm(page);
    await showMonthOf(page, target);
    await dayButton(page, target).click();
    await shiftRadio(page, 1).check({ force: true }); // Night
    await hall(page, "Pine Lawn").check({ force: true });
    await page.fill("#guests", "55");
    await page.getByRole("button", { name: "Continue" }).click();

    await page.selectOption("#eventType", "Birthday");
    await page.fill("#notes", tag);
    await page.getByRole("button", { name: "Send request" }).click();
    await expect(page.getByRole("heading", { name: new RegExp(`Request sent to ${world.venueName}`) })).toBeVisible();

    const stored = await withDb(async ({ db, ObjectId }) => db.collection("inquiries").find({ venue: new ObjectId(world.venueId) }).sort({ createdAt: -1 }).limit(1).next());
    expect(stored.preferredDate.toISOString()).toBe(eventIso(day)); // 06:15 UTC = 12:00 in Kathmandu, whatever the browser's zone
    expect(stored.preferredShift).toBe("night");
    expect(String(stored.space)).toBe(world.spaces.b);
    expect(stored.numberOfGuests).toBe(55);
    expect(stored.status).toBe("pending");
  });

  test("a request for a flexible shift on a hall-less date stores no shift and no hall", async ({ page }) => {
    const day = 34;
    const target = ktmDay(day);
    await openForm(page);
    await showMonthOf(page, target);
    await dayButton(page, target).click();
    await shiftRadio(page, 3).check({ force: true }); // Flexible
    await page.fill("#guests", "40");
    await page.getByRole("button", { name: "Continue" }).click();
    await page.selectOption("#eventType", "Wedding");
    await page.getByRole("button", { name: "Send request" }).click();
    await expect(page.getByRole("heading", { name: new RegExp(`Request sent to ${world.venueName}`) })).toBeVisible();

    const stored = await withDb(async ({ db, ObjectId }) => db.collection("inquiries").find({ venue: new ObjectId(world.venueId), eventType: "Wedding" }).sort({ createdAt: -1 }).limit(1).next());
    expect(stored.preferredDate.toISOString()).toBe(eventIso(day));
    expect(stored.preferredShift ?? null).toBeNull();
    expect(stored.space ?? null).toBeNull();
  });
});

test.describe("two customers", () => {
  test("a second customer sees the slot as taken once the first has booked it", async ({ browser, baseURL }) => {
    const day = 40;
    const target = ktmDay(day);
    const second = await browser.newContext({ baseURL });
    const page = await second.newPage();
    await login(page, world.other);

    await openForm(page);
    await showMonthOf(page, target);
    await hall(page, "Glass Hall").check({ force: true });
    await expect(dayButton(page, target)).toBeVisible();
    await dayButton(page, target).click();
    await expect(shiftRadio(page, 1)).toBeEnabled(); // night is free

    // The first customer books the night on that hall (paid through the API/database like the eSewa callback leaves it)
    await world.booked("customer", { days: day, shift: "night", space: "a" });

    await page.reload();
    await showMonthOf(page, target);
    await hall(page, "Glass Hall").check({ force: true });
    await dayButton(page, target).click(); // the day shift is still free, so the date itself stays selectable
    await expect(shiftRadio(page, 1)).toBeDisabled(); // Night
    await expect(shiftRadio(page, 2)).toBeDisabled(); // Full day
    await expect(shiftRadio(page, 0)).toBeEnabled(); // Day ends before the night starts

    // Taking the day as well leaves nothing on that hall: the date is struck through for it
    await world.booked("customer", { days: day, shift: "day", space: "a" });
    await page.reload();
    await showMonthOf(page, target);
    await hall(page, "Glass Hall").check({ force: true });
    await expect(dayButton(page, target, " (already booked)")).toBeVisible();
    await hall(page, "Pine Lawn").check({ force: true });
    await expect(dayButton(page, target)).toBeVisible();
    await second.close();
  });

  test("the booked slot is public as bare time ranges, with nothing personal in them", async () => {
    const from = new Date().toISOString();
    const to = new Date(Date.now() + 60 * 86400000).toISOString();
    const res = await world.api.other.get(`venues/${world.venueId}/availability?from=${from}&to=${to}`);
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.length).toBeGreaterThan(0);
    for (const row of body.data) expect(Object.keys(row).sort()).toEqual(["endTime", "space", "startTime"]);
    expect(JSON.stringify(body)).not.toContain("Calendar Guest");
  });
});

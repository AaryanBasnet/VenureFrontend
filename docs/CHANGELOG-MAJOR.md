# Major changes log

A running list of the big changes made while finishing Venure, newest first. Small fixes are in the git history.

## UX pass over the whole customer side (and shared pieces)
- Keyboard-friendly styled `Select` everywhere; one `useMenu` hook for the account and notification menus; one `useRovingTabs` hook for every tab bar.
- Calendar works from the keyboard (arrows, Home/End, PageUp/PageDown), explains unavailable dates, and shows English and Nepali months together. Request form keeps your input on refresh, has step history, and shows per-field errors.
- Venue page: gallery dialog with focus trap and swipe, section nav that tracks scrolling, mobile bottom bar with the price, favorites from the heart (signed-out visitors sign in and come back).
- Header and footer link only to real pages; footer has Terms and Privacy (plain-language, not legal advice). Password reset rewritten (resend, 15-minute code, checklist). Google button hides itself when unavailable.
- Session expiry and sign-out no longer reload the page; the visitor returns to where they were. Dashboard pages scroll to top and move focus on navigation.
- Dates on owner and admin pages use the Kathmandu day, so they are not off by one for people outside Nepal.
- Contrast: small text on light backgrounds uses `taupe` or `gold-800` (never `taupe-light` or `gold-700`). `taupe-light` stays for icons, borders and text on dark.
- Tests: Playwright suite grew from 6 to 158 tests (filters, venue page, inquiry form, chat, notifications, menus, routing and guards, accessibility smoke, owner, admin, legal pages).

## Admin area
- Same shell as the owner area. Dashboard, Users, Venue owners, Venues (approve, reject, feature), Reviews (new, replaces Testimonials), Messages.
- Admin API paths and response handling corrected (counts, lists and activity were broken). New backend endpoint `GET /api/admin/reviews`.

## Payments: eSewa replaces Stripe (frontend + backend)
- Deposits are paid on eSewa. The server signs the amount, the browser posts the form to eSewa, and eSewa sends the customer back to `/payment/esewa/success?data=...`.
- The backend verifies the signature, matches the payment to the attempt it created (customer and amount), then asks eSewa's status API whether it is `COMPLETE` before it creates the booking. `POST /api/payment/esewa/verify`.
- Removed: Stripe packages, `utils/stripe.js`, `pricingService.js`, `POST /bookings/from-quotation`.
- eSewa has no refund API, so a cancellation records a pending refund (`Payment` of type `refund`, status `pending`) and Venure pays it back by hand. If a customer pays but the date was taken at the same moment, the attempt is marked `refund_due` and logged.
- Outside production the backend falls back to eSewa's public sandbox merchant (`EPAYTEST`). Production needs `ESEWA_MERCHANT_CODE`, `ESEWA_SECRET_KEY`, `ESEWA_FORM_URL` and `ESEWA_STATUS_URL`.
- Verified against the real eSewa sandbox: our signed form is accepted (it redirects to the eSewa payment page) and an unpaid callback is refused. The paid path is covered by tests. A full paid run needs the eSewa test wallet, which only you should log in to.

## Bikram Sambat calendar
- The date picker has an English (AD) / नेपाली (BS) switch. Dates stay normal JS dates; BS is display only (`src/features/inquiry/bsCalendar.js`, library `nepali-date-converter`).
- BS dates also show on the request summary, quotation, and booking cards.

## Owner area redesign
- New shell: dark ink sidebar, cream workspace, notification bell in the top bar, skip link, mobile drawer.
- Shared building blocks in `src/components/owner/ui.jsx` and `ownerStyles.js`.
- Dashboard now starts with what needs the owner today (requests waiting for a quotation, upcoming events), then money.
- Every owner page now uses the same pieces: dashboard, venues (list, form, halls and spaces, food packages), inquiries, request detail with a new quotation builder (live total / deposit / balance), bookings (inline balance and cancel confirms), analytics, payments, reviews (working search and filters), chat (same components as the customer side).
- Owner Payments says plainly how money moves: deposit online through eSewa, balance at the venue and recorded by the owner. Pending eSewa refunds are not listed because the bookings API does not return payment documents yet.
- Known gaps: the chat list has no loading or error state (the hook hides fetch errors); `AddVenueModal` and `components/common/VenueCard.jsx` are no longer used by the owner pages and can be deleted; the admin area is untouched.

## Customer area (earlier)
- Venues page with filters, favorites, availability greying, notification bell, page titles, sign-in returns you to where you were.

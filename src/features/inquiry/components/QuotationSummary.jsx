import { priceFormatter } from "../../venues/venueFormat";
import { formatDate, serverDay, shiftLabel } from "../inquiryOptions";
import { bsLabel } from "../bsCalendar";

const npr = (n) => `NPR ${priceFormatter.format(Math.round(n))}`;

// The venue's quotation as the customer (and the owner) sees it. Amounts come from the server.
export default function QuotationSummary({ quotation }) {
  const depositLabel =
    quotation.depositType === "percentage" ? `Deposit (${quotation.depositValue}%)` : "Deposit";

  return (
    <div className="rounded-card-lg border border-line bg-white p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-h4 font-light text-ink">Quotation</h2>
        {quotation.validUntil && (
          <p className="font-body text-caption text-taupe">
            Valid until {formatDate(serverDay(quotation.validUntil))}
          </p>
        )}
      </div>
      <p className="mt-1 font-body text-small text-taupe">
        {formatDate(serverDay(quotation.eventDate))}
        {" ("}{bsLabel(serverDay(quotation.eventDate))}{")"}
        {" · "}
        {shiftLabel(quotation.shift)} · {quotation.space?.name ?? "Space"} · {quotation.numberOfGuests} {quotation.numberOfGuests === 1 ? "guest" : "guests"}
      </p>

      <table className="mt-5 w-full text-left font-body text-small">
        <thead>
          <tr className="border-b border-line font-body text-eyebrow uppercase text-taupe">
            <th scope="col" className="py-2 font-medium">Item</th>
            <th scope="col" className="py-2 text-right font-medium">Amount</th>
          </tr>
        </thead>
        <tbody>
          {quotation.lineItems.map((item, i) => (
            <tr key={i} className="border-b border-line align-top">
              <td className="py-3 pr-4 text-ink break-words">
                {item.label}
                <span className="block text-caption text-taupe">
                  {item.perGuest
                    ? `${npr(item.unitPrice)} per guest × ${quotation.numberOfGuests} ${quotation.numberOfGuests === 1 ? "guest" : "guests"}`
                    : item.quantity > 1
                      ? `${npr(item.unitPrice)} × ${item.quantity}`
                      : item.description || ""}
                </span>
              </td>
              <td className="py-3 text-right text-ink">{npr(item.amount)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot className="font-body">
          <tr>
            <td className="pt-4 font-display text-h5 text-ink">Total</td>
            <td className="pt-4 text-right font-display text-h5 text-ink">{npr(quotation.totalPrice)}</td>
          </tr>
          <tr>
            <td className="pt-3 pr-4 text-gold-800">{depositLabel}, paid online to confirm the date</td>
            <td className="pt-3 text-right text-gold-800">{npr(quotation.depositAmount)}</td>
          </tr>
          <tr>
            <td className="pt-1 pr-4 text-taupe">Balance, paid to the venue directly</td>
            <td className="pt-1 text-right text-taupe">{npr(quotation.balanceAmount)}</td>
          </tr>
        </tfoot>
      </table>

      {quotation.notes && <p className="mt-4 whitespace-pre-line break-words rounded-card-sm bg-sand p-4 font-body text-small text-ink">{quotation.notes}</p>}
    </div>
  );
}

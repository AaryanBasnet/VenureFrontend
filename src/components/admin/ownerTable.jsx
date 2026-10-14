import UserTable from "./UserTable";

// The venue owners list: the shared account list with a venues column instead of roles and bookings.
export default function OwnerTable(props) {
  return <UserTable {...props} variant="owners" />;
}

import StatusPage, { HomeButtons } from "../components/ui/StatusPage";

export default function NotFound() {
  return (
    <StatusPage code="404" title="We could not find that page" actions={<HomeButtons />}>
      The link may be old, or the page may have moved. You can go back home or browse the venues.
    </StatusPage>
  );
}

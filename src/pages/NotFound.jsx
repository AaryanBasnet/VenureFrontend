import StatusPage, { HomeButtons } from "../components/ui/StatusPage";

export default function NotFound() {
  return (
    <StatusPage code="404" title="This page has wandered off" actions={<HomeButtons />}>
      The link may be old, or the page may have moved. Let us take you back to something beautiful.
    </StatusPage>
  );
}

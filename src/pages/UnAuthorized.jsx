import StatusPage from "../components/ui/StatusPage";
import Button from "../components/ui/Button";

export default function UnAuthorized() {
  return (
    <StatusPage
      code="403"
      title="This area is not open to your account"
      actions={
        <>
          <Button to="/" arrow>
            Back to home
          </Button>
          <Button to="/login" variant="outline-dark">
            Sign in with another account
          </Button>
        </>
      }
    >
      You are signed in, but this page is for a different kind of account. If you think this is a mistake, please{" "}
      <a href="/contact" className="underline underline-offset-4 hover:text-ink">
        get in touch
      </a>
      .
    </StatusPage>
  );
}

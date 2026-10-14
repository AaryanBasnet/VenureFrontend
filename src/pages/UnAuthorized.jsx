import { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import StatusPage from "../components/ui/StatusPage";
import Button from "../components/ui/Button";
import { AuthContext } from "../auth/AuthProvider";

export default function UnAuthorized() {
  const { user, logout, loggingOut } = useContext(AuthContext);
  const navigate = useNavigate();

  // The sign-in page is closed to signed-in people, so switching accounts means signing out first
  const switchAccount = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <StatusPage
      code="403"
      title="This page is not open to your account"
      actions={
        <>
          <Button to="/" arrow>
            Go to home
          </Button>
          {user ? (
            <Button variant="outline-dark" onClick={switchAccount} disabled={loggingOut}>
              Sign in with another account
            </Button>
          ) : (
            <Button variant="outline-dark" to="/login">
              Sign in
            </Button>
          )}
        </>
      }
    >
      This page is for a different kind of account. If you think this is a mistake, please{" "}
      <Link to="/contact" className="underline underline-offset-4 hover:text-ink">
        get in touch
      </Link>
      .
    </StatusPage>
  );
}

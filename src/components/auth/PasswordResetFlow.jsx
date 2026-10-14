import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import ForgotPasswordForm from "./ForgotPasswordForm";
import VerifyResetCodeForm from "./VerifyResetCodeForm";
import ResetPasswordForm from "./ResetPasswordForm";
import Logo from "../ui/Logo";

// The password-reset steps on a page of their own (the /password-reset link). From the sign-in page the
// same steps open in a dialog instead. Resetting finishes by sending the person to sign in.
export default function PasswordResetFlow() {
  const navigate = useNavigate();
  const [step, setStep] = useState("email"); // 'email' | 'code' | 'password'
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");

  return (
    <main id="main-content" className="flex min-h-dvh flex-col items-center bg-paper px-5 py-8">
      <Link to="/" className="text-charcoal focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-charcoal">
        <Logo height={56} label="Venure home" />
      </Link>
      <div className="flex w-full max-w-md flex-1 items-center py-8">
        <div className="w-full">
          {step === "email" && (
            <ForgotPasswordForm
              defaultEmail={email}
              onSuccess={(value) => {
                setEmail(value);
                setStep("code");
              }}
              onBackToSignIn={() => navigate("/login")}
            />
          )}
          {step === "code" && (
            <VerifyResetCodeForm
              email={email}
              onSuccess={(value) => {
                setCode(value);
                setStep("password");
              }}
              onBack={() => setStep("email")}
            />
          )}
          {step === "password" && <ResetPasswordForm email={email} code={code} />}
        </div>
      </div>
    </main>
  );
}

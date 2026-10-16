import { useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { User, Mail, Phone, LockKeyhole } from "lucide-react";
import { registerUserApi } from "../../../api/authApi";
import { getErrorMessage } from "../../../api/api";
import { useAuthStore } from "../../../store/authStore";
import { useLogout } from "../../../hooks/auth/useLogout";
import { strongPasswordSchema } from "../../../utils/passwordRules";
import AuthInput from "../../../components/ui/AuthInput";
import Button from "../../../components/ui/Button";
import AuthSubmitButton from "../../../components/auth/AuthSubmitButton";
import { useFocusFirstError } from "../../../components/auth/useFocusFirstError";

const validationSchema = Yup.object({
  name: Yup.string().trim().required("Enter your full name."),
  email: Yup.string().trim().email("Enter a valid email address.").required("Enter your email address."),
  phone: Yup.string()
    .matches(/^\d{9,15}$/, "Use 9 to 15 digits, with no spaces or dashes.")
    .required("Enter your phone number."),
  password: strongPasswordSchema,
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("password")], "The passwords do not match.")
    .required("Enter your password again to confirm it."),
  agreeToTerms: Yup.boolean().oneOf([true], "Tick the box to agree before creating your account."),
});

function useOwnerRegister() {
  const setUser = useAuthStore((s) => s.setUser);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async (values) => (await registerUserApi({ ...values, role: "VenueOwner" })).data.data,
    onSuccess: (user) => {
      setUser(user);
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      toast.success("Your owner account is ready. Add your first venue to begin.");
      navigate("/owner/venues");
    },
  });
}

const linkClass = "inline-block py-1 text-charcoal underline underline-offset-4 hover:text-gold-800";

function SignUpForm() {
  const { mutate, isPending, error, reset } = useOwnerRegister();

  const formik = useFormik({
    initialValues: { name: "", email: "", phone: "", password: "", confirmPassword: "", agreeToTerms: false },
    validationSchema,
    onSubmit: ({ name, email, phone, password }) => {
      reset();
      mutate({ name: name.trim(), email: email.trim(), phone, password });
    },
  });

  const formRef = useRef(null);
  useFocusFirstError(formRef, formik);
  const termsError = formik.touched.agreeToTerms && formik.errors.agreeToTerms;
  const field = (name) => ({
    name,
    value: formik.values[name],
    onChange: formik.handleChange,
    onBlur: formik.handleBlur,
    error: formik.touched[name] && formik.errors[name],
  });

  return (
    <form ref={formRef} onSubmit={formik.handleSubmit} noValidate aria-label="Create a venue owner account" className="flex w-full flex-col gap-[18px]">
      <div className="flex w-full flex-col gap-3.5 sm:flex-row">
        <AuthInput icon={User} label="Full name" placeholder="Your name" autoComplete="name" className="sm:flex-1" {...field("name")} />
        <AuthInput icon={Phone} label="Phone number" type="tel" placeholder="98XXXXXXXX" autoComplete="tel" inputMode="numeric" className="sm:flex-1" {...field("phone")} />
      </div>
      <AuthInput icon={Mail} label="Email address" type="email" placeholder="you@example.com" autoComplete="email" {...field("email")} />
      <div className="flex w-full flex-col gap-3.5 sm:flex-row">
        <AuthInput
          icon={LockKeyhole}
          label="Password"
          type="password"
          placeholder="Create a password"
          autoComplete="new-password"
          className="sm:flex-1"
          hint="Include an uppercase letter, a lowercase letter and a number."
          {...field("password")}
        />
        <AuthInput icon={LockKeyhole} label="Confirm password" type="password" placeholder="Repeat password" autoComplete="new-password" className="sm:flex-1" {...field("confirmPassword")} />
      </div>

      <div className="flex items-start gap-2.5">
        <input
          type="checkbox"
          id="owner-agreeToTerms"
          name="agreeToTerms"
          checked={formik.values.agreeToTerms}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          aria-invalid={termsError ? "true" : undefined}
          aria-describedby={termsError ? "owner-agreeToTerms-error" : undefined}
          className="mt-1 size-6 shrink-0 rounded border-border-strong accent-ink"
        />
        <label htmlFor="owner-agreeToTerms" className="font-body text-small text-taupe">
          I agree to Venure&rsquo;s{" "}
          <Link to="/terms" target="_blank" rel="noopener" className={linkClass}>
            terms of use<span className="sr-only"> (opens in a new tab)</span>
          </Link>{" "}
          and{" "}
          <Link to="/privacy" target="_blank" rel="noopener" className={linkClass}>
            privacy page<span className="sr-only"> (opens in a new tab)</span>
          </Link>
          .
        </label>
      </div>
      {termsError && (
        <p id="owner-agreeToTerms-error" role="alert" className="-mt-2.5 font-body text-caption text-red-700">
          {formik.errors.agreeToTerms}
        </p>
      )}

      {error && (
        <p role="alert" className="font-body text-small text-red-700">
          {getErrorMessage(error)}
        </p>
      )}

      <AuthSubmitButton pending={isPending} pendingLabel="Creating account…">
        Create owner account
      </AuthSubmitButton>

      <p className="font-body text-caption text-taupe">
        Already have an account?{" "}
        <Link to="/login" state={{ from: "/owner/venues" }} className={linkClass}>
          Sign in
        </Link>
      </p>
    </form>
  );
}

function Notice({ title, children, actions }) {
  return (
    <div role="status">
      <p className="font-display text-h4 font-light text-ink">{title}</p>
      <p className="mt-3 font-body text-body text-gold-800">{children}</p>
      <div className="mt-6 flex flex-wrap items-center gap-4">{actions}</div>
    </div>
  );
}

function CustomerNotice() {
  const { mutate: logout, isPending } = useLogout();
  return (
    <Notice
      title="You are signed in as a customer"
      actions={
        <button
          type="button"
          onClick={() => logout()}
          disabled={isPending}
          className="inline-flex min-h-11 cursor-pointer items-center rounded-full border border-ink px-6 font-body text-button uppercase text-ink transition-colors hover:bg-ink hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:opacity-50"
        >
          {isPending ? "Signing out…" : "Sign out"}
        </button>
      }
    >
      Venue owners use a separate account, so you will need to sign out and create an owner account with an email address you have not used on Venure before. Your customer account and your requests stay as they are.
    </Notice>
  );
}

// The sign-up card. Which version shows depends on who is looking.
export default function OwnerSignUp() {
  const user = useAuthStore((s) => s.user);
  const isInitializing = useAuthStore((s) => s.isInitializing);

  // Reserve the card's height while the session check runs, so nothing jumps
  if (isInitializing) return <div aria-hidden="true" className="min-h-[420px]" />;

  if (user?.role === "VenueOwner") {
    return (
      <Notice
        title="You already have an owner account"
        actions={
          <>
            <Button to="/owner/dashboard" arrow>
              Go to your dashboard
            </Button>
            <Button to="/owner/venues" variant="outline-dark">
              Add a venue
            </Button>
          </>
        }
      >
        Open your dashboard to see requests, or go to your venues to add another one.
      </Notice>
    );
  }
  if (user?.role === "Admin") {
    return (
      <Notice
        title="You are signed in as an administrator"
        actions={
          <Button to="/admin/dashboard" arrow>
            Go to the admin dashboard
          </Button>
        }
      >
        Owner accounts are created from the sign-up form while signed out, or from the admin area.
      </Notice>
    );
  }
  if (user) return <CustomerNotice />;
  return <SignUpForm />;
}

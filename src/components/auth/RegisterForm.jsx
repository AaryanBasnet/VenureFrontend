import { useRef } from "react";
import { Link } from "react-router-dom";
import { useFormik } from "formik";
import * as Yup from "yup";
import { User, Mail, Phone, LockKeyhole } from "lucide-react";
import { strongPasswordSchema } from "../../utils/passwordRules";
import useRegisterUserTan from "../../hooks/useRegisterUserTan";
import AuthInput from "../ui/AuthInput";
import AuthSubmitButton from "./AuthSubmitButton";
import { useFocusFirstError } from "./useFocusFirstError";

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

// Figma 255:5284 "Registration form"
export default function RegisterForm() {
  const { mutate, isPending } = useRegisterUserTan();

  const formik = useFormik({
    initialValues: {
      name: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      agreeToTerms: false,
    },
    validationSchema,
    onSubmit: ({ name, email, phone, password }) => mutate({ name: name.trim(), email: email.trim(), phone, password }),
  });

  const formRef = useRef(null);
  useFocusFirstError(formRef, formik);

  const termsError = formik.touched.agreeToTerms && formik.errors.agreeToTerms;

  return (
    <form ref={formRef} className="flex w-full flex-col gap-[18px]" onSubmit={formik.handleSubmit} aria-label="Create account" noValidate>
      <div className="flex w-full flex-col gap-3.5 sm:flex-row">
        <AuthInput
          icon={User}
          label="Full name"
          name="name"
          placeholder="Your name"
          autoComplete="name"
          className="sm:flex-1"
          value={formik.values.name}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.name && formik.errors.name}
        />
        <AuthInput
          icon={Phone}
          label="Phone number"
          type="tel"
          name="phone"
          placeholder="98XXXXXXXX"
          autoComplete="tel"
          inputMode="numeric"
          className="sm:flex-1"
          value={formik.values.phone}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.phone && formik.errors.phone}
        />
      </div>

      <AuthInput
        icon={Mail}
        label="Email address"
        type="email"
        name="email"
        placeholder="you@example.com"
        autoComplete="email"
        value={formik.values.email}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        error={formik.touched.email && formik.errors.email}
      />

      <div className="flex w-full flex-col gap-3.5 sm:flex-row">
        <AuthInput
          icon={LockKeyhole}
          label="Password"
          type="password"
          name="password"
          placeholder="At least 8 characters"
          autoComplete="new-password"
          className="sm:flex-1"
          value={formik.values.password}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.password && formik.errors.password}
          hint="Include an uppercase letter, a lowercase letter and a number."
        />

        <AuthInput
          icon={LockKeyhole}
          label="Confirm password"
          type="password"
          name="confirmPassword"
          placeholder="Repeat password"
          autoComplete="new-password"
          className="sm:flex-1"
          value={formik.values.confirmPassword}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.confirmPassword && formik.errors.confirmPassword}
        />
      </div>

      <div className="flex items-start gap-2.5">
        <input
          type="checkbox"
          id="agreeToTerms"
          name="agreeToTerms"
          checked={formik.values.agreeToTerms}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          aria-invalid={termsError ? "true" : undefined}
          aria-describedby={termsError ? "agreeToTerms-error" : undefined}
          className="mt-1 size-6 shrink-0 rounded border-border-strong accent-ink"
        />
        <label htmlFor="agreeToTerms" className="font-body text-small text-taupe">
          I agree to Venure&rsquo;s{" "}
          <Link to="/terms" target="_blank" rel="noopener" className="inline-block py-1 text-charcoal underline underline-offset-4 hover:text-gold-800">
            terms of use<span className="sr-only"> (opens in a new tab)</span>
          </Link>{" "}
          and{" "}
          <Link to="/privacy" target="_blank" rel="noopener" className="inline-block py-1 text-charcoal underline underline-offset-4 hover:text-gold-800">
            privacy page<span className="sr-only"> (opens in a new tab)</span>
          </Link>
          .
        </label>
      </div>
      {termsError && (
        <p id="agreeToTerms-error" role="alert" className="-mt-2.5 font-body text-caption text-red-700">
          {formik.errors.agreeToTerms}
        </p>
      )}

      <AuthSubmitButton pending={isPending} pendingLabel="Creating account…">
        Create account
      </AuthSubmitButton>
    </form>
  );
}

import { useRef } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { Mail, LockKeyhole } from "lucide-react";
import { Link } from "react-router-dom";
import { useLoginUser } from "../../hooks/useLoginUser";
import AuthInput from "../ui/AuthInput";
import AuthSubmitButton from "./AuthSubmitButton";
import { useFocusFirstError } from "./useFocusFirstError";

// The password is only checked for being present: the server decides whether it is right.
const validationSchema = Yup.object({
  email: Yup.string().trim().email("Enter a valid email address.").required("Enter your email address."),
  password: Yup.string().required("Enter your password."),
});

// Figma 255:5371 "Login form"
export default function LoginForm({ onForgotPassword }) {
  const { mutate, isPending } = useLoginUser();

  const formik = useFormik({
    initialValues: { email: "", password: "" },
    validationSchema,
    onSubmit: ({ email, password }) => mutate({ email: email.trim(), password }),
  });

  const formRef = useRef(null);
  useFocusFirstError(formRef, formik);

  return (
    <form ref={formRef} className="flex w-full flex-col gap-4" onSubmit={formik.handleSubmit} aria-label="Sign in" noValidate>
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
      <AuthInput
        icon={LockKeyhole}
        label="Password"
        type="password"
        name="password"
        placeholder="Enter your password"
        autoComplete="current-password"
        value={formik.values.password}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        error={formik.touched.password && formik.errors.password}
      />

      <div className="-mt-1 flex justify-end">
        <button
          type="button"
          onClick={onForgotPassword}
          className="inline-flex min-h-11 cursor-pointer items-center font-body text-small font-medium text-gold-900 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-900"
        >
          Forgot your password?
        </button>
      </div>

      <AuthSubmitButton pending={isPending} pendingLabel="Signing in…">
        Sign in
      </AuthSubmitButton>

      <p className="text-center font-body text-small text-taupe">
        Planning an event and want to talk first?{" "}
        <Link to="/contact" className="font-medium text-gold-900 underline-offset-4 hover:underline">
          Contact us
        </Link>
      </p>
    </form>
  );
}

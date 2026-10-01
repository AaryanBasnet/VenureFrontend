import { useFormik } from "formik";
import * as Yup from "yup";
import { Mail, LockKeyhole } from "lucide-react";
import { Link } from "react-router-dom";
import { useLoginUser } from "../../hooks/useLoginUser";
import AuthInput from "../ui/AuthInput";
import AuthSubmitButton from "./AuthSubmitButton";

const validationSchema = Yup.object({
  email: Yup.string().email("Invalid email").required("Email required"),
  password: Yup.string().min(8, "Min 8 characters required").required("Password required"),
});

// Figma 255:5371 "Login form"
export default function LoginForm({ onForgotPassword }) {
  const { mutate, isPending } = useLoginUser();

  const formik = useFormik({
    initialValues: { email: "", password: "", remember: true },
    validationSchema,
    onSubmit: ({ email, password }) => mutate({ email, password }),
  });

  return (
    <form
      className="flex w-full flex-col gap-4"
      onSubmit={formik.handleSubmit}
      aria-label="Login form"
      noValidate
    >
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

      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2.5 font-body text-[12px] text-taupe">
          <input
            type="checkbox"
            name="remember"
            checked={formik.values.remember}
            onChange={formik.handleChange}
            className="size-[18px] rounded accent-ink"
          />
          Remember me
        </label>
        <button
          type="button"
          onClick={onForgotPassword}
          className="cursor-pointer font-body text-[12px] font-medium text-gold-700 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-700"
        >
          Forgot password?
        </button>
      </div>

      <div className="pt-2">
        <AuthSubmitButton pending={isPending} pendingLabel="Signing in…">
          Sign in to Venure
        </AuthSubmitButton>
      </div>

      <p className="text-center font-body text-caption text-taupe">
        Prefer a private consultation?{" "}
        <Link to="/contact" className="font-semibold text-gold-900 hover:underline">
          Speak with our concierge
        </Link>
      </p>
    </form>
  );
}

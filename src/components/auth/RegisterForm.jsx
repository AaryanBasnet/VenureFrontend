import { useFormik } from "formik";
import * as Yup from "yup";
import { User, Mail, Phone, LockKeyhole } from "lucide-react";
import { strongPasswordSchema } from "../../utils/passwordRules";
import useRegisterUserTan from "../../hooks/useRegisterUserTan";
import AuthInput from "../ui/AuthInput";
import AuthSubmitButton from "./AuthSubmitButton";

const validationSchema = Yup.object({
  name: Yup.string().required("Name is required"),
  email: Yup.string().email("Invalid email").required("Email is required"),
  phone: Yup.string()
    .matches(/^\d{9,15}$/, "Phone number must be 9-15 digits")
    .required("Phone is required"),
  password: strongPasswordSchema,
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("password")], "Passwords do not match")
    .required("Please confirm your password"),
  agreeToTerms: Yup.boolean().oneOf([true], "Please accept the Terms of Service"),
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
    onSubmit: ({ name, email, phone, password }) => mutate({ name, email, phone, password }),
  });

  return (
    <form className="flex w-full flex-col gap-[18px]" onSubmit={formik.handleSubmit} noValidate>
      <div className="flex w-full flex-col gap-3.5 sm:flex-row">
        <AuthInput
          icon={User}
          label="Full Name"
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
          label="Phone"
          type="tel"
          name="phone"
          placeholder="98XXXXXXXX"
          autoComplete="tel"
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

      <AuthInput
        icon={LockKeyhole}
        label="Create password"
        type="password"
        name="password"
        placeholder="At least 8 characters"
        autoComplete="new-password"
        value={formik.values.password}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        error={formik.touched.password && formik.errors.password}
        hint="Use a mix of uppercase, lowercase letters, and a number."
      />

      <AuthInput
        icon={LockKeyhole}
        label="Confirm password"
        type="password"
        name="confirmPassword"
        placeholder="Re-enter your password"
        autoComplete="new-password"
        value={formik.values.confirmPassword}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        error={formik.touched.confirmPassword && formik.errors.confirmPassword}
      />

      <div className="flex items-start gap-2.5">
        <input
          type="checkbox"
          id="agreeToTerms"
          name="agreeToTerms"
          checked={formik.values.agreeToTerms}
          onChange={formik.handleChange}
          className="mt-0.5 size-[18px] shrink-0 rounded border-border-strong accent-ink"
        />
        <label htmlFor="agreeToTerms" className="font-body text-[12px] leading-[1.45] text-taupe">
          I agree to Venure&rsquo;s <span className="font-medium text-gold-900">Terms of Service</span> and
          acknowledge the <span className="font-medium text-gold-900">Privacy Policy</span>.
        </label>
      </div>
      {formik.touched.agreeToTerms && formik.errors.agreeToTerms && (
        <p role="alert" className="-mt-2.5 font-body text-[12px] text-red-600">
          {formik.errors.agreeToTerms}
        </p>
      )}

      <AuthSubmitButton pending={isPending} pendingLabel="Creating account…">
        Create my account
      </AuthSubmitButton>
    </form>
  );
}

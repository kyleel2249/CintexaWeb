import { isValidPhone } from "@/lib/auth-flow";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type FieldErrors = Record<string, string>;

export const isValidEmail = (v: string) => v.length <= 254 && EMAIL_RE.test(v.trim());

type Common = { fullName: string; email: string; phone: string };

function commonErrors(v: Common): FieldErrors {
  const errors: FieldErrors = {};
  const name = v.fullName.trim();
  if (name.length < 2) errors.fullName = "Enter your full name.";
  else if (name.length > 120) errors.fullName = "That name is too long.";
  if (v.email.trim() && !isValidEmail(v.email)) errors.email = "Enter a valid email address.";
  if (v.phone.trim() && !isValidPhone(v.phone)) errors.phone = "Enter a valid phone number, for example +233 24 000 0000.";
  return errors;
}

/** Applying needs a name and at least one way to reach the applicant. */
export function validateApplication(v: Common & { message: string }): FieldErrors {
  const errors = commonErrors(v);
  if (!v.email.trim() && !v.phone.trim()) {
    errors.email = errors.email ?? "Enter an email address or a phone number so we can reach you.";
  }
  if (v.message.length > 1500) errors.message = "Please keep your message under 1,500 characters.";
  return errors;
}

/** Alerts are sent by email, so the email is required. */
export function validateAlertSignup(v: Common): FieldErrors {
  const errors = commonErrors(v);
  if (!v.email.trim()) errors.email = "Enter your email address.";
  return errors;
}

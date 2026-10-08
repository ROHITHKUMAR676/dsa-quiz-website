// Client-side validation for the profile form. The backend still has the final say;
// this just gives instant, readable feedback before anything is sent.

// ---- Phone (Indian mobile) -------------------------------------------------
// Accepts 98765 43210, +91 98765 43210, 91-9876543210, 09876543210.
// A valid number is 10 digits and starts with 6, 7, 8 or 9.

/** Keep only what a phone field should hold while typing: digits, one leading +, spaces and dashes. */
export function sanitizePhoneInput(raw: string): string {
  const cleaned = raw.replace(/[^\d+\s-]/g, "");
  const plus = cleaned.startsWith("+") ? "+" : "";
  return (plus + cleaned.replace(/\+/g, "")).slice(0, 17);
}

/** Returns the 10-digit national number, or null if the input isn't a usable Indian mobile number. */
export function toNationalPhone(raw: string): string | null {
  let digits = raw.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
  else if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  return /^[6-9]\d{9}$/.test(digits) ? digits : null;
}

export function validatePhone(raw: string): string | null {
  const value = raw.trim();
  if (!value) return "Phone number is required.";
  if (/[^\d+\s-]/.test(value)) return "Use digits only.";
  const national = toNationalPhone(value);
  if (!national) {
    const count = value.replace(/\D/g, "").length;
    if (count < 10) return "Enter all 10 digits.";
    if (count > 12) return "That's too many digits.";
    return "Enter a valid 10-digit mobile number starting with 6, 7, 8 or 9.";
  }
  if (/^(\d)\1{9}$/.test(national)) return "That doesn't look like a real number.";
  return null;
}

/** Canonical form that gets saved: +91 98765 43210 */
export function formatPhone(raw: string): string {
  const n = toNationalPhone(raw);
  return n ? `+91 ${n.slice(0, 5)} ${n.slice(5)}` : raw.trim();
}

// ---- Registration number ---------------------------------------------------
// 8-15 letters/digits with at least 4 digits, e.g. 21CS1042 or 211623070123.
// Tweak REGISTER_NUMBER_RULES if your college uses a stricter pattern.

export const REGISTER_NUMBER_RULES = { min: 13, max: 13};

/** Uppercase and strip everything that can't be part of a register number while typing. */
export function sanitizeRegisterNumberInput(raw: string): string {
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, REGISTER_NUMBER_RULES.max);
}

export function validateRegisterNumber(raw: string): string | null {
  const value = raw.trim();
  const { min, max } = REGISTER_NUMBER_RULES;
  if (!value) return "Register number is required.";
  if (!/^[A-Za-z0-9]+$/.test(value)) return "Use  digits only, no letters, spaces or symbols.";
  if (value.length < min) return `Too short. Register numbers have at least ${min} characters.`;
  if (value.length > max) return `Too long. Maximum is ${max} characters.`;
  if (/^(.)\1+$/.test(value)) return "That doesn't look like a real register number.";
  return null;
}

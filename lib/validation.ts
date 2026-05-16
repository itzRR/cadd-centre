// ─── Input Validation Utilities ─────────────────────────────────
// Shared validation logic for all forms across Scholar-Sync

/** Allow only letters, spaces, dots, and hyphens (no numbers, no symbols) */
export function isValidName(value: string): boolean {
  return /^[A-Za-z\s.\-']+$/.test(value.trim())
}

/** Sanitize name input: strip any non-letter characters except spaces, dots, hyphens, apostrophes */
export function sanitizeName(value: string): string {
  return value.replace(/[^A-Za-z\s.\-']/g, "")
}

/** Validate email format - must contain @ and a domain */
export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

/**
 * Validate Sri Lankan phone number
 * Accepted formats:
 *   07X XXXXXXX  (mobile)
 *   +94 7X XXXXXXX
 *   0XX XXXXXXX  (landline)
 *   +94 XX XXXXXXX
 * Stripped of spaces/dashes before validation
 */
export function isValidSriLankanPhone(value: string): boolean {
  const stripped = value.replace(/[\s\-()]/g, "")
  if (!stripped) return true // empty phone is OK (optional field)
  // Mobile: 07X followed by 7 digits → total 10 digits
  // Or with country code: +947X followed by 7 digits → +94 + 9 digits
  // Landline: 0XX followed by 7 digits → total 10 digits
  // Or +94XX followed by 7 digits
  return /^(\+94|0)\d{9}$/.test(stripped)
}

/** Format phone input to Sri Lankan style as user types */
export function formatSriLankanPhone(value: string): string {
  // Remove everything except digits and leading +
  let cleaned = value.replace(/[^\d+]/g, "")
  
  // If starts with +94, format as +94 XX XXX XXXX
  if (cleaned.startsWith("+94")) {
    const digits = cleaned.slice(3)
    if (digits.length <= 2) return `+94 ${digits}`
    if (digits.length <= 5) return `+94 ${digits.slice(0, 2)} ${digits.slice(2)}`
    return `+94 ${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 9)}`
  }
  
  // If starts with 0, format as 0XX XXX XXXX
  if (cleaned.startsWith("0")) {
    if (cleaned.length <= 3) return cleaned
    if (cleaned.length <= 6) return `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 10)}`
  }
  
  return cleaned
}

/** Validate password strength */
export function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  let score = 0
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++

  if (score <= 1) return { score, label: "Weak", color: "text-red-600" }
  if (score <= 2) return { score, label: "Fair", color: "text-yellow-600" }
  if (score <= 3) return { score, label: "Good", color: "text-blue-600" }
  return { score, label: "Strong", color: "text-green-600" }
}

/** Check if value is not empty after trimming */
export function isRequired(value: string): boolean {
  return value.trim().length > 0
}

/** Validate salary / amount - must be a positive number */
export function isValidAmount(value: number): boolean {
  return !isNaN(value) && value > 0
}

// ─── Field Error Type ───────────────────────────────────────────
export type FieldErrors = Record<string, string>

/**
 * Validate a full form and return field-level errors.
 * Returns empty object if all valid.
 */
export function validateForm(fields: {
  name?: string
  email?: string
  phone?: string
  password?: string
  confirmPassword?: string
  amount?: number
  required?: Record<string, string> // key -> value to check required
}): FieldErrors {
  const errors: FieldErrors = {}

  // Name validation
  if (fields.name !== undefined) {
    if (!isRequired(fields.name)) {
      errors.name = "Name is required"
    } else if (!isValidName(fields.name)) {
      errors.name = "Name can only contain letters, spaces, and hyphens"
    }
  }

  // Email validation
  if (fields.email !== undefined) {
    if (!isRequired(fields.email)) {
      errors.email = "Email is required"
    } else if (!isValidEmail(fields.email)) {
      errors.email = "Please enter a valid email address (e.g. name@example.com)"
    }
  }

  // Phone validation (Sri Lankan format)
  if (fields.phone !== undefined && fields.phone.trim()) {
    if (!isValidSriLankanPhone(fields.phone)) {
      errors.phone = "Enter a valid Sri Lankan number (e.g. 071 234 5678 or +94 71 234 5678)"
    }
  }

  // Password validation
  if (fields.password !== undefined) {
    if (!isRequired(fields.password)) {
      errors.password = "Password is required"
    } else if (fields.password.length < 8) {
      errors.password = "Password must be at least 8 characters"
    }
  }

  // Confirm password
  if (fields.confirmPassword !== undefined && fields.password !== undefined) {
    if (fields.confirmPassword !== fields.password) {
      errors.confirmPassword = "Passwords do not match"
    }
  }

  // Amount validation
  if (fields.amount !== undefined) {
    if (!isValidAmount(fields.amount)) {
      errors.amount = "Please enter a valid positive amount"
    }
  }

  // Generic required fields
  if (fields.required) {
    for (const [key, value] of Object.entries(fields.required)) {
      if (!isRequired(value)) {
        errors[key] = `${key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, " ")} is required`
      }
    }
  }

  return errors
}

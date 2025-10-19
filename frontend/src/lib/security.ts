import { z } from "zod";
import DOMPurify from "dompurify";

// ============================================================================
// SECURITY-FIRST IMPLEMENTATION
// ============================================================================

/**
 * Input validation schemas with strict security requirements
 */
export const SecuritySchemas = {
  // Authentication schemas
  LoginSchema: z.object({
    email: z
      .string()
      .email("Invalid email format")
      .min(1, "Email is required")
      .max(255, "Email too long")
      .transform((email) => email.toLowerCase().trim()),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128, "Password too long")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
        "Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character"
      ),
  }),

  RegisterSchema: z
    .object({
      email: z
        .string()
        .email("Invalid email format")
        .min(1, "Email is required")
        .max(255, "Email too long")
        .transform((email) => email.toLowerCase().trim()),
      password: z
        .string()
        .min(8, "Password must be at least 8 characters")
        .max(128, "Password too long")
        .regex(
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
          "Password must contain at least one lowercase letter, one uppercase letter, and one number"
        ),
      confirmPassword: z.string(),
      firstName: z
        .string()
        .min(1, "First name is required")
        .max(50, "First name too long")
        .regex(/^[a-zA-Z\s'-]+$/, "First name contains invalid characters"),
      lastName: z
        .string()
        .min(1, "Last name is required")
        .max(50, "Last name too long")
        .regex(/^[a-zA-Z\s'-]+$/, "Last name contains invalid characters"),
      zipCode: z
        .string()
        .optional()
        .refine(
          (val) => !val || /^\d{5}(-\d{4})?$/.test(val),
          "Invalid ZIP code format"
        ),
      acceptTerms: z
        .boolean()
        .refine(
          (val) => val === true,
          "You must accept the terms and conditions"
        ),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: "Passwords don't match",
      path: ["confirmPassword"],
    }),

  // Profile update schema
  ProfileUpdateSchema: z.object({
    firstName: z
      .string()
      .min(1, "First name is required")
      .max(50, "First name too long")
      .regex(/^[a-zA-Z\s'-]+$/, "First name contains invalid characters"),
    lastName: z
      .string()
      .min(1, "Last name is required")
      .max(50, "Last name too long")
      .regex(/^[a-zA-Z\s'-]+$/, "Last name contains invalid characters"),
    zipCode: z
      .string()
      .regex(/^\d{5}(-\d{4})?$/, "Invalid ZIP code format")
      .optional(),
    bio: z.string().max(500, "Bio too long").optional(),
    avatar: z.string().url("Invalid avatar URL").optional(),
  }),

  // Password reset schema
  PasswordResetSchema: z.object({
    email: z
      .string()
      .email("Invalid email format")
      .min(1, "Email is required")
      .max(255, "Email too long")
      .transform((email) => email.toLowerCase().trim()),
  }),

  PasswordResetConfirmSchema: z
    .object({
      token: z.string().min(1, "Reset token is required"),
      password: z
        .string()
        .min(8, "Password must be at least 8 characters")
        .max(128, "Password too long")
        .regex(
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
          "Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character"
        ),
      confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: "Passwords don't match",
      path: ["confirmPassword"],
    }),

  // General input validation
  ZipCodeSchema: z
    .string()
    .regex(/^\d{5}(-\d{4})?$/, "Invalid ZIP code format"),

  SearchSchema: z.object({
    query: z
      .string()
      .min(1, "Search query is required")
      .max(100, "Search query too long")
      .regex(
        /^[a-zA-Z0-9\s\-_.,!?]+$/,
        "Search query contains invalid characters"
      ),
  }),

  // File upload validation
  FileUploadSchema: z.object({
    file: z
      .instanceof(File)
      .refine(
        (file) => file.size <= 10 * 1024 * 1024,
        "File size must be less than 10MB"
      )
      .refine(
        (file) => ["image/jpeg", "image/png", "image/webp"].includes(file.type),
        "Only JPEG, PNG, and WebP images are allowed"
      ),
  }),
} as const;

/**
 * XSS Protection utilities
 */
export class XSSProtection {
  private static purifier = DOMPurify;

  /**
   * Sanitize HTML content to prevent XSS attacks
   */
  static sanitizeHtml(input: string, options?: DOMPurify.Config): string {
    return this.purifier.sanitize(input, {
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: [],
      ...options,
    });
  }

  /**
   * Sanitize text input (removes all HTML)
   */
  static sanitizeText(input: string): string {
    return this.sanitizeHtml(input, {
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: [],
    });
  }

  /**
   * Sanitize rich text content (allows safe HTML)
   */
  static sanitizeRichText(input: string): string {
    return this.sanitizeHtml(input, {
      ALLOWED_TAGS: ["p", "br", "strong", "em", "ul", "ol", "li", "a"],
      ALLOWED_ATTR: ["href", "target", "rel"],
      ALLOW_DATA_ATTR: false,
    });
  }

  /**
   * Validate and sanitize URL
   */
  static sanitizeUrl(url: string): string | null {
    try {
      const urlObj = new URL(url);
      // Only allow http and https protocols
      if (!["http:", "https:"].includes(urlObj.protocol)) {
        return null;
      }
      return urlObj.toString();
    } catch {
      return null;
    }
  }
}

/**
 * CSRF Protection utilities
 */
export class CSRFProtection {
  private static tokenKey = "csrf_token";
  private static tokenExpiry = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Generate a secure CSRF token
   */
  static generateToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
      ""
    );
  }

  /**
   * Store CSRF token in session storage
   */
  static storeToken(token: string): void {
    const tokenData = {
      token,
      expiry: Date.now() + this.tokenExpiry,
    };
    sessionStorage.setItem(this.tokenKey, JSON.stringify(tokenData));
  }

  /**
   * Get valid CSRF token from storage
   */
  static getToken(): string | null {
    try {
      const tokenData = sessionStorage.getItem(this.tokenKey);
      if (!tokenData) return null;

      const { token, expiry } = JSON.parse(tokenData);
      if (Date.now() > expiry) {
        this.clearToken();
        return null;
      }

      return token;
    } catch {
      this.clearToken();
      return null;
    }
  }

  /**
   * Validate CSRF token
   */
  static validateToken(token: string): boolean {
    const storedToken = this.getToken();
    return storedToken !== null && storedToken === token;
  }

  /**
   * Clear CSRF token
   */
  static clearToken(): void {
    sessionStorage.removeItem(this.tokenKey);
  }

  /**
   * Get CSRF token for API requests
   */
  static getTokenForRequest(): string | null {
    return this.getToken();
  }
}

/**
 * Rate limiting utilities
 */
export class RateLimiter {
  private static limits = new Map<
    string,
    { count: number; resetTime: number }
  >();
  private static defaultLimits = {
    login: { max: 5, window: 15 * 60 * 1000 }, // 5 attempts per 15 minutes
    register: { max: 3, window: 60 * 60 * 1000 }, // 3 attempts per hour
    passwordReset: { max: 3, window: 60 * 60 * 1000 }, // 3 attempts per hour
    api: { max: 100, window: 60 * 1000 }, // 100 requests per minute
  };

  /**
   * Check if action is within rate limit
   */
  static checkLimit(action: string, identifier: string): boolean {
    const key = `${action}:${identifier}`;
    const limit =
      this.defaultLimits[action as keyof typeof this.defaultLimits] ||
      this.defaultLimits.api;
    const now = Date.now();

    const current = this.limits.get(key);
    if (!current || now > current.resetTime) {
      this.limits.set(key, { count: 1, resetTime: now + limit.window });
      return true;
    }

    if (current.count >= limit.max) {
      return false;
    }

    current.count++;
    return true;
  }

  /**
   * Get remaining attempts for an action
   */
  static getRemainingAttempts(action: string, identifier: string): number {
    const key = `${action}:${identifier}`;
    const limit =
      this.defaultLimits[action as keyof typeof this.defaultLimits] ||
      this.defaultLimits.api;
    const current = this.limits.get(key);

    if (!current || Date.now() > current.resetTime) {
      return limit.max;
    }

    return Math.max(0, limit.max - current.count);
  }

  /**
   * Get time until rate limit resets
   */
  static getTimeUntilReset(action: string, identifier: string): number {
    const key = `${action}:${identifier}`;
    const current = this.limits.get(key);

    if (!current || Date.now() > current.resetTime) {
      return 0;
    }

    return Math.max(0, current.resetTime - Date.now());
  }
}

/**
 * Input sanitization utilities
 */
export class InputSanitizer {
  /**
   * Sanitize form input
   */
  static sanitizeFormInput(input: string): string {
    return XSSProtection.sanitizeText(input.trim());
  }

  /**
   * Sanitize search query
   */
  static sanitizeSearchQuery(query: string): string {
    return XSSProtection.sanitizeText(query.trim().toLowerCase());
  }

  /**
   * Sanitize file name
   */
  static sanitizeFileName(fileName: string): string {
    return fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
  }

  /**
   * Validate and sanitize email
   */
  static sanitizeEmail(email: string): string {
    return XSSProtection.sanitizeText(email.trim().toLowerCase());
  }
}

/**
 * Security headers for API requests
 */
export const SecurityHeaders = {
  /**
   * Get security headers for API requests
   */
  getHeaders(csrfToken?: string): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "X-Requested-With": "XMLHttpRequest",
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "X-XSS-Protection": "1; mode=block",
    };

    if (csrfToken) {
      headers["X-CSRF-Token"] = csrfToken;
    }

    return headers;
  },
};

/**
 * Security validation utilities
 */
export class SecurityValidator {
  /**
   * Validate UUID format
   */
  static validateUUID(uuid: string): boolean {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  /**
   * Validate password strength
   */
  static validatePasswordStrength(password: string): {
    isValid: boolean;
    score: number;
    feedback: string[];
  } {
    const feedback: string[] = [];
    let score = 0;

    if (password.length >= 8) score += 1;
    else feedback.push("Password should be at least 8 characters long");

    if (/[a-z]/.test(password)) score += 1;
    else feedback.push("Password should contain at least one lowercase letter");

    if (/[A-Z]/.test(password)) score += 1;
    else feedback.push("Password should contain at least one uppercase letter");

    if (/\d/.test(password)) score += 1;
    else feedback.push("Password should contain at least one number");

    if (/[@$!%*?&]/.test(password)) score += 1;
    else
      feedback.push("Password should contain at least one special character");

    if (password.length >= 12) score += 1;
    if (/[^a-zA-Z0-9@$!%*?&]/.test(password)) score += 1;

    return {
      isValid: score >= 4,
      score,
      feedback,
    };
  }

  /**
   * Check if string contains potentially malicious content
   */
  static containsMaliciousContent(input: string): boolean {
    const maliciousPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /data:text\/html/i,
      /vbscript:/i,
      /expression\s*\(/i,
    ];

    return maliciousPatterns.some((pattern) => pattern.test(input));
  }
}

/**
 * Error types for security-related errors
 */
export class SecurityError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = "SecurityError";
  }
}

export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export class RateLimitError extends Error {
  constructor(message: string, public retryAfter?: number) {
    super(message);
    this.name = "RateLimitError";
  }
}

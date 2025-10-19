import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  SecuritySchemas,
  XSSProtection,
  CSRFProtection,
  RateLimiter,
  InputSanitizer,
  SecurityValidator,
  SecurityError,
  ValidationError,
  RateLimitError,
} from "../../lib/security";

describe("SecuritySchemas", () => {
  describe("LoginSchema", () => {
    it("validates correct login data", () => {
      const validData = {
        email: "test@example.com",
        password: "ValidPass123!",
      };

      const result = SecuritySchemas.LoginSchema.parse(validData);
      expect(result.email).toBe("test@example.com");
      expect(result.password).toBe("ValidPass123!");
    });

    it("transforms email to lowercase", () => {
      const data = {
        email: "TEST@EXAMPLE.COM",
        password: "ValidPass123!",
      };

      const result = SecuritySchemas.LoginSchema.parse(data);
      expect(result.email).toBe("test@example.com");
    });

    it("rejects invalid email format", () => {
      const invalidData = {
        email: "invalid-email",
        password: "ValidPass123!",
      };

      expect(() => SecuritySchemas.LoginSchema.parse(invalidData)).toThrow();
    });

    it("rejects weak password", () => {
      const invalidData = {
        email: "test@example.com",
        password: "weak",
      };

      expect(() => SecuritySchemas.LoginSchema.parse(invalidData)).toThrow();
    });
  });

  describe("RegisterSchema", () => {
    it("validates correct registration data", () => {
      const validData = {
        email: "test@example.com",
        password: "ValidPass123!",
        confirmPassword: "ValidPass123!",
        firstName: "John",
        lastName: "Doe",
        zipCode: "12345",
        acceptTerms: true,
      };

      const result = SecuritySchemas.RegisterSchema.parse(validData);
      expect(result.email).toBe("test@example.com");
      expect(result.firstName).toBe("John");
    });

    it("rejects mismatched passwords", () => {
      const invalidData = {
        email: "test@example.com",
        password: "ValidPass123!",
        confirmPassword: "DifferentPass123!",
        firstName: "John",
        lastName: "Doe",
        acceptTerms: true,
      };

      expect(() => SecuritySchemas.RegisterSchema.parse(invalidData)).toThrow();
    });

    it("rejects unaccepted terms", () => {
      const invalidData = {
        email: "test@example.com",
        password: "ValidPass123!",
        confirmPassword: "ValidPass123!",
        firstName: "John",
        lastName: "Doe",
        acceptTerms: false,
      };

      expect(() => SecuritySchemas.RegisterSchema.parse(invalidData)).toThrow();
    });
  });
});

describe("XSSProtection", () => {
  it("sanitizes HTML content", () => {
    const maliciousInput = '<script>alert("xss")</script>Hello';
    const sanitized = XSSProtection.sanitizeHtml(maliciousInput);
    expect(sanitized).toBe("Hello");
  });

  it("sanitizes text input", () => {
    const maliciousInput = '<img src="x" onerror="alert(1)">';
    const sanitized = XSSProtection.sanitizeText(maliciousInput);
    expect(sanitized).toBe("");
  });

  it("allows safe HTML in rich text", () => {
    const safeInput = "<p>Hello <strong>world</strong></p>";
    const sanitized = XSSProtection.sanitizeRichText(safeInput);
    expect(sanitized).toContain("<p>");
    expect(sanitized).toContain("<strong>");
  });

  it("removes dangerous attributes in rich text", () => {
    const dangerousInput = '<p onclick="alert(1)">Hello</p>';
    const sanitized = XSSProtection.sanitizeRichText(dangerousInput);
    expect(sanitized).not.toContain("onclick");
  });

  it("validates and sanitizes URLs", () => {
    const validUrl = "https://example.com";
    const sanitized = XSSProtection.sanitizeUrl(validUrl);
    expect(sanitized).toBe("https://example.com/");
  });

  it("rejects non-HTTP URLs", () => {
    const invalidUrl = "javascript:alert(1)";
    const sanitized = XSSProtection.sanitizeUrl(invalidUrl);
    expect(sanitized).toBeNull();
  });
});

describe("CSRFProtection", () => {
  beforeEach(() => {
    // Clear sessionStorage before each test
    sessionStorage.clear();
  });

  it("generates secure tokens", () => {
    const token1 = CSRFProtection.generateToken();
    const token2 = CSRFProtection.generateToken();

    expect(token1).toHaveLength(64); // 32 bytes = 64 hex chars
    expect(token2).toHaveLength(64);
    expect(token1).not.toBe(token2);
  });

  it("stores and retrieves tokens", () => {
    const token = CSRFProtection.generateToken();
    CSRFProtection.storeToken(token);

    const retrievedToken = CSRFProtection.getToken();
    expect(retrievedToken).toBe(token);
  });

  it("validates tokens correctly", () => {
    const token = CSRFProtection.generateToken();
    CSRFProtection.storeToken(token);

    expect(CSRFProtection.validateToken(token)).toBe(true);
    expect(CSRFProtection.validateToken("invalid-token")).toBe(false);
  });

  it("clears tokens", () => {
    const token = CSRFProtection.generateToken();
    CSRFProtection.storeToken(token);
    CSRFProtection.clearToken();

    expect(CSRFProtection.getToken()).toBeNull();
  });

  it("handles expired tokens", () => {
    const token = CSRFProtection.generateToken();
    const tokenData = {
      token,
      expiry: Date.now() - 1000, // Expired
    };
    sessionStorage.setItem("csrf_token", JSON.stringify(tokenData));

    expect(CSRFProtection.getToken()).toBeNull();
  });
});

describe("RateLimiter", () => {
  beforeEach(() => {
    // Clear rate limiter state
    vi.clearAllMocks();
  });

  it("allows requests within limit", () => {
    const result = RateLimiter.checkLimit("login", "test@example.com");
    expect(result).toBe(true);
  });

  it("tracks remaining attempts", () => {
    const remaining = RateLimiter.getRemainingAttempts(
      "login",
      "test@example.com"
    );
    expect(remaining).toBe(5); // Default limit for login
  });

  it("calculates time until reset", () => {
    const timeUntilReset = RateLimiter.getTimeUntilReset(
      "login",
      "test@example.com"
    );
    expect(timeUntilReset).toBe(0); // No previous attempts
  });

  it("blocks requests when limit exceeded", () => {
    // Simulate multiple attempts
    for (let i = 0; i < 5; i++) {
      RateLimiter.checkLimit("login", "test@example.com");
    }

    // 6th attempt should be blocked
    const result = RateLimiter.checkLimit("login", "test@example.com");
    expect(result).toBe(false);
  });
});

describe("InputSanitizer", () => {
  it("sanitizes form input", () => {
    const input = "  <script>alert(1)</script>Hello  ";
    const sanitized = InputSanitizer.sanitizeFormInput(input);
    expect(sanitized).toBe("Hello");
  });

  it("sanitizes search queries", () => {
    const query = "  <script>alert(1)</script>search term  ";
    const sanitized = InputSanitizer.sanitizeSearchQuery(query);
    expect(sanitized).toBe("search term");
  });

  it("sanitizes file names", () => {
    const fileName = "file<script>.txt";
    const sanitized = InputSanitizer.sanitizeFileName(fileName);
    expect(sanitized).toBe("file_script_.txt");
  });

  it("sanitizes email addresses", () => {
    const email = "  TEST@EXAMPLE.COM  ";
    const sanitized = InputSanitizer.sanitizeEmail(email);
    expect(sanitized).toBe("test@example.com");
  });
});

describe("SecurityValidator", () => {
  it("validates UUID format", () => {
    const validUUID = "123e4567-e89b-12d3-a456-426614174000";
    const invalidUUID = "not-a-uuid";

    expect(SecurityValidator.validateUUID(validUUID)).toBe(true);
    expect(SecurityValidator.validateUUID(invalidUUID)).toBe(false);
  });

  it("validates password strength", () => {
    const weakPassword = "weak";
    const strongPassword = "StrongPass123!";

    const weakResult = SecurityValidator.validatePasswordStrength(weakPassword);
    const strongResult =
      SecurityValidator.validatePasswordStrength(strongPassword);

    expect(weakResult.isValid).toBe(false);
    expect(weakResult.score).toBeLessThan(4);
    expect(strongResult.isValid).toBe(true);
    expect(strongResult.score).toBeGreaterThanOrEqual(4);
  });

  it("detects malicious content", () => {
    const safeContent = "Hello world";
    const maliciousContent = "<script>alert(1)</script>";

    expect(SecurityValidator.containsMaliciousContent(safeContent)).toBe(false);
    expect(SecurityValidator.containsMaliciousContent(maliciousContent)).toBe(
      true
    );
  });
});

describe("Security Error Classes", () => {
  it("creates SecurityError with code", () => {
    const error = new SecurityError("Test error", "TEST_CODE");
    expect(error.message).toBe("Test error");
    expect(error.code).toBe("TEST_CODE");
    expect(error.name).toBe("SecurityError");
  });

  it("creates ValidationError with field", () => {
    const error = new ValidationError("Field error", "email");
    expect(error.message).toBe("Field error");
    expect(error.field).toBe("email");
    expect(error.name).toBe("ValidationError");
  });

  it("creates RateLimitError with retry time", () => {
    const error = new RateLimitError("Rate limited", 30000);
    expect(error.message).toBe("Rate limited");
    expect(error.retryAfter).toBe(30000);
    expect(error.name).toBe("RateLimitError");
  });
});

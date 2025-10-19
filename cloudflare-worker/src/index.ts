export interface Env {
  BACKEND_URL: string;
  POLICIES: KVNamespace;
  USER_SESSIONS: KVNamespace;
  ANALYTICS: KVNamespace;
  RATE_LIMIT: KVNamespace;
}

interface ItemDetection {
  label: string;
  confidence: number;
}

interface ItemDecision {
  label: string;
  bin: "recycling" | "compost" | "trash";
  explanation: string;
  eco_tip: string;
}

interface CombinedResponse {
  items: ItemDetection[];
  decisions: ItemDecision[];
  zip?: string;
  policies?: any;
}

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      });
    }

    // Only handle POST requests for image processing
    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    try {
      const url = new URL(request.url);
      const zip = url.searchParams.get("zip");
      const userId = url.searchParams.get("userId");

      // Validate zip code format if provided
      if (zip && !/^\d{5}(-\d{4})?$/.test(zip)) {
        return new Response(
          JSON.stringify({
            error:
              "Invalid zip code format. Please provide a valid US zip code (e.g., 12345 or 12345-6789).",
          }),
          {
            status: 400,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
          }
        );
      }

      // Get client IP for rate limiting
      const clientIP = request.headers.get("CF-Connecting-IP") || "unknown";

      // Check rate limit
      const rateLimitKey = userId || clientIP;
      const isAllowed = await checkRateLimit(env, rateLimitKey, 50, 3600); // 50 requests per hour

      if (!isAllowed) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Retry-After": "3600",
          },
        });
      }

      // Get form data
      const formData = await request.formData();
      const fileEntry = formData.get("file");

      if (!fileEntry || typeof fileEntry === "string") {
        return new Response(
          JSON.stringify({ error: "No file provided or invalid type" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // Narrowed to File by the guard above
      const file = fileEntry as File;

      // Validate file type with more specific checks
      const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
        "image/gif",
      ];
      if (
        !file.type.startsWith("image/") ||
        !allowedTypes.includes(file.type.toLowerCase())
      ) {
        return new Response(
          JSON.stringify({
            error:
              "Invalid file type. Only JPEG, PNG, WebP, and GIF images are allowed.",
            allowedTypes: allowedTypes,
          }),
          {
            status: 400,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
          }
        );
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        return new Response(
          JSON.stringify({ error: "File too large. Maximum size is 10MB." }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // Optimize image
      const optimizedFile = await optimizeImage(file);

      // Get local policies from KV with caching
      let policies = null;
      if (zip) {
        policies = await getCachedPolicy(env, zip);
      }

      // Track analytics event
      await trackAnalytics(
        env,
        "image_upload",
        {
          fileSize: file.size,
          optimizedSize: optimizedFile.size,
          fileType: file.type,
          zip: zip,
          userAgent: request.headers.get("User-Agent"),
          ip: clientIP,
        },
        userId || undefined
      );

      // Forward to backend for inference
      const inferFormData = new FormData();
      inferFormData.append("file", optimizedFile, file.name);
      if (zip) {
        inferFormData.append("zip", zip);
      }
      if (userId) {
        inferFormData.append("userId", userId);
      }

      const inferResponse = await fetch(`${env.BACKEND_URL}/infer`, {
        method: "POST",
        body: inferFormData,
        headers: {
          "User-Agent": "Rebin-Cloudflare-Worker/1.0",
        },
      });

      if (!inferResponse.ok) {
        const errorText = await inferResponse
          .text()
          .catch(() => "Unknown error");
        throw new Error(
          `Inference failed: ${inferResponse.status} - ${errorText}`
        );
      }

      const inferData = (await inferResponse.json()) as {
        items: ItemDetection[];
      };

      // Forward to backend for explanation
      const explainResponse = await fetch(`${env.BACKEND_URL}/explain`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Rebin-Cloudflare-Worker/1.0",
        },
        body: JSON.stringify({
          items: inferData.items.map((item: ItemDetection) => ({
            label: item.label,
          })),
          zip: zip,
          policies_json: policies,
        }),
      });

      if (!explainResponse.ok) {
        const errorText = await explainResponse
          .text()
          .catch(() => "Unknown error");
        throw new Error(
          `Explanation failed: ${explainResponse.status} - ${errorText}`
        );
      }

      const explainData = (await explainResponse.json()) as {
        decisions: ItemDecision[];
      };

      // Track successful processing
      await trackAnalytics(
        env,
        "image_processed",
        {
          itemsDetected: inferData.items.length,
          decisions: explainData.decisions.length,
          zip: zip,
          processingTime: Date.now(),
        },
        userId || undefined
      );

      // Combine responses
      const combinedResponse: CombinedResponse = {
        items: inferData.items,
        decisions: explainData.decisions,
        zip: zip || undefined,
        policies: policies || undefined,
      };

      return new Response(JSON.stringify(combinedResponse), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "no-cache",
        },
      });
    } catch (error) {
      console.error("Worker error:", error);

      // Track error
      await trackAnalytics(env, "processing_error", {
        error: error instanceof Error ? error.message : "Unknown error",
        userAgent: request.headers.get("User-Agent"),
        ip: request.headers.get("CF-Connecting-IP") || "unknown",
      });

      return new Response(
        JSON.stringify({
          error: "Internal server error",
          message: error instanceof Error ? error.message : "Unknown error",
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }
  },
};

async function resizeImage(
  file: File,
  maxWidth: number = 800,
  maxHeight: number = 600
): Promise<File> {
  // Simple check - if file is already small enough, return as-is
  if (file.size < 1024 * 1024) {
    // 1MB
    return file;
  }

  try {
    // Validate input parameters
    if (maxWidth <= 0 || maxHeight <= 0) {
      throw new Error("Invalid dimensions provided for image resize");
    }

    // Create canvas for image processing
    const canvas = new OffscreenCanvas(maxWidth, maxHeight);
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("Failed to get canvas context");
    }

    // Create image from file with error handling
    let imageBitmap: ImageBitmap;
    try {
      imageBitmap = await createImageBitmap(file);
    } catch (bitmapError) {
      throw new Error(
        `Failed to create image bitmap: ${
          bitmapError instanceof Error ? bitmapError.message : "Unknown error"
        }`
      );
    }

    // Validate image dimensions
    if (imageBitmap.width <= 0 || imageBitmap.height <= 0) {
      throw new Error("Invalid image dimensions");
    }

    // Calculate aspect ratio and new dimensions
    const aspectRatio = imageBitmap.width / imageBitmap.height;
    let { width, height } = { width: maxWidth, height: maxHeight };

    if (aspectRatio > 1) {
      // Landscape
      height = width / aspectRatio;
    } else {
      // Portrait or square
      width = height * aspectRatio;
    }

    // Ensure dimensions are valid
    if (width <= 0 || height <= 0) {
      throw new Error("Calculated dimensions are invalid");
    }

    // Center the image
    const x = (maxWidth - width) / 2;
    const y = (maxHeight - height) / 2;

    // Draw and resize with error handling
    try {
      ctx.drawImage(imageBitmap, x, y, width, height);
    } catch (drawError) {
      throw new Error(
        `Failed to draw image: ${
          drawError instanceof Error ? drawError.message : "Unknown error"
        }`
      );
    }

    // Convert to blob with compression
    let blob: Blob;
    try {
      blob = await canvas.convertToBlob({
        type: "image/jpeg",
        quality: 0.8,
      });
    } catch (blobError) {
      throw new Error(
        `Failed to convert canvas to blob: ${
          blobError instanceof Error ? blobError.message : "Unknown error"
        }`
      );
    }

    // Validate blob size
    if (blob.size === 0) {
      throw new Error("Generated blob is empty");
    }

    // Clean up resources
    imageBitmap.close();

    return new File([blob], file.name, { type: "image/jpeg" });
  } catch (error) {
    console.error("Image resize failed:", error);
    // Return original file if resize fails
    return file;
  }
}

async function optimizeImage(file: File): Promise<File> {
  // Additional image optimization
  const resizedFile = await resizeImage(file);

  // If still too large, try more aggressive compression
  if (resizedFile.size > 2 * 1024 * 1024) {
    // 2MB
    return await resizeImage(file, 600, 450);
  }

  return resizedFile;
}

async function getCachedPolicy(env: Env, zip: string): Promise<any> {
  try {
    const cached = await env.POLICIES.get(`policies:${zip}`, { type: "json" });
    if (cached) {
      return cached;
    }

    // If not cached, fetch from backend and cache
    const response = await fetch(`${env.BACKEND_URL}/policies/${zip}`);
    if (response.ok) {
      const policy = await response.json();
      // Cache for 1 hour
      await env.POLICIES.put(`policies:${zip}`, JSON.stringify(policy), {
        expirationTtl: 3600,
      });
      return policy;
    }
  } catch (error) {
    console.error("Policy cache error:", error);
  }

  return null;
}

async function trackAnalytics(
  env: Env,
  eventType: string,
  eventData: any,
  userId?: string
): Promise<void> {
  try {
    const analyticsData = {
      eventType,
      eventData,
      userId,
      timestamp: new Date().toISOString(),
      userAgent: eventData.userAgent,
      ip: eventData.ip,
    };

    // Store in KV with TTL of 30 days
    const key = `analytics:${Date.now()}:${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    await env.ANALYTICS.put(key, JSON.stringify(analyticsData), {
      expirationTtl: 30 * 24 * 3600, // 30 days
    });
  } catch (error) {
    console.error("Analytics tracking error:", error);
  }
}

async function checkRateLimit(
  env: Env,
  identifier: string,
  limit: number = 100,
  window: number = 3600
): Promise<boolean> {
  try {
    const key = `rate_limit:${identifier}`;
    const current = await env.RATE_LIMIT.get(key);

    if (!current) {
      await env.RATE_LIMIT.put(key, "1", { expirationTtl: window });
      return true;
    }

    const count = parseInt(current);
    if (count >= limit) {
      return false;
    }

    await env.RATE_LIMIT.put(key, (count + 1).toString(), {
      expirationTtl: window,
    });
    return true;
  } catch (error) {
    console.error("Rate limit check error:", error);
    return true; // Allow on error
  }
}

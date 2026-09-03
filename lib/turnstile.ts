/**
 * Verifies a Cloudflare Turnstile token.
 * @param token The token received from the client.
 * @returns { success: boolean, error?: string }
 */
export async function verifyTurnstileToken(token?: string | null): Promise<{ success: boolean; error?: string }> {
  if (!token) {
    return { success: false, error: "Missing Turnstile verification token." };
  }

  const secret = process.env.TURNSTILE_SECRET;
  if (!secret) {
    console.warn("TURNSTILE_SECRET is not set. Bypassing check.");
    // For local dev if secret is missing, we might want to bypass or fail.
    // Standard practice is to let it fail or log a strong warning.
    // For safety, we will let it pass if NOT in production, but fail in production.
    if (process.env.NODE_ENV !== "production") {
      return { success: true };
    }
    return { success: false, error: "Server configuration error." };
  }

  try {
    const formData = new FormData();
    formData.append("secret", secret);
    formData.append("response", token);

    const result = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: formData,
    });

    const outcome = await result.json();

    if (outcome.success) {
      return { success: true };
    } else {
      console.warn("Turnstile verification failed:", outcome["error-codes"]);
      return { success: false, error: "Bot verification failed. Please refresh and try again." };
    }
  } catch (error) {
    console.error("Turnstile fetch error:", error);
    return { success: false, error: "Failed to verify session." };
  }
}

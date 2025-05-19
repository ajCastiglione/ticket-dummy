import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { logEvent } from "@/utils/sentry";

export type JWTPayload = Record<string, unknown>;

const secret = new TextEncoder().encode(process.env.AUTH_SECRET);
const cookieName = "auth-token-tds";

// Encrypt and sign JWT token.
export async function signAuthToken(payload: JWTPayload) {
  try {
    const token = await new SignJWT(payload)
      .setProtectedHeader({
        alg: "HS256",
      })
      .setIssuedAt()
      .setExpirationTime("1d")
      .sign(secret);

    return token;
  } catch (error) {
    logEvent("Token signing failed", "auth", { payload }, "error", error);
    throw new Error("Token creation failed");
  }
}

// Decrypt and verify JWT token.
export async function verifyAuthToken<T>(token: string): Promise<T> {
  try {
    const { payload } = await jwtVerify(token, secret);

    return payload as T;
  } catch (error) {
    logEvent(
      "Token verification failed",
      "auth",
      { tokenSnippet: token.slice(0, 10) },
      "error",
      error
    );

    throw new Error("Token verification failed");
  }
}

// Set the authentication cookie.
export async function setAuthToken(token: string) {
  try {
    const cookieStore = await cookies();
    cookieStore.set(cookieName, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24, // 1 day
    });
  } catch (error) {
    logEvent("Failed to set auth cookie", "auth", { token }, "error", error);
  }
}

// Grab the auth token from the cookie.
export async function getAuthToken() {
  const cookieStore = await cookies();
  const token = cookieStore.get(cookieName);

  return token?.value;
}

// Delete the auth token from cookies.
export async function deleteAuthToken() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(cookieName);
  } catch (error) {
    logEvent("Failed to remove token cookie", "auth", {}, "error", error);
  }
}

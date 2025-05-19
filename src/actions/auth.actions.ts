"use server";
import { prisma } from "@/db/prisma";
import bcrypt from "bcryptjs";
import { logEvent } from "@/utils/sentry";
import { signAuthToken, setAuthToken, deleteAuthToken } from "@/lib/auth";

type ResponseResult = {
  success: boolean;
  message: string;
};

// Register new user.
export async function registerNewUser(
  prevState: ResponseResult,
  formData: FormData
): Promise<ResponseResult> {
  try {
    const name = formData.get("name")?.toString();
    const email = formData.get("email")?.toString();
    const password = formData.get("password")?.toString();

    if (!name || !email || !password) {
      logEvent(
        "User signup validation error: missing fields",
        "auth",
        { name, email },
        "warning"
      );

      return {
        success: false,
        message: "All fields are required",
      };
    }

    // Verify if the user already exists.
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      logEvent(
        `User signup failed: ${email} already exists`,
        "auth",
        { email },
        "warning"
      );

      return {
        success: false,
        message: "User already exists",
      };
    }

    // Create new account.
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    // Sign and set auth token.
    const token = await signAuthToken({
      userId: newUser.id,
    });
    await setAuthToken(token);

    logEvent(
      `User registered successfully: ${email}`,
      "auth",
      { userId: newUser.id, email },
      "info"
    );

    return {
      success: true,
      message: "Registration successful",
    };
  } catch (error) {
    logEvent(
      "Unexpected error during registration",
      "auth",
      {},
      "error",
      error
    );
    return {
      success: false,
      message: "Something went wrong, please try again",
    };
  }
}

// Log user out; remove auth token.
export async function logoutUser(): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    await deleteAuthToken();

    logEvent("User logged out", "auth", {}, "info");

    return {
      success: true,
      message: "Logged out successfully",
    };
  } catch (error) {
    logEvent("Error logging out", "auth", {}, "error", error);

    return {
      success: false,
      message: "Logout failed, please try again",
    };
  }
}

// Log user in.
export async function loginUser(
  prevState: ResponseResult,
  formData: FormData
): Promise<ResponseResult> {
  try {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!email || !password) {
      logEvent(
        "Validationo error: missing login fields",
        "auth",
        { email },
        "warning"
      );
      return {
        success: false,
        message: "Both email and password are required",
      };
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.password) {
      logEvent(
        `Login failed, user not found: ${email}`,
        "auth",
        { email },
        "warning"
      );
      return {
        success: false,
        message: "Invalid login credentials",
      };
    }

    const isMatchingPassword = await bcrypt.compare(password, user.password);

    if (!isMatchingPassword) {
      logEvent(
        "Login failed, password was incorrect",
        "auth",
        { email },
        "warning"
      );
      return {
        success: false,
        message: "Invalid login credentials",
      };
    }

    const token = await signAuthToken({
      userId: user.id,
    });
    await setAuthToken(token);

    logEvent(`User logged in: ${email}`, "auth", {
      userId: user.id,
    });

    return {
      success: true,
      message: "Login successful",
    };
  } catch (error) {
    logEvent("Unexpected error during login", "auth", {}, "error", error);
    return {
      success: false,
      message: "Login failed, please try again",
    };
  }
}

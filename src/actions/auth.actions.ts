"use server";
import { prisma } from "@/db/prisma";
import bcrypt from "bcryptjs";
import { logEvent } from "@/utils/sentry";
import { signAuthToken, setAuthToken } from "@/lib/auth";

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

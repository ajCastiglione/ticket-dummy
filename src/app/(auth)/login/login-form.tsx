"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { loginUser } from "@/actions/auth.actions";

const LoginForm = () => {
  const router = useRouter();
  const initialState = {
    success: false,
    message: "",
  };

  const [state, formAction] = useActionState(loginUser, initialState);

  useEffect(() => {
    if (state.success) {
      toast.success("Login Successful");
      router.push("/tickets");
      router.refresh();
    } else if (state.message) {
      toast.error(state.message);
    }
  }, [state, router]);

  return (
    <form action={formAction} className="space-y-4 text-gray-700">
      <input
        className="w-full border border-gray-200 p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
        type="email"
        name="email"
        placeholder="Your Email"
        autoComplete="email"
        required
      />
      <input
        className="w-full border border-gray-200 p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
        type="password"
        name="password"
        placeholder="Password"
        autoComplete="new-password"
        required
      />
      <button
        className="w-full bg-blue-600 text-white p-3 rounded hover:bg-blue-700 transition disabled:opacity-50 cursor-pointer"
        type="submit"
      >
        Login
      </button>
    </form>
  );
};

export default LoginForm;

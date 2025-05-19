"use client";
import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { logoutUser } from "@/actions/auth.actions";
import { toast } from "sonner";

const LogoutBtn = () => {
  const router = useRouter();
  const initState = {
    success: false,
    message: "",
  };

  const [state, formAction] = useActionState(logoutUser, initState);

  useEffect(() => {
    if (state.success) {
      toast.success("Logged out successfully!");
      router.push("/login");
    } else if (state.message) {
      toast.error(state.message);
    }
  }, [state, router]);

  return (
    <form action={formAction}>
      <button
        type="submit"
        className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition cursor-pointer"
      >
        Logout
      </button>
    </form>
  );
};
export default LogoutBtn;

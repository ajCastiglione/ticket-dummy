"use client";

import { useActionState, useEffect } from "react";
import { closeTicket } from "@/actions/ticket.actions";
import { toast } from "sonner";

type CloseTicketBtnProps = {
  ticketId: number;
  isClosed: boolean;
};
export default function CloseTicketBtn({
  ticketId,
  isClosed,
}: CloseTicketBtnProps) {
  const initState = {
    success: false,
    message: "",
  };
  const [state, formAction] = useActionState(closeTicket, initState);

  useEffect(() => {
    if (state.success) {
      toast.success("Ticket has been closed!");
    }
  }, [state]);

  if (isClosed) return null;

  return (
    <form action={formAction}>
      <input type="hidden" name="ticketId" value={ticketId} />
      <button
        type="submit"
        className="bg-red-500 text-white p-3 w-full rounded hover:bg-red-700 transition cursor-pointer"
      >
        Close Ticket
      </button>
    </form>
  );
}

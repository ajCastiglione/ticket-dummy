// Backend file to handle actions for tickets.
"use server";
import { prisma } from "@/db/prisma";
import { revalidatePath } from "next/cache";
import { logEvent } from "@/utils/sentry";
import { getCurrentUser } from "@/lib/current-user";

export async function createTicket(
  prevState: { success: boolean; message: string },
  formData: FormData
): Promise<{ success: boolean; message: string }> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      logEvent("User not found, cannot create ticket", "ticket", {}, "warning");
      return {
        success: false,
        message: "You must be logged in to create a ticket",
      };
    }

    const subject = formData.get("subject") as string;
    const description = formData.get("description") as string;
    const priority = formData.get("priority") as string;

    if (!subject || !description || !priority) {
      logEvent(
        "Validation Error: Missing ticket data fields",
        "ticket",
        { subject, description, priority },
        "warning"
      );
      return {
        success: false,
        message: "All fields are required",
      };
    }

    // Create new ticket.
    const ticket = await prisma.ticket.create({
      data: {
        subject,
        description,
        priority,
        user: {
          connect: {
            id: user.id,
          },
        },
      },
    });

    logEvent(
      `Ticket created successfully: ${ticket.id}`,
      "ticket",
      { ticketId: ticket.id },
      "info"
    );

    revalidatePath("/tickets");

    return { success: true, message: "Ticket created successfully" };
  } catch (error) {
    logEvent(
      "Error occurred while creating ticket",
      "ticket",
      {
        formData: Object.fromEntries(formData.entries()),
      },
      "error",
      error
    );
    return {
      success: false,
      message: "An error occurred while trying to create the ticket",
    };
  }
}

export async function getTickets() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      logEvent("User not found, cannot fetch tickets", "ticket", {}, "warning");
      return [];
    }
    const tickets = await prisma.ticket.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    logEvent(
      "Fetched ticket list",
      "ticket",
      {
        count: tickets.length,
      },
      "info"
    );

    return tickets;
  } catch (error) {
    logEvent("Error fetching tickets", "ticket", {}, "error", error);
    return [];
  }
}

export async function getTicketById(id: string) {
  try {
    const ticket = await prisma.ticket.findUnique({
      where: {
        id: Number(id),
      },
    });

    if (!ticket) {
      logEvent("Ticket not found", "ticket", { ticketId: id }, "warning");
    }

    return ticket;
  } catch (error) {
    logEvent(
      "Error fetching the ticket details",
      "ticket",
      { ticketId: id },
      "error",
      error
    );
    return null;
  }
}

export async function closeTicket(
  prevState: { success: boolean; message: string },
  formData: FormData
): Promise<{ success: boolean; message: string }> {
  try {
    const ticketId = Number(formData.get("ticketId"));

    if (!ticketId) {
      logEvent("Validation error: missing ticket ID", "ticket", {}, "warning");
      return {
        success: false,
        message: "Ticket ID is required",
      };
    }

    const user = await getCurrentUser();
    if (!user) {
      logEvent(
        "Unauthorized action, user not found",
        "ticket",
        { ticketId },
        "warning"
      );
      return {
        success: false,
        message: "Unauthorized action, please log in",
      };
    }

    const ticket = await prisma.ticket.findUnique({
      where: {
        id: ticketId,
      },
    });

    if (!ticket || ticket.userId !== user.id) {
      logEvent(
        "Unauthorized action, cannot close a ticket that is not the users",
        "ticket",
        { ticketId, userId: user.id },
        "warning"
      );
      return {
        success: false,
        message:
          "Unauthorized action, cannot close a ticket that doesn't belong to you",
      };
    }

    await prisma.ticket.update({
      where: {
        id: ticketId,
      },
      data: {
        status: "Closed",
        updatedAt: new Date(),
      },
    });

    revalidatePath("/tickets");
    revalidatePath(`/tickets/${ticketId}`);

    return {
      success: true,
      message: "Ticket closed successfully",
    };
  } catch (error) {
    logEvent("Error closing ticket", "ticket", {}, "error", error);
    return {
      success: false,
      message: "An error occurred while trying to close the ticket",
    };
  }
}

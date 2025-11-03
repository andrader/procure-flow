import { tool } from "ai";
import { z } from "zod";

// Generic details schemas kept flexible to make LLM calls easier
const AnyRecord = z.record(z.any());

export const add_payment_method = tool({
  description: "Add a payment method for checkout (client will persist).",
  inputSchema: z.object({
    method_details: AnyRecord.describe("Payment method details (e.g., type, brand, last4, etc.)"),
  }),
  async execute({ method_details }: { method_details: Record<string, unknown> }) {
    return { success: true as const, action: "add-payment-method" as const, method_details };
  },
});

export const change_payment_method = tool({
  description: "Change the currently selected payment method.",
  inputSchema: z.object({
    method_details: AnyRecord.describe("New payment method details"),
  }),
  async execute({ method_details }: { method_details: Record<string, unknown> }) {
    return { success: true as const, action: "change-payment-method" as const, method_details };
  },
});

export const remove_payment_method = tool({
  description: "Remove the current payment method.",
  inputSchema: z.object({}).describe("No input"),
  async execute() {
    return { success: true as const, action: "remove-payment-method" as const };
  },
});

export const add_shipping_address = tool({
  description: "Add a shipping address for checkout (client will persist).",
  inputSchema: z.object({
    address_details: AnyRecord.describe("Shipping address details (e.g., name, street, city, postal_code, country)")
  }),
  async execute({ address_details }: { address_details: Record<string, unknown> }) {
    return { success: true as const, action: "add-shipping-address" as const, address_details };
  },
});

export const change_shipping_address = tool({
  description: "Change the current shipping address.",
  inputSchema: z.object({
    address_details: AnyRecord.describe("New shipping address details"),
  }),
  async execute({ address_details }: { address_details: Record<string, unknown> }) {
    return { success: true as const, action: "change-shipping-address" as const, address_details };
  },
});

export const remove_shipping_address = tool({
  description: "Remove the current shipping address.",
  inputSchema: z.object({}).describe("No input"),
  async execute() {
    return { success: true as const, action: "remove-shipping-address" as const };
  },
});

export const finalize_purchase = tool({
  description: "Finalize the purchase: the client will display a summary and confirmation UI.",
  inputSchema: z.object({}).describe("No input"),
  async execute() {
    return { success: true as const, action: "finalize-purchase" as const, message: "Please review your order and confirm." };
  },
});

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/integrations/supabase/client.server", () => ({
  supabaseAdmin: { from: vi.fn() } as Record<string, unknown>,
}));

vi.mock("@/server/api/auth-helpers", () => ({
  requireAuthUserId: vi.fn(),
  isDemoRequest: vi.fn(() => false),
}));

vi.mock("@tanstack/react-start", () => ({
  createServerFn: () => ({
    handler: (fn: (...args: Array<unknown>) => unknown) => fn,
  }),
}));

import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireAuthUserId } from "@/server/api/auth-helpers";
import { cancelOrder, uploadPrescription } from "@/server/api/orders";
import { submitContactMessage } from "@/server/api/contact";

const cancelOrderFn = cancelOrder as unknown as (args: { data: string }) => Promise<unknown>;
const submitContactMessageFn = submitContactMessage as unknown as (args: {
  data: { name: string; email: string; subject: string; message: string };
}) => Promise<{ error: string | null }>;
const uploadPrescriptionFn = uploadPrescription as unknown as (args: {
  data: { fileName: string; fileBase64: string };
}) => Promise<{ path: string | null; error: string | null }>;

const mockSupabase = supabaseAdmin as unknown as Record<string, unknown>;
const mockRequireAuthUserId = requireAuthUserId as unknown as ReturnType<typeof vi.fn>;

function createMockChain() {
  const chain: Record<string, unknown> = {};
  chain.select = vi.fn(() => chain);
  chain.eq = vi.fn(() => chain);
  chain.maybeSingle = vi.fn();
  chain.single = vi.fn();
  chain.order = vi.fn(() => chain);
  chain.insert = vi.fn(() => chain);
  chain.update = vi.fn(() => chain);
  return chain;
}

describe("cancelOrder", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("allows owner to cancel a pending order", async () => {
    mockRequireAuthUserId.mockResolvedValue("user-1");

    const chain1 = createMockChain();
    chain1.maybeSingle = vi.fn().mockResolvedValue({
      data: { id: "order-1", user_id: "user-1", status: "pending" },
      error: null,
    });

    const chain2 = createMockChain();
    chain2.eq = vi.fn().mockResolvedValue({
      data: [{ medication_id: "med-1", quantity: 2 }],
      error: null,
    });

    const chain3 = createMockChain();
    chain3.eq = vi.fn().mockResolvedValue({ error: null });

    const chain4 = createMockChain();
    chain4.single = vi.fn().mockResolvedValue({ data: { stock: 10 }, error: null });

    const chain5 = createMockChain();
    chain5.eq = vi.fn().mockResolvedValue({ error: null });

    mockSupabase.from = vi
      .fn()
      .mockReturnValueOnce(chain1)
      .mockReturnValueOnce(chain2)
      .mockReturnValueOnce(chain3)
      .mockReturnValueOnce(chain4)
      .mockReturnValueOnce(chain5);

    const result = await cancelOrderFn({ data: "order-1" });
    expect(result).toBe(true);
    expect(mockSupabase.from).toHaveBeenCalledTimes(5);
  });

  it("throws when the order is not pending", async () => {
    mockRequireAuthUserId.mockResolvedValue("user-1");

    const chain = createMockChain();
    chain.maybeSingle = vi.fn().mockResolvedValue({
      data: { id: "order-1", user_id: "user-1", status: "shipped" },
      error: null,
    });

    mockSupabase.from = vi.fn().mockReturnValue(chain);

    await expect(cancelOrderFn({ data: "order-1" })).rejects.toThrow(
      "Only pending orders can be cancelled",
    );
  });

  it("throws when another user tries to cancel", async () => {
    mockRequireAuthUserId.mockResolvedValue("user-2");

    const chain = createMockChain();
    chain.maybeSingle = vi.fn().mockResolvedValue({
      data: { id: "order-1", user_id: "user-1", status: "pending" },
      error: null,
    });

    mockSupabase.from = vi.fn().mockReturnValue(chain);

    await expect(cancelOrderFn({ data: "order-1" })).rejects.toThrow(
      "You can only cancel your own orders",
    );
  });

  it("throws when order does not exist", async () => {
    mockRequireAuthUserId.mockResolvedValue("user-1");

    const chain = createMockChain();
    chain.maybeSingle = vi.fn().mockResolvedValue({
      data: null,
      error: null,
    });

    mockSupabase.from = vi.fn().mockReturnValue(chain);

    await expect(cancelOrderFn({ data: "order-1" })).rejects.toThrow("Order not found");
  });
});

describe("submitContactMessage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("submits a valid message", async () => {
    const chain = createMockChain();
    chain.insert = vi.fn().mockResolvedValue({ error: null });

    mockSupabase.from = vi.fn().mockReturnValue(chain);

    const result = await submitContactMessageFn({
      data: {
        name: "Alice",
        email: "alice@example.com",
        subject: "Question",
        message: "Hello, I have a question about my order.",
      },
    });
    expect(result).toEqual({ error: null });
  });

  it("rejects a message with empty fields", async () => {
    const result = await submitContactMessageFn({
      data: {
        name: "",
        email: "alice@example.com",
        subject: "Question",
        message: "",
      },
    });
    expect(result).toEqual({ error: "All fields are required" });
  });
});

describe("uploadPrescription", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const jpegBase64 =
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

  it("rejects file exceeding 5 MB", async () => {
    mockRequireAuthUserId.mockResolvedValue("user-1");

    const bigBuffer = Buffer.alloc(6 * 1024 * 1024);
    const bigBase64 = bigBuffer.toString("base64");

    const result = await uploadPrescriptionFn({
      data: { fileName: "test.pdf", fileBase64: bigBase64 },
    });
    expect(result.path).toBeNull();
    expect(result.error).toContain("5 MB");
  });

  it("rejects disallowed file extension", async () => {
    mockRequireAuthUserId.mockResolvedValue("user-1");

    const result = await uploadPrescriptionFn({
      data: { fileName: "malware.exe", fileBase64: jpegBase64 },
    });
    expect(result.path).toBeNull();
    expect(result.error).toContain("JPG, PNG and PDF");
  });

  it("rejects file with wrong magic bytes", async () => {
    mockRequireAuthUserId.mockResolvedValue("user-1");

    const fakePdf = Buffer.from("This is not a PDF but has a .pdf extension");
    const fakeBase64 = fakePdf.toString("base64");

    const result = await uploadPrescriptionFn({
      data: { fileName: "fake.pdf", fileBase64: fakeBase64 },
    });
    expect(result.path).toBeNull();
    expect(result.error).toContain("allowed format");
  });

  it("accepts a valid JPEG file and returns a path", async () => {
    mockRequireAuthUserId.mockResolvedValue("user-1");

    const uploadMock = vi.fn().mockResolvedValue({ data: { path: "user-1/123.jpg" }, error: null });
    (mockSupabase.storage as Record<string, unknown>) = {
      from: vi.fn(() => ({ upload: uploadMock })),
    };

    const result = await uploadPrescriptionFn({
      data: { fileName: "valid.jpg", fileBase64: jpegBase64 },
    });
    expect(result.path).toBeTruthy();
    expect(result.path).toMatch(/^user-1\/\d+\.jpg$/);
    expect(result.error).toBeUndefined();
  });
});

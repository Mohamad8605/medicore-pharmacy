import { describe, it, expect, beforeEach } from "vitest";
import { useCart, type CartMedication } from "@/lib/cart";

function makeMed(overrides?: Partial<CartMedication>): CartMedication {
  return {
    id: "med-1",
    name: "TestMed",
    price: 9.99,
    stock: 10,
    image_url: null,
    requires_prescription: false,
    ...overrides,
  };
}

beforeEach(() => {
  localStorage.clear();
  useCart.setState({ items: [] });
});

describe("useCart", () => {
  it("starts empty", () => {
    expect(useCart.getState().items).toHaveLength(0);
  });

  it("add() inserts an item", () => {
    const med = makeMed();
    useCart.getState().add(med);
    expect(useCart.getState().items).toHaveLength(1);
    expect(useCart.getState().items[0].medication.id).toBe("med-1");
    expect(useCart.getState().items[0].quantity).toBe(1);
  });

  it("add() increments quantity for existing item", () => {
    const med = makeMed();
    useCart.getState().add(med);
    useCart.getState().add(med);
    expect(useCart.getState().items).toHaveLength(1);
    expect(useCart.getState().items[0].quantity).toBe(2);
  });

  it("add() respects stock limit", () => {
    const med = makeMed({ stock: 2 });
    useCart.getState().add(med, 5);
    expect(useCart.getState().items[0].quantity).toBe(2);
  });

  it("remove() removes an item", () => {
    useCart.getState().add(makeMed({ id: "a" }));
    useCart.getState().add(makeMed({ id: "b" }));
    useCart.getState().remove("a");
    expect(useCart.getState().items).toHaveLength(1);
    expect(useCart.getState().items[0].medication.id).toBe("b");
  });

  it("setQuantity() updates quantity within bounds", () => {
    const med = makeMed({ stock: 5 });
    useCart.getState().add(med);
    useCart.getState().setQuantity("med-1", 3);
    expect(useCart.getState().items[0].quantity).toBe(3);
  });

  it("setQuantity() clamps to minimum 1", () => {
    useCart.getState().add(makeMed());
    useCart.getState().setQuantity("med-1", 0);
    expect(useCart.getState().items[0].quantity).toBe(1);
  });

  it("setQuantity() clamps to stock", () => {
    const med = makeMed({ stock: 3 });
    useCart.getState().add(med);
    useCart.getState().setQuantity("med-1", 99);
    expect(useCart.getState().items[0].quantity).toBe(3);
  });

  it("total() sums correctly", () => {
    useCart.getState().add(makeMed({ id: "a", price: 10 }));
    useCart.getState().add(makeMed({ id: "b", price: 5 }));
    useCart.getState().setQuantity("b", 3);
    expect(useCart.getState().total()).toBe(10 + 5 * 3);
  });

  it("count() returns total item quantity", () => {
    useCart.getState().add(makeMed({ id: "a" }));
    useCart.getState().add(makeMed({ id: "b" }));
    useCart.getState().setQuantity("b", 4);
    expect(useCart.getState().count()).toBe(1 + 4);
  });

  it("needsPrescription() returns false when no Rx item", () => {
    useCart.getState().add(makeMed());
    expect(useCart.getState().needsPrescription()).toBe(false);
  });

  it("needsPrescription() returns true when Rx item exists", () => {
    useCart.getState().add(makeMed({ requires_prescription: true }));
    expect(useCart.getState().needsPrescription()).toBe(true);
  });

  it("clear() empties the cart", () => {
    useCart.getState().add(makeMed());
    useCart.getState().add(makeMed({ id: "b" }));
    useCart.getState().clear();
    expect(useCart.getState().items).toHaveLength(0);
  });

  it("revalidateStock() removes items whose stock dropped to zero", () => {
    useCart.getState().add(makeMed({ id: "a" }));
    useCart.getState().add(makeMed({ id: "b" }));
    useCart.getState().revalidateStock({ a: 0, b: 5 });
    expect(useCart.getState().items).toHaveLength(1);
    expect(useCart.getState().items[0].medication.id).toBe("b");
  });

  it("revalidateStock() clamps quantity when stock drops below current qty", () => {
    useCart.getState().add(makeMed({ id: "a", stock: 10 }), 8);
    useCart.getState().revalidateStock({ a: 3 });
    expect(useCart.getState().items[0].quantity).toBe(3);
  });

  it("revalidateStock() updates stock number even if quantity is fine", () => {
    useCart.getState().add(makeMed({ id: "a", stock: 10 }), 2);
    useCart.getState().revalidateStock({ a: 7 });
    expect(useCart.getState().items[0].medication.stock).toBe(7);
    expect(useCart.getState().items[0].quantity).toBe(2);
  });

  it("revalidateStock() does nothing when stock is unchanged", () => {
    useCart.getState().add(makeMed({ id: "a", stock: 5 }));
    useCart.getState().revalidateStock({ a: 5 });
    expect(useCart.getState().items).toHaveLength(1);
    expect(useCart.getState().items[0].quantity).toBe(1);
  });

  it("persists items to localStorage under the correct key", () => {
    useCart
      .getState()
      .add(makeMed({ id: "persist-test", name: "PersistMed", price: 4.99, stock: 3 }));
    const saved = JSON.parse(localStorage.getItem("mohamads-medicore-cart") || "{}");
    expect(saved.state.items).toHaveLength(1);
    expect(saved.state.items[0].medication.name).toBe("PersistMed");
    expect(saved.state.items[0].medication.price).toBe(4.99);
  });

  it("remove() on a non-existent ID does nothing", () => {
    useCart.getState().add(makeMed());
    useCart.getState().remove("non-existent");
    expect(useCart.getState().items).toHaveLength(1);
  });

  it("setQuantity() on a non-existent ID does nothing", () => {
    useCart.getState().add(makeMed());
    useCart.getState().setQuantity("non-existent", 5);
    expect(useCart.getState().items).toHaveLength(1);
    expect(useCart.getState().items[0].quantity).toBe(1);
  });
});

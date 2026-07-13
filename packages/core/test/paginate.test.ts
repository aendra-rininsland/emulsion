import { describe, it, expect } from "vitest";
import { paginate } from "../src/grain/paginate.js";

function items(n: number) {
  return Array.from({ length: n }, (_, i) => ({ rkey: `item-${i}` }));
}

describe("paginate", () => {
  it("returns the first page and a cursor to the next one", () => {
    const { items: page, cursor } = paginate(items(5), { limit: 2 });
    expect(page.map((i) => i.rkey)).toEqual(["item-0", "item-1"]);
    expect(cursor).toBe("item-1");
  });

  it("continues from a cursor", () => {
    const { items: page, cursor } = paginate(items(5), { limit: 2, cursor: "item-1" });
    expect(page.map((i) => i.rkey)).toEqual(["item-2", "item-3"]);
    expect(cursor).toBe("item-3");
  });

  it("returns no cursor once the last page is reached", () => {
    const { items: page, cursor } = paginate(items(5), { limit: 2, cursor: "item-3" });
    expect(page.map((i) => i.rkey)).toEqual(["item-4"]);
    expect(cursor).toBeUndefined();
  });

  it("returns everything with no cursor when the full list fits in one page", () => {
    const { items: page, cursor } = paginate(items(3), { limit: 10 });
    expect(page).toHaveLength(3);
    expect(cursor).toBeUndefined();
  });

  it("returns an empty page for an unknown/stale cursor", () => {
    const { items: page, cursor } = paginate(items(5), { limit: 2, cursor: "does-not-exist" });
    expect(page).toEqual([]);
    expect(cursor).toBeUndefined();
  });

  it("defaults to a reasonable limit when none is given", () => {
    const { items: page } = paginate(items(100), {});
    expect(page.length).toBeLessThan(100);
    expect(page.length).toBeGreaterThan(0);
  });
});

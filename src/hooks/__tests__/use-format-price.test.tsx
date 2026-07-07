import { describe, it, expect, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useFormatPrice } from "@/hooks/use-format-price";
import { LanguageProvider } from "@/lib/LanguageContext";

function render(lang?: "de" | "en") {
  if (lang === "de") {
    localStorage.setItem("apotheke-lang", "de");
  }
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <LanguageProvider>{children}</LanguageProvider>
  );
  return renderHook(() => useFormatPrice(), { wrapper });
}

describe("useFormatPrice", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("formats a price in EUR with two decimals", () => {
    const { result } = render();
    const formatted = result.current(3.5);
    expect(formatted).toMatch(/€\s*3\.50/);
  });

  it("formats zero correctly", () => {
    const { result } = render();
    const formatted = result.current(0);
    expect(formatted).toMatch(/€\s*0\.00/);
  });

  it("formats large values with thousands separator in English locale", () => {
    const { result } = render();
    const formatted = result.current(1234567.89);
    expect(formatted).toContain("€");
    expect(formatted).toContain("1,234,567");
  });

  it("formats in German locale when language is de", () => {
    const { result } = render("de");
    const formatted = result.current(1.5);
    expect(formatted).toMatch(/1[,.]50\s*€/);
  });

  it("uses comma as decimal separator for German locale", () => {
    const { result } = render("de");
    const formatted = result.current(1.5);
    expect(formatted).toMatch(/1[,.]50\s*€/);
    expect(formatted).toContain(",");
  });

  it("formats negative values correctly", () => {
    const { result } = render();
    const formatted = result.current(-1.5);
    expect(formatted).toMatch(/-€\s*1\.50/);
  });
});

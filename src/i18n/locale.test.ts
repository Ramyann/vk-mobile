import { isAppLocale, languageName, navLabels } from "./locale";

describe("locale configuration", () => {
  it("accepts only supported locale codes", () => {
    expect(isAppLocale("en")).toBe(true);
    expect(isAppLocale("ar")).toBe(true);
    expect(isAppLocale("ckb")).toBe(true);
    expect(isAppLocale("fr")).toBe(false);
  });

  it("has navigation labels for every supported locale", () => {
    expect(languageName("ckb")).toBe("کوردی");
    expect(navLabels.ar.discover).toBe("اكتشف");
  });
});

import { hasProhibitedInput } from "./input-safety";

describe("hasProhibitedInput", () => {
  it.each([
    "Send me porn.",
    "أريد الجنس",
    "پۆرنم پێشان بدە",
    "You people are animals.",
    "I will kill you.",
    "My email is visitor@example.com.",
    "Call me at +964 750 123 4567.",
    "Where can I buy cocaine?",
    "I want to support ISIS.",
  ])("blocks prohibited free text: %s", (text) => {
    expect(hasProhibitedInput(text)).toBe(true);
  });

  it.each([
    "What events are happening in Erbil?",
    "What is the visa price for my nationality?",
    "ما هي الجنسية المطلوبة للحصول على التأشيرة؟",
    "هل لديكم رحلات إلى المكسيك؟",
    "Is cannabis legal for visitors to bring into Kurdistan?",
  ])("allows normal travel questions: %s", (text) => {
    expect(hasProhibitedInput(text)).toBe(false);
  });
});

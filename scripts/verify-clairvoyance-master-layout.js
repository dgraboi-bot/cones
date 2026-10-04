const { chromium } = require("playwright");

const baseUrl = process.argv[2] || "http://localhost/telepathyexperiment/cones/telepathybeginner.html";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 412, height: 915 },
    isMobile: true,
    hasTouch: true,
    userAgent: "Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 Chrome/130.0.0.0 Mobile Safari/537.36"
  });

  try {
    await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
    const layout = await page.evaluate(() => {
      const view = document.querySelector("[data-view=clairvoyance-viewing]");
      const card = document.querySelector("[data-role-card=remote-viewer]");
      const title = card.querySelector(".role-card-title");
      const header = card.querySelector(".role-card-header");
      const tagline = card.querySelector(".role-card-tagline");
      const exercise = card.querySelector(".role-card-level-stack");
      view.classList.remove("beginner-view-hidden");
      card.hidden = false;
      card.classList.remove("active");

      const box = (node) => {
        const rect = node.getBoundingClientRect();
        return {
          left: Math.round(rect.left),
          right: Math.round(rect.right),
          top: Math.round(rect.top),
          bottom: Math.round(rect.bottom),
          height: Math.round(rect.height)
        };
      };
      const mode = card.querySelector(".role-card-remote-view-badge");
      const back = card.querySelector(".role-card-inline-back");
      return {
        header: box(header),
        title: box(title),
        tagline: box(tagline),
        exercise: box(exercise),
        gridAreas: getComputedStyle(header).gridTemplateAreas,
        modeDisplay: getComputedStyle(mode).display,
        backDisplay: getComputedStyle(back).display
      };
    });

    assert(layout.header.height <= 108, `Collapsed Android Clairvoyance master card is too tall: ${layout.header.height}px.`);
    assert(layout.exercise.top >= layout.title.top - 4 && layout.exercise.bottom <= layout.title.bottom + 8, "Exercise is not aligned with the collapsed card title.");
    assert(layout.gridAreas.includes("title level"), "Collapsed Android Clairvoyance master card is not using its compact two-row grid.");
    assert(layout.modeDisplay === "none" && layout.backDisplay === "none", "Hidden master-card controls still consume mobile layout space.");
    await page.locator('[data-role-card="remote-viewer"] .role-card-toggle').tap();
    assert(await page.locator('[data-role-card="remote-viewer"]').evaluate((card) => card.classList.contains("active")), "A touch tap on the Clairvoyance master card did not expand it.");
    console.log("Collapsed Android Clairvoyance master layout verified.");
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error.stack || error);
  process.exit(1);
});

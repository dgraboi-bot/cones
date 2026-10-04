const { chromium } = require("playwright");

const baseUrl = process.argv[2] || "http://localhost/telepathyexperiment/cones/telepathybeginner.html";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });

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
      card.classList.add("active");
      title.textContent = "Clairvoyance\nRemote View";

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
      return {
        header: box(header),
        title: box(title),
        tagline: box(tagline),
        exercise: box(exercise),
        gridAreas: getComputedStyle(header).gridTemplateAreas
      };
    });

    assert(layout.header.height <= 72, `Expanded Clairvoyance header is too tall: ${layout.header.height}px.`);
    assert(layout.title.right <= layout.tagline.left, "Clairvoyance title overlaps the skill banner.");
    assert(layout.exercise.top >= layout.title.top + 18, "Exercise is not aligned with the Remote View line.");
    assert(layout.gridAreas.includes("title tagline mode level back"), "Expanded Clairvoyance header grid is not compact.");
    console.log("Clairvoyance master layout verified.");
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error.stack || error);
  process.exit(1);
});

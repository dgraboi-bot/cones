const { chromium } = require("playwright");

const baseUrl = process.argv[2] || "http://localhost/telepathyexperiment/cones/telepathybeginner.html";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function verify() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.setDefaultTimeout(10000);

  try {
    await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
    await page.locator('[data-open-performance-visualization-guide]').evaluate((button) => button.click());

    const guide = page.locator('[data-view="performance-visualization-guide"]');
    await guide.waitFor({ state: "visible" });
    const renderedText = (await guide.innerText()).replace(/\s+/g, " ").trim();
    assert(renderedText.includes("how different exercises contribute to the result."), "The guide must refer to exercises, not task levels.");
    assert(renderedText.includes("demo.exercise1.promising"), "The guide must use the Exercise demo identifier.");
    assert(renderedText.includes("In the Exercise 1 practice trials"), "The guide must refer to Exercise 1.");
    assert(!/\blevel\b/i.test(renderedText), `The rendered guide still contains Level terminology: ${renderedText}`);

    console.log("Performance visualization guide Exercise terminology verified.");
  } finally {
    await browser.close();
  }
}

verify().catch((error) => {
  console.error(error.stack || error.message || String(error));
  process.exitCode = 1;
});

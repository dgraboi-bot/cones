const { chromium } = require("playwright");

const baseUrl = process.argv[2] || "http://localhost/telepathyexperiment/cones/telepathybeginner.html?open=report-definition";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });

  try {
    await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
    const options = page.locator("[data-report-pair-options]");
    await options.waitFor({ state: "attached" });
    const dimensions = await options.evaluate((container) => {
      container.closest("[data-report-pair-menu]").hidden = false;
      container.innerHTML = "";
      const option = document.createElement("button");
      option.type = "button";
      option.className = "report-pair-option";
      option.innerHTML = [
        '<span class="report-pair-option-value">A deliberately long Receiver and Sender report name that must remain fully available in this selectable report-list row</span>',
        '<span class="report-pair-option-value">24 trials</span>'
      ].join("");
      container.appendChild(option);
      const before = container.scrollLeft;
      container.scrollLeft = container.scrollWidth;
      return {
        clientWidth: container.clientWidth,
        scrollWidth: container.scrollWidth,
        before,
        after: container.scrollLeft
      };
    });

    console.log(`Report selector dimensions: ${JSON.stringify(dimensions)}`);
    assert(dimensions.scrollWidth > dimensions.clientWidth, "Long report names do not make the report list horizontally scrollable.");
    assert(dimensions.after > dimensions.before, "The report list did not respond to a horizontal scroll.");
    console.log("Performance Report selector horizontal scrolling verified.");
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error.stack || error);
  process.exit(1);
});

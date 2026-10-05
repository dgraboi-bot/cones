const { chromium } = require("playwright");

const baseUrl = process.argv[2] || "http://localhost/telepathyexperiment/cones/telepathybeginner.html";
const launcherStorageKey = "cones-beginner-launcher-v2";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function verify() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  page.setDefaultTimeout(10000);

  try {
    await page.goto(`${baseUrl}?open=visitor-launcher`, { waitUntil: "domcontentloaded" });
    await page.evaluate((key) => {
      localStorage.clear();
      sessionStorage.clear();
      localStorage.setItem(key, JSON.stringify({ entryMode: "visitor", remoteViewerSimulationMode: "covered-screen" }));
    }, launcherStorageKey);
    await page.reload({ waitUntil: "domcontentloaded" });

    await page.locator('[data-open-aids]').evaluate((button) => button.click());
    await page.locator('[data-view="learning-center"]').waitFor({ state: "visible" });
    await page.locator('[data-learning-center-tab="start-here"]').evaluate((button) => button.click());

    const quickLink = page.locator('[data-learning-center-action="guided-remote-view-tour"]');
    const quickLinkText = await quickLink.evaluate((button) =>
      Array.from(button.querySelectorAll("span")).map((line) => line.textContent.trim()).join(" ")
    );
    assert(quickLinkText === "Guided Remote View Tour", `Guided Remote View Tour link wording is incorrect: ${JSON.stringify(quickLinkText)}`);
    await quickLink.evaluate((button) => button.click());

    const prompt = page.locator('[data-guided-tour-overlay]');
    const balloon = prompt.locator('[data-guided-tour-balloon]');
    await prompt.waitFor({ state: "visible" });
    assert(
      (await prompt.locator('[data-guided-tour-copy]').textContent()).trim() === "Clairvoyance / Remote View Tour. Press GO.",
      "The Guided Remote View Tour prompt is missing or has incorrect wording."
    );
    const display = await balloon.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      return {
        pointerEvents: getComputedStyle(element).pointerEvents,
        visible: !!(rect.width && rect.height),
        centerX: rect.left + (rect.width / 2),
        centerY: rect.top + (rect.height / 2),
        viewportX: window.innerWidth / 2,
        viewportY: window.innerHeight / 2
      };
    });
    assert(display.visible, "The Guided Remote View Tour prompt is not visibly rendered.");
    assert(display.pointerEvents === "none", "The guide panel must not block the GO button.");
    assert(Math.abs(display.centerX - display.viewportX) < 2, "The guide panel is not centered horizontally.");
    assert(Math.abs(display.centerY - display.viewportY) < 2, "The guide panel is not centered vertically.");

    const goButton = page.locator('[data-remote-viewer-go]');
    await goButton.waitFor({ state: "visible" });
    await goButton.click();
    await page.locator('[data-covered-screen-instruction-overlay]').waitFor({ state: "visible" });
    assert(await prompt.isHidden(), "The guide panel must clear when GO is pressed.");

    console.log("Guided Remote View Tour launch verified.");
  } finally {
    await browser.close();
  }
}

verify().catch((error) => {
  console.error(error.stack || error.message || String(error));
  process.exitCode = 1;
});

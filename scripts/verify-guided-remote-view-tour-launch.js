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
  const context = await browser.newContext({ viewport: { width: 1024, height: 768 } });
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

    await page.locator('[data-temporary-home-open-fresh]').click();
    await page.locator('[data-view="launcher"]').waitFor({ state: "visible" });
    await page.locator('[data-open-options]').click();
    await page.locator('[data-view="options"]').waitFor({ state: "visible" });
    await page.locator('[data-open-aids]').click();
    await page.locator('[data-view="learning-center"]').waitFor({ state: "visible" });
    await page.locator('[data-learning-center-tab="start-here"]').click();

    const quickLink = page.locator('[data-learning-center-action="guided-remote-view-tour"]');
    const quickLinkText = await quickLink.evaluate((button) =>
      Array.from(button.querySelectorAll("span")).map((line) => line.textContent.trim()).join(" ")
    );
    assert(quickLinkText === "Guided Remote View Tour", `Guided Remote View Tour link wording is incorrect: ${JSON.stringify(quickLinkText)}`);
    await quickLink.click();

    const prompt = page.locator('[data-guided-tour-overlay]');
    const balloon = prompt.locator('[data-guided-tour-balloon]');
    await prompt.waitFor({ state: "visible" });
    assert(
      (await prompt.locator('[data-guided-tour-copy]').textContent()).trim() ===
        "Clairvoyance / Remote View Tour. Press GO.\n\nDuring this tour, you may move this box around as needed.",
      "The Guided Remote View Tour prompt is missing or has incorrect wording."
    );
    const display = await balloon.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      return {
        pointerEvents: getComputedStyle(element).pointerEvents,
        cursor: getComputedStyle(element).cursor,
        visible: !!(rect.width && rect.height),
        centerX: rect.left + (rect.width / 2),
        centerY: rect.top + (rect.height / 2),
        viewportX: window.innerWidth / 2,
        viewportY: window.innerHeight / 2
      };
    });
    assert(display.visible, "The Guided Remote View Tour prompt is not visibly rendered.");
    assert(display.pointerEvents === "auto", "The guide panel must accept dragging and its Exit Tour control.");
    assert(display.cursor === "move", "The guide panel must show a move cursor.");
    assert(Math.abs(display.centerX - display.viewportX) < 2, "The guide panel is not centered horizontally.");
    assert(Math.abs(display.centerY - display.viewportY) < 2, "The guide panel is not centered vertically.");
    assert(await balloon.locator('[data-guided-tour-exit]').isVisible(), "The guide panel must offer Exit Tour.");
    assert((await balloon.locator('[data-guided-tour-exit]').getAttribute("title")) === "Exit Tour", "Exit Tour must have its tooltip.");
    assert(await balloon.locator('[data-guided-tour-next]').isHidden(), "The opening Remote View guide must not show NEXT.");

    const cardBounds = await page.locator('[data-role-card="remote-viewer"]').evaluate((card) => {
      const rect = card.getBoundingClientRect();
      return { top: rect.top, bottom: rect.bottom, viewportHeight: window.innerHeight };
    });
    assert(cardBounds.top >= 0 && cardBounds.bottom <= cardBounds.viewportHeight, `The expanded Clairvoyance panel was not scrolled fully into view: ${JSON.stringify(cardBounds)}`);

    const beforeDrag = await balloon.boundingBox();
    assert(beforeDrag, "The opening guide panel has no draggable bounds.");
    await page.mouse.move(beforeDrag.x + 24, beforeDrag.y + 28);
    await page.mouse.down();
    await page.mouse.move(beforeDrag.x + 100, beforeDrag.y + 84, { steps: 4 });
    await page.mouse.up();
    const afterDrag = await balloon.boundingBox();
    assert(afterDrag && afterDrag.x > beforeDrag.x + 40 && afterDrag.y > beforeDrag.y + 30, "The opening guide panel did not move when dragged.");

    page.once("dialog", (dialog) => dialog.accept());
    await balloon.locator('[data-guided-tour-exit]').click();
    await page.locator('[data-view="learning-center"]').waitFor({ state: "visible" });
    assert(
      await page.locator('[data-learning-center-tab="start-here"]').getAttribute("aria-selected") === "true",
      "Exit Tour must return the user to Learning Center Quick Links."
    );
    await quickLink.click();
    await prompt.waitFor({ state: "visible" });

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

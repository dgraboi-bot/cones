const { chromium } = require("playwright");

const baseUrl = process.argv[2] || "http://localhost/telepathyexperiment/cones/telepathybeginner.html";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function verify() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  page.setDefaultTimeout(10000);

  try {
    await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
    await page.locator('[data-view="research-interest-form"]').evaluate((view) => {
      view.classList.remove("beginner-view-hidden");
    });

    const form = page.locator('[data-research-interest-form]');
    const contactGrid = form.locator('.baseline-trial-summary-grid').first();
    const fields = contactGrid.locator('.settings-view-field');
    assert(await fields.count() === 4, "The experiment-interest contact area must contain exactly four fields.");
    assert(
      await page.locator('[data-research-interest-unique-name]').count() === 0,
      "The ESP GYM Unique Name field must not be visible in the experiment-interest form."
    );

    const labels = await fields.locator('.settings-view-label').allTextContents();
    assert(
      JSON.stringify(labels.map((label) => label.trim())) === JSON.stringify(["Name:", "Email:", "Address zip code:", "Age:"]),
      `Unexpected experiment-interest contact labels: ${JSON.stringify(labels)}`
    );

    const positions = await fields.evaluateAll((nodes) => nodes.map((node) => {
      const rect = node.getBoundingClientRect();
      return { left: Math.round(rect.left), top: Math.round(rect.top) };
    }));
    assert(
      positions[0].top === positions[1].top && positions[2].top === positions[3].top && positions[2].top > positions[0].top,
      `The fields must occupy two rows: ${JSON.stringify(positions)}`
    );
    assert(
      positions[0].left < positions[1].left && positions[2].left < positions[3].left,
      `The fields must occupy two columns: ${JSON.stringify(positions)}`
    );

    await page.locator('[data-view="research-proposal"]').evaluate((view) => {
      view.classList.remove("beginner-view-hidden");
    });
    const contactFormLink = page.locator('[data-open-research-proposal-contact]');
    assert(await contactFormLink.textContent() === "contact form", "Research Proposal contact form link wording is incorrect.");
    await contactFormLink.click();
    await page.locator('[data-view="contact"]').waitFor({ state: "visible" });
    assert(await page.locator('[data-view="research-proposal"]').isHidden(), "Research Proposal must hide while Contact ESP is open.");
    await page.locator('[data-close-contact]').click();
    assert(await page.locator('[data-view="research-proposal"]').isVisible(), "Contact ESP BACK must return to Research Proposal.");

    console.log("Research interest form layout and Research Proposal contact link verified.");
  } finally {
    await browser.close();
  }
}

verify().catch((error) => {
  console.error(error.stack || error.message || String(error));
  process.exitCode = 1;
});

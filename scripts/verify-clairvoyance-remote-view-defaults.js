const { chromium } = require("playwright");

const baseUrl = process.argv[2] || "http://localhost/telepathyexperiment/cones/telepathybeginner.html";
const launcherStorageKey = "cones-beginner-launcher-v2";

function assertEqual(actual, expected, label) {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}`);
  }
}

async function setLauncherState(page, state) {
  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
  await page.locator('[data-role-card="remote-viewer"] .role-card-toggle').waitFor({ state: "attached" });
  await page.evaluate(({ key, value }) => {
    localStorage.clear();
    localStorage.setItem(key, JSON.stringify(value));
  }, { key: launcherStorageKey, value: state });
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.locator('[data-role-card="remote-viewer"] .role-card-toggle').waitFor({ state: "attached" });
  await page.locator('[data-view="clairvoyance-viewing"]').evaluate((view) => view.classList.remove("beginner-view-hidden"));
  await page.locator('[data-role-card="remote-viewer"] .role-card-toggle').evaluate((button) => button.click());
  await page.locator('[data-role-card="remote-viewer"]').evaluate((card) => {
    if (!card.classList.contains("active")) {
      throw new Error("The Clairvoyance Remote View card did not expand.");
    }
  });
}

async function verify() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.setDefaultTimeout(8000);
  page.setDefaultNavigationTimeout(8000);
  page.on("pageerror", (error) => {
    throw error;
  });

  try {
    await setLauncherState(page, {
      entryMode: "visitor",
      remoteViewerSimulationMode: "covered-screen"
    });
    assertEqual(await page.locator('[data-remote-viewer-own]').inputValue(), "Anonymous Visitor", "anonymous covered-screen You");
    assertEqual(await page.locator('[data-remote-viewer-experience="tour"]').isChecked(), true, "anonymous covered-screen tour default");

    const qualifiedState = {
      recognizedIdentity: "graboi",
      remoteViewerSimulationMode: "remote-device",
      remoteViewerDisplayDevice: false,
      identifierStatusMap: {
        graboi: {
          formal_identity_exists: true,
          preferred_identifier: "graboi"
        }
      }
    };
    await page.route("**/api.php", async (route) => {
      let request = {};
      try {
        request = JSON.parse(route.request().postData() || "{}");
      } catch (_) {
        // Let malformed or unrelated requests follow their normal path.
      }
      if (request.action === "get_remote_display_devices_for_owner") {
        await route.fulfill({
          contentType: "application/json",
          body: JSON.stringify({
            ok: true,
            remote_display_devices: [{ device_name: "my remote", owner_identifier: "graboi" }]
          })
        });
        return;
      }
      await route.continue();
    });
    await setLauncherState(page, qualifiedState);
    assertEqual(await page.locator('[data-remote-viewer-own]').inputValue(), "graboi", "remote-screen You");
    await page.waitForFunction(() => (
      document.querySelector('[data-remote-viewer-partner]')?.value === "my remote"
    ));
    assertEqual(await page.locator('[data-remote-viewer-partner]').inputValue(), "my remote", "remote-screen discovered device");
    assertEqual(await page.locator('[data-remote-viewer-display-device]').isChecked(), false, "remote-screen display checkbox default");

    await page.locator('[data-remote-viewer-display-device]').evaluate((input) => {
      input.checked = true;
      input.dispatchEvent(new Event("change", { bubbles: true }));
    });
    assertEqual(await page.locator('[data-remote-viewer-own-label]').textContent(), "This Device", "display-device own label");
    assertEqual(await page.locator('[data-remote-viewer-partner-label]').textContent(), "Remote Viewer", "display-device partner label");
    assertEqual(await page.locator('[data-remote-viewer-own]').inputValue(), "graboi", "display-device default name");
    assertEqual(await page.locator('[data-remote-viewer-partner]').inputValue(), "graboi", "display-device remote viewer");
    assertEqual(await page.locator('[data-remote-viewer-partner]').evaluate((input) => input.readOnly), true, "display-device remote viewer read-only");

    await page.locator('[data-remote-viewer-display-device]').evaluate((input) => {
      input.checked = false;
      input.dispatchEvent(new Event("change", { bubbles: true }));
    });
    assertEqual(await page.locator('[data-remote-viewer-own-label]').textContent(), "You", "restored own label");
    assertEqual(await page.locator('[data-remote-viewer-partner-label]').textContent(), "Remote Screen", "restored partner label");
    assertEqual(await page.locator('[data-remote-viewer-own]').inputValue(), "graboi", "restored You");

    console.log("Clairvoyance Remote View defaults verified.");
  } finally {
    await browser.close();
  }
}

verify().catch((error) => {
  console.error(error.stack || error.message || String(error));
  process.exitCode = 1;
});

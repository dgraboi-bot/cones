const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');

(async () => {
  const css = await fs.readFile(path.join(__dirname, '..', 'telepathybeginner.css'), 'utf8');
  const browser = await chromium.launch({ headless: true });
  try {
    for (const width of [320, 390, 1280]) {
      const page = await browser.newPage({ viewport: { width, height: 844 } });
      await page.setContent(`<style>${css}</style>
        <div style="width:calc(100% - 64px);max-width:800px;margin:32px auto">
          <div class="report-pair-picker"><button class="report-pair-trigger">Select report</button>
            <div class="report-pair-menu"><div class="report-pair-menu-header"><span>Report</span><span>Trials</span></div>
              <div class="report-pair-menu-options" data-report-pair-options></div>
            </div>
          </div>
        </div>`);
      const measurements = await page.locator('[data-report-pair-options]').evaluate(container => {
        const labels = ['Android - Iphone (Telepathy) Exercise 2 data', 'Short report',
          'Demo Level 1 Telepathy Exercise 1', 'A deliberately much longer Receiver - Sender report name Exercise 4'];
        for (const [index, label] of labels.entries()) {
          const button = document.createElement('button');
          button.className = 'report-pair-option';
          const name = document.createElement('span');
          name.className = 'report-pair-option-value';
          name.textContent = label;
          const count = name.cloneNode();
          count.textContent = ['8 trials', '1 trial', '24 trials', '1000 trials'][index];
          button.append(name, count);
          container.append(button);
        }
        container.scrollLeft = container.scrollWidth;
        return {
          rightEdges: [...container.querySelectorAll('.report-pair-option-value:last-child')].map(node => node.getBoundingClientRect().right),
          scrollLeft: container.scrollLeft,
          scrollWidth: container.scrollWidth,
          clientWidth: container.clientWidth
        };
      });
      assert.ok(Math.max(...measurements.rightEdges) - Math.min(...measurements.rightEdges) < 1,
        `${width}px: trial counts must share one right edge: ${JSON.stringify(measurements)}`);
      if (width < 600) {
        assert.ok(measurements.scrollWidth > measurements.clientWidth && measurements.scrollLeft > 0,
          'Long report names must remain horizontally scrollable on phones');
      }
      await page.close();
      console.log(`PASS ${width}px: Trials aligned; long names remain scrollable`);
    }
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });

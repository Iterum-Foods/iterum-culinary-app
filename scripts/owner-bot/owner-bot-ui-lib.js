/**
 * Shared UI audit helpers for Owner Bot entry / polish runs.
 */
const fs = require('fs');
const path = require('path');

/**
 * Collect console errors and failed network requests during a step.
 */
function createUiCollector(page) {
  const consoleErrors = [];
  const pageErrors = [];
  const failedRequests = [];

  const onConsole = msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text().slice(0, 300));
    }
  };
  const onPageError = err => {
    pageErrors.push(String(err.message || err).slice(0, 300));
  };
  const onRequestFailed = req => {
    const url = req.url();
    if (/favicon|analytics|google|gstatic|fonts\.googleapis/i.test(url)) return;
    failedRequests.push({
      url: url.slice(0, 200),
      failure: req.failure()?.errorText || 'failed'
    });
  };

  page.on('console', onConsole);
  page.on('pageerror', onPageError);
  page.on('requestfailed', onRequestFailed);

  return {
    drain() {
      page.off('console', onConsole);
      page.off('pageerror', onPageError);
      page.off('requestfailed', onRequestFailed);
      return {
        consoleErrors: [...new Set(consoleErrors)],
        pageErrors: [...new Set(pageErrors)],
        failedRequests
      };
    }
  };
}

/**
 * In-page DOM / layout checks (no auth required).
 */
async function runDomUiAudit(page) {
  return page.evaluate(() => {
    const issues = [];
    const notes = [];

    const docW = document.documentElement.scrollWidth;
    const viewW = document.documentElement.clientWidth;
    if (docW > viewW + 8) {
      issues.push({
        severity: 'MAJOR',
        code: 'horizontal_overflow',
        message: `Page is ${docW - viewW}px wider than viewport (${viewW}px)`
      });
    }

    const brokenImages = [];
    document.querySelectorAll('img').forEach(img => {
      if (!img.getAttribute('src')) return;
      if (img.complete && img.naturalWidth === 0) {
        brokenImages.push(img.getAttribute('src') || '(no src)');
      }
    });
    if (brokenImages.length) {
      issues.push({
        severity: 'MINOR',
        code: 'broken_images',
        message: `${brokenImages.length} broken image(s): ${brokenImages.slice(0, 3).join(', ')}`
      });
    }

    const emptyCtas = [];
    document.querySelectorAll('button, a.btn, .btn').forEach(el => {
      const text = (el.textContent || '').replace(/\s+/g, ' ').trim();
      const aria = (el.getAttribute('aria-label') || '').trim();
      if (!text && !aria && el.offsetParent !== null) {
        emptyCtas.push(el.tagName + (el.id ? '#' + el.id : ''));
      }
    });
    if (emptyCtas.length) {
      issues.push({
        severity: 'MINOR',
        code: 'empty_cta',
        message: `${emptyCtas.length} visible button/link with no label`
      });
    }

    const inputsMissingLabel = [];
    document.querySelectorAll('input, select, textarea').forEach(input => {
      if (input.type === 'hidden' || input.offsetParent === null) return;
      const id = input.id;
      const labelled =
        (id && document.querySelector(`label[for="${CSS.escape(id)}"]`)) ||
        input.getAttribute('aria-label') ||
        input.getAttribute('aria-labelledby');
      if (!labelled) {
        inputsMissingLabel.push(id || input.name || input.type);
      }
    });
    if (inputsMissingLabel.length) {
      notes.push(
        `${inputsMissingLabel.length} visible field(s) without label/aria — ${inputsMissingLabel.slice(0, 4).join(', ')}`
      );
    }

    const tinyTapTargets = [];
    document.querySelectorAll('button, a').forEach(el => {
      if (el.offsetParent === null) return;
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0 && (r.width < 40 || r.height < 32)) {
        const t = (el.textContent || '').trim().slice(0, 24);
        if (t) tinyTapTargets.push(t);
      }
    });
    if (tinyTapTargets.length > 3) {
      notes.push(
        `${tinyTapTargets.length} small tap targets (<40×32px) — may hurt mobile UX`
      );
    }

    return {
      title: document.title,
      pathname: location.pathname,
      issues,
      notes,
      h1Count: document.querySelectorAll('h1').length
    };
  });
}

function mergeCollectorIssues(report, area, collectorResult, opts) {
  opts = opts || {};
  const { consoleErrors, pageErrors, failedRequests } = collectorResult;

  consoleErrors.forEach(msg => {
    if (/favicon|404.*\.ico/i.test(msg)) return;
    report.addIssue(
      opts.consoleSeverity || 'MINOR',
      area,
      `Console error: ${msg}`
    );
  });

  pageErrors.forEach(msg => {
    report.addIssue('MAJOR', area, `Page error: ${msg}`);
  });

  failedRequests.forEach(req => {
    if (/\.(woff2?|png|jpg|svg)/i.test(req.url) && /404/.test(req.failure)) {
      report.addIssue('MINOR', area, `Asset failed: ${req.url}`);
    } else if (!/firebase|googleapis|gstatic/i.test(req.url)) {
      report.addIssue('MAJOR', area, `Request failed: ${req.url} (${req.failure})`);
    }
  });
}

function writeEntryReports(report, meta) {
  const OUTPUT_DIR = meta.outputDir;
  const jsonPath = path.join(OUTPUT_DIR, 'entry_funnel_audit.json');
  const mdPath = path.join(OUTPUT_DIR, 'entry_funnel_audit.md');
  const htmlPath = path.join(OUTPUT_DIR, 'entry_funnel_audit.html');

  const payload = {
    generatedAt: new Date().toISOString(),
    baseUrl: meta.baseUrl,
    mode: meta.mode,
    durationSec: (Date.now() - report.startTime) / 1000,
    steps: report.steps,
    issues: report.issues,
    uxNotes: report.uxNotes
  };
  fs.writeFileSync(jsonPath, JSON.stringify(payload, null, 2));

  const failed = report.steps.filter(s => s.status === '❌').length;
  const warns = report.steps.filter(s => s.status === '⚠️').length;
  const escapeHtml = meta.escapeHtml;

  const md = `# Entry funnel UI audit — ${new Date().toISOString().slice(0, 10)}

**URL:** ${meta.baseUrl}  
**Mode:** ${meta.mode}  
**Duration:** ${payload.durationSec.toFixed(1)}s  
**Steps:** ${report.steps.length} (${failed} failed, ${warns} warnings)  
**Issues:** ${report.issues.length}

## Flow

| Step | Status | Details |
|------|--------|---------|
${report.steps.map(s => `| ${s.name} | ${s.status} | ${String(s.details).replace(/\|/g, '\\|')} |`).join('\n')}

## Issues

${
  report.issues.length
    ? report.issues
        .map(i => `- **[${i.severity}] ${i.area}** — ${i.description}`)
        .join('\n')
    : '_None — entry funnel looks clean._'
}

## UX polish notes

${
  report.uxNotes.length
    ? report.uxNotes.map(n => `- ${n}`).join('\n')
    : '_No extra notes._'
}

Screenshots: \`scripts/owner-bot/output/entry_*.png\`
`;
  fs.writeFileSync(mdPath, md);

  const issueRows = report.issues
    .map(
      i =>
        `<tr><td><strong>${escapeHtml(i.severity)}</strong></td><td>${escapeHtml(i.area)}</td><td>${escapeHtml(i.description)}</td></tr>`
    )
    .join('');
  const stepRows = report.steps
    .map(
      s =>
        `<tr><td>${escapeHtml(s.name)}</td><td style="text-align:center">${s.status}</td><td>${escapeHtml(s.details)}</td></tr>`
    )
    .join('');

  const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><title>Entry funnel audit</title>
<style>
body{font-family:Inter,system-ui,sans-serif;margin:24px;background:#f8fafc;color:#0f172a}
table{border-collapse:collapse;width:100%;margin:16px 0;background:#fff}
th,td{border:1px solid #e2e8f0;padding:10px;font-size:14px;text-align:left}
th{background:#334155;color:#fff}
.note{background:#fffbeb;border-left:4px solid #f59e0b;padding:10px;margin:8px 0}
</style></head><body>
<h1>Entry funnel UI audit</h1>
<p>${escapeHtml(meta.baseUrl)} · ${failed} failed · ${report.issues.length} issues</p>
<h2>Steps</h2><table><tr><th>Step</th><th>Status</th><th>Details</th></tr>${stepRows}</table>
<h2>Issues</h2><table><tr><th>Severity</th><th>Area</th><th>Description</th></tr>${issueRows || '<tr><td colspan="3">None</td></tr>'}</table>
<h2>UX notes</h2>
${report.uxNotes.map(n => `<div class="note">${escapeHtml(n)}</div>`).join('') || '<p>None</p>'}
</body></html>`;
  fs.writeFileSync(htmlPath, html);

  console.log(`\nReports:\n  ${htmlPath}\n  ${mdPath}\n  ${jsonPath}\n`);
}

module.exports = {
  createUiCollector,
  runDomUiAudit,
  mergeCollectorIssues,
  writeEntryReports
};

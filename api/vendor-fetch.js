/**
 * Vercel serverless handler: fetch a vendor webpage HTML server-side so the
 * browser does not depend on flaky public CORS proxies (see vendor-url-importer.js).
 *
 * SSRF mitigation: HTTPS/HTTP only, block obvious local hosts (not a full SSRF firewall).
 */

const MAX_HTML_BYTES = 2 * 1024 * 1024;
const FETCH_TIMEOUT_MS = 25_000;

function isBlockedHost(hostname) {
  const h = String(hostname || '').toLowerCase();
  if (!h || h === 'localhost') {
    return true;
  }
  if (h.endsWith('.local') || h.endsWith('.localhost')) {
    return true;
  }
  if (h === '127.0.0.1' || h === '::1' || h === '0.0.0.0') {
    return true;
  }
  if (h.endsWith('.internal') || h.endsWith('.lan')) {
    return true;
  }
  const ipv4 = h.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (ipv4) {
    const [a0, b0] = [Number(ipv4[1]), Number(ipv4[2])];
    // 127.0.0.0/8, 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16
    if (a0 === 10) {
      return true;
    }
    if (a0 === 127) {
      return true;
    }
    if (a0 === 192 && b0 === 168) {
      return true;
    }
    if (a0 === 169 && b0 === 254) {
      return true;
    }
    if (a0 === 172 && b0 >= 16 && b0 <= 31) {
      return true;
    }
  }
  return false;
}

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res
      .status(405)
      .json({ success: false, error: 'Method not allowed' });
  }

  const rawUrl =
    typeof req.query.url === 'string'
      ? req.query.url
      : Array.isArray(req.query.url)
        ? req.query.url[0]
        : '';

  if (!rawUrl) {
    return res
      .status(400)
      .json({ success: false, error: 'Missing url query parameter' });
  }

  let target;
  try {
    target = new URL(rawUrl);
  } catch {
    return res.status(400).json({ success: false, error: 'Invalid URL' });
  }

  if (target.protocol !== 'http:' && target.protocol !== 'https:') {
    return res
      .status(400)
      .json({ success: false, error: 'Only http(s) URLs are allowed' });
  }

  if (isBlockedHost(target.hostname)) {
    return res.status(400).json({ success: false, error: 'Host not allowed' });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const upstream = await fetch(target.toString(), {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'User-Agent':
          'IterumVendorImporter/1.0 (HTTPS; +https://iterumfoods.xyz)'
      }
    });

    if (!upstream.ok) {
      return res.status(502).json({
        success: false,
        error: `Upstream returned HTTP ${upstream.status}`
      });
    }

    const text = await upstream.text();
    clearTimeout(timeout);

    const bytes = Buffer.byteLength(text, 'utf8');
    if (bytes > MAX_HTML_BYTES) {
      return res.status(413).json({
        success: false,
        error: 'Page is too large to import (>2MB)'
      });
    }

    return res.status(200).json({
      success: true,
      html: text,
      contentType: upstream.headers.get('content-type') || ''
    });
  } catch (err) {
    clearTimeout(timeout);
    const message =
      err?.name === 'AbortError'
        ? 'Request timed out'
        : String(err.message || err);
    return res.status(502).json({
      success: false,
      error: message
    });
  }
};

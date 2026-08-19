/**
 * Parse vendor price lists (PDF text, CSV, TSV, Excel rows) into catalog SKUs.
 * Review-before-commit is expected — extraction is best-effort.
 */
(function (global) {
  'use strict';

  var HEADER_HINTS = {
    name: /^(item|name|product|description|spirit|wine name|item name)$/i,
    sku: /^(sku|code|item code|item #|item#|upc|plu)$/i,
    packSize: /^(pack|pack size|size|spec|packspec|uom|unit size)$/i,
    unitCost: /^(unitcost|unit cost|cost|price|case price|unitprice)$/i,
    category: /^(category|menu category|style|type|dept|department)$/i,
    unit: /^(unit|uom)$/i,
    vendorHint: /^(vendor|distributor|supplier)$/i,
    par: /^(par|par level|cc bar par|spec)$/i
  };

  var SKIP_LINE =
    /^(full liquor|inventory ===|category\s+item|master station|common craft|page \d)/i;

  var PACK_RE =
    /(\d+(?:\.\d+)?\s?(?:ml|l|ltr|liter|litre|oz|cs|case|pk|pack|gal|kg|lb|ct|bbl)|1\/2\s*bbl|6pk|12pk|750\s*ml|1\.0?\s*liter)/i;

  function parseMoney(raw) {
    if (raw == null || raw === '') return null;
    var s = String(raw).replace(/[$,]/g, '').replace(/\s/g, '').trim();
    if (!s || !/^\d+(\.\d+)?$/.test(s)) return null;
    var n = parseFloat(s);
    return Number.isFinite(n) ? n : null;
  }

  function splitCsvLine(line, delim) {
    var out = [];
    var cur = '';
    var inQuotes = false;
    for (var i = 0; i < line.length; i++) {
      var ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          cur += '"';
          i += 1;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === delim && !inQuotes) {
        out.push(cur.trim());
        cur = '';
      } else {
        cur += ch;
      }
    }
    out.push(cur.trim());
    return out;
  }

  function detectDelim(headerLine) {
    var commas = (headerLine.match(/,/g) || []).length;
    var tabs = (headerLine.match(/\t/g) || []).length;
    var pipes = (headerLine.match(/\|/g) || []).length;
    if (tabs >= commas && tabs >= pipes && tabs > 0) return '\t';
    if (pipes > commas && pipes > 0) return '|';
    return ',';
  }

  function mapHeader(cells) {
    var map = {};
    cells.forEach(function (cell, idx) {
      var key = String(cell || '')
        .replace(/[_/]+/g, ' ')
        .trim();
      Object.keys(HEADER_HINTS).forEach(function (field) {
        if (map[field] != null) return;
        if (HEADER_HINTS[field].test(key)) map[field] = idx;
      });
    });
    return map;
  }

  function looksLikeHeader(cells) {
    var map = mapHeader(cells);
    return map.name != null || (map.sku != null && map.unitCost != null);
  }

  function emptyRow() {
    return {
      name: '',
      sku: '',
      packSize: '',
      unitCost: null,
      category: '',
      unit: '',
      vendorHint: '',
      par: null,
      notes: ''
    };
  }

  function rowFromMapped(cells, map) {
    var row = emptyRow();
    function cell(field) {
      if (map[field] == null) return '';
      return String(cells[map[field]] || '').trim();
    }
    row.name = cell('name');
    row.sku = cell('sku');
    row.packSize = cell('packSize');
    row.category = cell('category');
    row.unit = cell('unit');
    row.vendorHint = cell('vendorHint');
    row.unitCost = parseMoney(cell('unitCost'));
    var parRaw = cell('par');
    if (parRaw) {
      var parN = parseFloat(String(parRaw).replace(/[^\d.]/g, ''));
      row.par = Number.isFinite(parN) ? parN : null;
    }
    if (!row.name && row.sku) row.name = row.sku;
    return row;
  }

  function parseLooseLine(line, lastCategory) {
    if (!line || SKIP_LINE.test(line)) return null;
    if (line.length < 3) return null;

    var row = emptyRow();
    row.category = lastCategory || '';

    var packMatch = line.match(PACK_RE);
    if (packMatch) row.packSize = packMatch[0].replace(/\s+/g, ' ');

    var moneyMatches = line.match(/\$\s*\d{1,5}(?:[.,]\d{2})?/g) || [];
    if (moneyMatches.length) {
      row.unitCost = parseMoney(moneyMatches[moneyMatches.length - 1]);
    } else {
      var nums = line.match(/\b\d{1,4}\.\d{2}\b/g);
      if (nums && nums.length) {
        row.unitCost = parseMoney(nums[nums.length - 1]);
      }
    }

    var parts = line.split(/\t+/).map(function (p) {
      return p.trim();
    });
    if (parts.length >= 2) {
      if (parts[0] && parts[0].length < 40 && !parseMoney(parts[0])) {
        if (!row.category) row.category = parts[0];
      }
      row.name = parts[1] || parts[0];
      parts.forEach(function (p) {
        if (!row.sku && /^\d{2,}\s/.test(p)) row.sku = p.split(/\s+/)[0];
        if (
          !row.vendorHint &&
          /walker|martignetti|burke|glazer|privateer|atlantic|craft/i.test(p)
        ) {
          row.vendorHint = p;
        }
      });
    } else {
      var cleaned = line
        .replace(/\$\s*\d{1,5}(?:[.,]\d{2})?/g, '')
        .replace(/\b\d{1,4}\.\d{2}\b/g, '')
        .replace(PACK_RE, '')
        .replace(/\s{2,}/g, ' ')
        .trim();
      row.name = cleaned;
    }

    var skuLead = line.match(/^(\d{2,}\s+[A-Z0-9][A-Z0-9 &'./-]{4,})/);
    if (skuLead) {
      row.sku = skuLead[1].split(/\s+/).slice(0, 2).join(' ');
      if (!row.name) row.name = skuLead[1];
    }

    if (!row.name) return null;
    if (row.name.length > 180) row.name = row.name.slice(0, 180);
    var nameLower = row.name.toLowerCase();
    if (
      nameLower === 'item' ||
      nameLower === 'category' ||
      nameLower.indexOf('order needed') !== -1
    ) {
      return null;
    }
    return row;
  }

  function parsePriceListText(text) {
    var raw = String(text || '').replace(/\u00a0/g, ' ');
    var lines = raw.split(/\r?\n/);
    var rows = [];
    var lastCategory = '';
    var i = 0;
    while (i < lines.length && !String(lines[i] || '').trim()) i += 1;
    var first = String(lines[i] || '').trim();
    var delim = detectDelim(first);
    var firstCells = splitCsvLine(first, delim);
    var mapped = looksLikeHeader(firstCells);

    if (mapped) {
      var map = mapHeader(firstCells);
      for (var r = i + 1; r < lines.length; r++) {
        var line = String(lines[r] || '').trim();
        if (!line) continue;
        var cells = splitCsvLine(line, delim);
        var row = rowFromMapped(cells, map);
        if (row.name || row.sku) rows.push(row);
      }
      return { rows: rows, mode: 'table' };
    }

    lines.forEach(function (line) {
      var t = String(line || '').trim();
      if (!t) return;
      if (SKIP_LINE.test(t)) return;
      if (
        /^(gin|vodka|rum|tequila|whiskey|wine|beer|bitters|soda|sparkling|white|red)\s*$/i.test(
          t
        )
      ) {
        lastCategory = t;
        return;
      }
      var parsed = parseLooseLine(t, lastCategory);
      if (parsed) rows.push(parsed);
    });

    var seen = new Set();
    var deduped = [];
    rows.forEach(function (row) {
      var key = (row.sku || row.name).toLowerCase();
      if (!key || seen.has(key)) return;
      seen.add(key);
      deduped.push(row);
    });
    return { rows: deduped, mode: 'loose' };
  }

  function sheetToText(workbook) {
    if (!workbook || !workbook.SheetNames || !workbook.SheetNames.length) {
      return '';
    }
    var name = workbook.SheetNames[0];
    var sheet = workbook.Sheets[name];
    if (global.XLSX?.utils?.sheet_to_csv) {
      return global.XLSX.utils.sheet_to_csv(sheet);
    }
    return '';
  }

  async function extractPdfText(arrayBuffer) {
    if (typeof global.pdfjsLib === 'undefined') {
      throw new Error('PDF.js is not loaded.');
    }
    var pdf = await global.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    var chunks = [];
    for (var p = 1; p <= pdf.numPages; p++) {
      var page = await pdf.getPage(p);
      var content = await page.getTextContent();
      var line = content.items
        .map(function (it) {
          return it.str || '';
        })
        .join(' ');
      chunks.push(line);
      var yBuckets = {};
      content.items.forEach(function (it) {
        var y = it.transform ? Math.round(it.transform[5]) : 0;
        yBuckets[y] = (yBuckets[y] || '') + (it.str || '') + '\t';
      });
      Object.keys(yBuckets)
        .sort(function (a, b) {
          return Number(b) - Number(a);
        })
        .forEach(function (y) {
          chunks.push(yBuckets[y].trim());
        });
    }
    return chunks.join('\n');
  }

  async function parseFile(file) {
    var name = (file && file.name ? file.name : '').toLowerCase();
    var type = file && file.type ? file.type : '';
    if (type === 'application/pdf' || name.endsWith('.pdf')) {
      var buf = await file.arrayBuffer();
      var text = await extractPdfText(buf);
      var parsed = parsePriceListText(text);
      parsed.source = file.name;
      parsed.rawText = text;
      return parsed;
    }
    if (
      name.endsWith('.xlsx') ||
      name.endsWith('.xls') ||
      type.indexOf('spreadsheet') !== -1 ||
      type.indexOf('excel') !== -1
    ) {
      if (!global.XLSX) throw new Error('Excel parser is not loaded.');
      var wb = global.XLSX.read(await file.arrayBuffer(), { type: 'array' });
      var csv = sheetToText(wb);
      var fromSheet = parsePriceListText(csv);
      fromSheet.source = file.name;
      return fromSheet;
    }
    var asText = await file.text();
    var fromText = parsePriceListText(asText);
    fromText.source = file.name;
    return fromText;
  }

  global.iterumPriceListParser = {
    parsePriceListText: parsePriceListText,
    parseFile: parseFile,
    parseMoney: parseMoney,
    extractPdfText: extractPdfText
  };
})(typeof window !== 'undefined' ? window : globalThis);

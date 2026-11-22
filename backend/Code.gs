/**
 * RTLH event kiosk — Google Sheet code.
 *
 * HOW TO UPDATE (2 minutes, same link as before):
 * 1. Open the "RTLH Event" Google Sheet → Extensions → Apps Script.
 * 2. Select everything in Code.gs, delete it, paste this whole file, press Save.
 * 3. Deploy → Manage deployments → ✏️ (pencil) → Version: "New version" → Deploy.
 *    The /exec link stays the same, so the kiosk and Admin app need no changes.
 *
 * Columns: A time · B event · C order no · D guest · E product · F colour
 *          G personalisation · H text / picture no · I font · J (free for your notes)
 *          K price (new)
 * Highlight a row green when it's done — the Admin app reads that colour.
 */
const DONE_GREEN = '#b7e1cd';

function sheet_() {
  return SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
}

function doPost(e) {
  const d = JSON.parse(e.postData.contents);
  const sh = sheet_();
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    // The kiosk re-sends orders that failed without Wi-Fi; skip exact repeats.
    if (d._id) {
      const props = PropertiesService.getScriptProperties();
      const seen = props.getProperty('seen') || '';
      if (seen.indexOf(d._id) >= 0) return ContentService.createTextOutput('OK');
      props.setProperty('seen', (d._id + ',' + seen).slice(0, 8000));
    }
    const row = sh.getLastRow() + 1;
    sh.getRange(row, 1, 1, 3).setNumberFormat('@'); // keep time and order no exactly as sent
    sh.getRange(row, 1, 1, 11).setValues([[d.timestamp, d.eventName, d.orderNumber, d.customerName, d.product,
      d.color, d.customType, d.customText, d.font, '', d.price === undefined ? '' : d.price]]);
  } finally {
    lock.releaseLock();
  }
  return ContentService.createTextOutput('OK');
}

/** Rows for the Admin app: the 11 columns above plus true/false for "highlighted green". */
function doGet() {
  const sh = sheet_();
  const n = sh.getLastRow();
  if (!n) return json_([]);
  const range = sh.getRange(1, 1, n, 11);
  const vals = range.getDisplayValues();
  const bg = sh.getRange(1, 1, n, 1).getBackgrounds();
  return json_(vals.map(function (r, i) { return r.concat([isGreen_(bg[i][0])]); }));
}

function isGreen_(hex) {
  hex = String(hex || '').toLowerCase();
  if (hex === DONE_GREEN) return true;
  const m = hex.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/);
  if (!m) return false;
  const r = parseInt(m[1], 16), g = parseInt(m[2], 16), b = parseInt(m[3], 16);
  return g > 150 && g - r > 25 && g >= b; // any greenish highlight counts as done
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

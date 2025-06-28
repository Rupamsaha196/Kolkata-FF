const sheetID = "1JZriCauUF0pNvXXO267n6crzefBYwyoBmbCM2kfd1Bo";
const sheetName = "www";
const url = `https://docs.google.com/spreadsheets/d/1JZriCauUF0pNvXXO267n6crzefBYwyoBmbCM2kfd1Bo/gviz/tq?sheet=www`;

fetch(url)
  .then(res => res.text())
  .then(rep => {
    const match = rep.match(/(?<=\().*(?=\);)/s);
    if (!match) throw new Error("❌ Failed to parse sheet data.");

    const jsonData = JSON.parse(match[0]);
    const rows = jsonData.table.rows.map(r =>
      r.c.map(c => {
        if (!c) return '';
        const val = (typeof c.v === 'string' || typeof c.v === 'number') ? String(c.v).trim() : (c.f ? String(c.f).trim() : '');
        return val;
      })
    );

    const grouped = {};
    rows.forEach(row => {
      const [rawDate, type, ...cols] = row;
      const date = formatDate(rawDate);
      if (!grouped[date]) grouped[date] = [];
      
      // Check if the type is "Jackpot" or "JACKPOT"
      const isJackpotRow = type.toLowerCase() === "jackpot";
      
      const sanitized = cols.map((v, index) => sanitize(v, isJackpotRow, index));
      grouped[date].push(fillToNine(sanitized));
    });

    renderResults(grouped);
  })
  .catch(err => {
    console.error("🚨 Fetch error:", err);
    document.getElementById('results').innerHTML = `<div style="color:red;font-weight:bold;">Error loading data</div>`;
  });

function formatDate(raw) {
  if (typeof raw === 'string' && raw.includes('Date(')) {
    const match = raw.match(/Date\((\d+),(\d+),(\d+)\)/);
    if (match) {
      const [, y, m, d] = match;
      return `${String(d).padStart(2, '0')}/${String(+m + 1).padStart(2, '0')}/${y}`;
    }
  }

  if (raw instanceof Date) {
    return `${String(raw.getDate()).padStart(2, '0')}/${String(raw.getMonth() + 1).padStart(2, '0')}/${raw.getFullYear()}`;
  }

  const parts = String(raw).split("-");
  if (parts.length === 3) {
    return parts[0].length === 4
      ? `${parts[2]}/${parts[1]}/${parts[0]}`
      : `${parts[0]}/${parts[1]}/${parts[2]}`;
  }

  return String(raw);
}

function fillToNine(arr) {
  const filled = [...arr];
  while (filled.length < 9) filled.push("N");
  return filled;
}

function sanitize(val, isJackpot = false) {
  if (val === null || val === undefined) return "N";
  const clean = String(val).trim();
  
  // Check if it's a jackpot row
  if (isJackpot) {
    // If the value is empty or "-", return "N"
    if (clean === '' || clean === '-') return "N";
    // Allow any alphanumeric value
    return clean; // Return the clean value directly
  }

  // For other rows, return "N" for empty or invalid values
  if (clean === '' || clean.toLowerCase() === 'null' || clean === '-') return "N";
  return clean;
}

function renderResults(data) {
  const container = document.getElementById('results');
  container.innerHTML = '';

  const sortedDates = Object.keys(data).sort((a, b) =>
    new Date(b.split("/").reverse().join("-")) - new Date(a.split("/").reverse().join("-"))
  );

  const latestDate = sortedDates[0];

  sortedDates.forEach(date => {
    const block = document.createElement('div');
    const isLatest = date === latestDate;

    block.innerHTML = `
      <div class="date-header ${isLatest ? 'latest' : ''}">Date: ${date}</div>
      ${data[date].map(row => `
        <div class="result-row">
          ${row.map(val => `<div class="cell">${val}</div>`).join('')}
        </div>
      `).join('')}
    `;

    container.appendChild(block);
  });
}

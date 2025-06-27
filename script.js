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
      r.c.map(c => (c && c.v !== null) ? c.v : '')
    );

    const grouped = {};
    rows.forEach(row => {
      const [rawDate, type, ...cols] = row;
      const date = formatDate(rawDate);
      if (!grouped[date]) grouped[date] = [];
      const sanitized = cols.map(v => sanitize(v, type));
      grouped[date].push(fillToNine(sanitized));
    });

    renderResults(grouped);
  })
  .catch(err => {
    console.error("🚨 Fetch error:", err);
    document.getElementById('results').innerHTML = `<div style=\"color:red;font-weight:bold;\">Error loading data</div>`;
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

function sanitize(val, type) {
  const clean = String(val).trim();
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
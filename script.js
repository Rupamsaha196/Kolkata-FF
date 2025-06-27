const sheetID = "1JZriCauUF0pNvXXO267n6crzefBYwyoBmbCM2kfd1Bo";
const sheetName = "www";
const url = `https://docs.google.com/spreadsheets/d/1JZriCauUF0pNvXXO267n6crzefBYwyoBmbCM2kfd1Bo/gviz/tq?sheet=www`;

fetch(url)
  .then(res => res.text())
  .then(rep => {
    const match = rep.match(/(?<=\().*(?=\);)/s);
    if (!match) {
      throw new Error("❌ Failed to parse sheet data. Check if your sheet is public and the tab name is correct.");
    }

    const jsonData = JSON.parse(match[0]);
    const rows = jsonData.table.rows.map(r =>
      r.c.map(c => (c && c.v !== null) ? c.v : '')
    );

    const grouped = {};
    rows.forEach(row => {
      const [rawDate, type, ...cols] = row;
      const date = formatDate(rawDate);
      if (!grouped[date]) grouped[date] = {};
      grouped[date][type] = fillToNine(cols.map(sanitize));
    });

    renderResults(grouped);
  })
  .catch(err => {
    console.error("🚨 Data fetch error:", err);
    const container = document.getElementById('results');
    container.innerHTML = `<div style="color: red; font-weight: bold;">⚠️ Error loading results. Please check if the Google Sheet is public and the sheet name is correct.</div>`;
  });

function formatDate(raw) {
  // Handle Google Sheets format: "Date(2025,5,26)"
  if (typeof raw === 'string' && raw.includes('Date(')) {
    const match = raw.match(/Date\((\d+),(\d+),(\d+)\)/);
    if (match) {
      const [, year, month, day] = match;
      return `${String(day).padStart(2, '0')}/${String(Number(month) + 1).padStart(2, '0')}/${year}`;
    }
  }

  // Handle native Date object
  if (raw instanceof Date) {
    const day = String(raw.getDate()).padStart(2, '0');
    const month = String(raw.getMonth() + 1).padStart(2, '0');
    const year = raw.getFullYear();
    return `${day}/${month}/${year}`;
  }

  // Handle string format (e.g., "2025-06-26" or "26-06-2025")
  if (typeof raw === 'string') {
    const parts = raw.split('-');
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        // "YYYY-MM-DD"
        return `${parts[2].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[0]}`;
      } else {
        // "DD-MM-YYYY"
        return `${parts[0].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[2]}`;
      }
    }
  }

  // Fallback: try parsing with JS Date
  try {
    const d = new Date(raw);
    if (!isNaN(d)) {
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    }
  } catch (e) {}

  return String(raw); // Final fallback
}

function fillToNine(arr) {
  const filled = [...arr];
  while (filled.length < 9) filled.push('-');
  return filled;
}

function sanitize(val) {
  if (val === null || val === undefined || val === 'null' || val === '') return '-';
  const cleaned = String(val).trim();
  return cleaned === '' || cleaned === '-' ? '-' : cleaned;
}

function renderResults(data) {
  const container = document.getElementById('results');
  container.innerHTML = '';

  const sortedDates = Object.keys(data)
    .sort((a, b) => new Date(b.split('/').reverse().join('-')) - new Date(a.split('/').reverse().join('-')));
  const latestDate = sortedDates[0];

  sortedDates.forEach(date => {
    const patti = data[date]['PATTI'] || fillToNine([]);
    const single = data[date]['SINGLE'] || fillToNine([]);
    const jackpot = data[date]['JACKPOT'] || fillToNine([]);

    const block = document.createElement('div');
    block.className = 'date-section';
    if (date === latestDate) block.classList.add('latest');

    block.innerHTML = `
      <div class="date-header">Date: ${date}</div>
      <div class="result-row">
        <div class="row-label">PATTI</div>
        ${patti.map(v => `<div class="cell">${v}</div>`).join('')}
      </div>
      <div class="result-row">
        <div class="row-label">SINGLE</div>
        ${single.map(v => `<div class="cell">${v}</div>`).join('')}
      </div>
      <div class="result-row">
        <div class="row-label">JACKPOT</div>
        ${jackpot.map(v => `<div class="cell">${v}</div>`).join('')}
      </div>
    `;

    container.appendChild(block);
  });
}

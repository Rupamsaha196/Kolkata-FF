const sheetID = "1JZriCauUF0pNvXXO267n6crzefBYwyoBmbCM2kfd1Bo";
const sheetName = "www";
const url = `https://docs.google.com/spreadsheets/d/1JZriCauUF0pNvXXO267n6crzefBYwyoBmbCM2kfd1Bo/gviz/tq?sheet=www`;

fetch(url)
  .then(res => res.text())
  .then(rep => {
    const match = rep.match(/(?<=\().*(?=\);)/s);
    if (!match) throw new Error("❌ Failed to parse sheet data.");

    const jsonData = JSON.parse(match[0]);
    const rows = jsonData.table.rows.map(r => r.c.map(c => (c && c.v !== null) ? c.v : ''));

    const grouped = {};
    rows.forEach(row => {
      const [rawDate, type, ...values] = row;
      const date = formatDate(rawDate);
      if (!grouped[date]) grouped[date] = [];
      grouped[date].push(fillToNine(values.map(sanitize)));
    });

    renderResults(grouped);
  })
  .catch(err => {
    document.getElementById('results').innerHTML =
      `<div style=\"color: red; font-weight: bold;\">⚠️ Error loading data: ${err.message}</div>`;
  });

function formatDate(raw) {
  if (typeof raw === 'string' && raw.includes('Date(')) {
    const match = raw.match(/Date\((\d+),(\d+),(\d+)\)/);
    if (match) {
      const [, year, month, day] = match;
      return `${String(day).padStart(2, '0')}/${String(Number(month) + 1).padStart(2, '0')}/${year}`;
    }
  }

  const d = new Date(raw);
  if (!isNaN(d)) {
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  }
  return String(raw);
}

function fillToNine(arr) {
  const filled = [...arr];
  while (filled.length < 9) filled.push('-');
  return filled;
}

function sanitize(val) {
  const cleaned = String(val).trim();
  return cleaned === '' || cleaned === '-' || cleaned.toLowerCase() === 'null' ? '-' : cleaned;
}

function renderResults(data) {
  const container = document.getElementById('results');
  container.innerHTML = '';

  const sortedDates = Object.keys(data).sort((a, b) => {
    const da = new Date(a.split('/').reverse().join('-'));
    const db = new Date(b.split('/').reverse().join('-'));
    return db - da;
  });

  const latestDate = sortedDates[0];

  sortedDates.forEach(date => {
    const rows = data[date];

    const block = document.createElement('div');
    block.className = 'date-section';
    if (date === latestDate) block.classList.add('latest');

    block.innerHTML = `
      <div class="date-header">Date: ${date}</div>
      ${rows.map(row => `
        <div class="result-row">
          ${row.map(v => `<div class="cell">${v}</div>`).join('')}
        </div>
      `).join('')}
    `;

    container.appendChild(block);
  });
}

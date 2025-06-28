const csvUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSbhd3V_u9ofdKtZQq29aemLHvfsezMMErww2XpgSKF43pxCtnTrAYHHvWvliJ9LHQp1NNIcfAy_MhW/pub?output=csv"; // ← paste your CSV export link here



fetch(csvUrl)
  .then(res => res.text())
  .then(csv => {
    const rows = csv.trim().split("\n").map(r => r.split(",").map(cell => cell.trim()));
    const grouped = {};

    rows.forEach(row => {
      // Skip if too short or is a header or has no date/type
      if (!row || row.length < 3) return;
      const [rawDate, type, ...cols] = row;

      if (!rawDate || !type || rawDate.toLowerCase().includes('date')) return;

      const date = formatDate(rawDate);
      if (!grouped[date]) grouped[date] = [];

      const isJackpot = type.toLowerCase() === "jackpot";
      const sanitized = cols.map((v, i) => sanitize(v, isJackpot, i));
      grouped[date].push(fillToNine(sanitized));
    });

    renderResults(grouped);
  })
  .catch(err => {
    console.error("❌ CSV Load Error:", err);
    document.getElementById('results').innerHTML =
      `<div style="color:red;font-weight:bold;">Error loading data</div>`;
  });

function formatDate(raw) {
  const d = new Date(raw);
  if (!isNaN(d)) {
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  }

  const parts = String(raw).split(/[-/]/);
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
  return filled.slice(0, 9);
}

function sanitize(val, isJackpot = false) {
  const clean = String(val ?? "").trim();
  if (isJackpot) {
    return (!clean || clean === "-") ? "N" : clean;
  }
  return (!clean || clean.toLowerCase() === "null" || clean === "-") ? "N" : clean;
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

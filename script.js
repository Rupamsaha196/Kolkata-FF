



const csvUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSbhd3V_u9ofdKtZQq29aemLHvfsezMMErww2XpgSKF43pxCtnTrAYHHvWvliJ9LHQp1NNIcfAy_MhW/pub?output=csv";

fetch(csvUrl)
  .then(res => res.text())
  .then(csv => {
    const rows = csv.trim().split("\n").map(r => r.split(",").map(cell => cell.trim()));
    const grouped = {};

    rows.forEach(row => {
      if (!row || row.length < 3) return;
      const [rawDate, type, ...cols] = row;

      if (!rawDate || !type || rawDate.toLowerCase().includes("date")) return;

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
  if (!raw) return '';

  const parts = raw.split(/[-/]/).map(Number);
  let day, month, year;

  if (parts[0] > 31) {
    // YYYY-MM-DD
    year = parts[0];
    month = parts[1];
    day = parts[2];
  } else if (parts[2] > 31) {
    // DD-MM-YYYY or DD/MM/YYYY
    day = parts[0];
    month = parts[1];
    year = parts[2];
  } else {
    return raw;
  }

  return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
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
  const container = document.getElementById("results");
  container.innerHTML = "";

  const sortedDates = Object.keys(data).sort((a, b) =>
    new Date(b.split("/").reverse().join("-")) - new Date(a.split("/").reverse().join("-"))
  );

  const latestDate = sortedDates[0];

  sortedDates.forEach(date => {
    const block = document.createElement("div");
    const isLatest = date === latestDate;

    block.innerHTML = `
      <div class="date-header ${isLatest ? "latest" : ""}">Date: ${date}</div>
      ${data[date].map(row => `
        <div class="result-row">
          ${row.map(val => `<div class="cell">${val}</div>`).join("")}
        </div>
      `).join("")}
    `;

    container.appendChild(block);
  });
}

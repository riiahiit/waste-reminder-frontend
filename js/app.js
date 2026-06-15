const addressInput = document.getElementById("addressInput");
const emailInput = document.getElementById("emailInput");
const saveAddressBtn = document.getElementById("saveAddressBtn");
const addressStatus = document.getElementById("addressStatus");

const nextCollectionSection = document.getElementById("next-collection");
const nextCollectionInfo = document.getElementById("nextCollectionInfo");

const calendarSection = document.getElementById("calendar-section");
const calendarContainer = document.getElementById("calendarContainer");

const notificationSection = document.getElementById("notification-section");
const notificationToggle = document.getElementById("notifyToggle");

let currentStreet = null;
let wasteData = [];

const CSV_URL =
  "https://wastereminderdata.blob.core.windows.net/waste-data/schedule_clean.csv";

// -----------------------------
// LOAD CSV
// -----------------------------
async function loadCSV() {
  try {
    const res = await fetch(CSV_URL);
    const text = await res.text();

    wasteData = text
      .trim()
      .split("\n")
      .slice(1)
      .map((row) => {
        const [street, date, type] = row.split(",").map((x) => x.trim());
        return { street, date, type };
      });
  } catch (err) {
    console.error("CSV error:", err);
  }
}

// -----------------------------
// SAVE SUBSCRIPTION
// -----------------------------
saveAddressBtn.addEventListener("click", async () => {
  const street = addressInput.value.trim();
  const email = emailInput.value.trim();

  if (!street || !email) {
    addressStatus.textContent = "Enter street and email";
    return;
  }

  currentStreet = street;

  try {
    await fetch(
      "https://waste-reminder-naida-c3e5e8d0cra8h3c5.westeurope-01.azurewebsites.net/api/subscribe",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ street, email }),
      }
    );

    addressStatus.textContent = "Subscribed!";
    showUI();
    renderData();
  } catch (err) {
    console.error(err);
    addressStatus.textContent = "Error sending data.";
  }
});

// -----------------------------
// SHOW UI
// -----------------------------
function showUI() {
  nextCollectionSection.classList.remove("hidden");
  calendarSection.classList.remove("hidden");
  notificationSection.classList.remove("hidden");
}

// -----------------------------
// FILTER + RENDER
// -----------------------------
function renderData() {
  if (!currentStreet) return;

  const userData = wasteData.filter((x) => x.street === currentStreet);

  if (userData.length === 0) {
    nextCollectionInfo.innerHTML = "No data for this street";
    calendarContainer.innerHTML = "";
    return;
  }

  // NEXT COLLECTION
  const today = new Date();
  let next = null;

  userData.forEach((x) => {
    const d = new Date(x.date);
    if (!next || (d >= today && d < next)) next = d;
  });

  if (next) {
    nextCollectionInfo.innerHTML = `
      <p><strong>Next collection:</strong></p>
      <p>${next.toDateString()}</p>
    `;
  }

  // CALENDAR (default first type)
  const grouped = {};
  userData.forEach((x) => {
    if (!grouped[x.type]) grouped[x.type] = [];
    grouped[x.type].push(x.date);
  });

  const firstType = Object.keys(grouped)[0];

  if (firstType) {
    calendarContainer.innerHTML = `
      <h3>${firstType.toUpperCase()}</h3>
      <ul>
        ${grouped[firstType]
          .map((d) => `<li>${new Date(d).toDateString()}</li>`)
          .join("")}
      </ul>
    `;
  }
}

// -----------------------------
// BUTTONS (calendar switch)
// -----------------------------
document.querySelectorAll(".waste-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    if (!currentStreet) return;

    const type = btn.dataset.type;

    const filtered = wasteData.filter(
      (x) => x.street === currentStreet && x.type === type
    );

    calendarContainer.innerHTML = `
      <h3>${type.toUpperCase()}</h3>
      <ul>
        ${filtered
          .map((x) => `<li>${new Date(x.date).toDateString()}</li>`)
          .join("")}
      </ul>
    `;
  });
});

// -----------------------------
// INIT
// -----------------------------
(function init() {
  loadCSV(); // samo učitaj, ne renderuj ništa
})();

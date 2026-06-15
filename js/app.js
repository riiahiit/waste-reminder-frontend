const addressInput = document.getElementById("addressInput");
const emailInput = document.getElementById("emailInput");
const saveAddressBtn = document.getElementById("saveAddressBtn");
const addressStatus = document.getElementById("addressStatus");

const calendarSection = document.getElementById("calendar-section");
const calendarContainer = document.getElementById("calendarContainer");

const notificationSection = document.getElementById("notification-section");
const notificationToggle = document.getElementById("notifyToggle");

let currentStreet = null;
let wasteData = [];

const streetList = document.getElementById("streetList");
const validStreets = new Set();

console.log("APP LOADED");

const CSV_URL = "https://wastereminderdata.blob.core.windows.net/waste-data/schedule_clean.csv";

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

    wasteData.forEach(item => {
  validStreets.add(item.street);
});

const sortedStreets = [...validStreets].sort((a, b) =>
  a.localeCompare(b, "cs")
);

streetList.innerHTML = sortedStreets
  .map(street => `<option value="${street}">`)
  .join("");
    
  console.log("STREETS LOADED:", sortedStreets.length);
  console.log(sortedStreets.slice(0, 10));
  } catch (err) {
    console.error("CSV error:", err);
  }
}



function showUI() {
  calendarSection.classList.remove("hidden");
  notificationSection.classList.remove("hidden");
}

function renderData() {
  if (!currentStreet) return;

  const userData = wasteData.filter((x) => x.street === currentStreet);

  if (userData.length === 0) {
    calendarContainer.innerHTML = "";
    return;
  }

  const grouped = {};

  userData.forEach((x) => {
    if (!grouped[x.type]) grouped[x.type] = [];
    grouped[x.type].push(x.date);
  });

  const priority = ["mixed", "plastic", "paper", "glass", "bio"];

  const firstType =priority.find(t => grouped[t]) || Object.keys(grouped)[0];

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

saveAddressBtn.addEventListener("click", async () => {
const street = addressInput.value.trim();
const email = emailInput.value.trim();

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const streetRegex = /^[a-zA-Z0-9\sÀ-žÁ-žČčĆćĐđŠšŽž\-\/]+$/;

if (!street || !email) {
  addressStatus.textContent = "Enter street and email";
  return;
}

if (!streetRegex.test(street)) {
  addressStatus.textContent =
    "Street contains invalid characters (use letters, numbers, ČĆŠŽĐ allowed)";
  return;
}

if (!emailRegex.test(email)) {
  addressStatus.textContent = "Enter a valid email address";
  return;
}

if (!validStreets.has(street)) {
  addressStatus.textContent = "Please select a street from the list";
  return;
}

currentStreet = street;

  try {
    await fetch(
      "https://waste-reminder-naida-c3e5e8d0cra8h3c5.westeurope-01.azurewebsites.net/api/subscribe",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ street, email })
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

(async function init() {
  await loadCSV();
})();

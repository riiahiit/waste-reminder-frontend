const addressInput = document.getElementById("addressInput");
const emailInput = document.getElementById("emailInput");
const saveAddressBtn = document.getElementById("saveAddressBtn");
saveAddressBtn.addEventListener("click", () => {
  console.log("SAVE CLICKED");
});

const addressStatus = document.getElementById("addressStatus");

const suggestionsBox = document.getElementById("suggestions");

const calendarSection = document.getElementById("calendar-section");
const calendarContainer = document.getElementById("calendarContainer");

const notificationSection = document.getElementById("notification-section");

let currentStreet = null;
let wasteData = [];
const validStreets = new Set();

console.log("APP LOADED");

const CSV_URL =
  "https://wastereminderdata.blob.core.windows.net/waste-data/schedule_clean.csv";

/* -----------------------------
   LOAD CSV
------------------------------ */
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

    wasteData.forEach((item) => validStreets.add(item.street));

    console.log("STREETS LOADED:", validStreets.size);
  } catch (err) {
    console.error("CSV error:", err);
  }
}

/* -----------------------------
   AUTOCOMPLETE (CUSTOM)
------------------------------ */
addressInput.addEventListener("input", () => {
  const value = addressInput.value.toLowerCase();

  if (!value) {
    suggestionsBox.innerHTML = "";
    return;
  }

  const filtered = [...validStreets]
    .filter((s) => s.toLowerCase().startsWith(value))
    .slice(0, 10);

  suggestionsBox.innerHTML = filtered
    .map((street) => `<div class="suggestion-item">${street}</div>`)
    .join("");

  document.querySelectorAll(".suggestion-item").forEach((el) => {
    el.addEventListener("click", () => {
      addressInput.value = el.textContent;
      suggestionsBox.innerHTML = "";
    });
  });
});

/* click outside closes suggestions */
document.addEventListener("click", (e) => {
  if (!e.target.closest("#suggestions") && e.target !== addressInput) {
    suggestionsBox.innerHTML = "";
  }
});

/* -----------------------------
   UI HELPERS
------------------------------ */
function showUI() {
  calendarSection.classList.remove("hidden");
  notificationSection.classList.remove("hidden");
}

/* -----------------------------
   SAVE ADDRESS
------------------------------ */
saveAddressBtn.addEventListener("click", async () => {
  try {
    const streetRegex = /^[a-zA-Z0-9\sÀ-žÁ-žČčĆćĐđŠšŽž\-\/]+$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const street = addressInput.value.trim();
    const email = emailInput.value.trim();

    console.log("SAVE CLICKED");
    console.log("street:", street);
    console.log("email:", email);

    console.log("valid?", validStreets.has(street));
    console.log("regex street ok:", streetRegex.test(street));
    console.log("email ok:", emailRegex.test(email));

    if (!street || !email) {
      addressStatus.textContent = "Enter street and email";
      return;
    }

    if (!streetRegex.test(street)) {
      addressStatus.textContent = "Street contains invalid characters";
      return;
    }

    if (!emailRegex.test(email)) {
      addressStatus.textContent = "Enter a valid email address";
      return;
    }

    if (!validStreets.has(street)) {
      addressStatus.textContent = "Please select a valid street";
      return;
    }

    currentStreet = street;

    const res = await fetch(
      "https://waste-reminder-naida-c3e5e8d0cra8h3c5.westeurope-01.azurewebsites.net/api/subscribe",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ street, email }),
      }
    );

    console.log("FETCH STATUS:", res.status);

    addressStatus.textContent = "Subscribed ✔";
    showUI();
    renderData();

  } catch (err) {
    console.error("ERROR:", err);
  }
});

/* -----------------------------
   RENDER SCHEDULE
------------------------------ */
function renderData() {
  if (!currentStreet) return;

  const userData = wasteData.filter((x) => x.street === currentStreet);

  const grouped = {};

  userData.forEach((x) => {
    if (!grouped[x.type]) grouped[x.type] = [];
    grouped[x.type].push(x.date);
  });

  const priority = ["mixed", "plastic", "paper", "glass", "bio"];
  const firstType = priority.find((t) => grouped[t]) || Object.keys(grouped)[0];

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

/* -----------------------------
   WASTE TYPE FILTER
------------------------------ */
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

/* -----------------------------
   INIT
------------------------------ */
(async function init() {
  await loadCSV();
})();

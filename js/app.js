/* ---------------------------------------
   Waste Collection Reminder – app.js
---------------------------------------- */

// Elements
const addressInput = document.getElementById("addressInput");
const emailInput = document.getElementById("emailInput");
const saveAddressBtn = document.getElementById("saveAddressBtn");
const addressStatus = document.getElementById("addressStatus");

const nextCollectionSection = document.getElementById("next-collection");
const nextCollectionInfo = document.getElementById("nextCollectionInfo");

const calendarSection = document.getElementById("calendar-section");
const calendarContainer = document.getElementById("calendarContainer");

const notificationToggle = document.getElementById("notifyToggle");
const notificationSection = document.getElementById("notification-section");

// ---------------------------------------
// 1. REAL DATA FROM AZURE CSV
// ---------------------------------------

let wasteSchedule = {};

const CSV_URL = "https://wastereminderdata.blob.core.windows.net/waste-data/schedule_clean.csv";

// ---------------------------------------
// LOAD CSV FROM AZURE STORAGE
// ---------------------------------------

async function loadScheduleFromCSV() {
   console.log("CSV LOADED:", csvText);
    try {
        const response = await fetch(CSV_URL);
        const csvText = await response.text();

        parseScheduleCSV(csvText);

        loadNextCollection();
        generateCalendar("general");

    } catch (error) {
        console.error("CSV load error:", error);
    }
}

// ---------------------------------------
// PARSE CSV
// ---------------------------------------

function parseScheduleCSV(csvText) {
   console.log("PARSED SCHEDULE:", wasteSchedule);
    const rows = csvText.trim().split("\n").slice(1);

    wasteSchedule = {};

    rows.forEach(row => {
        const [street, date, type] = row.split(",");

        if (!wasteSchedule[type]) {
            wasteSchedule[type] = [];
        }

        wasteSchedule[type].push(date);
    });
}

// ---------------------------------------
// SAVE SUBSCRIPTION
// ---------------------------------------

saveAddressBtn.addEventListener("click", async () => {

    const address = addressInput.value.trim();
    const email = emailInput.value.trim();

    if (!address || !email) {
        addressStatus.textContent = "Please enter valid data.";
        return;
    }

    try {
        const response = await fetch(
            "https://waste-reminder-naida-c3e5e8d0cra8h3c5.westeurope-01.azurewebsites.net/api/subscribe",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    street: address,
                    email: email
                })
            }
        );

        const data = await response.json();

        addressStatus.textContent = data.message || "Subscribed!";

        localStorage.setItem("userAddress", address);

        showAppSections();

    } catch (error) {
        console.error(error);
        addressStatus.textContent = "Error sending data.";
    }
});

// ---------------------------------------
// UI
// ---------------------------------------

function showAppSections() {
    nextCollectionSection.classList.remove("hidden");
    calendarSection.classList.remove("hidden");
    notificationSection.classList.remove("hidden");
}

// ---------------------------------------
// INIT
// ---------------------------------------

(function init() {

    const savedAddress = localStorage.getItem("userAddress");

    if (savedAddress) {
        addressInput.value = savedAddress;
        showAppSections();
    }

    loadScheduleFromCSV();

})();

// ---------------------------------------
// NEXT COLLECTION
// ---------------------------------------

function loadNextCollection() {

    const today = new Date();

    let nextDate = null;
    let nextType = null;

    for (const type in wasteSchedule) {
        wasteSchedule[type].forEach(dateStr => {
            const date = new Date(dateStr);

            if (!nextDate || (date >= today && date < nextDate)) {
                nextDate = date;
                nextType = type;
            }
        });
    }

    if (nextDate) {
        nextCollectionInfo.innerHTML = `
            <p><strong>Next collection:</strong></p>
            <p>${nextDate.toDateString()}</p>
            <p>Type: <strong>${nextType.toUpperCase()}</strong></p>
        `;
    }
}

// ---------------------------------------
// CALENDAR
// ---------------------------------------

document.querySelectorAll(".waste-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        generateCalendar(btn.dataset.type);
    });
});

function generateCalendar(type) {

    const dates = wasteSchedule[type] || [];

    calendarContainer.innerHTML = `
        <h3>${type.toUpperCase()} collection days</h3>
        <ul>
            ${dates.map(d => `<li>${new Date(d).toDateString()}</li>`).join("")}
        </ul>
    `;
}

// ---------------------------------------
// NOTIFICATIONS
// ---------------------------------------

notificationToggle.addEventListener("change", () => {
    localStorage.setItem("notifyEnabled", notificationToggle.checked);
});

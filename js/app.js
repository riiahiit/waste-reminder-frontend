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
// 1. Waste collection data
// ---------------------------------------

let wasteSchedule = {};

console.log("NEW VERSION LOADED");

// ---------------------------------------
// 2. SAVE SUBSCRIPTION (MAIN FUNCTION)
// ---------------------------------------

saveAddressBtn.addEventListener("click", async () => {

    const address = addressInput.value.trim();
    const email = emailInput.value.trim();

    console.log("ADDRESS:", address);
    console.log("EMAIL:", email);

    if (!address || !email || address.length < 3 || email.length < 5) {
        addressStatus.textContent = "Please enter valid address and email.";
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

        if (!response.ok) {
            throw new Error(data.message || "Request failed");
        }

        addressStatus.textContent = data.message || "Subscription saved!";

        localStorage.setItem("userAddress", address);

        showAppSections();

    } catch (error) {
        console.error("ERROR:", error);
        addressStatus.textContent = "Error sending data.";
    }
});

// ---------------------------------------
// 3. UI LOGIC
// ---------------------------------------

function showAppSections() {
    nextCollectionSection.classList.remove("hidden");
    calendarSection.classList.remove("hidden");
    notificationSection.classList.remove("hidden");

    loadNextCollection();
    generateCalendar("general");
}

// ---------------------------------------
// 4. INIT
// ---------------------------------------

(function init() {

    const savedAddress = localStorage.getItem("userAddress");
    const savedNotify = localStorage.getItem("notifyEnabled");

    if (savedAddress) {
        addressInput.value = savedAddress;
        showAppSections();
    }

    if (savedNotify === "true") {
        notificationToggle.checked = true;
    }

    console.log("App initialized");
})();

// ---------------------------------------
// 5. NEXT COLLECTION (MOCK DATA)
// ---------------------------------------

function loadNextCollection() {

    const today = new Date();

    const mockSchedule = {
        general: ["2026-06-16", "2026-06-23"],
        plastic: ["2026-06-18"],
        paper: ["2026-06-20"],
        glass: ["2026-06-21"],
        bio: ["2026-06-17"]
    };

    let nextDate = null;
    let nextType = null;

    for (const type in mockSchedule) {
        mockSchedule[type].forEach(dateStr => {
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
// 6. CALENDAR
// ---------------------------------------

document.querySelectorAll(".waste-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        generateCalendar(btn.dataset.type);
    });
});

function generateCalendar(type) {

    const mockSchedule = {
        general: ["2026-06-16", "2026-06-23"],
        plastic: ["2026-06-18"],
        paper: ["2026-06-20"],
        glass: ["2026-06-21"],
        bio: ["2026-06-17"]
    };

    const dates = mockSchedule[type] || [];

    calendarContainer.innerHTML = `
        <h3>${type.toUpperCase()} collection days</h3>
        <ul>
            ${dates.map(d => `<li>${new Date(d).toDateString()}</li>`).join("")}
        </ul>
    `;
}

// ---------------------------------------
// 7. NOTIFICATIONS
// ---------------------------------------

notificationToggle.addEventListener("change", () => {
    localStorage.setItem("notifyEnabled", notificationToggle.checked);
});

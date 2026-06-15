/* ---------------------------------------
   Waste Collection Reminder – app.js
---------------------------------------- */

// Elements
const addressInput = document.getElementById("addressInput");
const saveAddressBtn = document.getElementById("saveAddressBtn");
const addressStatus = document.getElementById("addressStatus");

const nextCollectionSection = document.getElementById("next-collection");
const nextCollectionInfo = document.getElementById("nextCollectionInfo");

const calendarSection = document.getElementById("calendar-section");
const calendarContainer = document.getElementById("calendarContainer");

const notificationToggle = document.getElementById("notifyToggle");
const notificationSection = document.getElementById("notification-section");


// ---------------------------------------
// 1. Mock waste collection data
// ---------------------------------------

const wasteSchedule = {
    general: ["2024-06-05", "2024-06-12", "2024-06-19"],
    plastic: ["2024-06-07", "2024-06-21"],
    paper: ["2024-06-10", "2024-06-24"],
    glass: ["2024-06-15"],
    bio: ["2024-06-04", "2024-06-11", "2024-06-18"]
};


// ---------------------------------------
// 2. Save address
// ---------------------------------------

saveAddressBtn.addEventListener("click", async () => {

    const address = addressInput.value.trim();
    const email = document.getElementById("emailInput").value.trim();

    if (address.length < 3 || email.length < 5) {
        addressStatus.textContent = "Please enter valid data.";
        return;
    }

    try {
        const response = await fetch(
            "https://YOUR-FUNCTION-APP.azurewebsites.net/api/subscribe",
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

        addressStatus.textContent = data.message;

        localStorage.setItem("userAddress", address);

        showAppSections();

    } catch (error) {
        console.error(error);
        addressStatus.textContent = "Error sending data.";
    }
});


// ---------------------------------------
// 3. Load saved address on startup
// ---------------------------------------

function showAppSections() {
    nextCollectionSection.classList.remove("hidden");
    calendarSection.classList.remove("hidden");
    notificationSection.classList.remove("hidden");

    loadNextCollection();
    generateCalendar("general");
}

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
})();


// ---------------------------------------
// 4. Calculate next collection day
// ---------------------------------------

function loadNextCollection() {
    const today = new Date();
    let nextDate = null;
    let nextType = null;

    for (const type in wasteSchedule) {
        wasteSchedule[type].forEach(dateStr => {
            const date = new Date(dateStr);
            if (date >= today && (!nextDate || date < nextDate)) {
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
// 5. Waste type buttons → update calendar
// ---------------------------------------

document.querySelectorAll(".waste-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        const type = btn.dataset.type;
        generateCalendar(type);
    });
});


// ---------------------------------------
// 6. Simple calendar generator
// ---------------------------------------

function generateCalendar(type) {
    const dates = wasteSchedule[type];

    calendarContainer.innerHTML = `
        <h3>${type.toUpperCase()} collection days</h3>
        <ul>
            ${dates.map(d => `<li>${new Date(d).toDateString()}</li>`).join("")}
        </ul>
    `;
}


// ---------------------------------------
// 7. Notification toggle
// ---------------------------------------

notificationToggle.addEventListener("change", () => {
    localStorage.setItem("notifyEnabled", notificationToggle.checked);
});

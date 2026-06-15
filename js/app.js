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

let currentStreet = null;

let wasteSchedule = {};

const CSV_URL = "https://wastereminderdata.blob.core.windows.net/waste-data/schedule_clean.csv";

async function loadScheduleFromCSV() {
    try {
        const response = await fetch(CSV_URL);
        const csvText = await response.text();
        parseScheduleCSV(csvText);

        if (currentStreet) {
            filterAndRender();
        }

    } catch (error) {
        console.error("CSV load error:", error);
    }
}

function parseScheduleCSV(csvText) {

    const rows = csvText.trim().split("\n").slice(1);

    wasteSchedule = {
        plastic: [],
        paper: [],
        glass: [],
        bio: [],
        mixed: []
    };

    rows.forEach(row => {

        const [street, date, type] = row.split(",").map(x => x.trim());

        if (!wasteSchedule[type]) {
            wasteSchedule[type] = [];
        }

        wasteSchedule[type].push({
            street,
            date
        });
    });
}

saveAddressBtn.addEventListener("click", async () => {

    const address = addressInput.value.trim();
    const email = emailInput.value.trim();

    if (!address || !email) {
        addressStatus.textContent = "Please enter valid data.";
        return;
    }

    currentStreet = address;

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

        filterAndRender();

    } catch (error) {
        console.error(error);
        addressStatus.textContent = "Error sending data.";
    }
});

function showAppSections() {
    nextCollectionSection.classList.remove("hidden");
    calendarSection.classList.remove("hidden");
    notificationSection.classList.remove("hidden");
}

(function init() {

    const savedAddress = localStorage.getItem("userAddress");

    if (savedAddress) {
        addressInput.value = savedAddress;
        currentStreet = savedAddress;
    }

    loadScheduleFromCSV().then(() => {
        if (currentStreet) {
            showAppSections();
            filterAndRender();
        }
    });

})();

function filterAndRender() {

    const filtered = {};

    for (const type in wasteSchedule) {

        filtered[type] = (wasteSchedule[type] || []).filter(item => {
            return item.street === currentStreet;
        });
    }

    loadNextCollection(filtered);
    generateCalendar(filtered);
}

function loadNextCollection(data) {

    const today = new Date();

    let nextDate = null;
    let nextType = null;

    for (const type in data) {

        data[type].forEach(item => {

            const date = new Date(item.date);

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

document.querySelectorAll(".waste-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        generateCalendar(filteredData, btn.dataset.type);
    });
});

function generateCalendar(data, type = "general") {

    const dates = (data?.[type] || []).map(x => x.date);

    calendarContainer.innerHTML = `
        <h3>${type.toUpperCase()} collection days</h3>
        <ul>
            ${dates.map(d => `<li>${new Date(d).toDateString()}</li>`).join("")}
        </ul>
    `;
}

notificationToggle.addEventListener("change", () => {
    localStorage.setItem("notifyEnabled", notificationToggle.checked);
});

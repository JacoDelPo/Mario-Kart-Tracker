import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    doc, 
    setDoc, 
    deleteDoc, 
    onSnapshot 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyDtntqbZUVkpMALlUQTdQU3YXL9pN_g0as",
    authDomain: "mario-kart-wii-tracker.firebaseapp.com",
    projectId: "mario-kart-wii-tracker",
    storageBucket: "mario-kart-wii-tracker.firebasestorage.app",
    messagingSenderId: "176208409500",
    appId: "1:176208409500:web:d76c4e10b8bca0e2c9ce59",
    measurementId: "G-MHVQ34HKHK"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let sessionsCache = [];

// ---------- Sincronizzazione in tempo reale con Firestore ----------
onSnapshot(collection(db, "sessions"), (snapshot) => {
    sessionsCache = [];
    snapshot.forEach((docSnap) => {
        sessionsCache.push(docSnap.data());
    });
    
    renderSessions();
    renderHistory();
    showSession();
    renderRaces();
});

// ---------- Salvataggio dati sessione ----------
async function saveCurrentSessionData(session) {
    await setDoc(doc(db, "sessions", String(session.id)), session);
}

// ---------- Creazione e visualizzazione ----------
async function createSession() {
    const newId = Date.now();
    const session = {
        id: newId,
        name: "Session " + (sessionsCache.length + 1),
        date: new Date().toLocaleString("it-IT"),
        status: "open",
        races: []
    };

    await setDoc(doc(db, "sessions", String(newId)), session);
}

function renderSessions() {
    const list = document.getElementById("SessionList");
    if (!list) return;

    list.innerHTML = "";

    sessionsCache.forEach(function (session) {
        if (session.status === "closed") return;

        const card = document.createElement("a");
        card.className = "session-card";
        card.href = "session.html?id=" + session.id;

        const title = document.createElement("h3");
        title.textContent = session.name;

        const date = document.createElement("p");
        date.textContent = session.date;

        card.appendChild(title);
        card.appendChild(date);
        list.appendChild(card);
    });
}

function renderHistory() {
    const list = document.getElementById("historyList");
    if (!list) return;

    list.innerHTML = "";

    sessionsCache.forEach(function (session) {
        if (session.status !== "closed") return;

        const card = document.createElement("a");
        card.className = "session-card";
        card.href = "session.html?id=" + session.id;

        const title = document.createElement("h3");
        title.textContent = session.name;

        const date = document.createElement("p");
        date.textContent = session.date;

        card.appendChild(title);
        card.appendChild(date);
        list.appendChild(card);
    });
}

// ---------- Pagina della sessione ----------
function showSession() {
    const title = document.getElementById("sessionTitle");
    if (!title) return;

    const id = new URLSearchParams(window.location.search).get("id");
    const session = sessionsCache.find(function (s) {
        return String(s.id) === id;
    });

    title.textContent = session ? session.name : "Session not found";
}

// ---------- Gestione Gare nella Sessione ----------
function getCurrentImageSession() {
    const id = new URLSearchParams(window.location.search).get("id");
    return sessionsCache.find(s => String(s.id) === id);
}

function renderRaces() {
    const tableBody = document.getElementById("raceTableBody");
    if (!tableBody) return;

    tableBody.innerHTML = "";
    const session = getCurrentImageSession();
    if (!session) return;

    const isClosed = session.status === "closed";

    const btnAddRace = document.getElementById("btnAddRace");
    if (btnAddRace) btnAddRace.style.display = isClosed ? "none" : "block";

    const btnEndSession = document.getElementById("btnEndSession");
    if (btnEndSession) btnEndSession.style.display = isClosed ? "none" : "block";

    if (!session.races) {
        session.races = [];
    }

    function createPositionInput(fieldValue, fieldKey, race) {
        const td = document.createElement("td");
        const select = document.createElement("select");
        select.className = "race-input position-input";
        select.disabled = isClosed;

        const defaultOption = document.createElement("option");
        defaultOption.value = "";
        defaultOption.textContent = "-";
        select.appendChild(defaultOption);

        for (let i = 1; i <= 12; i++) {
            const option = document.createElement("option");
            option.value = i;
            option.textContent = i;
            if (String(fieldValue) === String(i)) {
                option.selected = true;
            }
            select.appendChild(option);
        }

        if (!isClosed) {
            select.addEventListener("keydown", function (e) {
                if (e.key === "Backspace" || e.key === "Delete") {
                    e.preventDefault();
                    select.value = "";
                    race[fieldKey] = "";
                    saveCurrentSessionData(session);
                }
            });

            select.addEventListener("change", function () {
                race[fieldKey] = select.value;
                saveCurrentSessionData(session);
            });
        }

        td.appendChild(select);
        return td;
    }

    session.races.forEach((race, index) => {
        const tr = document.createElement("tr");

        const tdTrack = document.createElement("td");
        const inputTrack = document.createElement("input");
        inputTrack.type = "text";
        inputTrack.className = "race-input";
        inputTrack.value = race.track || "";
        inputTrack.disabled = isClosed;
        
        if (!isClosed) {
            inputTrack.addEventListener("input", function () {
                race.track = inputTrack.value;
                saveCurrentSessionData(session);
            });
        }
        tdTrack.appendChild(inputTrack);

        const tdLemonard = createPositionInput(race.lemonard, "lemonard", race);
        const tdNicolicio = createPositionInput(race.nicolicio, "nicolicio", race);
        const tdJack = createPositionInput(race.jackopo, "jackopo", race);

        const tdAction = document.createElement("td");
        tdAction.style.textAlign = "center";
        
        if (!isClosed) {
            const btnDelete = document.createElement("button");
            btnDelete.textContent = "X";
            btnDelete.className = "btn-delete";
            btnDelete.onclick = function () {
                session.races.splice(index, 1);
                saveCurrentSessionData(session);
            };
            tdAction.appendChild(btnDelete);
        }

        tr.appendChild(tdTrack);
        tr.appendChild(tdLemonard);
        tr.appendChild(tdNicolicio);
        tr.appendChild(tdJack);
        tr.appendChild(tdAction);
        
        tableBody.appendChild(tr);
    });
}

// ---------- Collegamento pulsante "Add Race" ----------
const btnAddRace = document.getElementById("btnAddRace");
if (btnAddRace) {
    btnAddRace.addEventListener("click", function () {
        const session = getCurrentImageSession();
        if (!session) return;

        if (!session.races) session.races = [];
        
        session.races.push({ track: "", lemonard: "", nicolicio: "", jackopo: "" });
        saveCurrentSessionData(session);
    });
}

// ---------- Collegamento dei pulsanti ----------
const btnPlacements = document.getElementById("btnPlacements");
const btnHistory = document.getElementById("btnHistory");
const btnCreateSession = document.getElementById("btnCreateSession");
const btnBackSession = document.getElementById("btnBackSession");
const btnBackSelection = document.getElementById("btnBackSelection");
const btnBackHistory = document.getElementById("btnBackHistory");
const btnEndSession = document.getElementById("btnEndSession");

if (btnPlacements) {
    btnPlacements.addEventListener("click", function () {
        window.location.href = "selection.html";
    });
}

if (btnHistory) {
    btnHistory.addEventListener("click", function () {
        window.location.href = "history.html";
    });
}

if (btnCreateSession) {
    btnCreateSession.addEventListener("click", createSession);
}

if (btnBackSession) {
    btnBackSession.addEventListener("click", function () {
        const session = getCurrentImageSession();
        if (session && session.status === "closed") {
            window.location.href = "history.html";
        } else {
            window.location.href = "selection.html";
        }
    });
}

if (btnBackSelection) {
    btnBackSelection.addEventListener("click", function () {
        window.location.href = "index.html";
    });
}

if (btnBackHistory) {
    btnBackHistory.addEventListener("click", function () {
        window.location.href = "index.html";
    });
}

if (btnEndSession) {
    btnEndSession.addEventListener("click", async function () {
        const session = getCurrentImageSession();
        if (!session) return;

        if (confirm("Vuoi chiudere questa sessione? Verrà spostata nella History.")) {
            session.status = "closed";
            await saveCurrentSessionData(session);
            window.location.href = "selection.html";
        }
    });
}

const btnDebugClear = document.getElementById("btnDebugClear");
if (btnDebugClear) {
    btnDebugClear.addEventListener("click", async function () {
        if (confirm("Delete ALL sessions?")) {
            for (const session of sessionsCache) {
                await deleteDoc(doc(db, "sessions", String(session.id)));
            }
        }
    });
}

// Sincronizzazione continua dello sfondo tra le pagine
const animDuration = 10; // Deve corrispondere ai secondi dell'animazione nel CSS (es. 10s)
let bgStartTime = sessionStorage.getItem('bgStartTime');

if (!bgStartTime) {
    bgStartTime = Date.now();
    sessionStorage.setItem('bgStartTime', bgStartTime);
}

const elapsedSeconds = (Date.now() - parseInt(bgStartTime)) / 1000;
const delay = - (elapsedSeconds % animDuration);
document.body.style.animationDelay = `${delay}s`;
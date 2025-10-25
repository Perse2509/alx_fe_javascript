// Keys for localStorage
const LS_QUOTES = "dqg_quotes_v2";
const LS_FILTER = "dqg_last_filter";
const SS_LAST_IDX = "dqg_last_quote";

// Default quotes
const defaultQuotes = [
  { text: "The only way to do great work is to love what you do.", category: "Motivation" },
  { text: "In the middle of difficulty lies opportunity.", category: "Inspiration" },
  { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", category: "Perseverance" },
  { text: "Happiness is not something ready made. It comes from your own actions.", category: "Happiness" },
  { text: "Life is what happens when you're busy making other plans.", category: "Life" },
  { text: "Do not watch the clock. Do what it does. Keep going.", category: "Time Management" },
  { text: "There is light at the end of the tunnel.", category: "Hope" },
  { text: "Finish what you started.", category: "Perseverance" },
  { text: "Believe in yourself and all that you are.", category: "Self-Belief" }
];


// State
let quotes = [];
let filteredQuotes = [];
let currentFilter = "all";
let selectedCategory = "all";


// DOM Elements
const quoteDisplay = document.getElementById("quoteDisplay");
const newQuoteBtn = document.getElementById("newQuote");
const addQuoteBtn = document.getElementById("addQuoteButton");
const exportBtn = document.getElementById("exportBtn");
const importFileInput = document.getElementById("importFile");
const clearStorageBtn = document.getElementById("clearStorage");
const quoteList = document.getElementById("quoteList");
const categoryFilter = document.getElementById("categoryFilter");

// ====== Load & Save ======
function saveQuotes() {
  localStorage.setItem(LS_QUOTES, JSON.stringify(quotes));
}
function loadQuotes() {
  const saved = localStorage.getItem(LS_QUOTES);
  if (saved) {
    quotes = JSON.parse(saved);
  } else {
    quotes = defaultQuotes.slice();
    saveQuotes();
  }
}
function saveLastFilter() {
  localStorage.setItem(LS_FILTER, currentFilter);
}
function loadLastFilter() {
  const saved = localStorage.getItem(LS_FILTER);
  return saved || "all";
}

// ====== Category Handling ======
function getUniqueCategories() {
  const categories = quotes.map(q => q.category.trim());
  return Array.from(new Set(categories));
}

function populateCategories() {
  const categories = getUniqueCategories();
  categoryFilter.innerHTML = `<option value="all">All Categories</option>`;
  categories.forEach(cat => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    if (cat === currentFilter) option.selected = true;
    categoryFilter.appendChild(option);
  });
}

// ====== Filtering ======
function filterQuotes() {
  currentFilter = categoryFilter.value;
  saveLastFilter();

  if (currentFilter === "all") {
    filteredQuotes = quotes;
  } else {
    filteredQuotes = quotes.filter(q => q.category === currentFilter);
  }

  renderQuoteList();
  showRandomQuote();
}

// ====== Display Functions ======
function showQuoteAtIndex(index) {
  if (filteredQuotes.length === 0) {
    quoteDisplay.textContent = "No quotes available for this category.";
    return;
  }
  const q = filteredQuotes[index];
  quoteDisplay.innerHTML = `
    <p style="font-size:1.3rem;font-weight:bold">"${q.text}"</p>
    <div class="category">Category: ${q.category}</div>
  `;
}

function showRandomQuote() {
  if (filteredQuotes.length === 0) {
    quoteDisplay.textContent = "No quotes available.";
    return;
  }
  const randomIndex = Math.floor(Math.random() * filteredQuotes.length);
  showQuoteAtIndex(randomIndex);
}

function renderQuoteList() {
  quoteList.innerHTML = "";
  filteredQuotes.forEach(q => {
    const div = document.createElement("div");
    div.classList.add("quote-item");
    div.innerHTML = `
      <div><strong>"${q.text}"</strong><div class="meta">${q.category}</div></div>
    `;
    quoteList.appendChild(div);
  });
}

// ====== Add Quote ======
function addQuote() {
  const text = document.getElementById("newQuoteText").value.trim();
  const category = document.getElementById("newQuoteCategory").value.trim() || "General";

  if (!text) {
    alert("Please enter a quote!");
    return;
  }

  quotes.push({ text, category });
  saveQuotes();
  populateCategories(); // Update dropdown
  filterQuotes(); 
  // 🔹 Send quote to server
sendQuoteToServer({ text, category });

  showRandomQuote();
  document.getElementById("newQuoteText").value = "";
  document.getElementById("newQuoteCategory").value = "";
  alert("Quote added successfully!");
}

// ====== Import/Export ======
function exportQuotes() {
  const blob = new Blob([JSON.stringify(quotes, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "quotes.json";
  a.click();
  URL.revokeObjectURL(url);
}

function importFromJsonFile(event) {
  const fileReader = new FileReader();
  fileReader.onload = function(evt) {
    try {
      const importedQuotes = JSON.parse(evt.target.result);
      quotes.push(...importedQuotes);
      saveQuotes();
      populateCategories();
      filterQuotes();
      alert("Quotes imported successfully!");
    } catch (e) {
      alert("Invalid JSON file.");
    }
  };
  fileReader.readAsText(event.target.files[0]);
}

// ====== Simulate Server Fetch ======
// ====== Fetch Quotes from Server (using real API) ======
async function fetchQuotesFromServer() {
  try {
    const response = await fetch("https://jsonplaceholder.typicode.com/posts");
    if (!response.ok) throw new Error("Network response was not ok");

    const data = await response.json();

    // Map the fetched posts to fit your quote structure
    const serverQuotes = data.slice(0, 10).map(post => ({
      text: post.title.charAt(0).toUpperCase() + post.title.slice(1),
      category: "Server Quote"
    }));

    // Merge new server quotes (avoid duplicates)
    const newQuotes = serverQuotes.filter(
      sq => !quotes.some(local => local.text === sq.text)
    );
    quotes.push(...newQuotes);

    saveQuotes();
    populateCategories();
    filterQuotes();

    console.log("✅ Quotes successfully fetched from https://jsonplaceholder.typicode.com/posts");
  } catch (error) {
    console.error("❌ Error fetching quotes from server:", error);
  }
}

// ====== Send New Quote to Server (POST) ======
async function sendQuoteToServer(quote) {
  try {
    const response = await fetch("https://jsonplaceholder.typicode.com/posts", {
      method: "POST", // ✅ Required
      headers: {
        "Content-Type": "application/json" // ✅ Required
      },
      body: JSON.stringify(quote)
    });

    const result = await response.json();
    console.log("✅ Quote successfully sent to server:", result);
    return result;
  } catch (error) {
    console.error("❌ Error sending quote to server:", error);
  }
}

// ====== Sync Quotes Between Local and Server ======
// ====== Sync Quotes Between Local and Server ======
async function syncQuotes() {
  try {
    console.log("🔄 Starting quote synchronization...");

    // 1️⃣ Fetch server quotes
    const response = await fetch("https://jsonplaceholder.typicode.com/posts");
    if (!response.ok) throw new Error("Failed to fetch server quotes");

    const serverData = await response.json();

    // 2️⃣ Convert server posts to quote format
    const serverQuotes = serverData.slice(0, 10).map(post => ({
      text: post.title.charAt(0).toUpperCase() + post.title.slice(1),
      category: "Server Quote"
    }));

    // 3️⃣ Find new local quotes not on server
    const unsyncedLocalQuotes = quotes.filter(
      q => !serverQuotes.some(sq => sq.text === q.text)
    );

    // 4️⃣ Send each unsynced quote to server
    for (const quote of unsyncedLocalQuotes) {
      await sendQuoteToServer(quote);
    }

    // 5️⃣ Merge new server quotes locally (avoid duplicates)
    const newServerQuotes = serverQuotes.filter(
      sq => !quotes.some(local => local.text === sq.text)
    );
    quotes.push(...newServerQuotes);

    // 6️⃣ Save updates and refresh display
    saveQuotes();
    populateCategories();
    filterQuotes();

    // ✅ Success message
    console.log("Quotes synced with server!");
    alert("Quotes synced with server!");
  } catch (error) {
    console.error("❌ Error during sync:", error);
  }
}


// ====== Initialization ======
function init() {
  loadQuotes();
  currentFilter = loadLastFilter();
  populateCategories();
  filterQuotes();

  newQuoteBtn.addEventListener("click", showRandomQuote);
  addQuoteBtn.addEventListener("click", addQuote);
  exportBtn.addEventListener("click", exportQuotes);
  importFileInput.addEventListener("change", importFromJsonFile);
  clearStorageBtn.addEventListener("click", () => {
    if (confirm("Clear all quotes and reset?")) {
      localStorage.clear();
      quotes = defaultQuotes.slice();
      populateCategories();
      filterQuotes();
    }
  });
}
// Automatically sync quotes every 60 seconds (1 minute)
setInterval(syncQuotes, 60000);

// ====== Create Add Quote Form (if missing) ======
function createAddQuoteForm() {
  const formContainer = document.getElementById("addQuoteFormContainer");

  // Prevent duplicates if already exists
  if (document.getElementById("newQuoteText")) return;

  // Create input for quote text
  const textInput = document.createElement("input");
  textInput.type = "text";
  textInput.id = "newQuoteText";
  textInput.placeholder = "Enter new quote";
  textInput.style.margin = "5px";
  textInput.style.width = "90%";

  // Create input for category
  const categoryInput = document.createElement("input");
  categoryInput.type = "text";
  categoryInput.id = "newQuoteCategory";
  categoryInput.placeholder = "Enter category";
  categoryInput.style.margin = "5px";
  categoryInput.style.width = "90%";

  // Create Add Quote button
  const addButton = document.createElement("button");
  addButton.id = "addQuoteButton";
  addButton.textContent = "Add Quote";
  addButton.style.marginTop = "10px";
  addButton.style.padding = "8px 16px";
  addButton.style.cursor = "pointer";

  // Append all elements to container
  formContainer.appendChild(textInput);
  formContainer.appendChild(categoryInput);
  formContainer.appendChild(addButton);
}


function init() {
  loadQuotes();
  currentFilter = loadLastFilter();
  populateCategories();
  filterQuotes();

  // 🔹 Ensure form exists
  createAddQuoteForm();

  // 🔹 Attach events
  newQuoteBtn.addEventListener("click", showRandomQuote);
  addQuoteBtn.addEventListener("click", addQuote);
  exportBtn.addEventListener("click", exportQuotes);
  importFileInput.addEventListener("change", importFromJsonFile);
  clearStorageBtn.addEventListener("click", () => {
    if (confirm("Clear all quotes and reset?")) {
      localStorage.clear();
      quotes = defaultQuotes.slice();
      populateCategories();
      filterQuotes();
    }
  });
}

document.addEventListener("DOMContentLoaded", init);









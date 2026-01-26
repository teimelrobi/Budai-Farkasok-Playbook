/* Playbook Editor – robust, ID-aligned with editor.html */

const DEFAULT_SITUATIONS = [
  "Támadás",
  "Védekezés",
  "Lerohanás",
  "Visszarendeződés",
  "Létszámfölény",
  "Létszámhátrány"
];

const DEFAULT_DEFENSES = [
  "",     // üres = nincs / mind
  "6:0",
  "5:1"
];

const STORE_KEY = "playbook_plays";

function byId(id) { return document.getElementById(id); }

function safeParseJson(str, fallback) {
  try { return JSON.parse(str); } catch { return fallback; }
}

function loadFromStorage() {
  const raw = localStorage.getItem(STORE_KEY);
  if (!raw) return null;
  const data = safeParseJson(raw, null);
  if (!data || !Array.isArray(data)) return null;
  return data;
}

function saveToStorage(plays) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(plays));
  } catch (e) {
    console.error("LocalStorage save error:", e);
    alert("Nem sikerült menteni (LocalStorage hiba).");
  }
}

function clearStorage() {
  localStorage.removeItem(STORE_KEY);
}

async function loadFromSiteJson() {
  // a playbook adatfájl helye
  const res = await fetch("assets/data/plays.json", { cache: "no-store" });
  if (!res.ok) throw new Error("Nem találom: assets/data/plays.json");
  const data = await res.json();
  if (!Array.isArray(data)) throw new Error("plays.json nem tömb (Array).");
  return data;
}

function normalizePlay(p, idx) {
  const id = (p && p.id != null && String(p.id).trim() !== "") ? String(p.id) : String(idx + 1);
  return {
    id,
    name: (p && p.name) ? String(p.name) : "",
    defense: (p && p.defense) ? String(p.defense) : "",
    situation: (p && p.situation) ? String(p.situation) : "",
    media: (p && p.media) ? String(p.media) : "",
    description: (p && p.description) ? String(p.description) : ""
  };
}

function makeEl(tag, cls, html) {
  const el = document.createElement(tag);
  if (cls) el.className = cls;
  if (html != null) el.innerHTML = html;
  return el;
}

function makeSelect(options, value) {
  const sel = document.createElement("select");
  sel.className = "input";
  options.forEach(opt => {
    const o = document.createElement("option");
    o.value = opt;
    o.textContent = opt === "" ? "—" : opt;
    sel.appendChild(o);
  });
  sel.value = options.includes(value) ? value : (options[0] ?? "");
  return sel;
}

function makeInput(value, placeholder = "") {
  const inp = document.createElement("input");
  inp.className = "input";
  inp.type = "text";
  inp.value = value ?? "";
  inp.placeholder = placeholder;
  return inp;
}

function makeTextarea(value, placeholder = "") {
  const ta = document.createElement("textarea");
  ta.className = "input textarea";
  ta.rows = 4;
  ta.value = value ?? "";
  ta.placeholder = placeholder;
  return ta;
}

let plays = [];
let hasBootstrapped = false;

function render() {
  const tbody = byId("tbody");
  tbody.innerHTML = "";

  plays.forEach((p, i) => {
    const tr = document.createElement("tr");

    // ID
    const tdId = document.createElement("td");
    const idInput = makeInput(p.id, "pl. 01");
    idInput.style.width = "90px";
    idInput.addEventListener("input", () => {
      plays[i].id = idInput.value.trim();
      saveToStorage(plays);
    });
    tdId.appendChild(idInput);
    tr.appendChild(tdId);

    // Név
    const tdName = document.createElement("td");
    const nameInput = makeInput(p.name, "Mozgás neve");
    nameInput.addEventListener("input", () => {
      plays[i].name = nameInput.value;
      saveToStorage(plays);
    });
    tdName.appendChild(nameInput);
    tr.appendChild(tdName);

    // Véd.
    const tdDef = document.createElement("td");
    const defSel = makeSelect(DEFAULT_DEFENSES, p.defense);
    defSel.addEventListener("change", () => {
      plays[i].defense = defSel.value;
      saveToStorage(plays);
    });
    tdDef.appendChild(defSel);
    tr.appendChild(tdDef);

    // Szituáció
    const tdSit = document.createElement("td");
    const sitSel = makeSelect(["", ...DEFAULT_SITUATIONS], p.situation);
    sitSel.addEventListener("change", () => {
      plays[i].situation = sitSel.value;
      saveToStorage(plays);
    });
    tdSit.appendChild(sitSel);
    tr.appendChild(tdSit);

    // Media
    const tdMedia = document.createElement("td");
    const mediaInput = makeInput(p.media, "assets/media/01_video.mp4");
    mediaInput.addEventListener("input", () => {
      plays[i].media = mediaInput.value;
      saveToStorage(plays);
    });
    tdMedia.appendChild(mediaInput);
    tr.appendChild(tdMedia);

    // Leírás
    const tdDesc = document.createElement("td");
    const descTa = makeTextarea(p.description, "Kulcspontok…");
    descTa.addEventListener("input", () => {
      plays[i].description = descTa.value;
      saveToStorage(plays);
    });
    tdDesc.appendChild(descTa);
    tr.appendChild(tdDesc);

    // Művelet
    const tdOps = document.createElement("td");

    const btnDup = makeEl("button", "btn mini", "Duplikál");
    btnDup.addEventListener("click", () => {
      const copy = { ...plays[i] };
      // új ID-t ajánlunk (ne ütközzön)
      copy.id = (copy.id ? (copy.id + "_copy") : String(Date.now()));
      plays.splice(i + 1, 0, copy);
      saveToStorage(plays);
      render();
    });

    const btnDel = makeEl("button", "btn mini danger", "Töröl");
    btnDel.addEventListener("click", () => {
      if (!confirm("Biztos törlöd ezt a figurát?")) return;
      plays.splice(i, 1);
      saveToStorage(plays);
      render();
    });

    tdOps.appendChild(btnDup);
    tdOps.appendChild(document.createTextNode(" "));
    tdOps.appendChild(btnDel);

    tr.appendChild(tdOps);

    tbody.appendChild(tr);
  });
}

async function bootstrap() {
  // 1) próbáljuk LocalStorage-ból
  const fromStore = loadFromStorage();
  if (fromStore) {
    plays = fromStore.map(normalizePlay);
    hasBootstrapped = true;
    render();
    return;
  }

  // 2) ha nincs, akkor a site plays.json-ból
  try {
    const fromFile = await loadFromSiteJson();
    plays = fromFile.map(normalizePlay);
    saveToStorage(plays);
    hasBootstrapped = true;
    render();
  } catch (e) {
    console.warn(e);
    plays = [];
    saveToStorage(plays);
    hasBootstrapped = true;
    render();
  }
}

function exportJson() {
  const clean = plays.map((p, idx) => normalizePlay(p, idx));
  const blob = new Blob([JSON.stringify(clean, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "plays.json";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(a.href);
}

function importJson(file) {
  const reader = new FileReader();
  reader.onload = () => {
    const data = safeParseJson(reader.result, null);
    if (!Array.isArray(data)) {
      alert("Hibás JSON: nem tömb (Array).");
      return;
    }
    plays = data.map(normalizePlay);
    saveToStorage(plays);
    render();
    alert("Import kész.");
  };
  reader.readAsText(file);
}

function addNewPlay() {
  const nextId = String(plays.length + 1);
  plays.unshift({
    id: nextId,
    name: "",
    defense: "",
    situation: "",
    media: "",
    description: ""
  });
  saveToStorage(plays);
  render();
  // fókusz az első sor név mezőre
  setTimeout(() => {
    const firstNameInput = document.querySelector("#tbody tr:first-child td:nth-child(2) input");
    if (firstNameInput) firstNameInput.focus();
  }, 50);
}

document.addEventListener("DOMContentLoaded", async () => {
  // Gombok (ID-k a editor.html alapján!)
  const btnAdd = byId("add");
  const btnExport = byId("export");
  const fileImport = byId("import");
  const btnReset = byId("reset");

  btnAdd.addEventListener("click", () => addNewPlay());
  btnExport.addEventListener("click", () => exportJson());

  fileImport.addEventListener("change", (e) => {
    const f = e.target.files && e.target.files[0];
    if (f) importJson(f);
    e.target.value = ""; // reset
  });

  btnReset.addEventListener("click", async () => {
    if (!confirm("Visszaállítod a szerkesztőt az oldalon lévő plays.json alapján?")) return;
    clearStorage();
    plays = [];
    render();
    await bootstrap();
  });

  await bootstrap();
});

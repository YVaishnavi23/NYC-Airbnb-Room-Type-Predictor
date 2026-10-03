// ---- Config ----------------------------------------------------------
const API_URL = "http://127.0.0.1:8000";

// Optional: name your model's classes, in the same order as model.classes_
// e.g. ["Entire home/apt", "Private room", "Shared room"]
const CLASS_LABELS = [];

// ---- Data ------------------------------------------------------------
const BOROUGHS = {
  "Manhattan":     { code: "M",  color: "#EE352E", center: [40.7831, -73.9712], hoods: ["Battery Park City","Chelsea","Chinatown","Civic Center","East Harlem","East Village","Financial District","Flatiron District","Gramercy","Greenwich Village","Harlem","Hell's Kitchen","Inwood","Kips Bay","Little Italy","Lower East Side","Marble Hill","Midtown","Morningside Heights","Murray Hill","NoHo","Nolita","Roosevelt Island","SoHo","Stuyvesant Town","Theater District","Tribeca","Two Bridges","Upper East Side","Upper West Side","Washington Heights","West Village"] },
  "Brooklyn":      { code: "B",  color: "#FF6319", center: [40.6782, -73.9442], hoods: ["Bath Beach","Bay Ridge","Bedford-Stuyvesant","Bensonhurst","Bergen Beach","Boerum Hill","Borough Park","Brighton Beach","Brooklyn Heights","Brownsville","Bushwick","Canarsie","Carroll Gardens","Clinton Hill","Cobble Hill","Columbia St","Coney Island","Crown Heights","Cypress Hills","DUMBO","Downtown Brooklyn","Dyker Heights","East Flatbush","East New York","Flatbush","Flatlands","Fort Greene","Fort Hamilton","Gowanus","Gravesend","Greenpoint","Kensington","Manhattan Beach","Midwood","Mill Basin","Navy Yard","Park Slope","Prospect Heights","Prospect-Lefferts Gardens","Red Hook","Sea Gate","Sheepshead Bay","South Slope","Sunset Park","Vinegar Hill","Williamsburg","Windsor Terrace"] },
  "Queens":        { code: "Q",  color: "#B933AD", center: [40.7282, -73.7949], hoods: ["Arverne","Astoria","Bay Terrace","Bayside","Bayswater","Belle Harbor","Bellerose","Breezy Point","Briarwood","Cambria Heights","College Point","Corona","Ditmars Steinway","Douglaston","East Elmhurst","Edgemere","Elmhurst","Far Rockaway","Flushing","Forest Hills","Fresh Meadows","Glendale","Hollis","Holliswood","Howard Beach","Jackson Heights","Jamaica","Jamaica Estates","Jamaica Hills","Kew Gardens","Kew Gardens Hills","Laurelton","Little Neck","Long Island City","Maspeth","Middle Village","Neponsit","Ozone Park","Queens Village","Rego Park","Richmond Hill","Ridgewood","Rockaway Beach","Rosedale","South Ozone Park","Springfield Gardens","St. Albans","Sunnyside","Whitestone","Woodhaven","Woodside"] },
  "Bronx":         { code: "X",  color: "#2fbf71", center: [40.8448, -73.8648], hoods: ["Allerton","Baychester","Belmont","Bronxdale","Castle Hill","City Island","Claremont Village","Clason Point","Co-op City","Concourse","Concourse Village","East Morrisania","Eastchester","Edenwald","Fieldston","Fordham","Highbridge","Hunts Point","Kingsbridge","Longwood","Melrose","Morris Heights","Morris Park","Morrisania","Mott Haven","Mount Eden","Mount Hope","North Riverdale","Norwood","Olinville","Parkchester","Pelham Bay","Pelham Gardens","Port Morris","Riverdale","Schuylerville","Soundview","Spuyten Duyvil","Throgs Neck","Tremont","Unionport","University Heights","Van Nest","Wakefield","West Farms","Westchester Square","Williamsbridge","Woodlawn"] },
  "Staten Island": { code: "S",  color: "#5b8cff", center: [40.5795, -74.1502], hoods: ["Arden Heights","Arrochar","Bay Terrace, Staten Island","Bull's Head","Castleton Corners","Clifton","Concord","Dongan Hills","Eltingville","Emerson Hill","Graniteville","Grant City","Great Kills","Grymes Hill","Howland Hook","Huguenot","Lighthouse Hill","Mariners Harbor","Midland Beach","New Brighton","New Dorp","New Dorp Beach","New Springville","Oakwood","Port Richmond","Prince's Bay","Randall Manor","Rosebank","Rossville","Shore Acres","Silver Lake","South Beach","St. George","Stapleton","Todt Hill","Tompkinsville","Tottenville","West Brighton","Westerleigh","Willowbrook"] }
};

// ---- Elements --------------------------------------------------------
const $ = id => document.getElementById(id);
const form = $("form"), hood = $("neighbourhood"), boroughBox = $("boroughs");
const NUM_FIELDS = ["latitude","longitude","price","minimum_nights","number_of_reviews","reviews_per_month","calculated_host_listings_count","availability_365"];
const INT_FIELDS = ["minimum_nights","number_of_reviews","calculated_host_listings_count","availability_365"];
let borough = "";

// ---- Borough picker --------------------------------------------------
Object.entries(BOROUGHS).forEach(([name, b]) => {
  const btn = document.createElement("button");
  btn.type = "button"; btn.setAttribute("role", "radio"); btn.setAttribute("aria-checked", "false");
  btn.style.setProperty("--c", b.color);
  btn.innerHTML = `<span class="dot">${b.code}</span>${name}`;
  btn.addEventListener("click", () => setBorough(name));
  boroughBox.appendChild(btn);
});

function setBorough(name, keepHood) {
  borough = name;
  const b = BOROUGHS[name];
  document.documentElement.style.setProperty("--accent", b.color);
  [...boroughBox.children].forEach(el => el.setAttribute("aria-checked", el.textContent.endsWith(name)));
  hood.disabled = false;
  hood.innerHTML = `<option value="">Choose a neighbourhood</option>` + b.hoods.map(h => `<option>${h}</option>`).join("");
  if (!keepHood) { $("latitude").value = b.center[0]; $("longitude").value = b.center[1]; }
  clearError(hood);
}

// ---- Sliders ---------------------------------------------------------
const bind = (rangeId, outId) => $(rangeId).addEventListener("input", e => $(outId).textContent = e.target.value);
bind("availability_365", "availability_out");
bind("calculated_host_listings_count", "host_out");

// ---- Validation (mirrors the Pydantic model) -------------------------
function setError(el, msg) { const f = el.closest(".field"); f.classList.add("bad"); f.querySelector(".err").textContent = msg; }
function clearError(el) { el.closest(".field")?.classList.remove("bad"); }
form.addEventListener("input", e => clearError(e.target));

function validate() {
  let ok = true;
  if (!borough) { boroughBox.animate([{ transform: "translateX(-4px)" }, { transform: "translateX(4px)" }, { transform: "none" }], 250); ok = false; }
  if (!hood.value) { setError(hood, "Choose a neighbourhood."); ok = false; }
  NUM_FIELDS.forEach(id => {
    const el = $(id), v = el.value;
    const n = Number(v);
    const min = el.min !== "" ? Number(el.min) : -Infinity;
    const max = el.max !== "" ? Number(el.max) : Infinity;
    if (v === "" || Number.isNaN(n)) { setError(el, "Enter a number."); ok = false; }
    else if (INT_FIELDS.includes(id) && !Number.isInteger(n)) { setError(el, "Use a whole number."); ok = false; }
    else if (n < min || n > max) { setError(el, `Must be between ${min} and ${max === Infinity ? "any" : max}.`); ok = false; }
  });
  return ok;
}

// ---- Submit ----------------------------------------------------------
form.addEventListener("submit", async e => {
  e.preventDefault();
  if (!validate()) return;

  const payload = { neighbourhood_group: borough, neighbourhood: hood.value };
  NUM_FIELDS.forEach(id => payload[id] = Number($(id).value));

  const btn = $("go");
  btn.classList.add("loading");
  showPanel("none");
  try {
    const res = await fetch(`${API_URL}/predict`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload)
    });
    if (!res.ok) {
      let detail = `Server returned ${res.status}.`;
      try {
        const body = await res.json();
        if (Array.isArray(body.detail)) detail = body.detail.map(d => `${d.loc.slice(-1)}: ${d.msg}`).join("\n");
      } catch {}
      throw new Error(detail);
    }
    render(await res.json());
  } catch (err) {
    const offline = err instanceof TypeError;
    $("error").textContent = offline ? `Can't reach the API at ${API_URL}. Start it with: uvicorn main:app --reload` : err.message;
    showPanel("error");
  } finally {
    btn.classList.remove("loading");
  }
});

// ---- Result ----------------------------------------------------------
function showPanel(which) {
  $("empty").hidden = which !== "empty";
  $("filled").hidden = which !== "filled";
  $("error").hidden = which !== "error";
}

function render({ prediction, probability }) {
  const top = probability.indexOf(Math.max(...probability));
  const label = CLASS_LABELS[top] ?? prediction;
  $("verdict").textContent = label;

  // reset, show, then animate on the next frame so transitions run
  const arc = $("arc"), pct = $("pct"), bars = $("bars");
  arc.style.transition = "none"; arc.style.strokeDashoffset = 327;
  bars.innerHTML = probability.map((p, i) => `
    <li><div class="meta"><span>${CLASS_LABELS[i] ?? (i === top ? prediction : "Class " + i)}</span><b>${(p * 100).toFixed(1)}%</b></div>
    <div class="track-bar"><div class="fill"></div></div></li>`).join("");
  showPanel("filled");

  requestAnimationFrame(() => requestAnimationFrame(() => {
    arc.style.transition = "";
    arc.style.strokeDashoffset = 327 * (1 - probability[top]);
    bars.querySelectorAll(".fill").forEach((f, i) => setTimeout(() => f.style.width = probability[i] * 100 + "%", i * 120));
    countUp(pct, probability[top] * 100);
  }));
}

function countUp(el, target) {
  const start = performance.now(), dur = 1200;
  (function tick(now) {
    const t = Math.min((now - start) / dur, 1);
    el.textContent = Math.round(target * (1 - Math.pow(1 - t, 3))) + "%";
    if (t < 1) requestAnimationFrame(tick);
  })(start);
}

// ---- Sample ----------------------------------------------------------
$("sample").addEventListener("click", () => {
  setBorough("Brooklyn", true);
  hood.value = "Williamsburg";
  Object.entries({ latitude: 40.7081, longitude: -73.9571, price: 145, minimum_nights: 3, number_of_reviews: 42, reviews_per_month: 1.2, calculated_host_listings_count: 2, availability_365: 220 })
    .forEach(([id, v]) => { $(id).value = v; $(id).dispatchEvent(new Event("input", { bubbles: true })); });
  form.querySelectorAll(".bad").forEach(f => f.classList.remove("bad"));
});

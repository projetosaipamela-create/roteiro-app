import { days, quickFilters, criticalReservations } from "../data/itinerary.js";
import { places, food } from "../data/places.js";
import { hotels } from "../data/hotels.js";

const ACCESS_PASSWORD = "famigliatoppa1501";
const ACCESS_KEY = "roteiroFamiliaAcesso";
const state = { dayId: days[0].id, section: "roteiro", filter: "all", query: "" };
const $ = (id) => document.getElementById(id);
const safe = (v = "") => String(v).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
const enc = (v = "") => encodeURIComponent(v);
const currentDay = () => days.find((day) => day.id === state.dayId) || days[0];
const place = (id) => places[id];
const meal = (id) => food[id];
const item = (id) => places[id] || food[id];

function initGate() {
  const unlocked = localStorage.getItem(ACCESS_KEY) === "ok";
  document.body.classList.toggle("locked", !unlocked);
  $("gateForm")?.addEventListener("submit", (event) => {
    event.preventDefault();
    if ($("gatePassword").value.trim().toLowerCase() === ACCESS_PASSWORD) {
      localStorage.setItem(ACCESS_KEY, "ok");
      document.body.classList.remove("locked");
      $("gatePassword").value = "";
      $("gateError").textContent = "";
    } else {
      $("gateError").textContent = "Senha incorreta. Confira com a família.";
      $("gatePassword").select();
    }
  });
}

function links(obj, theme) {
  const q = obj.address || obj.name;
  const base = [
    ["Google", `https://www.google.com/maps/search/?api=1&query=${enc(q)}`],
    ["Apple", `https://maps.apple.com/?q=${enc(q)}`]
  ];
  if (theme === "korea") base.unshift(["Naver", `https://map.naver.com/p/search/${enc(q)}`], ["Kakao", `https://map.kakao.com/?q=${enc(q)}`]);
  if (theme === "japan") base.push(["Transit", `https://world.jorudan.co.jp/mln/en/?p=0&from=&to=${enc(q)}`]);
  return `<div class="actions">${base.map(([label, href]) => `<a class="action" href="${href}" target="_blank" rel="noreferrer">${label}</a>`).join("")}<button class="action" data-copy="${safe(q)}">Copiar endereço</button></div>`;
}

function illustration(theme) {
  const icon = theme === "dubai" ? "✦" : theme === "korea" ? "♡" : "★";
  return `<svg viewBox="0 0 260 190" width="100%" height="100%" aria-hidden="true"><rect x="25" y="45" width="210" height="105" rx="26" fill="rgba(255,255,255,.22)"/><circle cx="76" cy="105" r="28" fill="rgba(255,255,255,.8)"/><path d="M48 105h56" stroke="#df3f48" stroke-width="12"/><rect x="135" y="70" width="62" height="62" rx="14" fill="rgba(255,230,111,.9)"/><text x="154" y="111" font-size="34" font-weight="900">?</text><text x="40" y="55" font-size="32">${icon}</text><text x="210" y="74" font-size="28">${icon}</text><path d="M38 160h184" stroke="rgba(255,255,255,.7)" stroke-width="9" stroke-linecap="round" stroke-dasharray="12 12"/></svg>`;
}

function visibleDays() {
  const q = state.query.trim().toLowerCase();
  return days.filter((day) => {
    const text = [day.date, day.city, day.title, day.subtitle, day.summary, day.planB, day.tags?.join(" "), day.stops?.map((s) => `${s.title} ${s.note} ${s.detail}`).join(" "), day.foodIds?.map((id) => food[id]?.name).join(" "), day.shopIds?.map((id) => places[id]?.name).join(" ")].join(" ").toLowerCase();
    if (q && !text.includes(q)) return false;
    if (state.filter === "booked") return day.tags?.some((tag) => tag.includes("contratado"));
    if (state.filter === "parks") return /parque|Disney|Universal|Nintendo/i.test(`${day.tags?.join(" ")} ${day.title}`);
    if (state.filter === "food") return day.foodIds?.length;
    if (state.filter === "shops") return day.shopIds?.length;
    if (state.filter === "rain") return /chuva|indoor|coberto|calor|clima|plano/i.test(`${day.tags?.join(" ")} ${day.planB}`);
    return true;
  });
}

function renderControls() {
  $("daySelect").innerHTML = `${days.map((day) => `<option value="${day.id}">${day.date} · ${day.city} · ${day.title}</option>`).join("")}<option value="critical">Reservas críticas</option>`;
  $("daySelect").value = state.dayId;
  $("quickFilters").innerHTML = quickFilters.map((f) => `<button class="${state.filter === f.id ? "active" : ""}" data-filter="${f.id}">${safe(f.label)}</button>`).join("");
}

function renderHero(day) {
  const card = $("dayCard");
  card.className = `day-card theme-${day.theme}`;
  $("heroEyebrow").textContent = `${day.date} · ${day.city}`;
  $("heroTitle").textContent = day.title;
  $("heroSubtitle").textContent = day.subtitle;
  $("heroChips").innerHTML = (day.tags || []).map((tag) => `<span class="chip">${safe(tag)}</span>`).join("");
  $("heroIllustration").innerHTML = illustration(day.theme);
}

function renderStop(stop, theme, open) {
  const related = (stop.placeIds || []).map(place).filter(Boolean);
  return `<details class="stop-card" ${open ? "open" : ""}><summary><span class="stop-time">${safe(stop.time)}</span><span><span class="stop-title">${safe(stop.title)}</span><span class="stop-meta">${safe(stop.duration || "")} · ${safe(stop.note || "")}</span></span></summary><div class="details-grid"><div class="detail-box"><strong>Como pensar esse ponto</strong><p>${safe(stop.detail || stop.note || "")}</p></div>${related.map((p) => `<div class="detail-box"><strong>${safe(p.name)}</strong><p>${safe(p.why || p.note || "")}</p><p><strong>Curiosidade/história:</strong> ${safe(p.curiosity || "Observar como este lugar se conecta à região do dia.")}</p><p><strong>Família:</strong> ${safe(p.family || "Encaixar conforme energia do grupo.")}</p><p class="small-note">${safe(p.hours || "Confirmar horário perto da data.")}</p>${links(p, theme)}</div>`).join("")}</div></details>`;
}

function renderRoteiro(day) {
  const extras = [...new Set([...(day.extraIds || []), ...(day.shopIds || [])])].map(item).filter(Boolean);
  $("section-roteiro").innerHTML = `<div class="intro-grid"><section class="info-card"><h3>Estratégia do dia</h3><p>${safe(day.summary)}</p></section><section class="info-card"><h3>Plano B chuva/calor</h3><p>${safe(day.planB)}</p></section></div><div class="timeline">${day.stops.map((stop, i) => renderStop(stop, day.theme, i === 0)).join("")}</div>${extras.length ? `<section class="info-card"><h3>Dicas encaixadas na região</h3><div class="food-grid">${extras.map((x) => `<article class="map-card"><h3>${safe(x.category || "dica")} · ${safe(x.region || x.city || "")}</h3><p><strong>${safe(x.name)}</strong></p><p>${safe(x.why || x.note || "")}</p>${links(x, day.theme)}</article>`).join("")}</div></section>` : ""}`;
}

function foodCard(x, theme) {
  return `<article class="food-card"><h3>${safe(x.name)}</h3><div class="tags">${(x.tags || []).map((tag) => `<span class="pill">${safe(tag)}</span>`).join("")}</div><p><strong>Região:</strong> ${safe(x.region)} · ${safe(x.city)}</p><p>${safe(x.note || x.why || "")}</p>${links(x, theme)}</article>`;
}

function renderFood(day) {
  const items = (day.foodIds || []).map(meal).filter(Boolean);
  const cafes = items.filter((x) => /café|coffee|starbucks|tea|dawn|reissue|flower|king/i.test(`${x.name} ${(x.tags || []).join(" ")} ${x.note}`));
  const restaurants = items.filter((x) => !cafes.includes(x));
  $("section-comida").innerHTML = `<section class="info-card"><h3>Região certa para comer</h3><p>Opções filtradas para o passeio do dia, priorizando família, experiência boa e comida cozida/sem cru.</p></section>${cafes.length ? `<section class="info-card"><h3>Cafés charmosos</h3><div class="food-grid">${cafes.map((x) => foodCard(x, day.theme)).join("")}</div></section>` : ""}${restaurants.length ? `<section class="info-card"><h3>Restaurantes</h3><div class="food-grid">${restaurants.map((x) => foodCard(x, day.theme)).join("")}</div></section>` : `<div class="empty">Sem restaurante fixo neste dia.</div>`}`;
}

function renderHotel(day) {
  const h = hotels[day.hotelId] || hotels.transit;
  $("section-hotel").innerHTML = `<div class="hotel-grid"><article class="hotel-card"><h3>Hotel do destino</h3><p><strong>${safe(h.name)}</strong></p><p>${safe(h.address)}</p><p class="small-note">${safe(h.neighborhood)} · ${safe(h.city)}</p>${links(h, day.theme)}</article><article class="hotel-card"><h3>Como usar no dia</h3><p>${safe(h.nearest)}</p><p class="small-note">${safe(h.notes)}</p></article></div>`;
}

function renderMaps(day) {
  const ids = [...new Set([...(day.mapIds || []), ...(day.shopIds || [])])];
  const h = hotels[day.hotelId] || hotels.transit;
  const guidance = day.theme === "korea" ? "Na Coreia, priorizar Naver Map ou KakaoMap." : day.theme === "japan" ? "No Japão, Google/Apple funcionam bem; para trem, conferir Japan Transit Planner/Jorudan/Navitime." : "Dubai funciona bem com Google Maps, Apple Maps e táxi/Careem/Uber.";
  $("section-mapas").innerHTML = `<section class="info-card"><h3>Mapa sem quebrar</h3><p>${guidance}</p></section><div class="map-grid"><article class="map-card"><h3>Base do dia</h3><p><strong>${safe(h.name)}</strong></p><p>${safe(h.address)}</p>${links(h, day.theme)}</article>${ids.map(place).filter(Boolean).map((p) => `<article class="map-card"><h3>${safe(p.category)} · ${safe(p.region)}</h3><p><strong>${safe(p.name)}</strong></p><p>${safe(p.address)}</p>${links(p, day.theme)}</article>`).join("")}</div>`;
}

function renderCritical() {
  renderHero({ date: "Antes da viagem", city: "Checklist", title: "Reservas críticas", subtitle: "Itens que precisam decisão, compra ou confirmação.", tags: ["evitar filas", "não aparece no day-by-day"], theme: "japan" });
  $("section-roteiro").innerHTML = `<section class="info-card"><h3>Checklist</h3><ul>${criticalReservations.map((x) => `<li>${safe(x)}</li>`).join("")}</ul></section>`;
  $("section-comida").innerHTML = `<div class="empty">Escolha um dia específico para ver comida por região.</div>`;
  $("section-hotel").innerHTML = `<div class="empty">Escolha um dia específico para ver hotel.</div>`;
  $("section-mapas").innerHTML = `<div class="empty">Escolha um dia específico para ver mapas.</div>`;
}

function activate(section) {
  state.section = section;
  document.querySelectorAll(".section-tab").forEach((b) => b.classList.toggle("active", b.dataset.section === section));
  document.querySelectorAll(".section-panel").forEach((p) => p.classList.toggle("active", p.id === `section-${section}`));
  document.querySelectorAll(".bottom-nav button").forEach((b) => b.classList.toggle("active", b.dataset.jump === section));
}

function render() {
  renderControls();
  if (state.dayId === "critical") renderCritical();
  else { const day = currentDay(); renderHero(day); renderRoteiro(day); renderFood(day); renderHotel(day); renderMaps(day); }
  activate(state.section);
}

document.addEventListener("click", async (event) => {
  const filter = event.target.closest("[data-filter]")?.dataset.filter;
  const section = event.target.closest("[data-section]")?.dataset.section || event.target.closest("[data-jump]")?.dataset.jump;
  const copy = event.target.closest("[data-copy]")?.dataset.copy;
  if (filter) { state.filter = filter; state.dayId = filter === "critical" ? "critical" : (visibleDays()[0]?.id || days[0].id); render(); scrollTo({ top: 0, behavior: "smooth" }); }
  if (section) { activate(section); $("dayCard").scrollIntoView({ behavior: "smooth", block: "start" }); }
  if (copy) { try { await navigator.clipboard.writeText(copy); $("toast").textContent = "Endereço copiado"; $("toast").classList.add("show"); setTimeout(() => $("toast").classList.remove("show"), 1400); } catch { prompt("Copie o endereço:", copy); } }
});

$("daySelect").addEventListener("change", (event) => { state.dayId = event.target.value; state.filter = event.target.value === "critical" ? "critical" : "all"; render(); });
$("searchInput").addEventListener("input", (event) => { state.query = event.target.value; renderControls(); });

initGate();
render();

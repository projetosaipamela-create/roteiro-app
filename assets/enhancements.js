import { days } from "../data/itinerary.js";
import { places, food } from "../data/places.js";
import { hotels } from "../data/hotels.js";

const FAVORITES_KEY = "roteiroFamiliaFavoritos";
const byName = new Map();
for (const [id, value] of Object.entries({ ...places, ...food })) byName.set(value.name, { id, ...value });

function favs() {
  try { return new Set(JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]")); }
  catch { return new Set(); }
}
function save(ids) { localStorage.setItem(FAVORITES_KEY, JSON.stringify([...ids])); }
function toast(text) {
  const node = document.getElementById("toast");
  if (!node) return;
  node.textContent = text;
  node.classList.add("show");
  setTimeout(() => node.classList.remove("show"), 1400);
}
function selectedDay() {
  const value = document.getElementById("daySelect")?.value;
  return days.find((day) => day.id === value) || days[0];
}
function isCafe(item) {
  return /café|coffee|starbucks|tea|dawn|reissue|flower|king/i.test(`${item?.name || ""} ${(item?.tags || []).join(" ")} ${item?.note || ""}`);
}
function daySummary(day) {
  const hotel = hotels[day.hotelId];
  const stops = day.stops.map((stop) => `${stop.time} - ${stop.title}`).join("\n");
  const meals = day.foodIds.map((id) => food[id]?.name).filter(Boolean).slice(0, 6).join(", ");
  return [`${day.date} | ${day.city}`, day.title, "", "Roteiro:", stops, "", `Hotel/base: ${hotel?.name || "Em trânsito"}`, meals ? `Comida/cafés perto: ${meals}` : "", `Plano B: ${day.planB}`].filter(Boolean).join("\n");
}
function missionHtml(day) {
  const cafeCount = day.foodIds.map((id) => food[id]).filter(isCafe).length;
  const mapCount = new Set([...(day.mapIds || []), ...(day.shopIds || [])]).size;
  const booked = day.tags.some((tag) => tag.includes("contratado"));
  return `<div class="mission-strip" data-enhanced="missions"><div class="mission-card"><span>Missão</span><strong>${booked ? "Tour contratado" : "Aventura livre"}</strong></div><div class="mission-card"><span>Paradas</span><strong>${day.stops.length}</strong></div><div class="mission-card"><span>Cafés</span><strong>${cafeCount}</strong></div><div class="mission-card"><span>Lojas</span><strong>${(day.shopIds || []).length}</strong></div><div class="mission-card"><span>Mapas</span><strong>${mapCount}</strong></div></div>`;
}
function enhanceMissions() {
  if (document.querySelector("[data-enhanced='missions']")) return;
  const intro = document.querySelector("#section-roteiro .intro-grid");
  if (intro) intro.insertAdjacentHTML("afterend", missionHtml(selectedDay()));
}
function enhanceShare() {
  const chips = document.getElementById("heroChips");
  if (!chips || chips.querySelector("[data-share-day]")) return;
  chips.insertAdjacentHTML("beforeend", `<button class="chip chip-button" data-share-day="${selectedDay().id}">Copiar resumo do dia</button>`);
}
function enhanceFavorites() {
  const ids = favs();
  document.querySelectorAll(".food-card, .map-card").forEach((card) => {
    if (card.querySelector("[data-fav]")) return;
    const name = card.querySelector("strong, h3")?.textContent?.trim();
    const item = byName.get(name);
    if (!item) return;
    const actions = card.querySelector(".actions");
    if (!actions) return;
    actions.insertAdjacentHTML("beforeend", `<button class="action favorite ${ids.has(item.id) ? "active" : ""}" data-fav="${item.id}">${ids.has(item.id) ? "Favorito" : "Favoritar"}</button>`);
  });
}
function enhanceFilters() {
  const bar = document.getElementById("quickFilters");
  if (!bar || bar.querySelector("[data-favorites-filter]")) return;
  bar.insertAdjacentHTML("beforeend", `<button data-favorites-filter>Favoritos</button>`);
}
function runEnhancements() {
  enhanceMissions();
  enhanceShare();
  enhanceFavorites();
  enhanceFilters();
}

document.addEventListener("click", async (event) => {
  const fav = event.target.closest("[data-fav]")?.dataset.fav;
  const share = event.target.closest("[data-share-day]")?.dataset.shareDay;
  const favoritesFilter = event.target.closest("[data-favorites-filter]");
  if (fav) {
    const ids = favs();
    ids.has(fav) ? ids.delete(fav) : ids.add(fav);
    save(ids);
    toast(ids.has(fav) ? "Salvo nos favoritos" : "Removido dos favoritos");
    document.querySelectorAll(`[data-fav='${fav}']`).forEach((button) => {
      button.classList.toggle("active", ids.has(fav));
      button.textContent = ids.has(fav) ? "Favorito" : "Favoritar";
    });
  }
  if (share) {
    const day = days.find((item) => item.id === share) || selectedDay();
    const text = daySummary(day);
    try { await navigator.clipboard.writeText(text); toast("Resumo do dia copiado"); }
    catch { window.prompt("Copie o resumo:", text); }
  }
  if (favoritesFilter) {
    const ids = favs();
    const first = days.find((day) => [...(day.foodIds || []), ...(day.shopIds || []), ...(day.extraIds || []), ...(day.mapIds || [])].some((id) => ids.has(id)));
    if (!first) { toast("Nenhum favorito salvo ainda"); return; }
    const select = document.getElementById("daySelect");
    select.value = first.id;
    select.dispatchEvent(new Event("change", { bubbles: true }));
    toast("Mostrando primeiro dia com favorito");
  }
});

const observer = new MutationObserver(() => runEnhancements());
observer.observe(document.body, { childList: true, subtree: true });
runEnhancements();

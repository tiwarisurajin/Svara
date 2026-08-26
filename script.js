const $ = s => document.querySelector(s);
const feed = $("#songFeed"), audio = $("#audio");
const playBtn = $("#playBtn"), playIcon = $("#playIcon"), prevBtn = $("#prevBtn"), nextBtn = $("#nextBtn");
const shuffleBtn = $("#shuffleBtn"), repeatBtn = $("#repeatBtn"), likeBtn = $("#likeBtn");
const progress = $("#progressBar"), volume = $("#volumeSlider");
const currentTime = $("#currentTime"), duration = $("#duration"), nowTitle = $("#nowTitle"), nowArtist = $("#nowArtist");
const searchPanel = $("#searchPanel"), searchInput = $("#searchInput"), drawer = $("#drawer"), drawerBackdrop = $("#drawerBackdrop");
const fileInput = $("#fileInput");


const STORAGE = "svara-v1";
const state = JSON.parse(localStorage.getItem(STORAGE) || "{}");
let songs = [
 { id: "kachaudi-1", title: "Kachaudi Gali", artist: "Coke Studio Bharat", src: "../music/Kachaudi Gali.mp3", kind: "bundled" }
];
let currentIndex = 0, shuffle = !!state.shuffle, repeat = !!state.repeat;
let liked = new Set(state.liked || []);
let imported = [];

function save() { localStorage.setItem(STORAGE, JSON.stringify({ shuffle, repeat, liked: [...liked], volume: Number(volume.value) })) }
function fmt(s) { return Number.isFinite(s) ? `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}` : "0:00" }
function escapeHtml(s) { return s.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])) }
function allSongs() { return [...songs, ...imported] }
function current() { return allSongs()[currentIndex] }

// Robust audio file checker for mobile and desktop compatibility
function isAudioFile(file) {
    const type = file.type || "";
    const name = file.name.toLowerCase();
    const audioExtensions = [".mp3", ".wav", ".m4a", ".aac", ".flac", ".ogg", ".opus", ".m4r", ".wma"];
    return type.startsWith("audio/") || audioExtensions.some(ext => name.endsWith(ext));
}

function render(filter = "") {
 const list = allSongs().filter(s => s.title.toLowerCase().includes(filter.toLowerCase()) || s.artist.toLowerCase().includes(filter.toLowerCase()));
 feed.innerHTML = "";
 $("#emptyState").hidden = list.length > 0;
 list.forEach(song => {
    const i = allSongs().indexOf(song), item = document.createElement("article");
    item.className = "song-item" + (i === currentIndex ? " is-active" : "");
    item.dataset.index = i;
    item.innerHTML = `
     <div class="song-content">
      <span class="song-icon">♫</span>
      <span class="song-name">${escapeHtml(song.title)}</span>
      <span class="song-artist">${escapeHtml(song.artist || "Svara")}</span>
      <span class="song-duration" data-duration="${i}">--:--</span>
      <button class="song-like ${liked.has(song.id) ? "liked" : ""}" aria-label="Like ${escapeHtml(song.title)}">${liked.has(song.id) ? "♥" : "♡"}</button>
      <button class="song-play" aria-label="Play ${escapeHtml(song.title)}">${i === currentIndex && !audio.paused ? "❚❚" : "▶"}</button>
     </div>`;
    item.addEventListener("click", e => {
     if (e.target.closest(".song-like")) return;
     load(i, true);
    });
    item.querySelector(".song-like").addEventListener("click", e => {
     e.stopPropagation(); toggleLike(i);
    });
    feed.appendChild(item);
 });
 loadDurations();
}

function loadDurations() {
 document.querySelectorAll("[data-duration]").forEach(el => {
  const i = Number(el.dataset.duration), s = allSongs()[i];
  const a = new Audio(); a.preload = "metadata"; a.src = s.src;
  a.addEventListener("loadedmetadata", () => el.textContent = fmt(a.duration), { once: true });
 });
}

function load(i, autoplay = false) {
 const list = allSongs(); if (!list[i]) return;
 currentIndex = i; const s = list[i];
 audio.src = s.src; audio.load(); nowTitle.textContent = s.title; nowArtist.textContent = s.artist || "Svara";
 updateMediaSession(); render(searchInput.value);
 if (autoplay) audio.play().catch(() => {});
}

function updateButtons() {
 const playing = !audio.paused;
 playIcon.textContent = playing ? "❚❚" : "▶";
 playBtn.setAttribute("aria-label", playing ? "Pause" : "Play");
 document.querySelectorAll(".song-item").forEach(item => {
    const i = Number(item.dataset.index), b = item.querySelector(".song-play");
    item.classList.toggle("is-active", i === currentIndex);
    b.textContent = i === currentIndex && playing ? "❚❚" : "▶";
 });
 likeBtn.textContent = liked.has(current()?.id) ? "♥" : "♡";
 likeBtn.classList.toggle("liked", liked.has(current()?.id));
 shuffleBtn.classList.toggle("active", shuffle); repeatBtn.classList.toggle("active", repeat);
}

function toggleLike(i) {
 const id = allSongs()[i].id; liked.has(id) ? liked.delete(id) : liked.add(id); save(); render(searchInput.value); updateButtons();
}

function next() {
 const list = allSongs(); if (!list.length) return;
 let i;
 if (shuffle) { do { i = Math.floor(Math.random() * list.length) } while (list.length > 1 && i === currentIndex) }
 else i = (currentIndex + 1) % list.length;
 load(i, true);
}

function prev() {
 if (audio.currentTime > 3) { audio.currentTime = 0; return }
 const list = allSongs(); load((currentIndex - 1 + list.length) % list.length, true);
}

function setView(view) {
 document.querySelectorAll(".nav-link,.mobile-nav-link").forEach(b => b.classList.toggle("active", b.dataset.view === view));
 const list = allSongs();
 if (view === "favorites") {
    const fav = list.filter(s => liked.has(s.id));
    feed.innerHTML = "";
    $("#emptyState").hidden = fav.length > 0;
    if (!fav.length) { $("#emptyState").hidden = false; return }
    fav.forEach(s => {
     const i = list.indexOf(s), item = document.createElement("article"); item.className = "song-item"; item.dataset.index = i;
     item.innerHTML = `<div class="song-content"><span class="song-icon">♫</span><span class="song-name">${escapeHtml(s.title)}</span><span class="song-artist">${escapeHtml(s.artist || "Svara")}</span><span class="song-duration" data-duration="${i}">--:--</span><button class="song-like liked">♥</button><button class="song-play">${i === currentIndex && !audio.paused ? "❚❚" : "▶"}</button></div>`;
     item.onclick = e => { if (!e.target.closest(".song-like")) load(i, true) };
     feed.appendChild(item);
    }); loadDurations();
 } else render(searchInput.value);
}

function updateMediaSession() {
 if (!("mediaSession" in navigator) || !current()) return;
 const s = current();
 navigator.mediaSession.metadata = new MediaMetadata({ title: s.title, artist: s.artist || "Svara", album: "Svara" });
 navigator.mediaSession.setActionHandler("play", () => audio.play());
 navigator.mediaSession.setActionHandler("pause", () => audio.pause());
 navigator.mediaSession.setActionHandler("previoustrack", prev);
 navigator.mediaSession.setActionHandler("nexttrack", next);
 navigator.mediaSession.setActionHandler("seekbackward", () => audio.currentTime = Math.max(0, audio.currentTime - 10));
 navigator.mediaSession.setActionHandler("seekforward", () => audio.currentTime = Math.min(audio.duration || 0, audio.currentTime + 10));
}

playBtn.onclick = () => audio.paused ? (audio.src ? audio.play() : load(currentIndex, true)) : audio.pause();
nextBtn.onclick = next; prevBtn.onclick = prev;
shuffleBtn.onclick = () => { shuffle = !shuffle; save(); updateButtons() };
repeatBtn.onclick = () => { repeat = !repeat; save(); updateButtons() };
likeBtn.onclick = () => current() && toggleLike(currentIndex);
volume.value = state.volume ?? ".78"; audio.volume = Number(volume.value);
volume.oninput = () => { audio.volume = Number(volume.value); save() };
progress.oninput = () => { if (audio.duration) audio.currentTime = audio.duration * Number(progress.value) / 100 };

audio.addEventListener("play", updateButtons); audio.addEventListener("pause", updateButtons);
audio.addEventListener("loadedmetadata", () => duration.textContent = fmt(audio.duration));
audio.addEventListener("timeupdate", () => {
 if (audio.duration) { progress.value = audio.currentTime / audio.duration * 100; currentTime.textContent = fmt(audio.currentTime) }
});
audio.addEventListener("ended", () => repeat ? (audio.currentTime = 0, audio.play()) : next());

$("#searchBtn").onclick = () => { searchPanel.hidden = false; searchInput.focus() };
$("#closeSearch").onclick = () => { searchPanel.hidden = true; searchInput.value = ""; render() };
searchInput.oninput = () => render(searchInput.value);
$("#menuBtn").onclick = () => openDrawer(); $("#mobileMenu").onclick = () => openDrawer();
$("#closeDrawer").onclick = closeDrawer; drawerBackdrop.onclick = closeDrawer;
function openDrawer() { drawer.classList.add("open"); drawer.setAttribute("aria-hidden", "false"); drawerBackdrop.hidden = false }
function closeDrawer() { drawer.classList.remove("open"); drawer.setAttribute("aria-hidden", "true"); drawerBackdrop.hidden = true }
$("#drawerShuffle").onclick = () => { shuffle = !shuffle; save(); updateDrawer(); updateButtons() };
$("#drawerRepeat").onclick = () => { repeat = !repeat; save(); updateDrawer(); updateButtons() };
function updateDrawer() { $("#drawerShuffle span").textContent = shuffle ? "On" : "Off"; $("#drawerRepeat span").textContent = repeat ? "On" : "Off" }
document.querySelectorAll("[data-view]").forEach(b => b.addEventListener("click", () => setView(b.dataset.view)));
$("#brandBtn").onclick = () => setView("home");
$("#clearLibrary").onclick = () => { imported.forEach(s => URL.revokeObjectURL(s.src)); imported = []; currentIndex = 0; load(0, false); render() };

// UPDATED: Uses the robust isAudioFile function to prevent mobile rejection
fileInput.addEventListener("change", e => addFiles([...e.target.files]));
document.addEventListener("dragover", e => e.preventDefault());
document.addEventListener("drop", e => { e.preventDefault(); addFiles([...e.dataTransfer.files].filter(isAudioFile)) });

function addFiles(files) {
 files.filter(isAudioFile).forEach((f, i) => {
    imported.push({ id: "local-" + Date.now() + "-" + i, title: f.name.replace(/\.[^.]+$/, ""), artist: "Local file", src: URL.createObjectURL(f), kind: "local" });
 });
 render(searchInput.value); if (imported.length && !audio.src) load(songs.length, false);
 closeDrawer(); // Automatically close drawer on mobile after picking files for better UX
}

let deferredPrompt = null;
window.addEventListener("beforeinstallprompt", e => { e.preventDefault(); deferredPrompt = e; $("#installBtn").hidden = false; $("#drawerInstall").hidden = false });
async function install() { if (!deferredPrompt) return; deferredPrompt.prompt(); await deferredPrompt.userChoice; deferredPrompt = null; $("#installBtn").hidden = true; $("#drawerInstall").hidden = true }
$("#installBtn").onclick = install; $("#drawerInstall").onclick = install;
window.addEventListener("appinstalled", () => { $("#installBtn").hidden = true; $("#drawerInstall").hidden = true });

window.addEventListener("keydown", e => {
 if (e.target.matches("input")) return;
 if (e.code === "Space") { e.preventDefault(); playBtn.click() }
 if (e.code === "ArrowRight") audio.currentTime = Math.min(audio.duration || 0, audio.currentTime + 5);
 if (e.code === "ArrowLeft") audio.currentTime = Math.max(0, audio.currentTime - 5);
 if (e.key.toLowerCase() === "m") { audio.muted = !audio.muted }
 if (e.key.toLowerCase() === "n") next();
 if (e.key.toLowerCase() === "p") prev();
});

if ("serviceWorker" in navigator) window.addEventListener("load", () => navigator.serviceWorker.register("../sw.js").catch(console.error));
render(); load(0, false); updateDrawer(); updateButtons();

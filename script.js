/* Timezone Tiles
   - Uses Intl.supportedValuesOf('timeZone') when available
   - Allows searching timezones, adding tiles, removing, and persisting selection in localStorage
   - Updates time every second
*/

document.addEventListener('DOMContentLoaded', () => {
  const SELECT_ID = 'timezoneSelect';
  const STORAGE_KEY = 'tz_tiles_v1';

  const searchInput = document.getElementById('searchInput');
  const timezoneSelect = document.getElementById(SELECT_ID);
  const addButton = document.getElementById('addButton');
  const addLocalButton = document.getElementById('addLocalButton');
  const clearAll = document.getElementById('clearAll');
  const tilesContainer = document.getElementById('tiles');

  const userLocale = navigator.language || 'en-GB';

  // Fallback list (small, extendable)
  const FALLBACK_ZONES = [
    'UTC',
    'Europe/London',
    'Europe/Moscow',
    'Europe/Paris',
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Asia/Kolkata',
    'Australia/Sydney'
  ];

  let allTimezones = [];
  let tiles = loadTiles(); // array of tz strings

  // Feature detect and load timezone list
  function loadAllTimezones() {
    if (typeof Intl.supportedValuesOf === 'function') {
      try {
        const zones = Intl.supportedValuesOf('timeZone');
        if (Array.isArray(zones) && zones.length) {
          allTimezones = zones;
          return;
        }
      } catch (e) {
        // ignore and fallback
      }
    }
    allTimezones = FALLBACK_ZONES.slice();
  }

  function populateSelect(list) {
    // Keep selection if possible
    const prev = timezoneSelect.value;
    timezoneSelect.innerHTML = '';
    const frag = document.createDocumentFragment();
    for (const z of list) {
      const opt = document.createElement('option');
      opt.value = z;
      opt.textContent = z;
      frag.appendChild(opt);
    }
    timezoneSelect.appendChild(frag);
    if (prev) timezoneSelect.value = prev;
  }

  // Debounced filter
  let filterTimer = null;
  function applyFilter(q) {
    const s = q.trim().toLowerCase();
    if (!s) {
      populateSelect(allTimezones);
      return;
    }
    const filtered = allTimezones.filter(z => z.toLowerCase().includes(s));
    populateSelect(filtered);
  }

  function debounceFilter(q) {
    clearTimeout(filterTimer);
    filterTimer = setTimeout(() => applyFilter(q), 150);
  }

  // Tiles persistence
  function loadTiles() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) { /* ignore */ }
    return [];
  }
  function saveTiles() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tiles));
    } catch (e) { /* ignore */ }
  }

  // Create tile DOM
  function createTileElement(tz) {
    const div = document.createElement('div');
    div.className = 'tile';
    div.dataset.tz = tz;

    div.innerHTML = `
      <div class="tile-header">
        <div>
          <div class="city">${escapeHtml(displayNameForTZ(tz))}</div>
          <div class="tzname">${escapeHtml(tz)}</div>
        </div>
        <div class="tile-actions">
          <button class="icon-btn remove" title="Удалить">✕</button>
        </div>
      </div>
      <div>
        <div class="time" aria-live="off">--:--:--</div>
        <div class="offset">—</div>
      </div>
    `;

    div.querySelector('.remove').addEventListener('click', () => {
      removeTile(tz);
    });

    return div;
  }

  function renderTiles() {
    tilesContainer.innerHTML = '';
    const frag = document.createDocumentFragment();
    for (const tz of tiles) {
      frag.appendChild(createTileElement(tz));
    }
    tilesContainer.appendChild(frag);
    // Immediately update times once rendered
    updateTimes();
  }

  // Helpers for time formatting
  function timePartsForTZ(date, timeZone) {
    // returns {h,m,s}
    try {
      const fmt = new Intl.DateTimeFormat('en-GB', {
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, timeZone
      });
      const parts = fmt.formatToParts(date);
      const h = Number(parts.find(p => p.type === 'hour').value);
      const m = Number(parts.find(p => p.type === 'minute').value);
      const s = Number(parts.find(p => p.type === 'second').value);
      return { h, m, s };
    } catch (e) {
      return null;
    }
  }

  function formatTimeForTZ(date, tz) {
    try {
      const opts = {
        timeZone: tz,
        hour12: false,
        hour: '2-digit', minute: '2-digit', second: '2-digit'
      };
      return new Intl.DateTimeFormat(userLocale, opts).format(date);
    } catch (e) {
      return '--:--:--';
    }
  }

  function diffMinutesToLocal(date, targetTz) {
    const local = { h: date.getHours(), m: date.getMinutes() };
    const t = timePartsForTZ(date, targetTz);
    if (!t) return null;
    let diff = (t.h * 60 + t.m) - (local.h * 60 + local.m);
    // Normalize to reasonable range (-12..+14 hours)
    if (diff > 12 * 60) diff -= 24 * 60;
    if (diff < -12 * 60) diff += 24 * 60;
    return diff;
  }

  function formatOffset(diffMinutes) {
    if (diffMinutes === 0) return 'Местное время';
    if (diffMinutes == null) return '—';
    const sign = diffMinutes > 0 ? '+' : '-';
    const m = Math.abs(diffMinutes);
    const hours = Math.floor(m / 60);
    const minutes = m % 60;
    return `${sign}${hours}ч${minutes ? ' ' + minutes + 'м' : ''}`;
  }

  // Update displayed times in tiles
  function updateTimes() {
    const now = new Date();
    for (const tileEl of tilesContainer.children) {
      const tz = tileEl.dataset.tz;
      const timeEl = tileEl.querySelector('.time');
      const offsetEl = tileEl.querySelector('.offset');

      timeEl.textContent = formatTimeForTZ(now, tz);
      const diff = diffMinutesToLocal(now, tz);
      offsetEl.textContent = formatOffset(diff);
    }
  }

  // Add/remove tile management
  function addTile(tz) {
    if (!tz) return;
    if (tiles.includes(tz)) {
      // bring to front
      tiles = tiles.filter(x => x !== tz);
      tiles.unshift(tz);
    } else {
      tiles.unshift(tz);
    }
    saveTiles();
    renderTiles();
  }

  function removeTile(tz) {
    tiles = tiles.filter(x => x !== tz);
    saveTiles();
    renderTiles();
  }

  function clearAllTiles() {
    tiles = [];
    saveTiles();
    renderTiles();
  }

  // Utility: derive display name from tz (last part)
  function displayNameForTZ(tz) {
    if (!tz) return '—';
    const parts = tz.split('/');
    return parts[parts.length - 1].replace('_', ' ');
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  // Add local timezone (resolved from environment)
  function addLocalTimezone() {
    const localTz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    addTile(localTz);
  }

  // Init
  loadAllTimezones();
  populateSelect(allTimezones);

  // Populate select with any saved tiles selected at top
  // (not required, just UX)
  if (tiles.length && allTimezones.includes(tiles[0])) {
    timezoneSelect.value = tiles[0];
  }

  renderTiles();
  updateTimes();
  const ticker = setInterval(updateTimes, 1000);

  // Events
  searchInput.addEventListener('input', (e) => debounceFilter(e.target.value));
  addButton.addEventListener('click', () => {
    const tz = timezoneSelect.value;
    if (tz) addTile(tz);
  });
  addLocalButton.addEventListener('click', () => addLocalTimezone());
  clearAll.addEventListener('click', () => {
    if (confirm('Удалить все плитки?')) clearAllTiles();
  });

  // double click on option to add quickly
  timezoneSelect.addEventListener('dblclick', () => {
    const tz = timezoneSelect.value;
    if (tz) addTile(tz);
  });

  // keyboard: Enter on select adds
  timezoneSelect.addEventListener('keydown', (ev) => {
    if (ev.key === 'Enter') {
      ev.preventDefault();
      const tz = timezoneSelect.value;
      if (tz) addTile(tz);
    }
  });
});
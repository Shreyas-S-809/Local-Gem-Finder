/* ═══════════════════════════════════════════════════════════
   Local Gem Finder — Frontend Logic (v2)
   Features: JSON handling, Google Maps, Favorites,
             Search History, Toasts, Card ↔ Map Sync
   ═══════════════════════════════════════════════════════════ */

(function () {
  "use strict";

  // ── DOM ─────────────────────────────────────────────────
  const $ = (sel) => document.querySelector(sel);
  const form            = $("#gem-form");
  const locationInput   = $("#location-input");
  const findBtn         = $("#find-btn");
  const quickPicks      = $("#quick-picks");
  const searchHistory   = $("#search-history");
  const loadingSection  = $("#loading-section");
  const loadingText     = $("#loading-text");
  const resultsSection  = $("#results-section");
  const resultsTitle    = $("#results-title");
  const resultsContent  = $("#results-content");
  const errorSection    = $("#error-section");
  const errorMessage    = $("#error-message");
  const retryBtn        = $("#retry-btn");
  const newSearchBtn    = $("#new-search-btn");
  const mapIframe       = $("#map-iframe");
  const mapPlaceholder  = $("#map-placeholder");
  const favToggle       = $("#favorites-toggle");
  const favCount        = $("#fav-count");
  const drawerOverlay   = $("#drawer-overlay");
  const favDrawer       = $("#favorites-drawer");
  const drawerClose     = $("#drawer-close");
  const drawerBody      = $("#drawer-body");
  const drawerEmpty     = $("#drawer-empty");
  const toastContainer  = $("#toast-container");

  // Chat DOM
  const chatToggle      = $("#chat-toggle");
  const chatPanel       = $("#chat-panel");
  const chatClose       = $("#chat-close");
  const chatBody        = $("#chat-body");
  const chatForm        = $("#chat-form");
  const chatInput       = $("#chat-input");
  const chatSendBtn     = $(".chat-send");
  const appLayout       = $("#app-layout");
  
  // Theme & New Features
  const themeToggle     = $("#theme-toggle");
  const budgetFilter    = $("#budget-filter");
  const vibeFilter      = $("#vibe-filter");
  const exportCalBtn    = $("#export-calendar-btn");

  // ── State ───────────────────────────────────────────────
  let lastLocation = "";
  let googleMapsApiKey = "";
  let currentGems = [];
  let mapInstance = null;
  let mapMarkers = [];

  // ── Category Config ─────────────────────────────────────
  const CATEGORY_META = {
    food:         { emoji: "🍜", label: "Food" },
    nature:       { emoji: "🌿", label: "Nature" },
    culture:      { emoji: "🎭", label: "Culture" },
    architecture: { emoji: "🏛️", label: "Architecture" },
    market:       { emoji: "🛍️", label: "Market" },
    experience:   { emoji: "✨", label: "Experience" },
  };

  const LOADING_MESSAGES = [
    "Scouting local spots…",
    "Asking the locals…",
    "Digging deeper than TripAdvisor…",
    "Finding the un-Google-able…",
    "Bypassing tourist traps…",
  ];

  // ── Init ────────────────────────────────────────────────
  async function init() {
    try {
      const res = await fetch("/api/config");
      const cfg = await res.json();
      googleMapsApiKey = cfg.googleMapsApiKey || "";
      if (googleMapsApiKey) {
        loadGoogleMapsScript(googleMapsApiKey);
      }
    } catch (_) {}
    loadFavorites();
    renderSearchHistory();
  }
  init();

  // ── Theme Toggle ─────────────────────────────────────────
  themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("light-mode");
    const isLight = document.body.classList.contains("light-mode");
    themeToggle.innerHTML = isLight 
      ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>'
      : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>';
  });

  // ── Google Maps JS API ──────────────────────────────────
  function loadGoogleMapsScript(key) {
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      mapInstance = new google.maps.Map(document.getElementById("map-canvas"), {
        center: { lat: 20, lng: 0 },
        zoom: 2,
        mapId: "DEMO_MAP_ID",
        mapTypeId: "hybrid",
        disableDefaultUI: true,
        zoomControl: true,
      });
    };
    document.head.appendChild(script);
  }

  function clearMarkers() {
    mapMarkers.forEach(m => m.setMap(null));
    mapMarkers = [];
  }

  function geocodeAndPin(gem, index) {
    if (!mapInstance || !window.google) return;
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ address: gem.searchQuery || gem.name }, (results, status) => {
      if (status === "OK" && results[0]) {
        const marker = new google.maps.Marker({
          map: mapInstance,
          position: results[0].geometry.location,
          title: gem.name,
          label: (index + 1).toString(),
        });
        mapMarkers[index] = marker; // Assign by exact index due to async completion
        if (index === 0) {
          mapInstance.setCenter(results[0].geometry.location);
          mapInstance.setZoom(13);
        }
      }
    });
  }

  // ═══════════════════════════════════════════════════════
  //  HELPERS
  // ═══════════════════════════════════════════════════════

  function showOnly(section) {
    loadingSection.classList.add("hidden");
    resultsSection.classList.add("hidden");
    errorSection.classList.add("hidden");
    if (section) section.classList.remove("hidden");
  }

  function escapeHTML(str) {
    const d = document.createElement("div");
    d.textContent = str;
    return d.innerHTML;
  }

  function googleMapsSearchURL(query) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  }

  function mapEmbedURL(query) {
    if (googleMapsApiKey && googleMapsApiKey !== "your_google_maps_api_key_here") {
      return `https://www.google.com/maps/embed/v1/search?key=${googleMapsApiKey}&q=${encodeURIComponent(query)}`;
    }
    // Free fallback (no API key)
    return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&t=&z=13&ie=UTF8&iwloc=&output=embed`;
  }

  function updateMap(query, index = 0) {
    if (!query) return;
    mapPlaceholder.classList.add("hidden");
    
    // If JS API loaded, center on the marker
    if (mapInstance && mapMarkers[index]) {
      mapInstance.setCenter(mapMarkers[index].getPosition());
      mapInstance.setZoom(14);
    }
  }

  function showToast(message, icon) {
    const t = document.createElement("div");
    t.className = "toast";
    t.innerHTML = `<span class="toast__icon">${icon || "✅"}</span><span>${escapeHTML(message)}</span>`;
    toastContainer.appendChild(t);
    setTimeout(() => t.remove(), 3200);
  }

  // ═══════════════════════════════════════════════════════
  //  SEARCH HISTORY (localStorage)
  // ═══════════════════════════════════════════════════════

  const HISTORY_KEY = "lgf_search_history";
  const MAX_HISTORY = 6;

  function getHistory() {
    try { return JSON.parse(localStorage.getItem(HISTORY_KEY)) || []; }
    catch (_) { return []; }
  }

  function addToHistory(loc) {
    let h = getHistory().filter((l) => l.toLowerCase() !== loc.toLowerCase());
    h.unshift(loc);
    if (h.length > MAX_HISTORY) h = h.slice(0, MAX_HISTORY);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(h));
    renderSearchHistory();
  }

  function renderSearchHistory() {
    const h = getHistory();
    if (h.length === 0) {
      searchHistory.classList.add("hidden");
      return;
    }
    searchHistory.classList.remove("hidden");
    // Keep label, remove old pills
    const pills = searchHistory.querySelectorAll(".pill");
    pills.forEach((p) => p.remove());

    h.forEach((loc) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "pill pill--history";
      btn.dataset.location = loc;
      btn.textContent = loc;
      searchHistory.appendChild(btn);
    });
  }

  // ═══════════════════════════════════════════════════════
  //  FAVORITES (localStorage)
  // ═══════════════════════════════════════════════════════

  const FAV_KEY = "lgf_favorites";

  function getFavorites() {
    try { return JSON.parse(localStorage.getItem(FAV_KEY)) || []; }
    catch (_) { return []; }
  }

  function saveFavorites(arr) {
    localStorage.setItem(FAV_KEY, JSON.stringify(arr));
    updateFavCount();
  }

  function isFavorite(gem) {
    return getFavorites().some((f) => f.name === gem.name && f.searchQuery === gem.searchQuery);
  }

  function toggleFavorite(gem) {
    let favs = getFavorites();
    const idx = favs.findIndex((f) => f.name === gem.name && f.searchQuery === gem.searchQuery);
    if (idx >= 0) {
      favs.splice(idx, 1);
      showToast("Removed from favorites", "💔");
    } else {
      favs.push(gem);
      showToast("Saved to favorites!", "❤️");
    }
    saveFavorites(favs);
    refreshFavButtons();
    return idx < 0; // true if added
  }

  function updateFavCount() {
    favCount.textContent = getFavorites().length;
  }

  function loadFavorites() {
    updateFavCount();
  }

  function refreshFavButtons() {
    document.querySelectorAll(".btn-fav").forEach((btn) => {
      const name = btn.dataset.name;
      const query = btn.dataset.query;
      const faved = getFavorites().some((f) => f.name === name && f.searchQuery === query);
      btn.classList.toggle("is-fav", faved);
    });
  }

  // ═══════════════════════════════════════════════════════
  //  RENDER GEM CARDS
  // ═══════════════════════════════════════════════════════

  function renderGems(gems, location) {
    currentGems = gems;
    resultsTitle.textContent = `Hidden Gems in ${location}`;
    resultsContent.innerHTML = "";
    clearMarkers();

    gems.forEach((gem, i) => {
      const cat = CATEGORY_META[gem.category] || CATEGORY_META.experience;
      const mapsURL = gem.searchQuery ? googleMapsSearchURL(gem.searchQuery) : "#";
      const isFav = isFavorite(gem);
      
      const imgHtml = gem.imageUrl 
        ? `<img class="gem-card__img" src="${gem.imageUrl}" alt="${escapeHTML(gem.name)}">` 
        : '';
        
      const costHtml = gem.estimatedCost ? `<span>💰 ${escapeHTML(gem.estimatedCost)}</span>` : '';
      const timeHtml = gem.bestTimeToVisit ? `<span>🕒 ${escapeHTML(gem.bestTimeToVisit)}</span>` : '';

      const card = document.createElement("div");
      card.className = "gem-card";
      card.dataset.index = i;
      card.innerHTML = `
        ${imgHtml}
        <div class="gem-card__top">
          <div class="gem-card__number">${i + 1}</div>
          <div class="gem-card__name">${escapeHTML(gem.name)}</div>
          <span class="gem-card__badge badge-${gem.category}">${cat.emoji} ${cat.label}</span>
        </div>
        <div class="gem-card__meta">
          ${costHtml} ${timeHtml}
        </div>
        <p class="gem-card__description">${escapeHTML(gem.description)}</p>
        <div class="gem-card__actions" style="margin-top:16px;">
          <a class="gem-card__link" href="${mapsURL}" target="_blank" rel="noopener noreferrer">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
            Google Maps
          </a>
          <button class="gem-card__action-btn btn-fav ${isFav ? "is-fav" : ""}" data-name="${escapeHTML(gem.name)}" data-query="${escapeHTML(gem.searchQuery)}" title="Save to favorites">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
          </button>
          <button class="gem-card__action-btn btn-upvote" title="Upvote Community Gem">👍</button>
        </div>
      `;
      resultsContent.appendChild(card);

      // Add pin to map
      geocodeAndPin(gem, i);
    });

    showOnly(resultsSection);
    
    // Fallback if Map JS not loaded but we have an iframe (removed iframe, so just show container)
    mapPlaceholder.classList.add("hidden");

    if (gems.length > 0) activateCard(0);
  }

  function activateCard(index) {
    document.querySelectorAll(".gem-card").forEach((c) => c.classList.remove("active"));
    const cards = document.querySelectorAll(".gem-card");
    if (cards[index]) {
      cards[index].classList.add("active");
      const gem = currentGems[index];
      if (gem && gem.searchQuery) updateMap(gem.searchQuery, index);
    }
  }

  // ═══════════════════════════════════════════════════════
  //  FAVORITES DRAWER
  // ═══════════════════════════════════════════════════════

  function renderDrawer() {
    const favs = getFavorites();
    drawerBody.innerHTML = "";

    if (favs.length === 0) {
      drawerBody.innerHTML = '<p class="drawer-empty">No saved gems yet. Click the heart on any gem card to save it!</p>';
      return;
    }

    favs.forEach((gem, i) => {
      const cat = CATEGORY_META[gem.category] || CATEGORY_META.experience;
      const mapsURL = gem.searchQuery ? googleMapsSearchURL(gem.searchQuery) : "#";
      const el = document.createElement("div");
      el.className = "drawer-gem";
      el.innerHTML = `
        <div class="drawer-gem__name">${cat.emoji} ${escapeHTML(gem.name)}</div>
        <p class="drawer-gem__desc">${escapeHTML(gem.description)}</p>
        <div class="drawer-gem__actions">
          <a class="drawer-gem__link" href="${mapsURL}" target="_blank" rel="noopener noreferrer">📍 Maps</a>
          <button class="drawer-gem__remove" data-index="${i}">✕ Remove</button>
        </div>
      `;
      drawerBody.appendChild(el);
    });
  }

  function openDrawer() {
    renderDrawer();
    drawerOverlay.classList.remove("hidden");
    favDrawer.classList.remove("hidden");
  }

  function closeDrawer() {
    drawerOverlay.classList.add("hidden");
    favDrawer.classList.add("hidden");
  }

  // ═══════════════════════════════════════════════════════
  //  FETCH GEMS
  // ═══════════════════════════════════════════════════════

  async function fetchGems(location) {
    lastLocation = location;
    findBtn.disabled = true;

    // Fun loading messages
    loadingText.textContent = LOADING_MESSAGES[Math.floor(Math.random() * LOADING_MESSAGES.length)];
    showOnly(loadingSection);

    try {
      const budget = budgetFilter.value;
      const vibe = vibeFilter.value;

      const res = await fetch("/api/find-gems", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ location, budget, vibe }),
      });

      const data = await res.json();

      if (!res.ok) {
        showError(data.error || "Something went wrong. Please try again.");
        return;
      }

      if (!data.gems || !Array.isArray(data.gems) || data.gems.length === 0) {
        showError("Received an empty response. Please try a different location.");
        return;
      }

      addToHistory(location);
      renderGems(data.gems, data.location || location);
    } catch (err) {
      console.error("Fetch error:", err);
      showError("Could not connect to the server. Make sure it's running and try again.");
    } finally {
      findBtn.disabled = false;
    }
  }

  function showError(msg) {
    errorMessage.textContent = msg;
    showOnly(errorSection);
  }

  // ═══════════════════════════════════════════════════════
  //  EVENT LISTENERS
  // ═══════════════════════════════════════════════════════

  // Form submit
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const loc = locationInput.value.trim();
    if (loc) fetchGems(loc);
  });

  // Quick picks + history pill clicks
  document.addEventListener("click", (e) => {
    const pill = e.target.closest(".pill");
    if (pill && pill.dataset.location) {
      locationInput.value = pill.dataset.location;
      fetchGems(pill.dataset.location);
    }
  });

  // Gem card clicks (delegate)
  resultsContent.addEventListener("click", (e) => {
    // Favorite button
    const favBtn = e.target.closest(".btn-fav");
    if (favBtn) {
      e.stopPropagation();
      const idx = parseInt(favBtn.closest(".gem-card").dataset.index, 10);
      const gem = currentGems[idx];
      if (gem) toggleFavorite(gem);
      return;
    }

    // Share button
    const shareBtn = e.target.closest(".btn-share");
    if (shareBtn) {
      e.stopPropagation();
      const query = shareBtn.dataset.query;
      if (query) {
        navigator.clipboard.writeText(googleMapsSearchURL(query)).then(() => {
          showToast("Maps link copied!", "📋");
        }).catch(() => {
          showToast("Could not copy link", "⚠️");
        });
      }
      return;
    }

    // Upvote
    const upBtn = e.target.closest(".btn-upvote");
    if (upBtn) {
      e.stopPropagation();
      upBtn.classList.toggle("is-fav");
      showToast(upBtn.classList.contains("is-fav") ? "Upvoted!" : "Vote removed", "👍");
      return;
    }

    // Don't activate card if clicking a link
    if (e.target.closest("a") || e.target.closest("button")) return;

    // Card click → focus map
    const card = e.target.closest(".gem-card");
    if (card) {
      const appLayout = document.getElementById("app-layout");
      const toggleMapText = document.getElementById("toggle-map-text");
      if (appLayout.classList.contains("map-closed")) {
        appLayout.classList.remove("map-closed");
        if (toggleMapText) toggleMapText.textContent = "Collapse Map";
      }
      const idx = parseInt(card.dataset.index, 10);
      activateCard(idx);
    }
  });

  // Map Toggle
  const toggleMapBtn = document.getElementById("toggle-map-btn");
  const toggleMapText = document.getElementById("toggle-map-text");
  if (toggleMapBtn) {
    toggleMapBtn.addEventListener("click", () => {
      const appLayout = document.getElementById("app-layout");
      appLayout.classList.toggle("map-closed");
      if (appLayout.classList.contains("map-closed")) {
        toggleMapText.textContent = "Expand Map";
      } else {
        toggleMapText.textContent = "Collapse Map";
      }
    });
  }

  // Retry
  retryBtn.addEventListener("click", () => {
    if (lastLocation) fetchGems(lastLocation);
    else { showOnly(null); locationInput.focus(); }
  });

  // New search
  newSearchBtn.addEventListener("click", () => {
    showOnly(null);
    locationInput.value = "";
    locationInput.focus();
    mapPlaceholder.classList.remove("hidden");
    clearMarkers();
  });

  // Favorites drawer
  favToggle.addEventListener("click", openDrawer);
  drawerClose.addEventListener("click", closeDrawer);
  drawerOverlay.addEventListener("click", closeDrawer);

  drawerBody.addEventListener("click", (e) => {
    const removeBtn = e.target.closest(".drawer-gem__remove");
    if (removeBtn) {
      const idx = parseInt(removeBtn.dataset.index, 10);
      const favs = getFavorites();
      if (favs[idx]) {
        favs.splice(idx, 1);
        saveFavorites(favs);
        renderDrawer();
        refreshFavButtons();
        showToast("Removed from favorites", "💔");
      }
    }
  });

  // Keyboard: Escape closes drawer and chat
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (!favDrawer.classList.contains("hidden")) closeDrawer();
      if (!chatPanel.classList.contains("hidden")) {
        chatPanel.classList.add("hidden");
        appLayout.classList.remove("chat-open");
      }
    }
  });

  // ═══════════════════════════════════════════════════════
  //  AI CHATBOT LOGIC
  // ═══════════════════════════════════════════════════════

  let chatHistory = [];

  // Toggle chat
  chatToggle.addEventListener("click", () => {
    chatPanel.classList.toggle("hidden");
    appLayout.classList.toggle("chat-open");
    if (!chatPanel.classList.contains("hidden")) {
      chatInput.focus();
    }
  });

  chatClose.addEventListener("click", () => {
    chatPanel.classList.add("hidden");
    appLayout.classList.remove("chat-open");
  });

  // Export to Calendar (Simple ICS generator)
  exportCalBtn.addEventListener("click", () => {
    if (chatHistory.length < 2) {
      showToast("Ask the AI to build an itinerary first!", "⚠️");
      return;
    }
    const calEvent = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
SUMMARY:My Local Gem Trip
DESCRIPTION:Generated by Local Gem Finder AI
DTSTART:${new Date().toISOString().replace(/[-:]/g, "").split(".")[0]}Z
DTEND:${new Date(Date.now() + 86400000).toISOString().replace(/[-:]/g, "").split(".")[0]}Z
END:VEVENT
END:VCALENDAR`;
    const blob = new Blob([calEvent], { type: "text/calendar" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "local-trip.ics";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Calendar event downloaded!", "📅");
  });

  // Simple markdown parser for chat
  function parseChatMarkdown(text) {
    let html = escapeHTML(text);
    // Bold
    html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    // Lists (simple hyphen)
    html = html.replace(/^- (.*)$/gm, "<li>$1</li>");
    if (html.includes("<li>")) {
      html = html.replace(/(<li>.*<\/li>)/s, "<ul>$1</ul>");
    }
    // Newlines to <br>
    html = html.replace(/\n/g, "<br>");
    return html;
  }

  function appendChatMsg(role, content, isHtml = false) {
    const wrapper = document.createElement("div");
    wrapper.className = `chat-msg chat-msg--${role}`;
    
    const bubble = document.createElement("div");
    bubble.className = "chat-bubble";
    
    if (isHtml) bubble.innerHTML = content;
    else bubble.textContent = content;

    wrapper.appendChild(bubble);
    chatBody.appendChild(wrapper);
    chatBody.scrollTop = chatBody.scrollHeight;
  }

  function showChatTyping() {
    const wrapper = document.createElement("div");
    wrapper.className = "chat-msg chat-msg--ai chat-typing-indicator";
    wrapper.innerHTML = `
      <div class="chat-bubble typing-dots">
        <div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>
      </div>
    `;
    chatBody.appendChild(wrapper);
    chatBody.scrollTop = chatBody.scrollHeight;
    return wrapper;
  }

  chatForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const text = chatInput.value.trim();
    if (!text) return;

    // Add user message
    appendChatMsg("user", text);
    chatHistory.push({ role: "user", content: text });
    
    chatInput.value = "";
    chatSendBtn.disabled = true;

    const typingEl = showChatTyping();

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: chatHistory }),
      });

      const data = await res.json();
      typingEl.remove();

      if (!res.ok) {
        appendChatMsg("ai", data.error || "Oops, something went wrong.");
      } else {
        chatHistory.push({ role: "assistant", content: data.reply });
        
        // Real ChatGPT responding style UI (Typewriter Effect)
        const wrapper = document.createElement("div");
        wrapper.className = "chat-msg chat-msg--ai";
        const bubble = document.createElement("div");
        bubble.className = "chat-bubble";
        wrapper.appendChild(bubble);
        chatBody.appendChild(wrapper);

        let i = 0;
        const text = data.reply;
        
        const interval = setInterval(() => {
          i += 3; // Type 3 chars at a time
          if (i >= text.length) {
            i = text.length;
            clearInterval(interval);
          }
          // Parse markdown on the fly and add typing cursor
          bubble.innerHTML = parseChatMarkdown(text.slice(0, i)) + (i < text.length ? "<span class='typing-cursor' style='display:inline-block;width:6px;height:14px;background:var(--accent-start);margin-left:4px;animation:blink 1s step-end infinite;'></span>" : "");
          chatBody.scrollTop = chatBody.scrollHeight;
        }, 15);
      }
    } catch (err) {
      typingEl.remove();
      appendChatMsg("ai", "Network error. Try again!");
    } finally {
      chatSendBtn.disabled = false;
      chatInput.focus();
    }
  });

  // Add blink animation dynamically
  const style = document.createElement('style');
  style.innerHTML = `@keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }`;
  document.head.appendChild(style);

})();

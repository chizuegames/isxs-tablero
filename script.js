/* ==========================================================================
       19. CENTRALIZED CONFIGURATION LAYER
       ========================================================================== */
const CONFIG = {
  themeMusic: "assets/music/theme.mp3",
  boardAssets: {
    background: "assets/backgrounds/main-bg.webp",
    sidebar: "assets/backgrounds/side-bar.webp",
    racePosition: "assets/backgrounds/racer-position.webp",
    curve: "assets/backgrounds/background-curve.webp",
    logo: "assets/backgrounds/Logo Illicit Speed.webp",
  },
  racers: [
    {
      id: "astra",
      name: "Astra",
      portrait: "assets/portraits/RAstrea.webp",
      voices: {
        first: "assets/voices/astra-first.mp3",
        second: "assets/voices/astra-second.mp3",
        last: "assets/voices/astra-last.mp3",
      },
    },
    {
      id: "chizue",
      name: "Chizue",
      portrait: "assets/portraits/RChizue.webp",
      voices: {
        first: "assets/voices/chizue-first.mp3",
        second: "assets/voices/chizue-second.mp3",
        last: "assets/voices/chizue-last.mp3",
      },
    },
    {
      id: "ais",
      name: "Ais",
      portrait: "assets/portraits/REis.webp",
      voices: {
        first: "assets/voices/ais-first.mp3",
        second: "assets/voices/ais-second.mp3",
        last: "assets/voices/ais-last.mp3",
      },
    },
    {
      id: "kael",
      name: "Kael",
      portrait: "assets/portraits/RKael.webp",
      voices: {
        first: "assets/voices/kael-first.mp3",
        second: "assets/voices/kael-second.mp3",
        last: "assets/voices/kael-last.mp3",
      },
    },
    {
      id: "keilan",
      name: "Keilan",
      portrait: "assets/portraits/RKeilan.webp",
      voices: {
        first: "assets/voices/keilan-first.mp3",
        second: "assets/voices/keilan-second.mp3",
        last: "assets/voices/keilan-last.mp3",
      },
    },
    {
      id: "kumi",
      name: "Kumi",
      portrait: "assets/portraits/RKumi.webp",
      voices: {
        first: "assets/voices/kumi-first.mp3",
        second: "assets/voices/kumi-second.mp3",
        last: "assets/voices/kumi-last.mp3",
      },
    },
    {
      id: "nova",
      name: "Nova",
      portrait: "assets/portraits/RNova.webp",
      voices: {
        first: "assets/voices/nova-first.mp3",
        second: "assets/voices/nova-second.mp3",
        last: "assets/voices/nova-last.mp3",
      },
    },
    {
      id: "orion",
      name: "Orion",
      portrait: "assets/portraits/ROrion.webp",
      voices: {
        first: "assets/voices/orion-first.mp3",
        second: "assets/voices/orion-second.mp3",
        last: "assets/voices/orion-last.mp3",
      },
    },
    {
      id: "salem",
      name: "Salem",
      portrait: "assets/portraits/RSalem.webp",
      voices: {
        first: "assets/voices/salem-first.mp3",
        second: "assets/voices/salem-second.mp3",
        last: "assets/voices/salem-last.mp3",
      },
    },
    {
      id: "vero",
      name: "Vero",
      portrait: "assets/portraits/RVero.webp",
      voices: {
        first: "assets/voices/vero-first.mp3",
        second: "assets/voices/vero-second.mp3",
        last: "assets/voices/vero-last.mp3",
      },
    },
    {
      id: "yumi",
      name: "Yumi",
      portrait: "assets/portraits/RYumi.webp",
      voices: {
        first: "assets/voices/yumi-first.mp3",
        second: "assets/voices/yumi-second.mp3",
        last: "assets/voices/yumi-last.mp3",
      },
    },
    {
      id: "yuuky",
      name: "Yuuky",
      portrait: "assets/portraits/RYuuky.webp",
      voices: {
        first: "assets/voices/yuuky-first.mp3",
        second: "assets/voices/yuuky-second.mp3",
        last: "assets/voices/yuuky-last.mp3",
      },
    },
  ],
};

/* ==========================================================================
       20. STATE ARCHITECTURE
       ========================================================================== */
class LeaderboardState {
  constructor(racersConfig) {
    this.allRacers = {};
    racersConfig.forEach((r) => {
      this.allRacers[r.id] = r;
    });

    // Single source of truth for active ordering
    this.activeRacers = []; // Array of racer IDs
    this.previousPositions = {}; // Map of racerId -> prevPosition (1-12)
    this.musicPlaying = false;
  }

  getRacer(id) {
    return this.allRacers[id];
  }

  getPoolRacers() {
    return Object.keys(this.allRacers).filter(
      (id) => !this.activeRacers.includes(id),
    );
  }

  // Add or reorder racer into a target index position (0 to 11)
  moveRacerToPosition(racerId, targetIndex) {
    const currentIdx = this.activeRacers.indexOf(racerId);

    // Save current positions snapshot before modifying
    this.snapshotPositions();

    if (currentIdx !== -1) {
      // Remove from current position
      this.activeRacers.splice(currentIdx, 1);
    }

    // Clamp target index
    const clampedIndex = Math.max(
      0,
      Math.min(targetIndex, this.activeRacers.length),
    );
    this.activeRacers.splice(clampedIndex, 0, racerId);
  }

  // Remove racer from active race back to pool
  removeRacerToPool(racerId) {
    this.snapshotPositions();
    const idx = this.activeRacers.indexOf(racerId);
    if (idx !== -1) {
      this.activeRacers.splice(idx, 1);
    }
  }

  snapshotPositions() {
    this.previousPositions = {};
    this.activeRacers.forEach((id, idx) => {
      this.previousPositions[id] = idx + 1;
    });
  }
}

/* ==========================================================================
       15, 16 & 17. AUDIO ENGINE WITH EVENT DEDUPLICATION
       ========================================================================== */
class AudioManager {
  constructor(musicPath) {
    this.musicPath = musicPath;
    this.musicAudio = new Audio(musicPath);
    this.musicAudio.loop = true;
    this.currentVoiceAudio = null;
  }

  toggleMusic() {
    if (this.musicAudio.paused) {
      this.musicAudio
        .play()
        .then(() => {
          return true;
        })
        .catch((err) => console.log("Autoplay blocked:", err));
      return true;
    } else {
      this.musicAudio.pause();
      return false;
    }
  }

  playVoiceCue(audioPath) {
    if (!audioPath) return;
    if (this.currentVoiceAudio) {
      this.currentVoiceAudio.pause();
      this.currentVoiceAudio.currentTime = 0;
    }
    this.currentVoiceAudio = new Audio(audioPath);
    this.currentVoiceAudio
      .play()
      .catch((err) => console.log("Voice audio play error:", err));
  }

  // Evaluate audio triggers based on position transition rules
  evaluateAudioRules(state, movedRacerId) {
    const active = state.activeRacers;
    const totalActive = active.length;
    if (totalActive === 0 || !movedRacerId) return;

    const newPos = active.indexOf(movedRacerId) + 1;
    const prevPos = state.previousPositions[movedRacerId] || null;

    // Skip evaluation if position didn't actually change
    if (newPos === prevPos) return;

    const racer = state.getRacer(movedRacerId);
    if (!racer || !racer.voices) return;

    // Rule 29: Only 1 active player -> Priority to first place sound
    if (totalActive === 1 && newPos === 1) {
      this.playVoiceCue(racer.voices.first);
      return;
    }

    // 1st Place Voice Trigger
    if (newPos === 1) {
      this.playVoiceCue(racer.voices.first);
      return;
    }

    // 2nd Place Voice Trigger
    if (newPos === 2 && totalActive >= 2) {
      this.playVoiceCue(racer.voices.second);
      return;
    }

    // Last Place Voice Trigger (Dynamic calculation based on total active players)
    if (newPos === totalActive && totalActive > 2) {
      this.playVoiceCue(racer.voices.last);
      return;
    }
  }
}

/* ==========================================================================
       5 & 21. UNIFIED POINTER DRAG AND DROP CONTROLLER
       ========================================================================== */
class DragDropController {
  constructor(state, audioManager, renderCallback) {
    this.state = state;
    this.audioManager = audioManager;
    this.render = renderCallback;

    this.draggedRacerId = null;
    this.dragGhostEl = null;

    this.initPointerEvents();
  }

  initPointerEvents() {
    document.addEventListener("pointerdown", this.onPointerDown.bind(this));
    document.addEventListener("pointermove", this.onPointerMove.bind(this));
    document.addEventListener("pointerup", this.onPointerUp.bind(this));
    document.addEventListener("pointercancel", this.onPointerUp.bind(this));
  }

  onPointerDown(e) {
    const dragHandle = e.target.closest("[data-drag-racer]");
    if (!dragHandle) return;

    e.preventDefault();
    this.draggedRacerId = dragHandle.getAttribute("data-drag-racer");
    const racer = this.state.getRacer(this.draggedRacerId);

    // Create Drag Ghost Preview Element
    this.dragGhostEl = document.createElement("div");
    this.dragGhostEl.className = "drag-ghost";
    this.dragGhostEl.innerHTML = `<img src="${racer.portrait}" alt="${racer.name}"/>`;
    document.body.appendChild(this.dragGhostEl);

    this.updateGhostPosition(e.clientX, e.clientY);
  }

  onPointerMove(e) {
    if (!this.draggedRacerId) return;
    e.preventDefault();
    this.updateGhostPosition(e.clientX, e.clientY);

    // Highlight drop target zones
    this.clearDropHighlights();
    const dropTarget = this.findDropTarget(e.clientX, e.clientY);
    if (dropTarget) {
      dropTarget.classList.add("drag-over");
    }
  }

  onPointerUp(e) {
    if (!this.draggedRacerId) return;

    const dropTarget = this.findDropTarget(e.clientX, e.clientY);
    const movedId = this.draggedRacerId;

    if (dropTarget) {
      if (
        dropTarget.id === "sidebar-pool-zone" ||
        dropTarget.id === "pool-grid"
      ) {
        // Dragged to pool -> Remove active status
        this.state.removeRacerToPool(movedId);
      } else if (dropTarget.hasAttribute("data-slot-index")) {
        // Dragged to a race position slot
        const targetIndex = parseInt(
          dropTarget.getAttribute("data-slot-index"),
          10,
        );
        this.state.moveRacerToPosition(movedId, targetIndex);
        this.audioManager.evaluateAudioRules(this.state, movedId);
      }
    }

    // Cleanup
    if (this.dragGhostEl) {
      this.dragGhostEl.remove();
      this.dragGhostEl = null;
    }
    this.draggedRacerId = null;
    this.clearDropHighlights();

    // Rerender UI
    this.render();
  }

  updateGhostPosition(x, y) {
    if (this.dragGhostEl) {
      this.dragGhostEl.style.left = `${x}px`;
      this.dragGhostEl.style.top = `${y}px`;
    }
  }

  findDropTarget(x, y) {
    const els = document.elementsFromPoint(x, y);
    for (let el of els) {
      if (
        el.hasAttribute("data-slot-index") ||
        el.id === "sidebar-pool-zone" ||
        el.id === "pool-grid"
      ) {
        return el;
      }
    }
    return null;
  }

  clearDropHighlights() {
    document
      .querySelectorAll(".drag-over")
      .forEach((el) => el.classList.remove("drag-over"));
  }
}

/* ==========================================================================
       APPLICATION INITIALIZATION & UI RENDERING
       ========================================================================== */
class Application {
  constructor() {
    this.state = new LeaderboardState(CONFIG.racers);
    this.audioManager = new AudioManager(CONFIG.themeMusic);
    this.dragController = new DragDropController(
      this.state,
      this.audioManager,
      () => this.render(),
    );

    this.col1El = document.getElementById("col-1");
    this.col2El = document.getElementById("col-2");
    this.poolGridEl = document.getElementById("pool-grid");
    this.counterEl = document.getElementById("player-counter");

    this.setupMusicToggle();
    this.render();
  }

  setupMusicToggle() {
    const btn = document.getElementById("music-toggle-btn");
    const icon = document.getElementById("music-icon");
    const label = document.getElementById("music-label");

    btn.addEventListener("click", () => {
      const isPlaying = this.audioManager.toggleMusic();
      icon.textContent = isPlaying ? "🔊" : "🔇";
      label.textContent = `Música Ambiente: ${isPlaying ? "ON" : "OFF"}`;
    });
  }

  render() {
    // 1. Update Player Counter
    const activeCount = this.state.activeRacers.length;
    this.counterEl.textContent = `Corredores activos: ${activeCount} / 12`;

    // 2. Render Race Positions (Positions 1-6 in Col 1, Positions 7-12 in Col 2)
    this.col1El.innerHTML = "";
    this.col2El.innerHTML = "";

    for (let i = 0; i < 12; i++) {
      const slotEl = document.createElement("div");
      slotEl.className = "race-slot";
      slotEl.setAttribute("data-slot-index", i);

      const activeRacerId = this.state.activeRacers[i];
      if (activeRacerId) {
        const racer = this.state.getRacer(activeRacerId);
        slotEl.innerHTML = `
              <div class="slot-content" data-drag-racer="${racer.id}">
                <img class="slot-portrait" src="${racer.portrait}" alt="${racer.name}"/>
                <div class="slot-text-area">
                  <span class="position-number">${i + 1}.</span>
                  <span class="racer-name">${racer.name}</span>
                </div>
              </div>
            `;
      } else {
        slotEl.innerHTML = `
              <div class="slot-text-area" style="opacity: 0.35;">
                <span class="position-number">${i + 1}.</span>
                <span class="racer-name" style="font-style: italic;">Vacío</span>
              </div>
            `;
      }

      if (i < 6) {
        this.col1El.appendChild(slotEl);
      } else {
        this.col2El.appendChild(slotEl);
      }
    }

    // 3. Render Racer Pool
    this.poolGridEl.innerHTML = "";
    const poolRacerIds = this.state.getPoolRacers();
    poolRacerIds.forEach((id) => {
      const racer = this.state.getRacer(id);
      const tokenEl = document.createElement("div");
      tokenEl.className = "racer-token";
      tokenEl.setAttribute("data-drag-racer", racer.id);
      tokenEl.innerHTML = `
        <div class="racer-portrait">
          <img src="${racer.portrait}" alt="${racer.name}"/>
        </div>
        <span>${racer.name}</span>
      `;
      // tokenEl.innerHTML = `
      //       <img src="${racer.portrait}" alt="${racer.name}"/>
      //       <span>${racer.name}</span>
      //     `;
      this.poolGridEl.appendChild(tokenEl);
    });
  }
}

// Launch Application
window.addEventListener("DOMContentLoaded", () => {
  new Application();
});

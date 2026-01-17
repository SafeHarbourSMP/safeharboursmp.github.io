// =====================================================
// BlueMap External Extender Integration
// =====================================================

const BLUEMAP_URL = 'http://66.59.208.121:8100';
const BLUEMAP_ORIGIN = 'http://66.59.208.121:8100';

// DOM References
let bluemapIframe = null;
let fallback = null;
let playerListPanel = null;
let playerListContainer = null;
let coordX = null;
let coordY = null;
let coordZ = null;

// State
let mapLoaded = false;
let playerListVisible = false;
let currentViewMode = 'perspective';

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function () {
    initBlueMap();
    initMobileWarning();
});

// =====================================================
// BlueMap Initialization
// =====================================================

function initBlueMap() {
    bluemapIframe = document.getElementById('bluemap-iframe');
    fallback = document.getElementById('map-fallback');
    playerListPanel = document.getElementById('player-list-panel');
    playerListContainer = document.getElementById('player-list');
    coordX = document.getElementById('coord-x');
    coordY = document.getElementById('coord-y');
    coordZ = document.getElementById('coord-z');

    if (!bluemapIframe) return;

    // Handle iframe load
    bluemapIframe.onload = function () {
        mapLoaded = true;
        console.log('BlueMap loaded successfully');

        // Send initial position
        sendToBlueMap({
            type: 'updatePosition',
            x: 0,
            y: 64,
            z: 0
        });

        // Set dark theme to match website
        sendToBlueMap({
            type: 'updateTheme',
            theme: 'dark'
        });

        // Request player list
        fetchPlayerList();
    };

    // Handle load errors
    bluemapIframe.onerror = function () {
        showFallback();
    };

    // Timeout fallback (5 seconds)
    setTimeout(function () {
        if (!mapLoaded) {
            showFallback();
        }
    }, 5000);

    // Setup control buttons
    setupMapControls();

    // Listen for BlueMap events
    setupBlueMapListeners();

    // Periodically fetch player list
    setInterval(fetchPlayerList, 30000); // Every 30 seconds
}

// =====================================================
// BlueMap Communication
// =====================================================

function sendToBlueMap(message) {
    if (bluemapIframe && bluemapIframe.contentWindow) {
        try {
            bluemapIframe.contentWindow.postMessage(message, BLUEMAP_ORIGIN);
        } catch (e) {
            console.warn('Failed to send message to BlueMap:', e);
        }
    }
}

function setupBlueMapListeners() {
    // Listen for position updates
    window.addEventListener('onPosition', function (event) {
        if (event.data) {
            updateCoordinates(event.data.x, event.data.y, event.data.z);
        }
    });

    // Listen for view mode changes
    window.addEventListener('onViewMode', function (event) {
        if (event.data && event.data.mode) {
            updateActiveViewButton(event.data.mode);
        }
    });

    // Listen for player list updates
    window.addEventListener('playerListUpdate', function (event) {
        if (event.data && event.data.players) {
            try {
                const players = JSON.parse(event.data.players);
                renderPlayerList(players);
            } catch (e) {
                console.warn('Failed to parse player list:', e);
            }
        }
    });

    // Generic message listener for cross-origin messages
    window.addEventListener('message', function (event) {
        if (event.origin !== BLUEMAP_ORIGIN) return;

        const data = event.data;
        if (!data || typeof data !== 'object') return;

        // Handle position updates
        if (data.type === 'position' || data.x !== undefined) {
            updateCoordinates(
                data.x || 0,
                data.y || 64,
                data.z || 0
            );
        }
    });
}

// =====================================================
// Map Controls
// =====================================================

function setupMapControls() {
    // View mode buttons
    const btnPerspective = document.getElementById('btn-perspective');
    const btnFlat = document.getElementById('btn-flat');
    const btnFreeflight = document.getElementById('btn-freeflight');
    const btnResetView = document.getElementById('btn-reset-view');
    const btnTogglePlayers = document.getElementById('btn-toggle-players');

    if (btnPerspective) {
        btnPerspective.addEventListener('click', function () {
            setViewMode('setPerspectiveView');
            setActiveButton(this);
        });
    }

    if (btnFlat) {
        btnFlat.addEventListener('click', function () {
            setViewMode('setFlatView');
            setActiveButton(this);
        });
    }

    if (btnFreeflight) {
        btnFreeflight.addEventListener('click', function () {
            setViewMode('setFreeFlight');
            setActiveButton(this);
        });
    }

    if (btnResetView) {
        btnResetView.addEventListener('click', function () {
            sendToBlueMap({ type: 'resetView' });
        });
    }

    if (btnTogglePlayers) {
        btnTogglePlayers.addEventListener('click', function () {
            togglePlayerList();
            this.classList.toggle('active', playerListVisible);
        });
    }
}

function setViewMode(command) {
    sendToBlueMap({
        type: 'viewMode',
        command: command,
        options: {
            transition: 500,
            heightTransition: 256
        }
    });
}

function setActiveButton(activeBtn) {
    const viewButtons = document.querySelectorAll('#btn-perspective, #btn-flat, #btn-freeflight');
    viewButtons.forEach(btn => btn.classList.remove('active'));
    activeBtn.classList.add('active');
}

function updateActiveViewButton(mode) {
    const modeMap = {
        'perspective': 'btn-perspective',
        'flat': 'btn-flat',
        'freeflight': 'btn-freeflight'
    };

    const btnId = modeMap[mode.toLowerCase()];
    if (btnId) {
        const btn = document.getElementById(btnId);
        if (btn) setActiveButton(btn);
    }
}

// =====================================================
// Coordinates Display
// =====================================================

function updateCoordinates(x, y, z) {
    if (coordX) coordX.textContent = Math.round(x);
    if (coordY) coordY.textContent = Math.round(y);
    if (coordZ) coordZ.textContent = Math.round(z);
}

// =====================================================
// Player List
// =====================================================

function togglePlayerList() {
    playerListVisible = !playerListVisible;
    if (playerListPanel) {
        playerListPanel.classList.toggle('visible', playerListVisible);
    }
    if (playerListVisible) {
        fetchPlayerList();
    }
}

async function fetchPlayerList() {
    try {
        const response = await fetch(`${BLUEMAP_URL}/maps/world/live/players.json`);
        if (!response.ok) throw new Error('Failed to fetch players');

        const data = await response.json();
        renderPlayerList(data.players || []);
    } catch (error) {
        console.warn('Could not fetch player list:', error);
        if (playerListContainer) {
            playerListContainer.innerHTML = '<p class="no-players">Unable to load players</p>';
        }
    }
}

function renderPlayerList(players) {
    if (!playerListContainer) return;

    if (!players || players.length === 0) {
        playerListContainer.innerHTML = '<p class="no-players">No players online</p>';
        return;
    }

    const html = players.map(player => `
        <div class="player-item" onclick="teleportToPlayer('${player.uuid}')">
            <img src="https://mc-heads.net/avatar/${player.uuid}/32" alt="${player.name}" class="player-avatar">
            <span class="player-name">${player.name}</span>
            <span class="player-coords">(${Math.round(player.position?.x || 0)}, ${Math.round(player.position?.z || 0)})</span>
        </div>
    `).join('');

    playerListContainer.innerHTML = html;
}

function teleportToPlayer(playerId) {
    sendToBlueMap({
        type: 'teleportToPlayer',
        playerId: playerId
    });
}

// Make teleportToPlayer available globally for onclick
window.teleportToPlayer = teleportToPlayer;

// =====================================================
// Fallback Handling
// =====================================================

function showFallback() {
    if (bluemapIframe) bluemapIframe.style.display = 'none';
    if (fallback) fallback.style.display = 'flex';

    // Disable map controls
    const mapControls = document.querySelector('.map-controls');
    if (mapControls) {
        mapControls.classList.add('disabled');
    }

    // Hide player list panel
    if (playerListPanel) {
        playerListPanel.style.display = 'none';
    }
}

// =====================================================
// Mobile Warning
// =====================================================

function initMobileWarning() {
    const mobileWarning = document.getElementById('mobile-warning');
    const closeBtn = document.querySelector('.close-btn');

    if (/Mobi|Android/i.test(navigator.userAgent)) {
        if (mobileWarning) mobileWarning.style.display = 'block';
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', function () {
            if (mobileWarning) mobileWarning.style.display = 'none';
        });
    }
}
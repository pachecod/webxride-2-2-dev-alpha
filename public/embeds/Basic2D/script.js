// VR Hotspot Project - Standalone Version
// Generated from VR Hotspot Editor

// Face camera component
AFRAME.registerComponent("face-camera", {
  init: function () {
    this.cameraObj = document.querySelector("[camera]").object3D;
  },
  tick: function () {
    if (this.cameraObj) {
      this.el.object3D.lookAt(this.cameraObj.position);
    }
  },
});

// Hotspot component for standalone projects
AFRAME.registerComponent("hotspot", {
  schema: {
    label: { type: "string", default: "" },
    audio: { type: "string", default: "" },
    popup: { type: "string", default: "" },
    popupWidth: { type: "number", default: 3 },
    popupHeight: { type: "number", default: 2 },
    popupColor: { type: "color", default: "#333333" },
  },

  init: function () {
    const data = this.data;
    const el = this.el;

    // Add hover animations
    el.setAttribute("animation__hover_in", {
      property: "scale",
      to: "1.2 1.2 1.2",
      dur: 200,
      easing: "easeOutQuad",
      startEvents: "mouseenter",
    });

    el.setAttribute("animation__hover_out", {
      property: "scale",
      to: "1 1 1",
      dur: 200,
      easing: "easeOutQuad",
      startEvents: "mouseleave",
    });

    // Add popup functionality
    if (data.popup) {
      this.createPopup(data);
    }

    // Add label
    if (data.label) {
      this.createLabel(data);
    }

    // Add audio functionality
    if (data.audio) {
      this.createAudio(data);
    }
  },

  createPopup: function(data) {
    const el = this.el;

    const infoIcon = document.createElement("a-entity");
    infoIcon.setAttribute("geometry", "primitive: plane; width: 4; height: 0.5");
    infoIcon.setAttribute("material", "color: #00FF00");
    infoIcon.setAttribute("text", "value: click for info; align: center; color: black; width: 8");
    infoIcon.setAttribute("position", "0 1 0");
    infoIcon.classList.add("clickable");
    el.appendChild(infoIcon);

    const popup = document.createElement("a-entity");
    popup.setAttribute("visible", "false");
    popup.setAttribute("position", "0 1.5 0");
    popup.setAttribute("look-at", "#cam");

    const background = document.createElement("a-plane");
    background.setAttribute("color", data.popupColor);
    background.setAttribute("width", data.popupWidth);
    background.setAttribute("height", data.popupHeight);
    background.setAttribute("opacity", 0.95);
    popup.appendChild(background);

    const text = document.createElement("a-text");
    text.setAttribute("value", data.popup);
    text.setAttribute("wrap-count", 35);
    text.setAttribute("color", "white");
    text.setAttribute("position", "0 0 0.01");
    text.setAttribute("align", "center");
    popup.appendChild(text);

    const closeButton = document.createElement("a-image");
    closeButton.setAttribute("position", data.popupWidth/2-0.3 + " " + (data.popupHeight/2-0.3) + " 0.02");
    closeButton.setAttribute("src", "#close");
    closeButton.setAttribute("width", "0.4");
    closeButton.setAttribute("height", "0.4");
    closeButton.classList.add("clickable");
    popup.appendChild(closeButton);

    infoIcon.addEventListener("click", (e) => {
      e.stopPropagation();
      popup.setAttribute("visible", true);
      infoIcon.setAttribute("visible", false); // Hide info icon when popup is open
    });

    closeButton.addEventListener("click", (e) => {
      e.stopPropagation();
      popup.setAttribute("visible", false);
      setTimeout(() => {
        infoIcon.setAttribute("visible", true); // Show info icon when popup is closed
      }, 250);
    });

    el.appendChild(popup);
  },

  createLabel: function(data) {
    const el = this.el;
    const labelContainer = document.createElement("a-entity");
    labelContainer.setAttribute("position", "0 -0.6 0");

    const bg = document.createElement("a-plane");
    bg.setAttribute("color", "#333333");
    bg.setAttribute("opacity", 0.8);
    bg.setAttribute("width", data.label.length * 0.15 + 0.4);
    bg.setAttribute("height", 0.3);

    const textEl = document.createElement("a-text");
    textEl.setAttribute("value", data.label);
    textEl.setAttribute("align", "center");
    textEl.setAttribute("color", "#FFFFFF");

    labelContainer.appendChild(bg);
    labelContainer.appendChild(textEl);
    el.appendChild(labelContainer);
  },

  createAudio: function(data) {
    const el = this.el;
    const audioEl = document.createElement("a-sound");
    audioEl.setAttribute("src", data.audio);
    audioEl.setAttribute("autoplay", "false");
    audioEl.setAttribute("loop", "true");
    el.appendChild(audioEl);

    const btn = document.createElement("a-image");
    btn.setAttribute("class", "clickable");
    btn.setAttribute("src", "#play");
    btn.setAttribute("width", "0.5");
    btn.setAttribute("height", "0.5");
    btn.setAttribute("position", "0 -1 0.02");
    el.appendChild(btn);

    let isPlaying = false;

    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (audioEl.components.sound) {
        if (isPlaying) {
          audioEl.components.sound.stopSound();
          btn.setAttribute("src", "#play");
        } else {
          audioEl.components.sound.playSound();
          btn.setAttribute("src", "#pause");
        }
        isPlaying = !isPlaying;
      }
    });
  }
});

// Project loader with improved resilience for WebXRide preview
class HotspotProject {
  constructor() {
    this.initialized = false;
    this.retryCount = 0;
    this.maxRetries = 5;
    this.init();
  }

  init() {
    // Wait for A-Frame to be ready
    if (typeof AFRAME !== 'undefined' && AFRAME.scenes && AFRAME.scenes.length > 0) {
      this.loadProject();
    } else {
      // If A-Frame isn't ready yet, wait and retry
      setTimeout(() => {
        if (this.retryCount < this.maxRetries) {
          this.retryCount++;
          this.init();
        } else {
          console.warn('A-Frame not ready after maximum retries');
        }
      }, 500);
    }
  }

    async loadProject() {
    try {
      console.log('Loading hotspot project...');
      this.updateDebugInfo('Loading Config...', 0);

      let config = null;

      // First, check if config is available as a global variable (injected by WebXRide)
      if (typeof window !== 'undefined' && window.config) {
        console.log('Config found as global variable (injected by WebXRide)');
        config = window.config;
      } else {
        console.log('No global config found, trying to fetch from paths...');
        
        // Try multiple possible paths for config.json
        const possiblePaths = [
          './config.json',
          'config.json',
          '/config.json',
          '../config.json'
        ];

        let lastError = null;

        for (const path of possiblePaths) {
          try {
            console.log(`Trying to load config from: ${path}`);
            const response = await fetch(path);
            if (response.ok) {
              config = await response.json();
              console.log('Config loaded successfully from:', path);
              break;
            } else {
              console.warn(`Failed to load from ${path}: ${response.status}`);
            }
          } catch (error) {
            console.warn(`Error loading from ${path}:`, error);
            lastError = error;
          }
        }

        if (!config) {
          throw new Error(`Failed to load config from any path. Last error: ${lastError}`);
        }
      }

      console.log('Config loaded:', config);
      this.createHotspots(config.hotspots);
      this.initialized = true;
    } catch (error) {
      console.warn('Failed to load config.json:', error);
      this.updateDebugInfo('Error: ' + error.message, 0);
      // Try to create some default hotspots for testing
      this.createDefaultHotspots();
    }
  }

  createHotspots(hotspots) {
    const container = document.getElementById('hotspot-container');
    if (!container) {
      console.error('Hotspot container not found');
      this.updateDebugInfo('Error: Container not found', 0);
      return;
    }
    
    // Clear existing hotspots
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    
    console.log('Creating hotspots:', hotspots);
    
    // Verify hotspot image is loaded
    const hotspotImg = document.querySelector('#hotspot');
    if (!hotspotImg) {
      console.error('Hotspot image not found in assets');
    } else {
      console.log('Hotspot image found:', hotspotImg);
    }
    
    hotspots.forEach((hotspot, index) => {
      const hotspotEl = document.createElement('a-image');
      hotspotEl.setAttribute('face-camera', '');
      hotspotEl.setAttribute('src', '#hotspot');
      hotspotEl.setAttribute('position', hotspot.position);
      hotspotEl.setAttribute('class', 'clickable');
      
      let config = "label:" + hotspot.label;
      
      if (hotspot.type === 'text' || hotspot.type === 'text-audio') {
        config += ";popup:" + hotspot.text + ";popupWidth:4;popupHeight:2.5;popupColor:#333333";
      }
      
      if (hotspot.type === 'audio' || hotspot.type === 'text-audio') {
        config += ";audio:#default-audio";
      }
      
      hotspotEl.setAttribute('hotspot', config);
      container.appendChild(hotspotEl);
      console.log(`Created hotspot ${index + 1}:`, hotspot.label, 'at position:', hotspot.position);
      
      // Add error handling for the hotspot element
      hotspotEl.addEventListener('error', (e) => {
        console.error(`Error with hotspot ${index + 1}:`, e);
      });
    });
    
    // Update debug info
    this.updateDebugInfo('Hotspots Created', hotspots.length);
  }

  updateDebugInfo(status, count) {
    const statusEl = document.getElementById('status');
    const countEl = document.getElementById('hotspot-count');
    
    if (statusEl) {
      statusEl.textContent = status;
    }
    if (countEl) {
      countEl.textContent = count;
    }
  }

  createDefaultHotspots() {
    console.log('Creating default hotspots for testing');
    this.updateDebugInfo('Creating Default Hotspots', 1);
    const defaultHotspots = [
      {
        type: "text",
        position: "0 2 -5",
        label: "Test Hotspot",
        text: "This is a test hotspot to verify the system is working."
      }
    ];
    this.createHotspots(defaultHotspots);
  }
}

// Global instance to prevent multiple initializations
let hotspotProjectInstance = null;

// Initialize project with multiple triggers for WebXRide compatibility
function initializeProject() {
  if (hotspotProjectInstance) {
    console.log('Project already initialized');
    return;
  }
  
  console.log('Initializing hotspot project...');
  hotspotProjectInstance = new HotspotProject();
}

// Multiple initialization triggers for different scenarios
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOMContentLoaded triggered');
  setTimeout(initializeProject, 1000);
});

// Also listen for A-Frame scene loaded event
document.addEventListener('DOMContentLoaded', () => {
  const scene = document.querySelector('a-scene');
  if (scene) {
    scene.addEventListener('loaded', () => {
      console.log('A-Frame scene loaded');
      setTimeout(initializeProject, 500);
    });
  }
});

// Fallback initialization
setTimeout(() => {
  if (!hotspotProjectInstance) {
    console.log('Fallback initialization');
    initializeProject();
  }
}, 2000);

// Re-initialization for WebXRide preview updates
if (typeof window !== 'undefined') {
  window.addEventListener('focus', () => {
    // Re-initialize when window gains focus (useful for iframe scenarios)
    setTimeout(() => {
      if (!hotspotProjectInstance || !hotspotProjectInstance.initialized) {
        console.log('Re-initializing on window focus');
        hotspotProjectInstance = null;
        initializeProject();
      }
    }, 1000);
  });
}
// Initialize the template
console.log('Template loader: Initializing template...');
document.addEventListener('DOMContentLoaded', function() {
  console.log('Template loader: DOMContentLoaded fired');
  
  // Initialize StoryTemplate if it exists
  if (typeof StoryTemplate !== 'undefined') {
    console.log('Template loader: Creating StoryTemplate instance');
    new StoryTemplate();
  } else {
    console.log('Template loader: StoryTemplate not found');
  }
  
  // Initialize EnhancedParallax if it exists
  if (typeof EnhancedParallax !== 'undefined') {
    console.log('Template loader: Creating EnhancedParallax instance');
    new EnhancedParallax();
  } else {
    console.log('Template loader: EnhancedParallax not found');
  }
  
  // Initialize ScrollProgress if it exists
  if (typeof ScrollProgress !== 'undefined') {
    console.log('Template loader: Creating ScrollProgress instance');
    new ScrollProgress();
  } else {
    console.log('Template loader: ScrollProgress not found');
  }
  
  // Call addInteractiveFeatures if it exists
  if (typeof addInteractiveFeatures === 'function') {
    console.log('Template loader: Calling addInteractiveFeatures');
    addInteractiveFeatures();
  } else {
    console.log('Template loader: addInteractiveFeatures not found');
  }
  
  console.log('Template loader: Initialization complete');
});

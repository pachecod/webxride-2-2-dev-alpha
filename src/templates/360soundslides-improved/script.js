// 360° Audio Tour - Improved Version
// Better organized, more maintainable, and compatible with the app's template system

class AudioTour {
  constructor() {
    this.currentScene = 'scene1';
    this.currentAudio = null;
    this.audioEnabled = false;
    this.isLoading = true;
    this.scenes = {
      scene1: { panorama: '#panorama1', audio: '#audio1', title: 'Forest Path', description: 'A peaceful forest path surrounded by nature.' },
      scene2: { panorama: '#panorama2', audio: '#audio2', title: 'Lake View', description: 'A serene lake with crystal clear waters.' },
      scene3: { panorama: '#panorama3', audio: '#audio3', title: 'Mountain Vista', description: 'Majestic mountains stretching to the horizon.' }
    };
    
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.setupAFrameComponents();
    this.loadAssets();
  }

  setupEventListeners() {
    // Start button
    const startButton = document.getElementById('start-button');
    if (startButton) {
      startButton.addEventListener('click', () => this.startTour());
    }

    // Asset loading
    const assets = document.querySelector('a-assets');
    if (assets) {
      assets.addEventListener('loaded', () => this.onAssetsLoaded());
    }

    // Scene loading
    const scene = document.querySelector('a-scene');
    if (scene) {
      scene.addEventListener('loaded', () => this.onSceneLoaded());
    }
  }

  setupAFrameComponents() {
    // Hotspot component
    AFRAME.registerComponent('hotspot', {
      schema: {
        target: { type: 'string' },
        audio: { type: 'string' },
        title: { type: 'string' },
        description: { type: 'string' }
      },

      init: function() {
        this.el.addEventListener('click', (e) => {
          e.stopPropagation();
          window.audioTour.navigateToScene(this.data.target);
        });

        // Visual feedback
        this.el.addEventListener('mouseenter', () => {
          this.el.classList.add('hotspot-animation');
        });

        this.el.addEventListener('mouseleave', () => {
          this.el.classList.remove('hotspot-animation');
        });
      }
    });

    // Audio control component
    AFRAME.registerComponent('audio-control', {
      schema: {
        action: { type: 'string' }
      },

      init: function() {
        this.el.addEventListener('click', (e) => {
          e.stopPropagation();
          if (this.data.action === 'play') {
            window.audioTour.playAudio();
          } else if (this.data.action === 'pause') {
            window.audioTour.pauseAudio();
          }
        });
      }
    });
  }

  async loadAssets() {
    const progressBar = document.getElementById('progress-bar');
    const progressFill = document.querySelector('.progress-fill');
    const progressText = document.querySelector('.progress-text');

    if (progressBar) {
      progressBar.classList.remove('hidden');
    }

    // Simulate loading progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15;
      if (progress > 90) progress = 90;
      
      if (progressFill) progressFill.style.width = `${progress}%`;
      if (progressText) progressText.textContent = `Loading assets... ${Math.round(progress)}%`;
    }, 200);

    // Wait for assets to load
    await this.waitForAssets();
    
    clearInterval(interval);
    if (progressFill) progressFill.style.width = '100%';
    if (progressText) progressText.textContent = 'Ready!';
    
    setTimeout(() => {
      if (progressBar) progressBar.classList.add('hidden');
      this.showStartOverlay();
    }, 500);
  }

  async waitForAssets() {
    return new Promise((resolve) => {
      const assets = document.querySelector('a-assets');
      if (assets) {
        assets.addEventListener('loaded', resolve, { once: true });
        // Fallback timeout
        setTimeout(resolve, 3000);
      } else {
        resolve();
      }
    });
  }

  showStartOverlay() {
    const loadingOverlay = document.getElementById('loading-overlay');
    const startOverlay = document.getElementById('start-overlay');
    
    if (loadingOverlay) {
      loadingOverlay.style.opacity = '0';
      setTimeout(() => loadingOverlay.classList.add('hidden'), 500);
    }
    
    if (startOverlay) {
      startOverlay.classList.remove('hidden');
    }
  }

  async startTour() {
    const startOverlay = document.getElementById('start-overlay');
    if (startOverlay) {
      startOverlay.classList.add('hidden');
    }

    // Enable audio context
    await this.enableAudio();
    
    // Start with first scene
    this.navigateToScene('scene1');
  }

  async enableAudio() {
    try {
      // Create a temporary audio context to unlock audio
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      await audioContext.resume();
      
      // Preload all audio files
      const audioElements = document.querySelectorAll('audio');
      for (const audio of audioElements) {
        audio.load();
        await new Promise((resolve) => {
          if (audio.readyState >= 2) {
            resolve();
          } else {
            audio.addEventListener('canplay', resolve, { once: true });
          }
        });
      }
      
      this.audioEnabled = true;
      console.log('Audio enabled successfully');
    } catch (error) {
      console.warn('Audio could not be enabled:', error);
    }
  }

  navigateToScene(sceneId) {
    if (!this.scenes[sceneId]) {
      console.error('Scene not found:', sceneId);
      return;
    }

    const scene = this.scenes[sceneId];
    
    // Update panorama
    const skybox = document.querySelector('#skybox');
    if (skybox) {
      skybox.setAttribute('src', scene.panorama);
    }

    // Update hotspot visibility
    this.updateHotspotVisibility(sceneId);

    // Update info panel
    this.updateInfoPanel(scene.title, scene.description);

    // Play audio
    if (this.audioEnabled) {
      this.playAudioForScene(sceneId);
    }

    this.currentScene = sceneId;
  }

  updateHotspotVisibility(activeSceneId) {
    const hotspots = document.querySelectorAll('[id^="scene"]');
    hotspots.forEach(hotspot => {
      const isActive = hotspot.id === activeSceneId;
      hotspot.setAttribute('visible', isActive);
    });
  }

  updateInfoPanel(title, description) {
    const titleElement = document.querySelector('#scene-title');
    const descriptionElement = document.querySelector('#scene-description');
    
    if (titleElement) titleElement.setAttribute('value', title);
    if (descriptionElement) descriptionElement.setAttribute('value', description);
  }

  playAudioForScene(sceneId) {
    const scene = this.scenes[sceneId];
    if (!scene || !scene.audio) return;

    // Stop current audio
    this.pauseAudio();

    // Play new audio
    const audioElement = document.querySelector(scene.audio);
    if (audioElement) {
      audioElement.play().catch(error => {
        console.warn('Could not play audio:', error);
      });
      this.currentAudio = audioElement;
      this.updateAudioStatus('Playing');
    }
  }

  playAudio() {
    if (!this.audioEnabled) return;
    
    const scene = this.scenes[this.currentScene];
    if (scene && scene.audio) {
      const audioElement = document.querySelector(scene.audio);
      if (audioElement) {
        audioElement.play().catch(error => {
          console.warn('Could not play audio:', error);
        });
        this.currentAudio = audioElement;
        this.updateAudioStatus('Playing');
      }
    }
  }

  pauseAudio() {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.updateAudioStatus('Paused');
    }
  }

  updateAudioStatus(status) {
    const statusElement = document.querySelector('#audio-status');
    if (statusElement) {
      statusElement.setAttribute('value', `Audio: ${status}`);
    }
  }

  onAssetsLoaded() {
    console.log('All assets loaded');
  }

  onSceneLoaded() {
    console.log('Scene loaded');
    this.isLoading = false;
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.audioTour = new AudioTour();
});

// Handle VR mode changes
document.addEventListener('DOMContentLoaded', () => {
  const scene = document.querySelector('a-scene');
  if (scene) {
    scene.addEventListener('enter-vr', () => {
      console.log('Entered VR mode');
    });
    
    scene.addEventListener('exit-vr', () => {
      console.log('Exited VR mode');
    });
  }
}); 
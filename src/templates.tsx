import { FileType, Framework, Project } from './types';

// Basic HTML template
const basicTemplate: Project = {
  name: 'Basic HTML Project',
  framework: Framework.HTML,
  files: [
    {
      id: 'index.html',
      name: 'index.html',
      type: FileType.HTML,
      content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My Project</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div class="container">
    <h1>Welcome to WebXR IDE</h1>
    <p>Edit this HTML file to get started with your project.</p>
    <div class="card">
      <h2>Features</h2>
      <ul>
        <li>Live preview as you type</li>
        <li>Support for HTML, CSS, and JavaScript</li>
        <li>Built-in WebXR frameworks</li>
      </ul>
    </div>
    <button id="demo-button">Click me!</button>
  </div>
  <script src="script.js"></script>
</body>
</html>`
    },
    {
      id: 'style.css',
      name: 'style.css',
      type: FileType.CSS,
      content: `body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  line-height: 1.6;
  color: #333;
  margin: 0;
  padding: 0;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  min-height: 100vh;
}

.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  margin-top: 2rem;
}

h1 {
  color: #2563eb;
  margin-top: 0;
}

.card {
  background-color: #f9fafb;
  border-left: 4px solid #3b82f6;
  padding: 1rem;
  margin: 1.5rem 0;
  border-radius: 4px;
  transition: transform 0.2s ease;
}

.card:hover {
  transform: translateY(-3px);
}

button {
  background-color: #3b82f6;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.2s;
}

button:hover {
  background-color: #2563eb;
}`
    },
    {
      id: 'script.js',
      name: 'script.js',
      type: FileType.JS,
      content: `// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('Script loaded!');
  
  // Add event listener to the button
  const button = document.getElementById('demo-button');
  if (button) {
    button.addEventListener('click', () => {
      alert('Button clicked!');
      
      // Change the button text
      button.textContent = 'Clicked!';
      
      // Add a class for styling
      button.style.backgroundColor = '#10b981';
    });
  }
  
  // Add a simple animation to the card
  const card = document.querySelector('.card');
  if (card) {
    let animated = false;
    
    card.addEventListener('click', () => {
      if (!animated) {
        card.style.transition = 'transform 0.5s ease, box-shadow 0.5s ease';
        card.style.transform = 'scale(1.05)';
        card.style.boxShadow = '0 10px 15px rgba(0, 0, 0, 0.1)';
        animated = true;
      } else {
        card.style.transform = 'scale(1)';
        card.style.boxShadow = 'none';
        animated = false;
      }
    });
  }
});`
    }
  ]
};

// A-Frame template
const aframeTemplate: Project = {
  name: 'A-Frame Project',
  framework: Framework.AFRAME,
  files: [
    {
      id: 'index.html',
      name: 'index.html',
      type: FileType.HTML,
      content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Simple A-Frame Scene</title>
  <script src="https://aframe.io/releases/1.4.2/aframe.min.js"></script>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <a-scene>
    <!-- Environment -->
    <a-sky color="#ECECEC"></a-sky>
    <a-plane position="0 0 -4" rotation="-90 0 0" width="4" height="4" color="#7BC8A4"></a-plane>

    <!-- Add some basic shapes -->
    <a-box position="-1 0.5 -3" rotation="0 45 0" color="#4CC3D9"></a-box>
    <a-sphere position="0 1.25 -5" radius="1.25" color="#EF2D5E"></a-sphere>
    <a-cylinder position="1 0.75 -3" radius="0.5" height="1.5" color="#FFC65D"></a-cylinder>

    <!-- Camera -->
    <a-entity position="0 1.6 0">
      <a-camera></a-camera>
    </a-entity>
  </a-scene>

  <script src="script.js"></script>
</body>
</html>`
    },
    {
      id: 'style.css',
      name: 'style.css',
      type: FileType.CSS,
      content: `body {
  margin: 0;
  padding: 0;
}

.a-enter-vr {
  position: fixed;
  bottom: 20px;
  right: 20px;
}`
    },
    {
      id: 'script.js',
      name: 'script.js',
      type: FileType.JS,
      content: `document.addEventListener('DOMContentLoaded', () => {
  // Add some simple animations
  const box = document.querySelector('a-box');
  const sphere = document.querySelector('a-sphere');
  const cylinder = document.querySelector('a-cylinder');

  // Rotate box
  box.setAttribute('animation', {
    property: 'rotation',
    dur: 4000,
    to: '0 405 0',
    loop: true
  });

  // Move sphere up and down
  sphere.setAttribute('animation', {
    property: 'position',
    dur: 2000,
    dir: 'alternate',
    easing: 'easeInOutSine',
    to: '0 1.75 -5',
    loop: true
  });

  // Change cylinder color
  cylinder.setAttribute('animation', {
    property: 'material.color',
    dur: 3000,
    to: '#FF6B6B',
    dir: 'alternate',
    loop: true
  });
});`
    }
  ]
};

// Babylon.js template
const babylonTemplate: Project = {
  name: 'Babylon.js Project',
  framework: Framework.BABYLON,
  files: [
    {
      id: 'index.html',
      name: 'index.html',
      type: FileType.HTML,
      content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Babylon.js Project</title>
  <script src="https://cdn.babylonjs.com/babylon.js"></script>
  <script src="https://cdn.babylonjs.com/loaders/babylonjs.loaders.min.js"></script>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <canvas id="renderCanvas"></canvas>
  <script src="script.js"></script>
</body>
</html>`
    },
    {
      id: 'style.css',
      name: 'style.css',
      type: FileType.CSS,
      content: `html, body {
  overflow: hidden;
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
}

#renderCanvas {
  width: 100%;
  height: 100%;
  touch-action: none;
}`
    },
    {
      id: 'script.js',
      name: 'script.js',
      type: FileType.JS,
      content: `document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('renderCanvas');
  const engine = new BABYLON.Engine(canvas, true);

  const createScene = () => {
    const scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color3(0.1, 0.1, 0.2);

    // Add camera
    const camera = new BABYLON.ArcRotateCamera(
      'camera',
      0,
      Math.PI / 3,
      10,
      BABYLON.Vector3.Zero(),
      scene
    );
    camera.attachControl(canvas, true);

    // Add lights
    const light = new BABYLON.HemisphericLight(
      'light',
      new BABYLON.Vector3(0, 1, 0),
      scene
    );

    // Add shapes
    const sphere = BABYLON.MeshBuilder.CreateSphere(
      'sphere',
      { diameter: 2 },
      scene
    );
    sphere.position.y = 1;

    const ground = BABYLON.MeshBuilder.CreateGround(
      'ground',
      { width: 10, height: 10 },
      scene
    );

    // Add materials
    const sphereMaterial = new BABYLON.StandardMaterial('sphereMat', scene);
    sphereMaterial.diffuseColor = new BABYLON.Color3(0.4, 0.4, 0.8);
    sphere.material = sphereMaterial;

    const groundMaterial = new BABYLON.StandardMaterial('groundMat', scene);
    groundMaterial.diffuseColor = new BABYLON.Color3(0.4, 0.6, 0.4);
    ground.material = groundMaterial;

    return scene;
  };

  const scene = createScene();

  engine.runRenderLoop(() => {
    scene.render();
  });

  window.addEventListener('resize', () => {
    engine.resize();
  });
});`
    }
  ]
};

// 360° Audio Tour template
const audioTourTemplate: Project = {
  name: '360° Audio Tour',
  framework: Framework.AFRAME,
  files: [
    {
      id: 'index.html',
      name: 'index.html',
      type: FileType.HTML,
      content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>360° Audio Tour</title>
  <script src="https://aframe.io/releases/1.4.2/aframe.min.js"></script>
  <link rel="stylesheet" href="style.css">
</head>

<body>
  <!-- Loading overlay -->
  <div id="loading-overlay">
    <div class="loading-content">
      <div class="spinner"></div>
      <p>Loading 360° Tour...</p>
    </div>
  </div>

  <!-- Start overlay -->
  <div id="start-overlay" class="hidden">
    <div class="start-content">
      <h1>360° Audio Tour</h1>
      <p>Explore interactive panoramas with audio narration</p>
      <button id="start-button">Start Tour</button>
      <div class="instructions">
        <h3>How to use:</h3>
        <ul>
          <li>Click hotspots to navigate between scenes</li>
          <li>Use play/pause buttons to control audio</li>
          <li>Click "Caption" for detailed descriptions</li>
          <li>Drag to look around in each panorama</li>
        </ul>
      </div>
    </div>
  </div>

  <!-- Progress indicator -->
  <div id="progress-bar" class="hidden">
    <div class="progress-fill"></div>
    <span class="progress-text">Loading assets...</span>
  </div>

  <a-scene background="color: #ECECEC" vr-mode-ui="enabled: true">
    <!-- Assets -->
    <a-assets timeout="30000">
      <!-- Panoramas -->
      <img id="panorama1" src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=2048&h=1024&fit=crop" crossorigin="anonymous" />
      <img id="panorama2" src="https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=2048&h=1024&fit=crop" crossorigin="anonymous" />
      <img id="panorama3" src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=2048&h=1024&fit=crop" crossorigin="anonymous" />

      <!-- UI Elements -->
      <img id="hotspot-icon" src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMzIiIGN5PSIzMiIgcj0iMjQiIGZpbGw9IiNGRkQ3MDAiIHN0cm9rZT0iI0ZGRkZGRiIgc3Ryb2tlLXdpZHRoPSI0Ii8+CjxjaXJjbGUgY3g9IjMyIiBjeT0iMzIiIHI9IjgiIGZpbGw9IiNGRkZGRkYiLz4KPC9zdmc+" />
      <img id="play-icon" src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTggNVYxOUwxOSAxMkw4IDVaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4=" />
      <img id="pause-icon" src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3QgeD0iNiIgeT0iNCIgd2lkdGg9IjQiIGhlaWdodD0iMTYiIGZpbGw9IndoaXRlIi8+CjxyZWN0IHg9IjE0IiB5PSI0IiB3aWR0aD0iNCIgaGVpZ2h0PSIxNiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+" />
      
      <!-- Audio tracks (using placeholder URLs - replace with actual audio files) -->
      <audio id="audio1" src="https://www.soundjay.com/misc/sounds/bell-ringing-05.wav" preload="auto" crossorigin="anonymous"></audio>
      <audio id="audio2" src="https://www.soundjay.com/misc/sounds/bell-ringing-05.wav" preload="auto" crossorigin="anonymous"></audio>
      <audio id="audio3" src="https://www.soundjay.com/misc/sounds/bell-ringing-05.wav" preload="auto" crossorigin="anonymous"></audio>
    </a-assets>

    <!-- Hotspot groups -->
    <a-entity id="hotspots">
      <!-- Scene 1: Forest -->
      <a-entity id="scene1" visible="true">
        <a-image
          class="clickable hotspot"
          src="#hotspot-icon"
          position="2 1.6 -3"
          scale="0.4 0.4 0.4"
          hotspot="target:scene2; audio:audio1; title:Forest Path; description:This peaceful forest path leads to a beautiful clearing. Listen to the sounds of nature and birds chirping in the distance."
        >
          <a-text value="→" position="0 0 0.1" align="center" color="white" scale="2 2 2"></a-text>
        </a-image>
        
        <a-image
          class="clickable hotspot"
          src="#hotspot-icon"
          position="-2 1.6 -3"
          scale="0.4 0.4 0.4"
          hotspot="target:scene3; audio:audio3; title:Mountain View; description:From this vantage point, you can see the majestic mountains in the distance. The crisp mountain air and stunning vistas create a perfect moment of tranquility."
        >
          <a-text value="→" position="0 0 0.1" align="center" color="white" scale="2 2 2"></a-text>
        </a-image>
      </a-entity>

      <!-- Scene 2: Lake -->
      <a-entity id="scene2" visible="false">
        <a-image
          class="clickable hotspot"
          src="#hotspot-icon"
          position="0 1.6 -3"
          scale="0.4 0.4 0.4"
          hotspot="target:scene1; audio:audio2; title:Back to Forest; description:Return to the peaceful forest path where the journey began."
        >
          <a-text value="←" position="0 0 0.1" align="center" color="white" scale="2 2 2"></a-text>
        </a-image>
      </a-entity>

      <!-- Scene 3: Mountains -->
      <a-entity id="scene3" visible="false">
        <a-image
          class="clickable hotspot"
          src="#hotspot-icon"
          position="0 1.6 -3"
          scale="0.4 0.4 0.4"
          hotspot="target:scene1; audio:audio1; title:Back to Forest; description:Return to the peaceful forest path where the journey began."
        >
          <a-text value="←" position="0 0 0.1" align="center" color="white" scale="2 2 2"></a-text>
        </a-image>
      </a-entity>
    </a-entity>

    <!-- Audio controls -->
    <a-entity id="audio-controls" position="0 -1.5 -2">
      <a-plane
        color="#000000"
        opacity="0.7"
        width="3"
        height="0.8"
        position="0 0 0"
      ></a-plane>
      
      <a-image
        id="play-button"
        class="clickable"
        src="#play-icon"
        position="-0.8 0 0.01"
        width="0.3"
        height="0.3"
        audio-control="action:play"
      ></a-image>
      
      <a-image
        id="pause-button"
        class="clickable"
        src="#pause-icon"
        position="-0.4 0 0.01"
        width="0.3"
        height="0.3"
        audio-control="action:pause"
      ></a-image>
      
      <a-text
        id="audio-status"
        value="Audio: Ready"
        position="0.2 0 0.01"
        color="white"
        width="2"
        align="left"
      ></a-text>
    </a-entity>

    <!-- Info panel -->
    <a-entity id="info-panel" position="0 1.5 -2">
      <a-plane
        color="#000000"
        opacity="0.8"
        width="4"
        height="1"
        position="0 0 0"
      ></a-plane>
      
      <a-text
        id="scene-title"
        value="Forest Path"
        position="0 0.2 0.01"
        color="white"
        width="3.5"
        align="center"
        font="kelsonsans"
      ></a-text>
      
      <a-text
        id="scene-description"
        value="Click hotspots to navigate between scenes"
        position="0 -0.2 0.01"
        color="#CCCCCC"
        width="3.5"
        align="center"
        font="kelsonsans"
      ></a-text>
    </a-entity>

    <!-- The sky (panorama) -->
    <a-sky id="skybox" src="#panorama1"></a-sky>

    <!-- Camera with cursor -->
    <a-entity id="camera" camera look-controls position="0 1.6 0">
      <a-entity 
        cursor="rayOrigin: mouse; fuse: false"
        raycaster="objects: .clickable; far: 10"
        position="0 0 -1"
        geometry="primitive: ring; radiusInner: 0.02; radiusOuter: 0.03"
        material="color: white; shader: flat"
      ></a-entity>
    </a-entity>
  </a-scene>

  <script src="script.js"></script>
</body>
</html>`
    },
    {
      id: 'style.css',
      name: 'style.css',
      type: FileType.CSS,
      content: `/* Base styles */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Arial', sans-serif;
  overflow: hidden;
  background: #000;
}

/* Loading overlay */
#loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  transition: opacity 0.5s ease-out;
}

.loading-content {
  text-align: center;
  color: white;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top: 4px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Start overlay */
#start-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 999;
}

.start-content {
  text-align: center;
  color: white;
  max-width: 500px;
  padding: 40px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 20px;
}

.start-content h1 {
  font-size: 2.5em;
  margin-bottom: 10px;
}

#start-button {
  background: linear-gradient(45deg, #ff6b6b, #ee5a24);
  color: white;
  border: none;
  padding: 15px 40px;
  font-size: 1.2em;
  border-radius: 50px;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 30px;
}

#start-button:hover {
  transform: translateY(-2px);
  background: linear-gradient(45deg, #ee5a24, #ff6b6b);
}

/* Utility classes */
.hidden {
  display: none !important;
}

/* Hotspot animations */
@keyframes hotspotPulse {
  0% { opacity: 0.8; transform: scale(1); }
  50% { opacity: 1.0; transform: scale(1.05); }
  100% { opacity: 0.8; transform: scale(1); }
}

.hotspot-animation {
  animation: hotspotPulse 2s infinite;
}`
    },
    {
      id: 'script.js',
      name: 'script.js',
      type: FileType.JS,
      content: `// 360° Audio Tour - Improved Version
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
      
      if (progressFill) progressFill.style.width = \`\${progress}%\`;
      if (progressText) progressText.textContent = \`Loading assets... \${Math.round(progress)}%\`;
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
      statusElement.setAttribute('value', \`Audio: \${status}\`);
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
});`
    }
  ]
};

export { basicTemplate };
export const defaultTemplates = {
  basic: basicTemplate,
  aframe: aframeTemplate,
  babylon: babylonTemplate,
  audioTour: audioTourTemplate,
};
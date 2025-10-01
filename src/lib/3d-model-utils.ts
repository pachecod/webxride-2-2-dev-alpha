/**
 * 3D Model Utilities for WebXRide
 * Provides enhanced 3D model loading, optimization, and preview functionality
 */

export interface ModelLoadOptions {
  enableShadows?: boolean;
  enableAntialiasing?: boolean;
  optimizeMaterials?: boolean;
  preloadTextures?: boolean;
  timeout?: number;
}

export type MovementMode = 'move' | 'look';

export interface ModelLoadState {
  loading: boolean;
  error: string | null;
  progress: number;
  loaded: boolean;
}

/**
 * Enhanced 3D Model Handler Component for A-Frame
 */
export function createEnhancedModelHandler(options: ModelLoadOptions = {}) {
  const {
    enableShadows = true,
    enableAntialiasing = true,
    optimizeMaterials = true,
    preloadTextures = true,
    timeout = 30000
  } = options;

  return `
    AFRAME.registerComponent('enhanced-model-handler', {
      init: function() {
        this.options = ${JSON.stringify(options)};
        this.loadState = {
          loading: true,
          error: null,
          progress: 0,
          loaded: false
        };
        
        this.el.addEventListener('model-loaded', this.onModelLoaded.bind(this));
        this.el.addEventListener('model-error', this.onModelError.bind(this));
        this.el.addEventListener('model-loading', this.onModelLoading.bind(this));
        
        // Send initial loading state to parent
        this.sendMessageToParent({
          type: 'MODEL_LOADING_STATE',
          ...this.loadState
        });
        
        // Set timeout for model loading
        this.loadTimeout = setTimeout(() => {
          if (this.loadState.loading) {
            this.onModelError({ detail: { message: 'Model loading timeout' } });
          }
        }, ${timeout});
      },
      
      onModelLoaded: function() {
        console.log('Enhanced model handler: Model loaded successfully');
        clearTimeout(this.loadTimeout);
        
        const mesh = this.el.getObject3D('mesh');
        if (mesh) {
          // Optimize model performance
          this.optimizeModel(mesh);
          
          // Update load state
          this.loadState.loading = false;
          this.loadState.loaded = true;
          this.loadState.progress = 100;
          
          // Send success state to parent
          this.sendMessageToParent({
            type: 'MODEL_LOADING_STATE',
            ...this.loadState
          });
        }
      },
      
      onModelError: function(event) {
        console.error('Enhanced model handler: Model loading error:', event.detail);
        clearTimeout(this.loadTimeout);
        
        // Update load state
        this.loadState.loading = false;
        this.loadState.error = event.detail.message || 'Failed to load 3D model';
        
        // Send error state to parent
        this.sendMessageToParent({
          type: 'MODEL_LOADING_STATE',
          ...this.loadState
        });
      },
      
      onModelLoading: function() {
        console.log('Enhanced model handler: Model loading started');
        
        // Update load state
        this.loadState.loading = true;
        this.loadState.progress = 25;
        
        // Send loading state to parent
        this.sendMessageToParent({
          type: 'MODEL_LOADING_STATE',
          ...this.loadState
        });
      },
      
      optimizeModel: function(mesh) {
        // Optimize geometry
        if (mesh.geometry) {
          mesh.geometry.computeBoundingBox();
          mesh.geometry.computeBoundingSphere();
          
          // Optimize materials
          if (mesh.material) {
            if (Array.isArray(mesh.material)) {
              mesh.material.forEach(mat => this.optimizeMaterial(mat));
            } else {
              this.optimizeMaterial(mesh.material);
            }
          }
        }
        
        // Traverse child objects
        mesh.traverse((node) => {
          if (node.isMesh) {
            if (node.geometry) {
              node.geometry.computeBoundingBox();
              node.geometry.computeBoundingSphere();
            }
            if (node.material) {
              this.optimizeMaterial(node.material);
            }
          }
        });
      },
      
      optimizeMaterial: function(material) {
        // Force material update
        material.needsUpdate = true;
        
        // Optimize textures
        if (material.map) {
          material.map.needsUpdate = true;
          if (this.options.optimizeMaterials) {
            material.map.minFilter = THREE.LinearFilter;
            material.map.magFilter = THREE.LinearFilter;
            material.map.generateMipmaps = false;
          }
        }
        
        // Enable shadow casting/receiving for better visuals
        if (this.options.enableShadows) {
          material.castShadow = true;
          material.receiveShadow = true;
        }
      },
      
      sendMessageToParent: function(data) {
        try {
          if (window.parent && window.parent !== window) {
            window.parent.postMessage(data, '*');
          }
        } catch (e) {
          console.warn('Could not send message to parent:', e);
        }
      }
    });
  `;
}

/**
 * Enhanced Camera Controls Component for A-Frame
 */
export function createEnhancedCameraControls() {
  return `
    AFRAME.registerComponent('enhanced-camera-controls', {
      init: function() {
        this.camera = this.el;
        this.initialPosition = this.camera.getAttribute('position');
        this.initialRotation = this.camera.getAttribute('rotation');
        this.moveSpeed = 0.1;
        this.rotationSpeed = 2;
        this.movementMode = 'move'; // 'move' or 'look'
        this.isMouseDown = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
        
        // Add keyboard controls for better navigation
        this.setupKeyboardControls();
        this.setupMouseControls();
        
        // Listen for movement mode changes from parent
        window.addEventListener('message', (event) => {
          if (event.data && event.data.type === 'MOVEMENT_MODE_CHANGE') {
            this.movementMode = event.data.mode;
            console.log('Movement mode changed to:', this.movementMode);
          }
        });
      },
      
            setupKeyboardControls: function() {
        document.addEventListener('keydown', (event) => {
          const position = this.camera.getAttribute('position');
          const rotation = this.camera.getAttribute('rotation');
          
          switch(event.key.toLowerCase()) {
            case 'w': // Move forward
              this.moveCamera('forward', this.moveSpeed);
              break;
            case 's': // Move backward
              this.moveCamera('backward', this.moveSpeed);
              break;
            case 'a': // Strafe left
              this.moveCamera('left', this.moveSpeed);
              break;
            case 'd': // Strafe right
              this.moveCamera('right', this.moveSpeed);
              break;
            case 'q': // Rotate left
              this.rotateCamera('left', this.rotationSpeed);
              break;
            case 'e': // Rotate right
              this.rotateCamera('right', this.rotationSpeed);
              break;
            case 'r': // Reset view
              this.resetView();
              break;
            case 'shift': // Increase speed
              this.moveSpeed = 0.2;
              break;
            // Add vertical movement controls
            case ' ': // Spacebar - Move up
              this.moveCamera('up', this.moveSpeed);
              break;
            case 'control': // Ctrl - Move down
              this.moveCamera('down', this.moveSpeed);
              break;
            case 'arrowup': // Up arrow - Move up
              this.moveCamera('up', this.moveSpeed);
              break;
            case 'arrowdown': // Down arrow - Move down
              this.moveCamera('down', this.moveSpeed);
              break;
            case 'arrowleft': // Left arrow - Strafe left
              this.moveCamera('left', this.moveSpeed);
              break;
            case 'arrowright': // Right arrow - Strafe right
              this.moveCamera('right', this.moveSpeed);
              break;
          }
        });
        
        document.addEventListener('keyup', (event) => {
          if (event.key.toLowerCase() === 'shift') {
            this.moveSpeed = 0.1;
          }
        });
      },
      
      setupMouseControls: function() {
        document.addEventListener('mousedown', (event) => {
          this.isMouseDown = true;
          this.lastMouseX = event.clientX;
          this.lastMouseY = event.clientY;
        });
        
        document.addEventListener('mouseup', () => {
          this.isMouseDown = false;
        });
        
        document.addEventListener('mousemove', (event) => {
          if (this.isMouseDown) {
            const deltaX = event.clientX - this.lastMouseX;
            const deltaY = event.clientY - this.lastMouseY;
            
            if (this.movementMode === 'look') {
              // Look around mode - rotate camera
              const rotation = this.camera.getAttribute('rotation');
              this.camera.setAttribute('rotation', {
                x: Math.max(-90, Math.min(90, rotation.x - deltaY * 0.5)),
                y: rotation.y + deltaX * 0.5,
                z: rotation.z
              });
            } else {
              // Move mode - move camera based on mouse movement
              const position = this.camera.getAttribute('position');
              const rotation = this.camera.getAttribute('rotation');
              const rad = rotation.y * Math.PI / 180;
              
              // Calculate movement based on mouse delta
              const moveX = -deltaX * 0.01;
              const moveZ = -deltaY * 0.01;
              
              // Apply movement relative to camera rotation
              const newPosition = {
                x: position.x + (moveX * Math.cos(rad) - moveZ * Math.sin(rad)),
                y: position.y,
                z: position.z + (moveX * Math.sin(rad) + moveZ * Math.cos(rad))
              };
              
              this.camera.setAttribute('position', newPosition);
            }
            
            this.lastMouseX = event.clientX;
            this.lastMouseY = event.clientY;
          }
        });
      },
      
      moveCamera: function(direction, distance) {
        const position = this.camera.getAttribute('position');
        const rotation = this.camera.getAttribute('rotation');
        const rad = rotation.y * Math.PI / 180;
        
        let newPosition = { ...position };
        
        switch(direction) {
          case 'forward':
            newPosition.x -= Math.sin(rad) * distance;
            newPosition.z -= Math.cos(rad) * distance;
            break;
          case 'backward':
            newPosition.x += Math.sin(rad) * distance;
            newPosition.z += Math.cos(rad) * distance;
            break;
          case 'left':
            newPosition.x -= Math.cos(rad) * distance;
            newPosition.z += Math.sin(rad) * distance;
            break;
          case 'right':
            newPosition.x += Math.cos(rad) * distance;
            newPosition.z -= Math.sin(rad) * distance;
            break;
          // Add vertical movement
          case 'up':
            newPosition.y += distance;
            break;
          case 'down':
            newPosition.y -= distance;
            break;
        }
        
        this.camera.setAttribute('position', newPosition);
      },
      
      rotateCamera: function(direction, angle) {
        const rotation = this.camera.getAttribute('rotation');
        const newRotation = { ...rotation };
        
        if (direction === 'left') {
          newRotation.y -= angle;
        } else if (direction === 'right') {
          newRotation.y += angle;
        }
        
        this.camera.setAttribute('rotation', newRotation);
      },
      
      resetView: function() {
        if (this.initialPosition) {
          this.camera.setAttribute('position', this.initialPosition);
        }
        if (this.initialRotation) {
          this.camera.setAttribute('rotation', this.initialRotation);
        }
      }
    });
  `;
}

/**
 * Scene Performance Optimizer Component for A-Frame
 */
export function createSceneOptimizer(options: ModelLoadOptions = {}) {
  return `
    AFRAME.registerComponent('scene-optimizer', {
      init: function() {
        this.scene = this.el;
        this.options = ${JSON.stringify(options)};
        this.optimizeScene();
      },
      
      optimizeScene: function() {
        // Enable shadows
        if (this.options.enableShadows !== false) {
          this.scene.setAttribute('shadow', 'type: pcfsoft');
        }
        
        // Optimize renderer
        if (this.options.enableAntialiasing !== false) {
          this.scene.setAttribute('renderer', 'antialias: true; colorManagement: true; sortObjects: true');
        }
        
        // Optimize lighting
        const lights = this.scene.querySelectorAll('[light]');
        lights.forEach(light => {
          if (this.options.enableShadows) {
            light.setAttribute('cast-shadow', true);
            light.setAttribute('shadow-map-size', 2048);
            light.setAttribute('shadow-camera-far', 50);
          }
        });
        
        // Add performance monitoring
        this.addPerformanceMonitoring();
        
        // Add mouse wheel zoom support
        this.addMouseWheelZoom();
      },
      
      addMouseWheelZoom: function() {
        document.addEventListener('wheel', (event) => {
          event.preventDefault();
          
          const camera = this.scene.querySelector('[camera]') || this.scene.querySelector('[position]');
          if (!camera) return;
          
          const position = camera.getAttribute('position');
          const zoomSpeed = 0.1;
          const zoomDirection = event.deltaY > 0 ? 1 : -1;
          
          // Zoom towards/away from scene center
          const sceneCenter = { x: 0, y: 0, z: 0 };
          const direction = {
            x: sceneCenter.x - position.x,
            y: sceneCenter.y - position.y,
            z: sceneCenter.z - position.z
          };
          
          const distance = Math.sqrt(direction.x * direction.x + direction.y * direction.y + direction.z * direction.z);
          if (distance > 0.5 || zoomDirection < 0) {
            const scale = 1 + (zoomDirection * zoomSpeed);
            camera.setAttribute('position', {
              x: position.x + direction.x * (scale - 1),
              y: position.y + direction.y * (scale - 1),
              z: position.z + direction.z * (scale - 1)
            });
          }
        });
      },
      
      addPerformanceMonitoring: function() {
        let frameCount = 0;
        let lastTime = performance.now();
        
        const updateFPS = () => {
          frameCount++;
          const currentTime = performance.now();
          
          if (currentTime - lastTime >= 1000) {
            const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
            console.log('Scene FPS:', fps);
            
            frameCount = 0;
            lastTime = currentTime;
          }
          
          requestAnimationFrame(updateFPS);
        };
        
        requestAnimationFrame(updateFPS);
      }
    });
  `;
}

/**
 * Create a complete 3D scene optimization script
 */
export function createComplete3DOptimizationScript(options: ModelLoadOptions = {}) {
  return `
    ${createEnhancedModelHandler(options)}
    ${createEnhancedCameraControls()}
    ${createSceneOptimizer(options)}
    
    // Additional 3D scene enhancements
    AFRAME.registerComponent('scene-enhancer', {
      init: function() {
        this.scene = this.el;
        this.enhanceScene();
      },
      
      enhanceScene: function() {
        // Add ambient lighting if none exists
        if (!this.scene.querySelector('[light][type="ambient"]')) {
          const ambientLight = document.createElement('a-light');
          ambientLight.setAttribute('type', 'ambient');
          ambientLight.setAttribute('intensity', '0.4');
          ambientLight.setAttribute('color', '#ffffff');
          this.scene.appendChild(ambientLight);
        }
        
        // Add directional lighting if none exists
        if (!this.scene.querySelector('[light][type="directional"]')) {
          const directionalLight = document.createElement('a-light');
          directionalLight.setAttribute('type', 'directional');
          directionalLight.setAttribute('intensity', '0.8');
          directionalLight.setAttribute('color', '#ffffff');
          directionalLight.setAttribute('position', '0 10 5');
          directionalLight.setAttribute('cast-shadow', true);
          this.scene.appendChild(directionalLight);
        }
        
        // Enable physics if available
        if (AFRAME.utils.device.isMobile()) {
          this.scene.setAttribute('renderer', 'powerPreference: high-performance');
        }
      }
    });
  `;
}

/**
 * Utility function to detect 3D content in HTML
 */
export function detect3DContent(htmlContent: string): boolean {
  const patterns = [
    /a-scene/i,
    /aframe/i,
    /gltf-model/i,
    /obj-model/i,
    /collada-model/i,
    /three\.js/i,
    /webgl/i,
    /3d/i
  ];
  
  return patterns.some(pattern => pattern.test(htmlContent));
}

/**
 * Utility function to extract 3D model URLs from HTML
 */
export function extract3DModelUrls(htmlContent: string): string[] {
  const urls: string[] = [];
  const patterns = [
    /gltf-model=["']([^"']+)["']/gi,
    /obj-model=["']([^"']+)["']/gi,
    /collada-model=["']([^"']+)["']/gi,
    /src=["']([^"']+\.(gltf|glb|obj|dae))["']/gi
  ];
  
  patterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(htmlContent)) !== null) {
      urls.push(match[1]);
    }
  });
  
  return [...new Set(urls)]; // Remove duplicates
} 
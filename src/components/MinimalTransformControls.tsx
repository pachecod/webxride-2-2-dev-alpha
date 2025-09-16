import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls';
// If you have type errors for the above, ensure @types/three is installed and your tsconfig includes "types": ["three"]

const MinimalTransformControls: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<'translate' | 'scale'>('translate');
  const controlsRef = useRef<TransformControls | null>(null);

  useEffect(() => {
    const width = 600;
    const height = 400;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x222222);

    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.set(2, 2, 5);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);

    // Add a simple box
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshNormalMaterial({ wireframe: false });
    const box = new THREE.Mesh(geometry, material);
    scene.add(box);

    // Add lights
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(5, 10, 7.5);
    scene.add(light);

    // OrbitControls
    const orbit = new OrbitControls(camera, renderer.domElement);
    orbit.enableDamping = true;

    // TransformControls
    const transform = new TransformControls(camera, renderer.domElement);
    transform.attach(box);
    transform.setSize(2.0); // Make gizmos larger
    scene.add(transform);
    controlsRef.current = transform;

    // Disable OrbitControls while using TransformControls
    function onDraggingChanged(event: { value: boolean }) {
      orbit.enabled = !event.value;
    }
    transform.addEventListener('dragging-changed', onDraggingChanged);

    // Animation loop
    let frameId: number;
    const animate = () => {
      orbit.update();
      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    };
    animate();

    // Mount renderer
    if (mountRef.current) {
      mountRef.current.appendChild(renderer.domElement);
    }

    // Cleanup
    return () => {
      if (mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
      transform.removeEventListener('dragging-changed', onDraggingChanged);
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      cancelAnimationFrame(frameId);
    };
  }, []);

  // Update mode when changed
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.setMode(mode);
    }
  }, [mode]);

  return (
    <div>
      <div style={{ marginBottom: 8 }}>
        <button onClick={() => setMode('translate')} disabled={mode === 'translate'}>
          Translate
        </button>
        <button onClick={() => setMode('scale')} disabled={mode === 'scale'} style={{ marginLeft: 8 }}>
          Scale
        </button>
      </div>
      <div ref={mountRef} style={{ width: 600, height: 400, border: '1px solid #444' }} />
    </div>
  );
};

export default MinimalTransformControls; 
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY; // Use anon key for now

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  console.error('Please create a .env file with:');
  console.error('VITE_SUPABASE_URL=your_supabase_project_url_here');
  console.error('VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here');
  console.error('');
  console.error('You can find these values in your Supabase dashboard under Settings > API');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Sample templates to upload
const templates = {
  'basic-html': {
    name: 'Basic HTML Project',
    framework: 'html',
    description: 'A simple HTML template with CSS and JavaScript',
    files: {
      'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Basic HTML Project</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div class="container">
    <h1>Welcome to Your Basic HTML Project</h1>
    <p>This is a simple HTML template to get you started.</p>
    <button id="clickMe">Click Me!</button>
    <div id="output"></div>
  </div>
  <script src="script.js"></script>
</body>
</html>`,
      'style.css': `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: Arial, sans-serif;
  line-height: 1.6;
  background-color: #f4f4f4;
}

.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

h1 {
  color: #333;
  text-align: center;
  margin-bottom: 20px;
}

p {
  color: #666;
  text-align: center;
  margin-bottom: 20px;
}

button {
  display: block;
  margin: 20px auto;
  padding: 10px 20px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 16px;
}

button:hover {
  background-color: #0056b3;
}

#output {
  text-align: center;
  margin-top: 20px;
  padding: 10px;
  background-color: #e9ecef;
  border-radius: 5px;
  min-height: 50px;
}`,
      'script.js': `document.addEventListener('DOMContentLoaded', function() {
  const button = document.getElementById('clickMe');
  const output = document.getElementById('output');
  let clickCount = 0;

  button.addEventListener('click', function() {
    clickCount++;
    output.innerHTML = 'Button clicked ' + clickCount + ' time' + (clickCount === 1 ? '' : 's') + '!';
  });
});`
    }
  },
  'a-frame-basic': {
    name: 'A-Frame Basic Scene',
    framework: 'aframe',
    description: 'A simple A-Frame VR scene with basic 3D objects',
    files: {
      'index.html': `<!DOCTYPE html>
<html>
<head>
  <title>A-Frame Basic Scene</title>
  <script src="https://aframe.io/releases/1.4.0/aframe.min.js"></script>
</head>
<body>
  <a-scene>
    <a-assets>
      <img id="skyTexture" src="https://cdn.aframe.io/360-image-gallery-boilerplate/img/city.jpg">
    </a-assets>

    <!-- Sky -->
    <a-sky src="#skyTexture"></a-sky>

    <!-- Camera -->
    <a-camera position="0 1.6 0">
      <a-cursor></a-cursor>
    </a-camera>

    <!-- Ground -->
    <a-plane position="0 0 -4" rotation="-90 0 0" width="4" height="4" color="#7BC8A4"></a-plane>

    <!-- Box -->
    <a-box position="-1 0.5 -3" rotation="0 45 0" width="1" height="1" depth="1" color="#4CC3D9"></a-box>

    <!-- Sphere -->
    <a-sphere position="0 1.25 -5" radius="1.25" color="#EF2D5E"></a-sphere>

    <!-- Cylinder -->
    <a-cylinder position="1 0.75 -3" radius="0.5" height="1.5" color="#FFC65D"></a-cylinder>

    <!-- Text -->
    <a-text value="Welcome to A-Frame!" position="0 2.5 -3" align="center" color="#FFF"></a-text>
  </a-scene>
</body>
</html>`
    }
  },
  'babylon-basic': {
    name: 'Babylon.js Basic Scene',
    framework: 'babylon',
    description: 'A simple Babylon.js 3D scene with basic objects',
    files: {
      'index.html': `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Babylon.js Basic Scene</title>
  <style>
    html, body {
      width: 100%;
      height: 100%;
      margin: 0;
      padding: 0;
      overflow: hidden;
    }
    #renderCanvas {
      width: 100%;
      height: 100%;
      touch-action: none;
    }
  </style>
  <script src="https://cdn.babylonjs.com/babylon.js"></script>
  <script src="https://cdn.babylonjs.com/loaders/babylonjs.loaders.min.js"></script>
  <script src="script.js"></script>
</head>
<body>
  <canvas id="renderCanvas"></canvas>
</body>
</html>`,
      'script.js': `window.addEventListener('DOMContentLoaded', function() {
  const canvas = document.getElementById('renderCanvas');
  const engine = new BABYLON.Engine(canvas, true);

  const createScene = function() {
    const scene = new BABYLON.Scene(engine);

    // Camera
    const camera = new BABYLON.ArcRotateCamera('camera', 0, Math.PI / 3, 10, BABYLON.Vector3.Zero(), scene);
    camera.attachControl(canvas, true);

    // Light
    const light = new BABYLON.HemisphericLight('light', new BABYLON.Vector3(0, 1, 0), scene);
    light.intensity = 0.7;

    // Ground
    const ground = BABYLON.MeshBuilder.CreateGround('ground', { width: 6, height: 6 }, scene);
    const groundMaterial = new BABYLON.StandardMaterial('groundMat', scene);
    groundMaterial.diffuseColor = new BABYLON.Color3(0.2, 0.8, 0.2);
    ground.material = groundMaterial;

    // Box
    const box = BABYLON.MeshBuilder.CreateBox('box', { size: 1 }, scene);
    box.position.y = 0.5;
    const boxMaterial = new BABYLON.StandardMaterial('boxMat', scene);
    boxMaterial.diffuseColor = new BABYLON.Color3(0, 0.5, 0.7);
    box.material = boxMaterial;

    // Sphere
    const sphere = BABYLON.MeshBuilder.CreateSphere('sphere', { diameter: 1 }, scene);
    sphere.position = new BABYLON.Vector3(2, 0.5, 0);
    const sphereMaterial = new BABYLON.StandardMaterial('sphereMat', scene);
    sphereMaterial.diffuseColor = new BABYLON.Color3(0.9, 0.2, 0.2);
    sphere.material = sphereMaterial;

    // Animation
    scene.registerBeforeRender(function() {
      box.rotation.y += 0.01;
      sphere.rotation.y -= 0.01;
    });

    return scene;
  };

  const scene = createScene();

  engine.runRenderLoop(function() {
    scene.render();
  });

  window.addEventListener('resize', function() {
    engine.resize();
  });
});`
    }
  }
};

async function uploadTemplates() {
  try {
    console.log('Starting template upload...');

    // Create templates bucket if it doesn't exist
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    if (bucketsError) {
      console.error('Error listing buckets:', bucketsError);
      return;
    }

    const templatesBucketExists = buckets.some(bucket => bucket.name === 'templates');
    if (!templatesBucketExists) {
      console.log('Creating templates bucket...');
      const { error: createError } = await supabase.storage.createBucket('templates', {
        public: false,
        allowedMimeTypes: ['text/html', 'text/css', 'application/javascript', 'application/json']
      });
      if (createError) {
        console.error('Error creating templates bucket:', createError);
        return;
      }
      console.log('Templates bucket created successfully');
    }

    // Upload each template
    for (const [templateId, template] of Object.entries(templates)) {
      console.log('Uploading template: ' + templateId);
      
      // Create metadata file
      const metadata = {
        name: template.name,
        framework: template.framework,
        description: template.description
      };

      // Upload metadata.json
      const { error: metadataError } = await supabase.storage
        .from('templates')
        .upload(templateId + '/metadata.json', JSON.stringify(metadata, null, 2), {
          contentType: 'application/json'
        });

      if (metadataError) {
        console.error('Error uploading metadata for ' + templateId + ':', metadataError);
        continue;
      }

      // Upload each file in the template
      for (const [filename, content] of Object.entries(template.files)) {
        const contentType = filename.endsWith('.html') ? 'text/html' :
                           filename.endsWith('.css') ? 'text/css' :
                           filename.endsWith('.js') ? 'application/javascript' :
                           'text/plain';

        const { error: fileError } = await supabase.storage
          .from('templates')
          .upload(templateId + '/' + filename, content, {
            contentType
          });

        if (fileError) {
          console.error('Error uploading ' + filename + ' for ' + templateId + ':', fileError);
        } else {
          console.log('✓ Uploaded ' + filename + ' for ' + templateId);
        }
      }
    }

    console.log('Template upload completed!');
    
    // List uploaded templates
    const { data: uploadedTemplates, error: listError } = await supabase.storage
      .from('templates')
      .list('', { limit: 100, offset: 0 });
    
    if (listError) {
      console.error('Error listing uploaded templates:', listError);
    } else {
      console.log('Uploaded templates:', uploadedTemplates);
    }

  } catch (error) {
    console.error('Error uploading templates:', error);
  }
}

uploadTemplates(); 
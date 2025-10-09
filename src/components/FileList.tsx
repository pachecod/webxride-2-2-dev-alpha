import React, { useState, useEffect, useRef } from 'react';
import { Copy, Trash2, FileText, Image as ImageIcon, FileAudio, File, Box, AlertCircle, ChevronDown, ChevronRight, RefreshCw, Search, ChevronLeft, Edit, X, Tag, Plus } from 'lucide-react';
import { supabase, getFiles, createRequiredFolders, renameFile as renameFileInStorage, updateFileMetadata } from '../lib/supabase';
import { FileUpload } from './FileUpload';
import { CommonFileUpload } from './CommonFileUpload';
import { ClassUserSelector } from './ClassUserSelector';
import * as THREE from 'three';
// @ts-ignore
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
// @ts-ignore
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Box3, Box3Helper, Vector3, BufferGeometry, BufferAttribute, Object3D } from 'three';
// @ts-ignore
import { TransformControls } from 'three/examples/jsm/controls/TransformControls';
// @ts-ignore
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter';

interface FileInfo {
  name: string;
  originalName: string;
  url: string;
  id: string;
  type: string;
  folder?: string;
  size?: number;
  lastModified?: string;
  sourceUrl?: string | null;
  sourceInfo?: string | null;
  uploadedBy?: string;
  uploadedAt?: string;
  tags?: string[];
}

interface FilesByCategory {
  [key: string]: FileInfo[];
}

interface FileListProps {
  onLoadHtmlDraft?: (html: string) => void;
  selectedUser: string;
  isAdmin: boolean;
  onUserSelect?: (userName: string) => void;
}

interface MeshEditorModalProps {
  open: boolean;
  onClose: () => void;
  modelUrl: string;
}
type ReactElementOrNull = React.ReactElement | null;
// Suppress known ReactNode/JSX linter error for Vite/TSX
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const MeshEditorModal: React.FC<MeshEditorModalProps> = ({ open, onClose, modelUrl }): React.ReactElement | null => {
  const containerRef = useRef<HTMLDivElement>(null);
  const threeRef = useRef<any>({});
  const [isCropping, setIsCropping] = useState(false);
  const [mode, setMode] = useState<'translate' | 'scale'>('scale'); // NEW: mode state

  useEffect(() => {
    if (!open) return;
    let width = containerRef.current?.clientWidth || 800;
    let height = containerRef.current?.clientHeight || 600;

    // Set up three.js scene
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.01, 1000);
    camera.position.set(0, 1, 3);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setClearColor(0x222222, 1);
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    containerRef.current?.appendChild(renderer.domElement);

    // Orbit controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    // Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 1));
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.7);
    dirLight.position.set(5, 10, 7);
    scene.add(dirLight);

    // Load model
    const loader = new GLTFLoader();
    let model: THREE.Object3D | null = null;
    let boxHelper: Box3Helper | null = null;
    let cropBox: THREE.Mesh | null = null;
    let transformControls: any = null;
    let animationId: number;

    loader.load(modelUrl, (gltf: any) => {
      model = gltf.scene as THREE.Object3D;
      scene.add(model);

      // Compute bounding box of model
      if (!model) return;
      const bbox = new Box3().setFromObject(model);
      const size = new Vector3();
      bbox.getSize(size);
      const center = new Vector3();
      bbox.getCenter(center);

      // Create crop box mesh (wireframe, transparent)
      const cropGeometry = new THREE.BoxGeometry(size.x, size.y, size.z);
      const cropMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true, transparent: true, opacity: 0.4 });
      cropBox = new THREE.Mesh(cropGeometry, cropMaterial);
      cropBox.position.copy(center);
      scene.add(cropBox);

      // TransformControls for crop box
      const transformControls = new TransformControls(camera, renderer.domElement);
      transformControls.attach(cropBox);
      transformControls.size = 2.0; // Make gizmo handles larger
      scene.add(transformControls);

      // Disable OrbitControls when dragging with TransformControls
      transformControls.addEventListener('dragging-changed', function (event: any) {
        controls.enabled = !event.value;
      });

      // Add box helper for crop box
      if (cropBox) {
        boxHelper = new Box3Helper(new Box3().setFromObject(cropBox as THREE.Object3D), 0x00ff00);
        scene.add(boxHelper);
      }

      // Store transformControls for later
      threeRef.current.transformControls = transformControls;
      threeRef.current.cropBox = cropBox;
    });

    // Animation loop
    function animate() {
      animationId = requestAnimationFrame(animate);
      controls.update();
      if (boxHelper && cropBox) {
        // Only call setFromObject if cropBox is not null
        if (cropBox !== null) {
          boxHelper.box.setFromObject(cropBox as THREE.Object3D);
          boxHelper.updateMatrixWorld(true);
        }
      }
      renderer.render(scene, camera);
    }
    animate();

    // Store refs for crop/export
    threeRef.current = { scene };

    // Cleanup
    return () => {
      cancelAnimationFrame(animationId);
      renderer.dispose();
      containerRef.current?.removeChild(renderer.domElement);
      scene.clear();
    };
  }, [open, modelUrl]);

  // NEW: Effect to update transformControls mode when mode state changes
  useEffect(() => {
    if (threeRef.current && threeRef.current.transformControls) {
      threeRef.current.transformControls.setMode(mode);
      // Always re-attach to cropBox in case it was recreated
      if (threeRef.current.cropBox) {
        threeRef.current.transformControls.attach(threeRef.current.cropBox);
      }
      console.log('TransformControls mode set to', mode);
    }
  }, [mode]);

  // Crop and export logic
  const handleCropAndSave = async () => {
    setIsCropping(true);
    const { scene } = threeRef.current;
    if (!scene) return;
    const cropBox = scene.children.find((obj: any) => obj.type === 'Mesh' && obj.material && obj.material.wireframe) as THREE.Mesh | undefined;
    const model = scene.children.find((obj: any) => obj.type === 'Group') as THREE.Object3D | undefined;
    if (!cropBox || !model) {
      setIsCropping(false);
      alert('Could not find crop box or model.');
      return;
    }
    // Compute crop box in world space
    let bbox: THREE.Box3 | null = null;
    if (cropBox) {
      bbox = new THREE.Box3().setFromObject(cropBox as THREE.Object3D);
    } else {
      setIsCropping(false);
      alert('Could not find crop box.');
      return;
    }
    // Type guard for THREE.Mesh
    function isThreeMesh(obj: any): obj is THREE.Mesh {
      return obj && obj.isMesh && obj instanceof THREE.Mesh;
    }
    // Find the first mesh in the model
    let mesh: THREE.Mesh | undefined = undefined;
    model.traverse((child: any) => {
      if (!mesh && isThreeMesh(child)) mesh = child;
    });
    if (!mesh || !mesh.geometry) {
      setIsCropping(false);
      alert('No mesh found in model.');
      return;
    }
    const geometry = mesh.geometry;
    // Convert to non-indexed for easier processing
    let nonIndexed = geometry.index ? geometry.toNonIndexed() : geometry;
    const posAttr = nonIndexed.getAttribute('position');
    const normalAttr = nonIndexed.getAttribute('normal');
    const uvAttr = nonIndexed.getAttribute('uv');
    const vertexCount = posAttr.count;
    // Each triangle: 3 vertices
    const newPositions = [];
    const newNormals = [];
    const newUVs = [];
    let triangleCount = 0;
    for (let i = 0; i < vertexCount; i += 3) {
      // Get triangle vertices in local space
      const v0 = new THREE.Vector3().fromBufferAttribute(posAttr, i);
      const v1 = new THREE.Vector3().fromBufferAttribute(posAttr, i + 1);
      const v2 = new THREE.Vector3().fromBufferAttribute(posAttr, i + 2);
      // Transform to world coordinates
      // @ts-ignore
      mesh.localToWorld(v0);
      // @ts-ignore
      mesh.localToWorld(v1);
      // @ts-ignore
      mesh.localToWorld(v2);
      // Check if all inside crop box (in world space)
      if (bbox && bbox.containsPoint(v0) && bbox.containsPoint(v1) && bbox.containsPoint(v2)) {
        // Positions (store in local space for geometry)
        // To get local positions, transform back:
        const lv0 = v0.clone(); 
        // @ts-ignore
        mesh.worldToLocal(lv0);
        const lv1 = v1.clone(); 
        // @ts-ignore
        mesh.worldToLocal(lv1);
        const lv2 = v2.clone(); 
        // @ts-ignore
        mesh.worldToLocal(lv2);
        newPositions.push(lv0.x, lv0.y, lv0.z, lv1.x, lv1.y, lv1.z, lv2.x, lv2.y, lv2.z);
        // Normals
        if (normalAttr) {
          const n0 = new THREE.Vector3().fromBufferAttribute(normalAttr, i);
          const n1 = new THREE.Vector3().fromBufferAttribute(normalAttr, i + 1);
          const n2 = new THREE.Vector3().fromBufferAttribute(normalAttr, i + 2);
          newNormals.push(n0.x, n0.y, n0.z, n1.x, n1.y, n1.z, n2.x, n2.y, n2.z);
        }
        // UVs
        if (uvAttr) {
          newUVs.push(
            uvAttr.getX(i), uvAttr.getY(i),
            uvAttr.getX(i + 1), uvAttr.getY(i + 1),
            uvAttr.getX(i + 2), uvAttr.getY(i + 2)
          );
        }
        triangleCount++;
      }
    }
    if (triangleCount === 0) {
      setIsCropping(false);
      alert('No triangles inside the crop box. Try resizing the box.');
      return;
    }
    // Build new geometry
    const croppedGeometry = new THREE.BufferGeometry();
    // Validation: positions must be a multiple of 9 (3 vertices per triangle)
    if (newPositions.length % 9 !== 0) {
      setIsCropping(false);
      alert('Internal error: Cropped positions array is not a multiple of 9.');
      return;
    }
    // If the original mesh had uvs, ensure the cropped mesh has uvs for every vertex
    if (uvAttr) {
      if (newUVs.length !== (newPositions.length / 3) * 2) {
        setIsCropping(false);
        alert('Internal error: Cropped UV array length does not match positions.');
        return;
      }
      croppedGeometry.setAttribute('uv', new THREE.Float32BufferAttribute(newUVs, 2));
    }
    croppedGeometry.setAttribute('position', new THREE.Float32BufferAttribute(newPositions, 3));
    // If normals are present and correct, use them; otherwise, recompute
    if (newNormals.length === newPositions.length) {
      croppedGeometry.setAttribute('normal', new THREE.Float32BufferAttribute(newNormals, 3));
    } else {
      croppedGeometry.computeVertexNormals();
    }
    // Final validation: all attributes must have the same vertex count
    const posCount = croppedGeometry.getAttribute('position').count;
    if (croppedGeometry.getAttribute('normal') && croppedGeometry.getAttribute('normal').count !== posCount) {
      setIsCropping(false);
      alert('Internal error: Normals count does not match positions count.');
      return;
    }
    if (croppedGeometry.getAttribute('uv') && croppedGeometry.getAttribute('uv').count !== posCount) {
      setIsCropping(false);
      alert('Internal error: UV count does not match positions count.');
      return;
    }
    // Create new mesh
    const croppedMesh = new THREE.Mesh(croppedGeometry, (mesh as THREE.Mesh).material);
    // Wrap the mesh in a group for GLTFExporter
    const exportGroup = new THREE.Group();
    exportGroup.add(croppedMesh);
    // Export as GLB
    const exporter = new GLTFExporter();
    try {
      exporter.parse(
        exportGroup,
        (gltf: any) => {
          console.log('GLTFExporter result type:', typeof gltf, gltf instanceof ArrayBuffer ? 'ArrayBuffer' : 'Object');
          if (gltf instanceof ArrayBuffer) {
            // Save as GLB
            const blob = new Blob([gltf], { type: 'model/gltf-binary' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'cropped-model.glb';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          } else if (typeof gltf === 'object') {
            // Save as GLTF (debug)
            alert('Warning: Exported as .gltf (JSON) instead of .glb (binary). The mesh may be malformed.');
            const json = JSON.stringify(gltf, null, 2);
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'cropped-model.gltf';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          } else {
            alert('Unknown export result type.');
          }
          setIsCropping(false);
        },
        { binary: true }
      );
    } catch (err) {
      setIsCropping(false);
      alert('GLB export failed: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  // Suppress known ReactNode/JSX linter error for Vite/TSX
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return open ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80">
      <div className="bg-gray-900 rounded-lg shadow-lg p-8 w-[80vw] h-[80vh] max-w-6xl max-h-[90vh] relative flex flex-col items-center justify-center">
        <button onClick={onClose} className="absolute top-2 right-2 text-gray-300 hover:text-white bg-gray-700 hover:bg-gray-600 rounded-full p-1">×</button>
        <h2 className="text-xl font-bold mb-4 text-white">Mesh Editor (GLTF/GLB)</h2>
        <div className="text-gray-300 mb-4">Model URL: {modelUrl}</div>
        <div ref={containerRef} id="mesh-editor-canvas" className="w-full h-full bg-black rounded mb-4" style={{ minHeight: '60vh', minWidth: '60vw', pointerEvents: 'auto' }}></div>
        {/* NEW: Mode switch buttons */}
        <div className="flex gap-4 mt-2 mb-2">
          <button
            onClick={() => setMode('translate')}
            className={`px-4 py-2 rounded text-lg font-semibold border-2 ${mode === 'translate' ? 'bg-blue-700 border-blue-400 text-white' : 'bg-gray-700 border-gray-500 text-gray-200 hover:bg-gray-600'}`}
          >
            Move Box
          </button>
          <button
            onClick={() => setMode('scale')}
            className={`px-4 py-2 rounded text-lg font-semibold border-2 ${mode === 'scale' ? 'bg-green-700 border-green-400 text-white' : 'bg-gray-700 border-gray-500 text-gray-200 hover:bg-gray-600'}`}
          >
            Resize Box
          </button>
         <span className="ml-4 px-3 py-2 rounded text-lg font-semibold border-2 border-gray-600 bg-gray-800 text-gray-200">Current mode: {mode === 'scale' ? 'Resize' : 'Move'}</span>
        </div>
        <div className="flex gap-4 mt-2">
          <button
            onClick={handleCropAndSave}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-lg font-semibold"
            disabled={isCropping}
          >
            {isCropping ? 'Cropping...' : 'Crop & Save as New Model'}
          </button>
          <span className="text-gray-400 text-sm">Tip: Use <kbd>T</kbd> to move, <kbd>S</kbd> to scale the box</span>
        </div>
      </div>
    </div>
  ) : null;
};

export const FileList: React.FC<FileListProps> = ({ onLoadHtmlDraft, selectedUser, isAdmin, onUserSelect }) => {
  const [files, setFiles] = useState<FilesByCategory>({});
  const [commonFiles, setCommonFiles] = useState<FilesByCategory>({});
  const [activeTab, setActiveTab] = useState<'my-files' | 'common-assets'>('my-files');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['images', '3d', 'audio', 'other']));
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [filesPerPage, setFilesPerPage] = useState<number | 'all'>(5);
  const [page, setPage] = useState<{ [key: string]: number }>({ images: 0, '3d': 0, audio: 0, other: 0 });
  const [totalFilesByCategory, setTotalFilesByCategory] = useState<{ [key: string]: number }>({});
  const [showHtmlDraftModal, setShowHtmlDraftModal] = useState(false);
  const [pendingHtmlDraftUrl, setPendingHtmlDraftUrl] = useState<string | null>(null);
  const [pendingHtmlDraftName, setPendingHtmlDraftName] = useState<string | null>(null);
  const [loadingHtmlDraft, setLoadingHtmlDraft] = useState(false);
  const [htmlDraftTitles, setHtmlDraftTitles] = useState<{ [url: string]: string }>({});
  const [previewFile, setPreviewFile] = useState<FileInfo | null>(null);
  const [showMeshEditor, setShowMeshEditor] = useState(false);
  const [includeSourceInfo, setIncludeSourceInfo] = useState(false);
  const [currentPreviewIndex, setCurrentPreviewIndex] = useState<number>(0);
  const [currentPreviewCategory, setCurrentPreviewCategory] = useState<string>('');
  const [movementMode, setMovementMode] = useState<'move' | 'look'>('move');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [renameFile, setRenameFile] = useState<FileInfo | null>(null);
  const [newFileName, setNewFileName] = useState('');
  const [editTagsFile, setEditTagsFile] = useState<FileInfo | null>(null);
  const [tagInput, setTagInput] = useState('');
  const [searchTags, setSearchTags] = useState('');

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'audio':
        return <FileAudio size={18} className="text-green-400" />;
      case '3d':
        return <Box size={18} className="text-orange-400" />;
      case 'images':
        return <ImageIcon size={18} className="text-blue-400" />;
      default:
        return <FileText size={18} className="text-gray-400" />;
    }
  };

  const loadFiles = async () => {
    setLoading(true);
    setError(null);
    
    console.log('🚀 Loading files with parallel category loading for better performance...');
    
    try {
      if (activeTab === 'my-files') {
        // Load user files for all categories
        const categorizedFiles: FilesByCategory = {
          images: [],
          '3d': [],
          audio: [],
          other: [],
          html: []
        };
        const totals: { [key: string]: number } = {};
        
        // Load all categories in parallel instead of sequentially for much better performance
        const categoryPromises = Object.keys(categorizedFiles).map(async (category) => {
          let limit = filesPerPage === 'all' ? 100 : filesPerPage; // Cap at 100 even in 'all' mode
          let offset = filesPerPage === 'all' ? 0 : (page[category] || 0) * (filesPerPage as number);
          const folder = category === 'html' ? 'public_html' : category;
          const result = await getFiles({ limit, offset, folder, user: selectedUser });
          return { category, result };
        });
        
        const categoryResults = await Promise.all(categoryPromises);
        
        // Process results
        categoryResults.forEach(({ category, result }) => {
          categorizedFiles[category] = result.files;
          totals[category] = result.total;
        });
        
        setFiles(categorizedFiles);
        setTotalFilesByCategory(totals);
        
        // Extract HTML titles
        for (const file of categorizedFiles.html) {
          if (!htmlDraftTitles[file.url]) {
            extractTitleFromHtml(file.url, file.originalName).then(title => {
              setHtmlDraftTitles(prev => ({ ...prev, [file.url]: title }));
            });
          }
        }
      } else {
        // Load common assets - load each category separately with proper pagination
        const categorizedCommonFiles: FilesByCategory = {
          images: [],
          '3d': [],
          audio: [],
          other: []
        };
        const commonTotals: { [key: string]: number } = {};
        
        // Load all categories in parallel for better performance
        const categoryPromises = Object.keys(categorizedCommonFiles).map(async (category) => {
          let limit = filesPerPage === 'all' ? 100 : filesPerPage; // Cap at 100 even in 'all' mode
          let offset = filesPerPage === 'all' ? 0 : (page[category] || 0) * (filesPerPage as number);
          const result = await getFiles({ limit, offset, folder: category, user: 'common-assets' });
          return { category, result };
        });
        
        const categoryResults = await Promise.all(categoryPromises);
        
        // Process results
        categoryResults.forEach(({ category, result }) => {
          categorizedCommonFiles[category] = result.files;
          commonTotals[category] = result.total;
        });
        
        setCommonFiles(categorizedCommonFiles);
        setTotalFilesByCategory(commonTotals);
      }

    } catch (err) {
      console.error('Error loading files:', err);
      setError(err instanceof Error ? err.message : 'Failed to load files');
    } finally {
      setLoading(false);
    }
  };

  const copyUrl = async (url: string, fileName: string, file?: FileInfo) => {
    try {
      let textToCopy = url;
      
      // For images, use the full-size URL when copying (not thumbnail/preview)
      if (file && file.type === 'images') {
        textToCopy = getImageUrlForContext(file, 'full');
      }
      
      if (includeSourceInfo && file && (file.sourceUrl || file.sourceInfo)) {
        textToCopy = textToCopy + '\n\n';
        if (file.sourceUrl) {
          textToCopy += `<!-- Source URL: ${file.sourceUrl} -->\n`;
        }
        if (file.sourceInfo) {
          textToCopy += `<!-- Source Info: ${file.sourceInfo} -->\n`;
        }
      }
      
      await navigator.clipboard.writeText(textToCopy);
      setCopyFeedback(fileName);
      setTimeout(() => setCopyFeedback(null), 2000);
    } catch (error) {
      console.error('Failed to copy URL:', error);
    }
  };

  const deleteFile = async (fileName: string, folder: string) => {
    if (!confirm(`Are you sure you want to delete ${fileName}?`)) {
      return;
    }

    try {
      const filePath = `${folder}/${fileName}`;
      const filesToDelete = [filePath];
      
      // If this is an image file, also delete the associated preview and thumbnail files
      const isImage = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(fileName);
      if (isImage) {
        // Generate the preview and thumbnail file paths
        const nameWithoutExt = fileName.substring(0, fileName.lastIndexOf('.'));
        const previewPath = `${folder}/${nameWithoutExt}_preview.jpg`;
        const thumbPath = `${folder}/${nameWithoutExt}_thumb.jpg`;
        filesToDelete.push(previewPath, thumbPath);
      }
      
      const { error } = await supabase.storage
        .from('files')
        .remove(filesToDelete);

      if (error) throw error;

      loadFiles();
      if (previewUrl) setPreviewUrl(null);
    } catch (error) {
      console.error('Error deleting file:', error);
      alert('Failed to delete file');
    }
  };

  const handleSaveTags = async () => {
    if (!editTagsFile) return;

    try {
      const tagArray = tagInput.trim() ? tagInput.split(',').map(t => t.trim()).filter(t => t) : [];
      const filePath = editTagsFile.folder ? `${editTagsFile.folder}/${editTagsFile.name}` : editTagsFile.name;
      
      const result = await updateFileMetadata(filePath, { tags: tagArray });
      
      if (result.success) {
        alert('Tags updated successfully!');
        setEditTagsFile(null);
        setTagInput('');
        loadFiles();
      } else {
        const errorMsg = result.error?.message || 'Unknown error';
        alert(`Failed to update tags: ${errorMsg}`);
      }
    } catch (err) {
      console.error('Error updating tags:', err);
      alert('Failed to update tags');
    }
  };

  const handleRenameFile = async () => {
    if (!renameFile || !newFileName.trim()) {
      return;
    }

    try {
      // Clean the filename - spaces already replaced with hyphens in onChange
      let cleanName = newFileName.trim();
      
      console.log('Original input:', cleanName);
      
      // Remove extension if user added one (look for last dot)
      if (cleanName.includes('.')) {
        cleanName = cleanName.substring(0, cleanName.lastIndexOf('.'));
        console.log('After removing extension:', cleanName);
      }
      
      // Keep only alphanumeric, hyphens, and underscores
      // Put hyphen at the END of character class to avoid range issues
      cleanName = cleanName.replace(/[^a-zA-Z0-9_-]/g, '');
      console.log('After sanitization:', cleanName);
      
      if (!cleanName) {
        alert('Please enter a valid file name (letters, numbers, hyphens, and underscores only)');
        return;
      }
      
      const filePath = renameFile.folder ? `${renameFile.folder}/${renameFile.name}` : renameFile.name;
      console.log('Old file path:', filePath);
      console.log('New name to send:', cleanName);
      
      const result = await renameFileInStorage(filePath, cleanName);
      
      if (result.success) {
        alert('File renamed successfully!');
        setRenameFile(null);
        setNewFileName('');
        loadFiles();
      } else {
        const errorMsg = result.error?.message || 'Unknown error';
        alert(`Failed to rename file: ${errorMsg}`);
      }
    } catch (err) {
      console.error('Error renaming file:', err);
      alert('Failed to rename file');
    }
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  // Filter files by tag search
  const filterFilesByTags = (filesByCategory: FilesByCategory): FilesByCategory => {
    if (!searchTags.trim()) return filesByCategory;
    
    const searchTagArray = searchTags.toLowerCase().split(',').map(t => t.trim()).filter(t => t);
    if (searchTagArray.length === 0) return filesByCategory;
    
    const filtered: FilesByCategory = {};
    
    Object.entries(filesByCategory).forEach(([category, files]) => {
      filtered[category] = files.filter(file => {
        if (!file.tags || file.tags.length === 0) return false;
        
        // Check if any of the file's tags match any of the search tags
        const fileTags = file.tags.map(t => t.toLowerCase());
        return searchTagArray.some(searchTag => 
          fileTags.some(fileTag => fileTag.includes(searchTag) || searchTag.includes(fileTag))
        );
      });
    });
    
    return filtered;
  };

  // Get filtered files
  const currentFiles = activeTab === 'my-files' ? filterFilesByTags(files) : filterFilesByTags(commonFiles);

  const handlePreview = (file: FileInfo) => {
    console.log('Opening preview for:', file.url, 'type:', file.type);
    console.log('Preview file object:', file);
    console.log('Source URL:', file.sourceUrl);
    console.log('Source Info:', file.sourceInfo);
    
    // Find the file's position in the current list
    const currentFiles = activeTab === 'my-files' ? files : commonFiles;
    const category = file.type;
    const categoryFiles = currentFiles[category] || [];
    const fileIndex = categoryFiles.findIndex(f => f.id === file.id);
    
    setPreviewUrl(file.url);
    setPreviewFile(file);
    setCurrentPreviewIndex(fileIndex >= 0 ? fileIndex : 0);
    setCurrentPreviewCategory(category);
  };

  const navigateToFile = (direction: 'prev' | 'next') => {
    if (!previewFile || !currentPreviewCategory) return;
    
    const currentFiles = activeTab === 'my-files' ? files : commonFiles;
    const categoryFiles = currentFiles[currentPreviewCategory] || [];
    
    if (categoryFiles.length === 0) return;
    
    let newIndex: number;
    if (direction === 'prev') {
      newIndex = currentPreviewIndex > 0 ? currentPreviewIndex - 1 : categoryFiles.length - 1;
    } else {
      newIndex = currentPreviewIndex < categoryFiles.length - 1 ? currentPreviewIndex + 1 : 0;
    }
    
    const newFile = categoryFiles[newIndex];
    if (newFile) {
      setPreviewUrl(newFile.url);
      setPreviewFile(newFile);
      setCurrentPreviewIndex(newIndex);
    }
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (!previewUrl || !previewFile) return;
    
    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        navigateToFile('prev');
        break;
      case 'ArrowRight':
        event.preventDefault();
        navigateToFile('next');
        break;
      case 'Escape':
        event.preventDefault();
        setPreviewUrl(null);
        setPreviewFile(null);
        break;
    }
  };

  const handleHtmlDraftClick = (file: FileInfo) => {
    setPendingHtmlDraftUrl(file.url);
    setPendingHtmlDraftName(file.originalName);
    setShowHtmlDraftModal(true);
  };

  const confirmLoadHtmlDraft = async () => {
    if (!pendingHtmlDraftUrl || !onLoadHtmlDraft) {
      setShowHtmlDraftModal(false);
      return;
    }
    setLoadingHtmlDraft(true);
    try {
      const response = await fetch(pendingHtmlDraftUrl);
      const html = await response.text();
      onLoadHtmlDraft(html);
    } catch (e) {
      alert('Failed to load HTML draft.');
    } finally {
      setLoadingHtmlDraft(false);
      setShowHtmlDraftModal(false);
      setPendingHtmlDraftUrl(null);
      setPendingHtmlDraftName(null);
    }
  };

  const extractTitleFromHtml = async (url: string, fallback: string): Promise<string> => {
    try {
      const response = await fetch(url);
      const html = await response.text();
      const match = html.match(/<title>(.*?)<\/title>/i);
      return match ? match[1] : fallback;
    } catch {
      return fallback;
    }
  };

  // Helper to get preview/thumbnail URL from original
  function getImageVariantUrl(url: string, variant: 'preview' | 'thumb') {
    // e.g., .../filename_123456.jpg => .../filename_123456_preview.jpg
    return url.replace(/(\.[^.\/]+)$/, `_${variant}.jpg`);
  }

  // Helper to get the appropriate image URL based on context
  // Progressive image loading strategy:
  // - thumb: Small thumbnail for file list (fastest loading)
  // - preview: Medium preview for modal (balanced quality/speed)
  // - full: Original full-size for copying URLs (highest quality)
  function getImageUrlForContext(file: FileInfo, context: 'thumb' | 'preview' | 'full') {
    switch (context) {
      case 'thumb':
        return getImageVariantUrl(file.url, 'thumb');
      case 'preview':
        return getImageVariantUrl(file.url, 'preview');
      case 'full':
        return file.url; // Original full-size image
      default:
        return getImageVariantUrl(file.url, 'thumb');
    }
  }

  // 3D Model Control Functions
  const changeMovementMode = (mode: 'move' | 'look') => {
    setMovementMode(mode);
    // Send message to iframe if it exists
    const iframe = document.querySelector('iframe[title="3D Model Preview"]') as HTMLIFrameElement;
    if (iframe && iframe.contentWindow) {
      try {
        iframe.contentWindow.postMessage({
          type: 'MOVEMENT_MODE_CHANGE',
          mode
        }, '*');
      } catch (e) {
        console.warn('Could not send movement mode change message:', e);
      }
    }
  };

  const reset3DView = () => {
    // Send reset message to iframe if it exists
    const iframe = document.querySelector('iframe[title="3D Model Preview"]') as HTMLIFrameElement;
    if (iframe && iframe.contentWindow) {
      try {
        iframe.contentWindow.postMessage({
          type: '3D_CONTROL',
          control: 'reset-view'
        }, '*');
      } catch (e) {
        console.warn('Could not send reset view message:', e);
      }
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  useEffect(() => {
    loadFiles();

    const channel = supabase
      .channel('storage-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'storage',
        table: 'objects',
        filter: `bucket_id=eq.files`
      }, () => {
        setTimeout(() => {
          loadFiles();
        }, 500);
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  // Add keyboard event listener for preview navigation
  useEffect(() => {
    if (previewUrl && previewFile) {
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [previewUrl, previewFile, currentPreviewIndex, currentPreviewCategory]);

  useEffect(() => {
    loadFiles();
  }, [activeTab, filesPerPage, page, selectedUser]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-gray-400">Loading files...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-800 rounded-lg p-4">
        <div className="flex items-center justify-center flex-col text-center space-y-4">
          <AlertCircle className="text-red-400 w-8 h-8" />
          <div>
            <p className="text-red-400 mb-2">Failed to load files</p>
            <p className="text-sm text-gray-400 mb-4">{error}</p>
            <button
              onClick={loadFiles}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors flex items-center gap-2 mx-auto"
            >
              <RefreshCw size={16} />
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // currentFiles is now declared earlier with tag filtering
  const hasFiles = Object.values(currentFiles).some(category => category.length > 0);
  const totalFiles = Object.values(currentFiles).reduce((sum, category) => sum + category.length, 0);

  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden">
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-700">
        <button
          onClick={() => setActiveTab('my-files')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'my-files'
              ? 'bg-gray-700 text-white border-b-2 border-blue-500'
              : 'text-gray-400 hover:text-white hover:bg-gray-700'
          }`}
        >
          My Files
        </button>
        <button
          onClick={() => setActiveTab('common-assets')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'common-assets'
              ? 'bg-gray-700 text-white border-b-2 border-blue-500'
              : 'text-gray-400 hover:text-white hover:bg-gray-700'
          }`}
        >
          Common Assets
        </button>
      </div>

      <div className="p-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <h3 className="text-base font-semibold">
              {activeTab === 'my-files' ? 'My Files' : 'Common Assets'}
            </h3>
            {totalFiles > 0 && (
              <span className="text-xs text-gray-400">({totalFiles})</span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {activeTab === 'my-files' ? (
              <FileUpload selectedUser={selectedUser} onFilesChanged={loadFiles} onUploadComplete={() => {}} />
            ) : (
              isAdmin && <CommonFileUpload onFilesChanged={loadFiles} onUploadComplete={() => {}} />
            )}
            <button
              onClick={loadFiles}
              className="p-1.5 hover:bg-gray-600 rounded transition-colors"
              title="Refresh files"
            >
              <RefreshCw size={14} className="text-gray-400" />
            </button>
          </div>
        </div>
                <div className="flex items-center gap-2 mb-2">
          <label htmlFor="filesPerPage" className="text-xs text-gray-400">Show files:</label>
                      <select
              id="filesPerPage"
              value={filesPerPage}
              onChange={e => {
                setFilesPerPage(e.target.value === 'all' ? 'all' : parseInt(e.target.value));
                setPage({ images: 0, '3d': 0, audio: 0, other: 0 });
              }}
              className="bg-gray-700 text-white text-xs rounded px-2 py-1"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value="all">All (max 100)</option>
            </select>
          
          {/* Performance warning for users with many files */}
          {filesPerPage === 'all' && (
            <div className="text-xs text-yellow-400 bg-yellow-900/20 px-2 py-1 rounded">
              ⚠️ Loading up to 100 files per category
            </div>
          )}
        </div>
      </div>

      {/* Tag Search Box */}
      <div className="mb-4 px-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            value={searchTags}
            onChange={(e) => setSearchTags(e.target.value)}
            placeholder="Search by tags (comma-separated)..."
            className="w-full pl-10 pr-3 py-2 bg-gray-700 text-white border border-gray-600 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
          />
        </div>
        {searchTags && (
          <p className="text-xs text-gray-400 mt-1">
            Searching across all file types for tags: <span className="text-blue-400">{searchTags}</span>
          </p>
        )}
      </div>

      {/* Rest of the existing file list rendering code remains the same, but uses currentFiles instead of files */}
      <div className="flex">
        <div className={`flex-1 ${previewUrl ? 'border-r border-gray-700' : ''}`}>
          {Object.keys(currentFiles).every(cat => currentFiles[cat].length === 0) && !loading && (
            <div className="bg-gray-800 rounded-lg p-6 flex flex-col items-center justify-center text-center border border-gray-700 mt-2 mb-4">
              <AlertCircle size={36} className="text-yellow-400 mb-2" />
              <div className="text-yellow-300 text-lg font-semibold mb-1">
                {!isAdmin && !selectedUser && window.location.pathname !== '/admin-tools' ? 'Select your name to see your files.' : 
                 isAdmin || window.location.pathname === '/admin-tools' ? 'No files uploaded yet.' : 'No files uploaded yet for this user.'}
              </div>
              <div className="text-gray-400 text-sm mb-4">
                {!isAdmin && !selectedUser && window.location.pathname !== '/admin-tools' ? 'Choose your name from the dropdown above to view and upload your files.' :
                 isAdmin || window.location.pathname === '/admin-tools' ? 'Upload files or select a user to view their uploads.' : 'Upload files using the button above.'}
              </div>
              {!isAdmin && !selectedUser && window.location.pathname !== '/admin-tools' && (
                <div className="mt-2 min-h-[40vh] flex flex-col justify-start">
                  <ClassUserSelector selectedUser={selectedUser} onUserSelect={onUserSelect || (() => {})} />
                </div>
              )}
            </div>
          )}
          {loading ? (
            <div className="text-center py-6 px-3">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-gray-400 mb-2 text-sm">Loading files in parallel...</p>
              <p className="text-xs text-gray-500">Categories are loading simultaneously for faster performance</p>
              <p className="text-xs text-blue-400 mt-2">🖼️ Only loading optimized thumbnails for faster browsing</p>
            </div>
          ) : !hasFiles ? (
            <div className="text-center py-6 px-3">
              <p className="text-gray-400 mb-3 text-sm">No files uploaded yet</p>
              <p className="text-xs text-gray-500">
                Use the upload button in the header to add files
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {Object.entries(currentFiles).map(([category, categoryFiles]) => {
                if (!categoryFiles.length) return null;
                const pagedFiles = categoryFiles; // Already paginated by backend
                return (
                  <div key={category} className="border border-gray-700 rounded-lg overflow-hidden">
                    <button
                      onClick={() => toggleCategory(category)}
                      className="w-full flex items-center justify-between p-2 bg-gray-700 hover:bg-gray-600 transition-colors"
                    >
                      <span className="font-medium capitalize text-sm">{category === 'html' ? 'Saved HTML' : category}</span>
                      <span className="flex items-center">
                        <span className="text-xs text-gray-400 mr-2">{categoryFiles.length} files</span>
                        {expandedCategories.has(category) ? (
                          <ChevronDown size={14} />
                        ) : (
                          <ChevronRight size={14} />
                        )}
                      </span>
                    </button>
                    
                    {expandedCategories.has(category) && (
                      <>
                        <div className="divide-y divide-gray-700">
                          {pagedFiles.map((file) => {
                            return (
                              <div 
                                key={file.id}
                                className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center p-3 hover:bg-gray-700 transition-colors group min-w-0 max-w-[290px] w-full"
                              >
                                {/* File Icon/Thumbnail */}
                                <div className="flex-1 flex items-center w-full min-w-0 max-w-[200px]">
                                  <div className="flex-shrink-0 mr-3">
                                    {category === 'images' ? (
                                      <div className="w-10 h-10 rounded overflow-hidden bg-gray-800 flex items-center justify-center cursor-pointer relative" onClick={() => { console.log('Thumbnail clicked for image:', file.url); handlePreview(file); }}>
                                        <img 
                                          src={getImageVariantUrl(file.url, 'thumb')}
                                          alt={file.originalName}
                                          className="w-full h-full object-cover"
                                          onError={(e) => {
                                            // fallback to original if thumb not found
                                            const target = e.target as HTMLImageElement;
                                            target.onerror = null;
                                            target.src = file.url;
                                          }}
                                        />
                                        {/* Magnifying glass icon overlay */}
                                        <span className="absolute bottom-1 right-1 bg-black bg-opacity-60 rounded-full p-0.5">
                                          <Search size={14} className="text-white opacity-80" />
                                        </span>
                                      </div>
                                    ) : category === 'audio' ? (
                                      <div className="w-10 h-10 rounded bg-gray-800 flex items-center justify-center cursor-pointer relative" onClick={() => handlePreview(file)}>
                                        {getFileIcon(category)}
                                        {/* Play icon overlay */}
                                        <span className="absolute bottom-1 right-1 bg-black bg-opacity-60 rounded-full p-0.5">
                                          <svg width="14" height="14" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 4L15 10L6 16V4Z" fill="white" fillOpacity="0.8"/></svg>
                                        </span>
                                      </div>
                                    ) : category === '3d' ? (
                                      <div className="w-10 h-10 rounded bg-gray-800 flex items-center justify-center cursor-pointer relative" onClick={() => handlePreview(file)}>
                                        {getFileIcon(category)}
                                        {/* Cube icon overlay */}
                                        <span className="absolute bottom-1 right-1 bg-black bg-opacity-60 rounded-full p-0.5">
                                          <svg width="14" height="14" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="3" width="14" height="14" rx="2" fill="white" fillOpacity="0.8"/></svg>
                                        </span>
                                      </div>
                                    ) : category === 'html' ? (
                                      <div className="w-10 h-10 rounded bg-gray-800 flex items-center justify-center">
                                        <FileText size={18} className="text-orange-400" />
                                      </div>
                                    ) : (
                                      <div className="w-10 h-10 rounded bg-gray-800 flex items-center justify-center">
                                        {getFileIcon(category)}
                                      </div>
                                    )}
                                  </div>

                                  {/* File Info */}
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-white truncate mb-1">
                                      {category === 'html' ? (htmlDraftTitles[file.url] || file.originalName) : file.originalName}
                                    </p>
                                    <div className="flex items-center gap-1 text-xs text-gray-400">
                                      <span className="capitalize">{category === 'html' ? 'Saved HTML' : category}</span>
                                      {file.size && file.size > 0 && (
                                        <>
                                          <span>•</span>
                                          <span>{(file.size / 1024).toFixed(1)}KB</span>
                                        </>
                                      )}
                                    </div>
                                    {/* Tags Display */}
                                    {file.tags && file.tags.length > 0 && (
                                      <div className="mt-1 flex flex-wrap gap-1">
                                        {file.tags.map((tag, idx) => (
                                          <span key={idx} className="text-xs bg-blue-900/30 text-blue-300 px-2 py-0.5 rounded-full border border-blue-700/50">
                                            {tag}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                    {/* Source Metadata Display */}
                                    {(file.sourceUrl || file.sourceInfo) && (
                                      <div className="mt-1 text-xs text-gray-500">
                                        <div className="flex items-start gap-1">
                                          <span className="text-gray-600">📚</span>
                                          <div className="flex-1 min-w-0">
                                            {file.sourceUrl && (
                                              <div className="truncate">
                                                <a 
                                                  href={file.sourceUrl} 
                                                  target="_blank" 
                                                  rel="noopener noreferrer"
                                                  className="text-blue-400 hover:text-blue-300 underline truncate block"
                                                  title={file.sourceUrl}
                                                >
                                                  Source
                                                </a>
                                              </div>
                                            )}
                                            {file.sourceInfo && (
                                              <div className="text-gray-400 truncate" title={file.sourceInfo}>
                                                {file.sourceInfo}
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center space-x-0.5 ml-0 sm:ml-1 mt-2 sm:mt-0 bg-gray-700 p-0.5 rounded w-auto min-w-0">
                                  <button
                                    onClick={() => copyUrl(file.url, file.originalName, file)}
                                    className="p-0.5 hover:bg-gray-600 rounded transition-colors"
                                    title="Copy URL"
                                  >
                                    <Copy size={10} className="text-white" />
                                    {copyFeedback === file.originalName && (
                                      <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 px-2 py-1 bg-gray-900 text-xs rounded whitespace-nowrap mb-1">
                                        Copied!
                                      </span>
                                    )}
                                  </button>
                                  {category === 'html' ? (
                                    <button
                                      onClick={() => handleHtmlDraftClick(file)}
                                      className="p-0.5 hover:bg-gray-600 rounded transition-colors"
                                      title="Load this HTML draft into the editor"
                                    >
                                      <FileText size={10} className="text-blue-400 hover:text-blue-300" />
                                    </button>
                                  ) : null}
                                  <button
                                    onClick={() => {
                                      setEditTagsFile(file);
                                      setTagInput(file.tags ? file.tags.join(', ') : '');
                                    }}
                                    className="p-0.5 hover:bg-gray-600 rounded transition-colors"
                                    title="Edit tags"
                                  >
                                    <Tag size={10} className="text-purple-400 hover:text-purple-300" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      setRenameFile(file);
                                      // Extract name without extension and timestamp
                                      // Remove timestamp pattern (_digits) at the end if present
                                      let baseName = file.originalName.replace(/_\d+$/, '');
                                      setNewFileName(baseName);
                                    }}
                                    className="p-0.5 hover:bg-gray-600 rounded transition-colors"
                                    title="Rename file"
                                  >
                                    <Edit size={10} className="text-blue-400 hover:text-blue-300" />
                                  </button>
                                  <button
                                    onClick={() => deleteFile(file.name, file.folder || 'other')}
                                    className="p-0.5 hover:bg-gray-600 rounded transition-colors"
                                    title="Delete file"
                                  >
                                    <Trash2 size={10} className="text-red-400 hover:text-red-300" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        {filesPerPage !== 'all' && categoryFiles.length > 0 && (
                          <div className="flex justify-between items-center px-3 py-2 bg-gray-900 border-t border-gray-700">
                            <button
                              disabled={page[category] === 0}
                              onClick={() => {
                                const newPage = Math.max(0, (page[category] || 0) - 1);
                                console.log(`Prev clicked for category: ${category}, current page: ${page[category]}, new page: ${newPage}`);
                                setPage(p => ({ ...p, [category]: newPage }));
                              }}
                              className="px-2 py-1 text-xs bg-gray-700 rounded disabled:opacity-50"
                            >
                              Prev
                            </button>
                            <span className="text-xs text-gray-400">Page {(page[category] || 0) + 1}</span>
                            <button
                              disabled={((page[category] || 0) + 1) * (filesPerPage as number) >= (totalFilesByCategory[category] || 0)}
                              onClick={() => {
                                const newPage = (page[category] || 0) + 1;
                                console.log(`Next clicked for category: ${category}, current page: ${page[category]}, new page: ${newPage}`);
                                setPage(p => ({ ...p, [category]: newPage }));
                              }}
                              className="px-2 py-1 text-xs bg-gray-700 rounded disabled:opacity-50"
                            >
                              Next
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {previewUrl && previewFile && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70"
            onClick={() => {
              if (!showMeshEditor) {
                setPreviewUrl(null);
                setPreviewFile(null);
              }
            }}
          >
            <div
              className="relative bg-gray-900 rounded-lg shadow-lg p-4 flex flex-col items-center"
              style={{ 
                maxWidth: isFullscreen ? '95vw' : '90vw', 
                maxHeight: isFullscreen ? '95vh' : '90vh',
                width: isFullscreen ? '95vw' : 'auto',
                height: isFullscreen ? '95vh' : 'auto'
              }}
              onClick={e => e.stopPropagation()}
            >
              <button
                onClick={() => { setPreviewUrl(null); setPreviewFile(null); }}
                className="absolute top-2 right-2 text-gray-300 hover:text-white bg-gray-700 hover:bg-gray-600 rounded-full p-1"
                aria-label="Close preview"
              >
                ×
              </button>

              {/* Navigation buttons */}
              {(() => {
                const currentFiles = activeTab === 'my-files' ? files : commonFiles;
                const categoryFiles = currentFiles[currentPreviewCategory] || [];
                const hasMultipleFiles = categoryFiles.length > 1;
                
                if (!hasMultipleFiles) return null;
                
                return (
                  <div className="absolute top-1/2 transform -translate-y-1/2 flex justify-between w-full px-4 pointer-events-none">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigateToFile('prev');
                      }}
                      className="bg-gray-800 hover:bg-gray-700 text-white rounded-full p-2 pointer-events-auto transition-colors shadow-lg"
                      aria-label="Previous file"
                      title="Previous file (←)"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigateToFile('next');
                      }}
                      className="bg-gray-800 hover:bg-gray-700 text-white rounded-full p-2 pointer-events-auto transition-colors shadow-lg"
                      aria-label="Next file"
                      title="Next file (→)"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>
                  </div>
                );
              })()}
              
              {/* File counter and debug info */}
              <div className="text-white text-sm mb-2 text-center">
                {(() => {
                  const currentFiles = activeTab === 'my-files' ? files : commonFiles;
                  const categoryFiles = currentFiles[currentPreviewCategory] || [];
                  const hasMultipleFiles = categoryFiles.length > 1;
                  
                  return (
                    <div>
                      <div>Loading preview for: {previewFile.originalName} ({previewFile.type})</div>
                      {hasMultipleFiles && (
                        <div className="text-gray-400 text-xs mt-1">
                          {currentPreviewIndex + 1} of {categoryFiles.length}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
              
              {previewFile.type === 'images' && (
                <img
                  src={getImageVariantUrl(previewFile.url, 'preview')}
                  alt={previewFile.originalName}
                  style={{
                    maxWidth: '90vw',
                    maxHeight: '80vh',
                    display: 'block',
                    margin: '0 auto',
                    borderRadius: '8px',
                    background: '#222',
                  }}
                  onLoad={() => console.log('Preview image loaded:', getImageVariantUrl(previewFile.url, 'preview'))}
                  onError={(e) => {
                    console.log('Preview image failed, falling back to original:', previewFile.url);
                    // Fallback to original if preview doesn't exist
                    const target = e.target as HTMLImageElement;
                    target.onerror = null;
                    target.src = previewFile.url;
                  }}
                />
              )}
              {previewFile.type === 'audio' && (
                <div className="flex flex-col items-center mb-4 w-full">
                  <audio
                    src={previewFile.url}
                    controls
                    autoPlay
                    className="w-full max-w-lg mb-2"
                    style={{ maxWidth: '480px' }}
                  />
                  <span className="text-white text-sm mb-2">{previewFile.originalName}</span>
                </div>
              )}
              {previewFile.type === '3d' && (
                <div className="flex flex-col items-center mb-4 w-full">
                  {previewFile.url.match(/\.(glb|gltf)$/i) ? (
                    <>
                      <div className="relative">
                        <iframe
                          title="3D Model Preview"
                          srcDoc={`<!DOCTYPE html>
<html>
<head>
  <script src='https://aframe.io/releases/1.4.2/aframe.min.js'></script>
  <script>
    // Enhanced 3D Model Handler Component
    AFRAME.registerComponent('enhanced-model-handler', {
      init: function() {
        this.el.addEventListener('model-loaded', this.onModelLoaded.bind(this));
        this.el.addEventListener('model-error', this.onModelError.bind(this));
        this.el.addEventListener('model-loading', this.onModelLoading.bind(this));
      },
      
      onModelLoaded: function() {
        console.log('Enhanced model handler: Model loaded successfully');
        const mesh = this.el.getObject3D('mesh');
        if (mesh) {
          this.optimizeModel(mesh);
        }
      },
      
      onModelError: function(event) {
        console.error('Enhanced model handler: Model loading error:', event.detail);
      },
      
      onModelLoading: function() {
        console.log('Enhanced model handler: Model loading started');
      },
      
      optimizeModel: function(mesh) {
        if (mesh && mesh.geometry) {
          mesh.geometry.computeBoundingBox();
          mesh.geometry.computeBoundingSphere();
        }
        
        mesh.traverse((node) => {
          if (node && node.isMesh) {
            if (node.geometry) {
              node.geometry.computeBoundingBox();
              node.geometry.computeBoundingSphere();
            }
            if (node.material) {
              node.material.needsUpdate = true;
              if (node.material.map) {
                node.material.map.needsUpdate = true;
              }
            }
          }
        });
      }
    });
    
    // Enhanced Camera Controls Component
    AFRAME.registerComponent('enhanced-camera-controls', {
      init: function() {
        this.camera = this.el;
        this.initialPosition = this.camera.getAttribute('position');
        this.initialRotation = this.camera.getAttribute('rotation');
        this.lockPosition = null; // Position to lock to in eye mode
        this.moveSpeed = 0.05; // Reduced from 0.1 for slower movement
        this.rotationSpeed = 2;
        this.movementMode = 'move'; // 'move' or 'look'
        this.isMouseDown = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
        
        this.setupKeyboardControls();
        this.setupMouseControls();
        this.setupMouseWheel();
        
        // Listen for movement mode changes from parent
        window.addEventListener('message', (event) => {
          if (event.data && event.data.type === 'MOVEMENT_MODE_CHANGE') {
            this.movementMode = event.data.mode;
            console.log('Movement mode changed to:', this.movementMode);
            
            // When switching to eye mode, capture current position as the lock point
            if (this.movementMode === 'look') {
              this.lockPosition = this.camera.getAttribute('position');
              console.log('Eye mode: Camera locked at position:', this.lockPosition);
            }
          }
        });
      },
      
      setupKeyboardControls: function() {
        document.addEventListener('keydown', (event) => {
          const position = this.camera.getAttribute('position');
          const rotation = this.camera.getAttribute('rotation');
          
          switch(event.key.toLowerCase()) {
            case 'w': // Move forward
              if (this.movementMode === 'move') this.moveCamera('forward', this.moveSpeed);
              break;
            case 's': // Move backward
              if (this.movementMode === 'move') this.moveCamera('backward', this.moveSpeed);
              break;
            case 'a': // Strafe left
              if (this.movementMode === 'move') this.moveCamera('left', this.moveSpeed);
              break;
            case 'd': // Strafe right
              if (this.movementMode === 'move') this.moveCamera('right', this.moveSpeed);
              break;
            case ' ': // Spacebar - Move up
              if (this.movementMode === 'move') this.moveCamera('up', this.moveSpeed);
              break;
            case 'control': // Ctrl - Move down
              if (this.movementMode === 'move') this.moveCamera('down', this.moveSpeed);
              break;
            case 'arrowup': // Up arrow - Move up
              if (this.movementMode === 'move') this.moveCamera('up', this.moveSpeed);
              break;
            case 'arrowdown': // Down arrow - Move down
              if (this.movementMode === 'move') this.moveCamera('down', this.moveSpeed);
              break;
            case 'arrowleft': // Left arrow - Strafe left
              if (this.movementMode === 'move') this.moveCamera('left', this.moveSpeed);
              break;
            case 'arrowright': // Right arrow - Strafe right
              if (this.movementMode === 'move') this.moveCamera('right', this.moveSpeed);
              break;
            case 'r': // Reset view
              this.resetView();
              break;
            case 'shift': // Increase speed
              if (this.movementMode === 'move') this.moveSpeed = 0.1; // Increased from 0.05 for shift boost
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
              // Look around mode - rotate camera ONLY (no position change)
              const rotation = this.camera.getAttribute('rotation');
              this.camera.setAttribute('rotation', {
                x: Math.max(-90, Math.min(90, rotation.x - deltaY * 0.5)),
                y: rotation.y + deltaX * 0.5,
                z: rotation.z
              });
              // Camera position stays locked - no movement allowed in eye mode
            } else {
              // Move mode - move camera freely in 3D space
              const position = this.camera.getAttribute('position');
              const rotation = this.camera.getAttribute('rotation');
              const radY = rotation.y * Math.PI / 180;
              const radX = rotation.x * Math.PI / 180;
              
              // Calculate movement based on mouse delta (slower)
              const moveX = -deltaX * 0.005; // Reduced from 0.01 for slower movement
              const moveZ = -deltaY * 0.005; // Reduced from 0.01 for slower movement
              
              // Apply movement relative to camera rotation (true 3D movement)
              const newPosition = {
                x: position.x + (moveX * Math.cos(radY) - moveZ * Math.sin(radY)),
                y: position.y + (moveZ * Math.cos(radX)), // Allow vertical movement
                z: position.z + (moveX * Math.sin(radY) + moveZ * Math.cos(radY))
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
        const radY = rotation.y * Math.PI / 180;
        const radX = rotation.x * Math.PI / 180;
        
        let newPosition = { ...position };
        
        switch(direction) {
          case 'forward':
            // Move forward in the direction the camera is facing
            newPosition.x -= Math.sin(radY) * distance;
            newPosition.z -= Math.cos(radY) * distance;
            break;
          case 'backward':
            // Move backward in the direction the camera is facing
            newPosition.x += Math.sin(radY) * distance;
            newPosition.z += Math.cos(radY) * distance;
            break;
          case 'left':
            // Strafe left relative to camera direction
            newPosition.x -= Math.cos(radY) * distance;
            newPosition.z += Math.sin(radY) * distance;
            break;
          case 'right':
            // Strafe right relative to camera direction
            newPosition.x += Math.cos(radY) * distance;
            newPosition.z -= Math.sin(radY) * distance;
            break;
          case 'up':
            // Move up in world space (not relative to camera rotation)
            newPosition.y += distance;
            break;
          case 'down':
            // Move down in world space (not relative to camera rotation)
            newPosition.y -= distance;
            break;
        }
        
        this.camera.setAttribute('position', newPosition);
      },
      
      setupMouseWheel: function() {
        document.addEventListener('wheel', (event) => {
          event.preventDefault();
          
          // Only allow zooming in move mode, not in eye mode
          if (this.movementMode === 'move') {
            const delta = event.deltaY > 0 ? 1 : -1;
            const zoomSpeed = 0.5;
            
            // Zoom by moving camera forward/backward
            const position = this.camera.getAttribute('position');
            const rotation = this.camera.getAttribute('rotation');
            const radY = rotation.y * Math.PI / 180;
            const radX = rotation.x * Math.PI / 180;
            
            // Calculate zoom direction based on camera rotation
            const zoomDirection = {
              x: Math.sin(radY) * Math.cos(radX),
              y: -Math.sin(radX),
              z: Math.cos(radY) * Math.cos(radX)
            };
            
            const newPosition = {
              x: position.x + zoomDirection.x * delta * zoomSpeed,
              y: position.y + zoomDirection.y * delta * zoomSpeed,
              z: position.z + zoomDirection.z * delta * zoomSpeed
            };
            
            this.camera.setAttribute('position', newPosition);
          }
          // In eye mode, mouse wheel does nothing - camera stays locked in place
        });
      },
      
      resetView: function() {
        if (this.movementMode === 'look' && this.lockPosition) {
          // In eye mode, reset to the locked position (where you switched to eye mode)
          this.camera.setAttribute('position', this.lockPosition);
        } else if (this.initialPosition) {
          // In move mode, reset to the original starting position
          this.camera.setAttribute('position', this.initialPosition);
        }
        
        if (this.initialRotation) {
          this.camera.setAttribute('rotation', this.initialRotation);
        }
      }
    });
    
    // Scene Performance Optimizer
    AFRAME.registerComponent('scene-optimizer', {
      init: function() {
        this.scene = this.el;
        this.optimizeScene();
      },
      
      optimizeScene: function() {
        this.scene.setAttribute('shadow', 'type: pcfsoft');
        this.scene.setAttribute('renderer', 'antialias: true; colorManagement: true; sortObjects: true');
        
        const lights = this.scene.querySelectorAll('[light]');
        lights.forEach(light => {
          light.setAttribute('cast-shadow', true);
          light.setAttribute('shadow-map-size', 2048);
          light.setAttribute('shadow-camera-far', 50);
        });
      }
    });
  </script>
  <style>
    body { margin: 0; padding: 0; }
    .a-enter-vr { display: none !important; }
    a-scene { antialias: true; colorManagement: true; sortObjects: true; }
    [gltf-model] { cast-shadow: true; receive-shadow: true; }
  </style>
</head>
<body>
  <a-scene embedded style='width:100vw;height:100vh;' scene-optimizer>
    <a-entity gltf-model='${previewFile.url}' position='0 1.2 -2' scale='1 1 1' enhanced-model-handler></a-entity>
    <a-sky color='#ECECEC'></a-sky>
    <a-camera position='0 1.6 3' enhanced-camera-controls></a-camera>
    
    <!-- Enhanced lighting -->
    <a-light type="ambient" intensity="0.4" color="#ffffff"></a-light>
    <a-light type="directional" intensity="0.8" color="#ffffff" position="0 10 5" cast-shadow></a-light>
    
    <!-- Ground plane for better depth perception -->
    <a-plane position="0 0 0" rotation="-90 0 0" width="20" height="20" color="#cccccc" receive-shadow></a-plane>
  </a-scene>
</body>
</html>`}
                          style={{ 
                            width: isFullscreen ? '80vw' : '480px', 
                            height: isFullscreen ? '80vh' : '360px', 
                            border: 'none', 
                            background: '#ECECEC', 
                            borderRadius: '8px'
                          }}
                        />
                        
                        {/* 3D Controls Overlay */}
                        <div className="absolute top-2 right-2 bg-gray-900 bg-opacity-90 rounded-lg p-2 shadow-lg z-10">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-white text-xs font-medium">3D Controls</span>
                            {/* Fullscreen Toggle */}
                            <button
                              onClick={() => toggleFullscreen()}
                              className="ml-auto px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-xs transition-colors"
                              title={isFullscreen ? "Exit Large View" : "Large View"}
                            >
                              {isFullscreen ? '⛶' : '⛶'}
                            </button>
                          </div>
                          
                          {/* Movement Mode Selector */}
                          <div className="mb-2 p-1 bg-gray-800 rounded">
                            <div className="text-xs text-gray-400 mb-1 text-center">Mode</div>
                            <div className="flex gap-1">
                              <button
                                onClick={() => changeMovementMode('move')}
                                className={`flex-1 px-1 py-1 rounded text-xs transition-colors ${
                                  movementMode === 'move' 
                                    ? 'bg-blue-600 text-white' 
                                    : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                                }`}
                                title="Move Mode - Click and drag to move camera"
                              >
                                🖐️
                              </button>
                              <button
                                onClick={() => changeMovementMode('look')}
                                className={`flex-1 px-1 py-1 rounded text-xs transition-colors ${
                                  movementMode === 'look' 
                                    ? 'bg-green-600 text-white' 
                                    : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                                }`}
                                title="Look Mode - Click and drag to look around"
                              >
                                👁️
                              </button>
                            </div>
                          </div>
                          
                          {/* Quick Controls */}
                          <div className="flex flex-col gap-1">
                            <button
                              onClick={() => reset3DView()}
                              className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs transition-colors"
                              title="Reset View (R)"
                            >
                              Reset
                            </button>
                            <div className="text-xs text-gray-400 text-center">
                              <div>🖐️: Move</div>
                              <div>👁️: Look</div>
                            </div>
                          </div>
                        </div>
                      </div>
                      {/* Admin-only Open Mesh Editor button for GLTF/GLB */}
                      {/* {previewFile.type === '3d' && previewFile.url.match(/\.(glb|gltf)$/i) && (
                        <button
                          className="mt-4 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded text-sm font-semibold"
                          onClick={() => setShowMeshEditor(true)}
                        >
                          Open Mesh Editor
                        </button>
                      )} */}
                    </>
                  ) : (
                    <span className="text-red-400">Unsupported 3D model format. Only .glb and .gltf are supported.</span>
                  )}
                  <span className="text-white text-sm mb-2 mt-2">{previewFile.originalName}</span>
                </div>
              )}
              {/* Source Metadata Display */}
              {(previewFile.sourceUrl || previewFile.sourceInfo) && (
                <div className="mt-4 p-3 bg-gray-800 rounded-lg border border-gray-700 w-full max-w-lg">
                  <div className="flex items-start gap-2">
                    <span className="text-gray-400 text-lg">📚</span>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-300 mb-2">Source Attribution</h4>
                      {previewFile.sourceUrl && (
                        <div className="mb-2">
                          <label className="block text-xs text-gray-500 mb-1">Source URL:</label>
                          <a 
                            href={previewFile.sourceUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300 underline text-sm break-all"
                          >
                            {previewFile.sourceUrl}
                          </a>
                        </div>
                      )}
                      {previewFile.sourceInfo && (
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Source Information:</label>
                          <p className="text-sm text-gray-300 whitespace-pre-wrap break-words">
                            {previewFile.sourceInfo}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Tags Display */}
              {previewFile.tags && previewFile.tags.length > 0 && (
                <div className="mt-4 p-3 bg-gray-800 rounded-lg border border-gray-700 w-full max-w-lg">
                  <div className="flex items-start gap-2">
                    <Tag className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-300 mb-2">Tags</h4>
                      <div className="flex flex-wrap gap-1">
                        {previewFile.tags.map((tag, idx) => (
                          <span key={idx} className="text-xs bg-purple-900/30 text-purple-300 px-2 py-1 rounded-full border border-purple-700/50">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Modal action buttons */}
              <div className="flex flex-col gap-2 mt-2">
                {/* Source Info Checkbox */}
                {(previewFile.sourceUrl || previewFile.sourceInfo) && (
                  <div className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      id="includeSourceInfo"
                      checked={includeSourceInfo}
                      onChange={(e) => setIncludeSourceInfo(e.target.checked)}
                      className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
                    />
                    <label htmlFor="includeSourceInfo" className="text-gray-300">
                      Include Source Info
                    </label>
                  </div>
                )}
                
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => copyUrl(previewFile.url, previewFile.originalName, previewFile)}
                    className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white text-sm flex items-center gap-1"
                    title="Copy URL"
                  >
                    <Copy size={14} />
                    Copy URL
                  </button>
                  <button
                    onClick={() => {
                      setEditTagsFile(previewFile);
                      setTagInput(previewFile.tags ? previewFile.tags.join(', ') : '');
                      setPreviewUrl(null);
                      setPreviewFile(null);
                    }}
                    className="px-3 py-2 bg-purple-700 hover:bg-purple-600 rounded text-white text-sm flex items-center gap-1"
                    title="Edit tags"
                  >
                    <Tag size={14} />
                    Edit Tags
                  </button>
                  <button
                    onClick={() => {
                      setRenameFile(previewFile);
                      // Extract name without extension and timestamp
                      let baseName = previewFile.originalName.replace(/_\d+$/, '');
                      // Remove extension from display name
                      const lastDot = baseName.lastIndexOf('.');
                      if (lastDot > 0) {
                        baseName = baseName.substring(0, lastDot);
                      }
                      setNewFileName(baseName);
                      setPreviewUrl(null);
                      setPreviewFile(null);
                    }}
                    className="px-3 py-2 bg-blue-700 hover:bg-blue-600 rounded text-white text-sm flex items-center gap-1"
                    title="Rename file"
                  >
                    <Edit size={14} />
                    Rename
                  </button>
                  <button
                    onClick={() => {
                      deleteFile(previewFile.name, previewFile.folder || 'other');
                      setPreviewUrl(null);
                      setPreviewFile(null);
                    }}
                    className="px-3 py-2 bg-red-700 hover:bg-red-600 rounded text-white text-sm flex items-center gap-1"
                    title="Delete file"
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                </div>
              </div>
            </div>
            {/* MeshEditorModal (admin only, GLTF/GLB only) */}
            {showMeshEditor && previewFile && previewFile.url.match(/\.(glb|gltf)$/i) && (
              <MeshEditorModal
                open={showMeshEditor}
                onClose={() => setShowMeshEditor(false)}
                modelUrl={previewFile.url}
              />
            )}
          </div>
        )}
      </div>
      {showHtmlDraftModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 text-center">
            <h2 className="text-xl font-semibold mb-4">Load HTML Draft</h2>
            <div className="text-gray-300 mb-4">
              Loading this file will overwrite your current HTML. Continue?
            </div>
            <div className="flex justify-center gap-4">
              <button
                onClick={confirmLoadHtmlDraft}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white"
                disabled={loadingHtmlDraft}
              >
                {loadingHtmlDraft ? 'Loading...' : 'OK'}
              </button>
              <button
                onClick={() => setShowHtmlDraftModal(false)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white"
                disabled={loadingHtmlDraft}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rename File Modal */}
      {renameFile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Rename File</h3>
              <button
                onClick={() => {
                  setRenameFile(null);
                  setNewFileName('');
                }}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                New File Name
              </label>
              <input
                type="text"
                value={newFileName}
                onChange={(e) => {
                  // Auto-replace spaces with hyphens as user types
                  const value = e.target.value.replace(/\s+/g, '-');
                  setNewFileName(value);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleRenameFile();
                  } else if (e.key === 'Escape') {
                    setRenameFile(null);
                    setNewFileName('');
                  }
                }}
                className="w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="Enter new file name (no spaces)..."
                autoFocus
              />
              <p className="text-xs text-gray-400 mt-1">
                Spaces will be replaced with hyphens. Extension will be preserved automatically.
              </p>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setRenameFile(null);
                  setNewFileName('');
                }}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRenameFile}
                disabled={!newFileName.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded transition-colors"
              >
                Rename
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Tags Modal */}
      {editTagsFile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Tag size={20} className="text-purple-400" />
                Edit Tags
              </h3>
              <button
                onClick={() => {
                  setEditTagsFile(null);
                  setTagInput('');
                }}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="mb-2">
              <p className="text-sm text-gray-400 mb-3">
                File: <span className="text-white">{editTagsFile.originalName}</span>
              </p>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Tags (comma-separated)
              </label>
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSaveTags();
                  } else if (e.key === 'Escape') {
                    setEditTagsFile(null);
                    setTagInput('');
                  }
                }}
                className="w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="landscape, nature, outdoor, etc."
                autoFocus
              />
              <p className="text-xs text-gray-400 mt-1">
                Use tags to organize and quickly find your files
              </p>
            </div>
            {/* Tag suggestions */}
            {editTagsFile.type && (
              <div className="mb-4">
                <p className="text-xs text-gray-400 mb-2">Common tags for {editTagsFile.type}:</p>
                <div className="flex flex-wrap gap-1">
                  {editTagsFile.type === 'images' && ['landscape', 'portrait', 'nature', 'urban', 'abstract'].map(tag => (
                    <button
                      key={tag}
                      onClick={() => {
                        const current = tagInput.trim();
                        setTagInput(current ? `${current}, ${tag}` : tag);
                      }}
                      className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 px-2 py-1 rounded transition-colors"
                    >
                      + {tag}
                    </button>
                  ))}
                  {editTagsFile.type === 'audio' && ['music', 'sound-effect', 'voice', 'ambient', 'loop'].map(tag => (
                    <button
                      key={tag}
                      onClick={() => {
                        const current = tagInput.trim();
                        setTagInput(current ? `${current}, ${tag}` : tag);
                      }}
                      className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 px-2 py-1 rounded transition-colors"
                    >
                      + {tag}
                    </button>
                  ))}
                  {editTagsFile.type === '3d' && ['character', 'building', 'prop', 'environment', 'vehicle'].map(tag => (
                    <button
                      key={tag}
                      onClick={() => {
                        const current = tagInput.trim();
                        setTagInput(current ? `${current}, ${tag}` : tag);
                      }}
                      className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 px-2 py-1 rounded transition-colors"
                    >
                      + {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setEditTagsFile(null);
                  setTagInput('');
                }}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTags}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded transition-colors"
              >
                Save Tags
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
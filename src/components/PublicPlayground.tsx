import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import Header from './Header';
import Editor from './Editor';
import FileTabs from './FileTabs';
import Preview from './Preview';
import { Framework, Project } from '../types';
import { loadTemplateFromPublicPath } from '../lib/template-loader';
import { loadTemplateFromStorage, loadTemplateFromDB } from '../lib/supabase';
import JSZip from 'jszip';

export const PublicPlayground: React.FC = () => {
  const { templateId } = useParams();
  const [searchParams] = useSearchParams();
  const [project, setProject] = useState<Project | null>(null);
  const [activeFileId, setActiveFileId] = useState<string>('index.html');
  const [previewKey, setPreviewKey] = useState<number>(0);
  const [splitPosition, setSplitPosition] = useState<number>(50);
  const [showPreview, setShowPreview] = useState(true);

  const storageKey = useMemo(() => `playground-${templateId}`, [templateId]);

  // Load template (prefer locally cached edits)
  useEffect(() => {
    let isMounted = true;
    async function load() {
      if (!templateId) return;

      const cached = localStorage.getItem(storageKey);
      if (cached) {
        try {
          const parsed = JSON.parse(cached) as Project;
          if (isMounted) setProject(parsed);
          return;
        } catch {}
      }

      const source = (searchParams.get('source') || 'public').toLowerCase();
      try {
        const loaded = source === 'storage'
          ? (await loadTemplateFromStorage(templateId)).data
          : source === 'db'
            ? (await loadTemplateFromDB(templateId)).data
            : await loadTemplateFromPublicPath(searchParams.get('path') || `/templates/${templateId}/index.html`);
        if (isMounted) setProject(loaded);
      } catch (e) {
        console.error('Failed to load public template:', e);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, [templateId, storageKey, searchParams]);

  // Persist changes locally only
  useEffect(() => {
    if (project) {
      localStorage.setItem(storageKey, JSON.stringify(project));
    }
  }, [project, storageKey]);

  const handleExportLocalSite = async () => {
    if (!project) return;
    const zip = new JSZip();
    project.files.forEach(file => {
      zip.file(file.name, file.content);
    });
    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.name || 'project'}.zip`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-300">
        Loading playground...
      </div>
    );
  }

  const activeFile = project.files.find(f => f.id === activeFileId) || project.files[0];

  return (
    <div className="h-screen flex flex-col bg-neutral-900 text-white">
      <div className="px-4 py-2 bg-gray-800 border-b border-gray-700 text-sm">
        <a href="/" className="text-blue-300 hover:text-blue-200 underline">← Return to WebXRide</a>
      </div>
      <Header
        projectName={`Playground: ${project.name}`}
        onExportLocalSite={handleExportLocalSite}
        // Intentionally omit onSaveHtml, onSubmitToTeacher, onSaveTemplate for public mode
      />

      <div className="flex-1 flex overflow-hidden">
        <div className="w-1/2 min-w-[280px] border-r border-neutral-800 overflow-hidden flex flex-col" style={{ width: `${splitPosition}%` }}>
          <FileTabs
            files={project.files}
            activeFileId={activeFile.id}
            onChangeFile={(id) => setActiveFileId(id)}
          />
          <div className="flex-1 overflow-hidden">
            <Editor
            value={activeFile.content}
            language={activeFile.type}
            fileName={activeFile.name}
              rideyEnabled={import.meta.env.VITE_PLAYGROUND_ENABLE_RIDEY === 'true'}
            onChange={(newValue) => {
              setProject(prev => {
                if (!prev) return prev;
                const updated = { ...prev, files: prev.files.map(f => f.id === activeFile.id ? { ...f, content: newValue } : f) };
                return updated;
              });
            }}
            />
          </div>
        </div>
        <div className="w-1/2 min-w-[280px] overflow-hidden" style={{ width: `${100 - splitPosition}%` }}>
          {showPreview && project && (
            <Preview key={previewKey} files={project.files} framework={project.framework} project={project} />
          )}
        </div>
      </div>
    </div>
  );
};

export default PublicPlayground;



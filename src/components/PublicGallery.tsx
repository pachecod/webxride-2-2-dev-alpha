import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface PublicTemplate {
  id: string;
  name: string;
  description?: string;
}

export const PublicGallery: React.FC = () => {
  const [templates, setTemplates] = useState<PublicTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: folders } = await supabase.storage
          .from('templates')
          .list('', { limit: 1000, offset: 0, sortBy: { column: 'name', order: 'asc' } });

        const topLevel = (folders || []).filter((folder: any) => {
          const hasSlash = folder.name.includes('/');
          const isNotMetadataFile = !folder.name.endsWith('metadata.json');
          const isNotTemplateOrder = folder.name !== 'template-order.json';
          const isNotSystemFile = !folder.name.startsWith('.');
          return !hasSlash && isNotMetadataFile && isNotTemplateOrder && isNotSystemFile;
        });

        const result: PublicTemplate[] = [];
        for (const folder of topLevel) {
          let meta: any = null;
          // First try a cache-busting signed URL (avoids stale CDN cache)
          try {
            const { data: signed } = await supabase.storage
              .from('templates')
              .createSignedUrl(`${folder.name}/metadata.json`, 60);
            if (signed?.signedUrl) {
              const res = await fetch(signed.signedUrl, { cache: 'no-store' });
              if (res.ok) meta = await res.json();
            }
          } catch {}

          // Fallback to direct download
          if (!meta) {
            try {
              const { data: metaFile } = await supabase.storage
                .from('templates')
                .download(`${folder.name}/metadata.json`);
              if (metaFile) meta = JSON.parse(await metaFile.text());
            } catch {}
          }

          if (meta && meta.public_playground === true) {
            result.push({
              id: folder.name,
              name: meta.name || folder.name,
              description: meta.description || ''
            });
          }
        }

        setTemplates(result);
      } catch (e) {
        setError('Failed to load public templates');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center gap-4">
          <a href="/" className="text-blue-300 hover:text-blue-200 underline text-sm">← Return to WebXRide</a>
          <div className="h-6 w-px bg-gray-600" />
          <h1 className="text-xl font-semibold">Public Templates</h1>
        </div>
      </div>
      <div className="p-6 max-w-6xl mx-auto">
        <p className="text-sm text-gray-300 mb-4">Browse templates shared publicly. Click to open in the playground and experiment locally.</p>
        {error && (
          <div className="mb-4 p-3 bg-red-900/40 border border-red-700 text-red-200 rounded">{error}</div>
        )}
        {loading ? (
          <div className="text-gray-400">Loading...</div>
        ) : templates.length === 0 ? (
          <div className="text-gray-400">No public templates available yet.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map(t => (
              <div key={t.id} className="bg-gray-800 border border-gray-700 rounded p-4 flex flex-col">
                <div className="font-semibold text-white mb-1 truncate">{t.name}</div>
                <div className="text-xs text-gray-400 mb-3 truncate">{t.id}</div>
                {t.description && (
                  <div className="text-sm text-gray-300 line-clamp-3 mb-4">{t.description}</div>
                )}
                <div className="mt-auto">
                  <a
                    href={`/play/${t.id}?source=storage`}
                    className="inline-block px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm text-white"
                    title="Open in Public Playground"
                  >
                    Open in Playground
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicGallery;



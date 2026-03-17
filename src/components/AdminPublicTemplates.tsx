import React, { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { getTemplatesWithOrder, getTemplatesFromDB, setTemplatePublicFlag, setTemplatePublicFlagDB, setTemplateThumbnailUrl, supabase } from '../lib/supabase';

interface TemplateItem {
  id: string;
  name: string;
  framework: string;
  description?: string;
  public_playground?: boolean;
  thumbnail_url?: string;
}

export const AdminPublicTemplates: React.FC = () => {
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [savingThumbnail, setSavingThumbnail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      // Prefer DB templates (published to students); fallback to storage order
      const { data: dbTemplates } = await getTemplatesFromDB();
      const source = (dbTemplates && dbTemplates.length > 0) ? 'db' : 'storage';
      let sourceTemplates = source === 'db' ? dbTemplates : (await getTemplatesWithOrder()).data || [];

      // Fallback: if list still empty, manually list top-level folders (same approach as Sidebar)
      if (!sourceTemplates || sourceTemplates.length === 0) {
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
        sourceTemplates = topLevel.map((f: any) => ({ id: f.name, name: f.name, framework: 'html' }));
      }

      const result: TemplateItem[] = [];
      for (const t of sourceTemplates as any[]) {
        const id = t.id;
        let name = t.name || id;
        let framework = t.framework || 'html';
        let publicFlag = (t.public_playground === true);
        let thumbnailUrl: string | undefined = undefined;
        if (source === 'storage') {
          try {
            const { data: metaFile } = await supabase.storage
              .from('templates')
              .download(`${id}/metadata.json`);
            if (metaFile) {
              const meta = JSON.parse(await metaFile.text());
              name = meta.name || name;
              framework = meta.framework || framework;
              publicFlag = meta.public_playground === true;
              if (meta.thumbnail_url && typeof meta.thumbnail_url === 'string') {
                thumbnailUrl = meta.thumbnail_url;
              }
            }
          } catch {}
        }

        result.push({ id, name, framework, public_playground: publicFlag, thumbnail_url: thumbnailUrl });
      }

      setTemplates(result);
    } catch (e) {
      setError('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleToggle = async (templateId: string, next: boolean) => {
    setSaving(templateId);
    setError(null);
    try {
      // Update both DB and storage metadata to keep in sync
      const db = await setTemplatePublicFlagDB(templateId, next);
      const storage = await setTemplatePublicFlag(templateId, next);
      if (!db.success && !storage.success) throw db.error || storage.error || new Error('Unknown error');
      setTemplates(prev => prev.map(t => t.id === templateId ? { ...t, public_playground: next } : t));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(null);
    }
  };

  const handleThumbnailChange = async (templateId: string, url: string) => {
    setSavingThumbnail(templateId);
    setError(null);
    try {
      const trimmed = url.trim();
      const res = await setTemplateThumbnailUrl(templateId, trimmed || null);
      if (!res.success) throw res.error || new Error('Failed to save thumbnail URL');
      setTemplates(prev =>
        prev.map(t => (t.id === templateId ? { ...t, thumbnail_url: trimmed || undefined } : t)),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSavingThumbnail(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => (window.location.href = '/admin-tools')}
            className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
            title="Back to Admin Tools"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Settings
          </button>
          <div className="h-6 w-px bg-gray-600" />
          <h1 className="text-xl font-semibold">Public Templates</h1>
        </div>
      </div>

      <div className="p-6">
        <p className="text-sm text-gray-300 mb-4">Toggle which templates are available in the Public Playground.</p>
      {error && (
        <div className="mb-4 p-3 bg-red-900/40 border border-red-700 text-red-200 rounded">{error}</div>
      )}
        {loading ? (
        <div className="text-gray-400">Loading templates...</div>
        ) : (
          <div className="space-y-2">
            {templates.length === 0 && (
              <div className="text-gray-400">No templates found.</div>
            )}
            {templates.map(t => (
              <div key={t.id} className="bg-gray-800 border border-gray-700 rounded px-4 py-3 space-y-2">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-white font-medium">{t.name}</div>
                    <div className="text-xs text-gray-400">{t.id}</div>
                  </div>
                  <label className="flex items-center gap-2 text-sm text-gray-200">
                    <input
                      type="checkbox"
                      className="w-4 h-4"
                      checked={!!t.public_playground}
                      onChange={(e) => handleToggle(t.id, e.target.checked)}
                      disabled={saving === t.id}
                    />
                    {saving === t.id ? 'Saving...' : 'Make available in Public Playground'}
                  </label>
                </div>
                <div className="mt-1">
                  <label className="block text-xs text-gray-300 mb-1">
                    Thumbnail URL (optional)
                  </label>
                  <input
                    type="url"
                    className="w-full px-2 py-1 rounded border border-gray-600 bg-gray-700 text-xs text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="https://example.com/thumbnail.jpg"
                    defaultValue={t.thumbnail_url || ''}
                    onBlur={e => handleThumbnailChange(t.id, e.target.value)}
                  />
                  {savingThumbnail === t.id && (
                    <div className="mt-1 text-[10px] text-gray-400">Saving thumbnail…</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPublicTemplates;



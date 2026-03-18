import { getTemplatesWithOrder, supabase } from './supabase';

export type PublicTemplate = {
  id: string;
  name: string;
  description?: string;
  thumbnailUrl?: string;
  createdAt?: number;
};

type FetchPublicTemplatesOptions = {
  limit?: number;
  orderBy?: 'adminOrder' | 'recent' | 'alpha';
};

async function fetchTemplateMetadata(templateId: string): Promise<any | null> {
  let meta: any = null;

  // Prefer a short-lived signed URL to avoid stale CDN cache
  try {
    const { data: signed } = await supabase.storage
      .from('templates')
      .createSignedUrl(`${templateId}/metadata.json`, 60);
    if (signed?.signedUrl) {
      const res = await fetch(signed.signedUrl, { cache: 'no-store' });
      if (res.ok) meta = await res.json();
    }
  } catch {
    // ignore; fall back below
  }

  if (!meta) {
    try {
      const { data: metaFile } = await supabase.storage
        .from('templates')
        .download(`${templateId}/metadata.json`);
      if (metaFile) meta = JSON.parse(await metaFile.text());
    } catch {
      // ignore
    }
  }

  return meta;
}

export async function fetchPublicTemplates(
  options: FetchPublicTemplatesOptions = {}
): Promise<PublicTemplate[]> {
  const { limit = 6, orderBy = 'adminOrder' } = options;

  // List top-level folders once (also gives us fallback created_at in some environments)
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

  const folderCreatedAtById = new Map<string, number>();
  for (const f of topLevel as any[]) {
    const createdAt = Date.parse(f.created_at || f.updated_at || '') || 0;
    if (createdAt) folderCreatedAtById.set(f.name, createdAt);
  }

  let sourceIds: string[] = [];

  if (orderBy === 'adminOrder') {
    try {
      const { data: orderedTemplates } = await getTemplatesWithOrder();
      if (orderedTemplates && (orderedTemplates as any[]).length > 0) {
        sourceIds = (orderedTemplates as any[]).map(t => t.id).filter(Boolean);
      }
    } catch {
      // ignore; fall back below
    }
  }

  if (sourceIds.length === 0) {
    // Fallback to top-level folders (already sorted by name from storage listing)
    sourceIds = topLevel.map((f: any) => f.name);
  }

  const results: PublicTemplate[] = [];

  for (const id of sourceIds) {
    if (!id) continue;
    const meta = await fetchTemplateMetadata(id);
    if (!meta || meta.public_playground !== true) continue;

    const createdAt =
      Date.parse(meta.created_at || meta.updated_at || '') ||
      folderCreatedAtById.get(id) ||
      0;

    results.push({
      id,
      name: meta.name || id,
      description: meta.description || '',
      thumbnailUrl: typeof meta.thumbnail_url === 'string' ? meta.thumbnail_url : undefined,
      createdAt: createdAt || undefined,
    });

    // Small early exit if we’re not going to reorder later
    if (orderBy !== 'recent' && results.length >= limit) break;
  }

  if (orderBy === 'recent') {
    results.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  } else if (orderBy === 'alpha') {
    results.sort((a, b) => a.name.localeCompare(b.name));
  }

  return results.slice(0, limit);
}


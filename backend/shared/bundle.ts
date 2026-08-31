import { unzipSync } from 'fflate';

// Extraction runs in the browser and files are uploaded directly to Vercel Blob,
// so these limits are generous (GameMaker HTML5 / pygbag builds can be large).
export const MAX_TOTAL_UNCOMPRESSED = 200 * 1024 * 1024; // 200MB extracted (zip-bomb guard)
export const MAX_FILES = 1500;
export const MAX_FILE_BYTES = 100 * 1024 * 1024; // 100MB per file (server token limit)

// Bare MIME types (no charset) so they match Vercel Blob content-type handling.
const MIME_TYPES: Record<string, string> = {
  html: 'text/html',
  htm: 'text/html',
  css: 'text/css',
  js: 'text/javascript',
  mjs: 'text/javascript',
  json: 'application/json',
  wasm: 'application/wasm',
  txt: 'text/plain',
  csv: 'text/csv',
  xml: 'application/xml',
  svg: 'image/svg+xml',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  ico: 'image/x-icon',
  bmp: 'image/bmp',
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  ogg: 'audio/ogg',
  mp4: 'video/mp4',
  webm: 'video/webm',
  woff: 'font/woff',
  woff2: 'font/woff2',
  ttf: 'font/ttf',
  otf: 'font/otf',
  eot: 'application/vnd.ms-fontobject',
  // GameMaker / pygbag data blobs
  data: 'application/octet-stream',
  mem: 'application/octet-stream',
  bin: 'application/octet-stream',
  apk: 'application/octet-stream',
  pck: 'application/octet-stream'
};

const ALLOWED_EXTENSIONS = new Set(Object.keys(MIME_TYPES));

export const SCRATCH_CONTENT_TYPE = 'application/octet-stream';

function extensionOf(name: string): string {
  const dot = name.lastIndexOf('.');
  return dot === -1 ? '' : name.slice(dot + 1).toLowerCase();
}

export function contentTypeFor(name: string): string {
  return MIME_TYPES[extensionOf(name)] ?? 'application/octet-stream';
}

function isUnsafePath(name: string): boolean {
  if (name.startsWith('/') || name.includes('\\')) return true;
  return name.split('/').some((segment) => segment === '..');
}

export interface PreparedFile {
  path: string; // relative to the bundle root, e.g. "index.html" or "html5game/game.js"
  data: Uint8Array;
  contentType: string;
}

export interface PreparedBundle {
  entryPath: string;
  files: PreparedFile[];
}

/**
 * Extracts a web bundle zip (plain website, GameMaker HTML5 build, pygbag build),
 * finds the entry HTML, rebases every file relative to the entry's directory and
 * validates safety limits. Runs in the browser before uploading to Vercel Blob.
 */
export function prepareWebBundle(zip: Uint8Array): PreparedBundle {
  const entries = unzipSync(zip);
  const names = Object.keys(entries).filter((name) => !name.endsWith('/'));

  if (names.length === 0) {
    throw new Error('File .zip rỗng');
  }
  if (names.length > MAX_FILES) {
    throw new Error(`Bundle có quá nhiều file (tối đa ${MAX_FILES})`);
  }

  // Prefer index.html; fall back to the shallowest single .html file.
  const byDepth = (a: string, b: string) => a.split('/').length - b.split('/').length;
  let entry =
    names.filter((n) => n === 'index.html' || n.endsWith('/index.html')).sort(byDepth)[0];

  if (!entry) {
    const htmlFiles = names.filter((n) => n.endsWith('.html')).sort(byDepth);
    entry = htmlFiles[0];
  }

  if (!entry) {
    throw new Error('Bundle phải có một file .html (ví dụ index.html)');
  }

  // Directory that contains the entry becomes the bundle root.
  const slash = entry.lastIndexOf('/');
  const prefix = slash === -1 ? '' : entry.slice(0, slash + 1);
  const entryPath = entry.slice(prefix.length);

  const files: PreparedFile[] = [];
  let totalBytes = 0;

  for (const name of names) {
    if (!name.startsWith(prefix)) continue; // ignore files outside the bundle root
    if (isUnsafePath(name)) {
      throw new Error(`Đường dẫn file không hợp lệ: ${name}`);
    }

    const ext = extensionOf(name);
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      throw new Error(`Định dạng file không được phép: .${ext || '(không có)'}`);
    }

    const data = entries[name];
    totalBytes += data.length;
    if (totalBytes > MAX_TOTAL_UNCOMPRESSED) {
      throw new Error('Bundle vượt quá giới hạn dung lượng sau giải nén');
    }
    if (data.length > MAX_FILE_BYTES) {
      throw new Error(`File "${name}" vượt quá giới hạn ${Math.round(MAX_FILE_BYTES / (1024 * 1024))}MB`);
    }

    files.push({
      path: name.slice(prefix.length),
      data,
      contentType: contentTypeFor(name)
    });
  }

  return { entryPath, files };
}

export function makeBundleId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

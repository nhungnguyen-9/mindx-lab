import express from 'express';
import { fileURLToPath, pathToFileURL } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.BACKEND_PORT || 3001;

function vercelAdapter(handlerPath: string, paramName?: string) {
    return async (req: express.Request, res: express.Response) => {
        if (paramName) {
            (req as any).query = { ...req.query, [paramName]: req.params[paramName] };
        }
        const fullPath = resolve(__dirname, handlerPath);
        const fileUrl = pathToFileURL(fullPath).href;
        const mod = await import(fileUrl);
        await mod.default(req, res);
    };
}

// Public routes
app.all('/api/products', vercelAdapter('./api/products/index'));
app.all('/api/products/:id', vercelAdapter('./api/products/[id]', 'id'));

// Auth routes
app.all('/api/auth/login', vercelAdapter('./api/auth/login'));

// Admin routes
app.all('/api/admin/stats', vercelAdapter('./api/admin/stats'));
app.all('/api/admin/upload', vercelAdapter('./api/admin/upload'));
app.all('/api/admin/blob-upload', vercelAdapter('./api/admin/blob-upload'));
app.all('/api/admin/products', vercelAdapter('./api/admin/products/index'));
app.all('/api/admin/products/:id/publish', vercelAdapter('./api/admin/products/[id]/publish', 'id'));
app.all('/api/admin/products/:id', vercelAdapter('./api/admin/products/[id]', 'id'));
app.all('/api/admin/users', vercelAdapter('./api/admin/users/index'));
app.all('/api/admin/users/:id', vercelAdapter('./api/admin/users/[id]', 'id'));

app.listen(PORT, () => {
    console.log(`Backend API running at http://localhost:${PORT}`);
});

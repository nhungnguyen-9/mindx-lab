import { json } from './http';

export function badRequest(
    res: any,
    message: string,
    details?: Record<string, string>
) {
    json(res, 400, { error: message, code: 'BAD_REQUEST', ...(details && { details }) });
}

export function notFound(res: any, message = 'Not found') {
    json(res, 404, { error: message, code: 'NOT_FOUND' });
}

export function unauthorized(res: any, message = 'Unauthorized') {
    json(res, 401, { error: message, code: 'UNAUTHORIZED' });
}

export function serverError(res: any, message = 'Internal server error') {
    json(res, 500, { error: message, code: 'SERVER_ERROR' });
}

/**
 * @returns Vercel url if in env; otherwise the fallback; otherwise `localhost:3000`
 */
export function getWorkingUrl_Vercel(): string {
    return process.env.VERCEL_URL 
        || process.env.VERCEL_URL_FALLBACK 
        || 'http://localhost:3000';
}

/**
 * @returns LiveKit url if in env; otherwise the fallback; otherwise `localhost:8000`
 */
export function getWorkingUrl_LiveKit(): string {
    return process.env.NEXT_PUBLIC_TOKEN_API_URL 
        || process.env.NEXT_PUBLIC_TOKEN_API_URL_FALLBACK 
        || 'http://localhost:8000';
}
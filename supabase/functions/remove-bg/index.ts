const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

/** Simple in-memory cache for processed images (hash → PNG ArrayBuffer) */
const imageCache = new Map<string, { data: ArrayBuffer; timestamp: number }>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

/** Request queue to prevent concurrent API calls */
let activeRequests = 0;
const MAX_CONCURRENT = 2;
const pendingQueue: Array<{ resolve: (v: void) => void }> = [];

async function acquireSlot(): Promise<void> {
  if (activeRequests < MAX_CONCURRENT) {
    activeRequests++;
    return;
  }
  return new Promise((resolve) => {
    pendingQueue.push({ resolve });
  });
}

function releaseSlot() {
  activeRequests--;
  if (pendingQueue.length > 0) {
    activeRequests++;
    pendingQueue.shift()!.resolve();
  }
}

/** Hash image bytes for cache key using SubtleCrypto */
async function hashBuffer(buffer: ArrayBuffer): Promise<string> {
  const hashBuf = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(hashBuf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** Clean expired cache entries */
function cleanCache() {
  const now = Date.now();
  for (const [key, entry] of imageCache) {
    if (now - entry.timestamp > CACHE_TTL_MS) {
      imageCache.delete(key);
    }
  }
}

/** Call remove.bg with retry logic for 429 rate limits */
async function callRemoveBgWithRetry(
  imageBytes: ArrayBuffer,
  apiKey: string,
  maxRetries = 3
): Promise<ArrayBuffer> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const formData = new FormData();
    formData.append(
      'image_file',
      new Blob([imageBytes], { type: 'image/png' }),
      'photo.png'
    );
    formData.append('size', 'auto');

    const response = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: { 'X-Api-Key': apiKey },
      body: formData,
    });

    if (response.ok) {
      return response.arrayBuffer();
    }

    // Rate limited — retry with exponential backoff
    if (response.status === 429 && attempt < maxRetries) {
      const retryAfter = response.headers.get('Retry-After');
      const waitMs = retryAfter
        ? parseInt(retryAfter, 10) * 1000
        : Math.min(1000 * Math.pow(2, attempt), 30000);
      console.log(`[remove-bg] Rate limited (429). Retrying in ${waitMs}ms (attempt ${attempt + 1}/${maxRetries})`);
      await new Promise((r) => setTimeout(r, waitMs));
      continue;
    }

    // Other error — throw immediately
    const errorText = await response.text();
    console.error('remove.bg API error:', response.status, errorText);
    throw new Error(`remove.bg API error: ${response.status} - ${errorText}`);
  }

  throw new Error('Rate limit exceeded after maximum retries. Please try again later.');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('REMOVE_BG_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'REMOVE_BG_API_KEY is not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const formData = await req.formData();
    const imageFile = formData.get('image_file');

    if (!imageFile || !(imageFile instanceof File)) {
      return new Response(
        JSON.stringify({ success: false, error: 'image_file is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const imageBytes = await imageFile.arrayBuffer();

    // Check cache first
    cleanCache();
    const hash = await hashBuffer(imageBytes);
    const cached = imageCache.get(hash);
    if (cached) {
      console.log('[remove-bg] Cache hit for hash:', hash.slice(0, 12));
      return new Response(cached.data, {
        headers: { ...corsHeaders, 'Content-Type': 'image/png' },
      });
    }

    // Queue-based concurrency control
    await acquireSlot();
    try {
      // Double-check cache after acquiring slot (another request may have cached it)
      const cached2 = imageCache.get(hash);
      if (cached2) {
        return new Response(cached2.data, {
          headers: { ...corsHeaders, 'Content-Type': 'image/png' },
        });
      }

      console.log('[remove-bg] Processing image, hash:', hash.slice(0, 12));
      const resultBuffer = await callRemoveBgWithRetry(imageBytes, apiKey);

      // Cache the result
      imageCache.set(hash, { data: resultBuffer, timestamp: Date.now() });

      return new Response(resultBuffer, {
        headers: { ...corsHeaders, 'Content-Type': 'image/png' },
      });
    } finally {
      releaseSlot();
    }
  } catch (error) {
    console.error('Error in remove-bg function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    const isRateLimit = errorMessage.includes('429') || errorMessage.includes('Rate limit');
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
        retryable: isRateLimit,
      }),
      {
        status: isRateLimit ? 429 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

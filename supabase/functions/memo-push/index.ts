import { createClient } from 'npm:@supabase/supabase-js@2';
import webpush from 'npm:web-push@3.6.7';

type MemoPushRequest = {
  memo?: {
    id?: string;
    body?: string;
    created_at?: string;
  };
  sender_email?: string;
  title?: string;
  tag?: string;
  url?: string;
};

type PushSubscriptionRow = {
  id: string;
  endpoint: string;
  subscription: {
    endpoint: string;
    expirationTime?: number | null;
    keys: {
      p256dh: string;
      auth: string;
    };
  };
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function requiredEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

function truncateBody(body: string): string {
  const normalized = body.replace(/\s+/g, ' ').trim();
  return normalized.length > 120 ? `${normalized.slice(0, 119)}…` : normalized;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return Response.json(
      { error: 'Method not allowed' },
      { status: 405, headers: corsHeaders },
    );
  }

  try {
    const payload = await req.json() as MemoPushRequest;
    const memo = payload.memo || {};
    const body = truncateBody(memo.body || '新しいメモが追加されました。');
    const title = truncateBody(payload.title || 'Zaiko メモ');

    const supabase = createClient(
      requiredEnv('SUPABASE_URL'),
      requiredEnv('SUPABASE_SERVICE_ROLE_KEY'),
      { auth: { persistSession: false } },
    );

    webpush.setVapidDetails(
      Deno.env.get('VAPID_SUBJECT') || 'mailto:zaiko@example.com',
      requiredEnv('VAPID_PUBLIC_KEY'),
      requiredEnv('VAPID_PRIVATE_KEY'),
    );

    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('id, endpoint, subscription');

    if (error) throw error;
    const subscriptionCount = subscriptions?.length || 0;
    console.log('memo-push subscriptions:', subscriptionCount);

    const notificationPayload = JSON.stringify({
      title,
      body,
      url: payload.url || '/stock-room/',
      tag: payload.tag || (memo.id ? `zaiko-memo-${memo.id}` : 'zaiko-memo'),
      memo_id: memo.id || null,
      sender_email: payload.sender_email || '',
      created_at: memo.created_at || null,
    });

    let sent = 0;
    let failed = 0;
    let removed = 0;

    await Promise.all((subscriptions || []).map(async (row: PushSubscriptionRow) => {
      try {
        await webpush.sendNotification(row.subscription, notificationPayload);
        sent += 1;
      } catch (e) {
        failed += 1;
        const statusCode = (e as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await supabase.from('push_subscriptions').delete().eq('id', row.id);
          removed += 1;
        } else {
          console.warn('Web Push send failed:', row.endpoint, e);
        }
      }
    }));

    return Response.json(
      { ok: true, subscription_count: subscriptionCount, sent, failed, removed },
      { headers: corsHeaders },
    );
  } catch (e) {
    console.error('memo-push failed:', e);
    return Response.json(
      { error: e instanceof Error ? e.message : 'Unknown error' },
      { status: 500, headers: corsHeaders },
    );
  }
});

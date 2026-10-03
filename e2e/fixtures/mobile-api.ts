import type { Page, Route } from '@playwright/test';

export const FIXTURE_MOBILE_TOKEN = {
  access_token: 'cleanup-e2e-mobile-token',
  refresh_token: 'cleanup-e2e-mobile-refresh',
  encoded_mi: 'cleanup-encoded-mi',
  permission: { role: 'client' },
};

export const FIXTURE_CLIENT_INFO = {
  id: 900002,
  email: 'cleanup.client@example.com',
  first_name: 'Cleanup',
  last_name: 'Client',
  name: 'Cleanup Client',
  has_changed_password: true,
  connected_wearable: false,
  verified_account: true,
  active_client: true,
  action_plan: true,
  lab_test: false,
};

export const FIXTURE_BRAND = {
  name: 'Cleanup Clinic',
  logo: '',
  primary_color: '#005F73',
  secondary_color: '#0A9396',
  headline: 'Cleanup fixture brand',
  tone: 'calm',
  focus_area: 'general',
  last_update: '2026-08-01T00:00:00Z',
};

export const FIXTURE_TASK_TITLE = 'Cleanup Fixture Walk';

function fixtureChatMessages() {
  const yesterday = new Date();
  yesterday.setHours(18, 0, 0, 0);
  yesterday.setDate(yesterday.getDate() - 1);
  const today = new Date();
  today.setHours(9, 15, 0, 0);

  return [
    {
      conversation_id: 11,
      date: yesterday.toISOString(),
      message_text: 'Yesterday check-in',
      sender_type: 'patient',
      time: '18:00',
      timestamp: yesterday.getTime(),
      reported: false,
    },
    {
      conversation_id: 12,
      date: yesterday.toISOString(),
      message_text: 'Noted, rest well.',
      sender_type: 'ai',
      time: '18:01',
      timestamp: yesterday.getTime() + 60_000,
      reported: false,
    },
    {
      conversation_id: 13,
      date: today.toISOString(),
      message_text: 'How am I today?',
      sender_type: 'patient',
      time: '09:15',
      timestamp: today.getTime(),
      reported: false,
    },
    {
      conversation_id: 14,
      date: today.toISOString(),
      message_text: 'You are on track.',
      sender_type: 'ai',
      time: '09:16',
      timestamp: today.getTime() + 60_000,
      reported: false,
    },
  ];
}

export const FIXTURE_WEEKLY_TASKS = [
  {
    date: '2026-08-01',
    day: 'Saturday',
    progress: 0,
    tasks: [
      {
        Category: 'Activity',
        Description: 'Deterministic cleanup fixture task',
        Instruction: 'Walk for 10 minutes',
        Task_Type: 'Action',
        Times: ['09:00'],
        Title: FIXTURE_TASK_TITLE,
        Status: false,
        Updated_at: '2026-08-01T00:00:00Z',
        task_id: 'cleanup-task-1',
      },
    ],
  },
];

const ALLOWED_LOCAL_PREFIXES = [
  'http://127.0.0.1:4174/',
  'http://localhost:4174/',
  'ws://127.0.0.1:4174/',
  'ws://localhost:4174/',
];

function isViteAsset(url: string): boolean {
  return ALLOWED_LOCAL_PREFIXES.some((prefix) => url.startsWith(prefix));
}

function json(route: Route, body: unknown, status = 200) {
  return route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });
}

function pathOf(url: string): string {
  try {
    return new URL(url).pathname;
  } catch {
    return url;
  }
}

async function handleApi(route: Route) {
  const request = route.request();
  const url = request.url();
  const method = request.method().toUpperCase();
  const path = pathOf(url);

  if (method === 'OPTIONS') {
    return route.fulfill({
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  if (path.includes('/auth/mobile_token') && method === 'POST') {
    return json(route, FIXTURE_MOBILE_TOKEN);
  }

  if (
    path.includes('/api/client_information_mobile') ||
    path.includes('/client_information_mobile')
  ) {
    return json(route, FIXTURE_CLIENT_INFO);
  }

  if (path.includes('/mobile/weekly_tasks')) {
    return json(route, FIXTURE_WEEKLY_TASKS);
  }

  if (path.includes('/mobile/today_tasks')) {
    return json(route, FIXTURE_WEEKLY_TASKS[0].tasks);
  }

  if (path.includes('show_assigned_questionaries') || path.includes('questionaries')) {
    return json(route, []);
  }

  if (path.includes('/biomarkers_mobile')) {
    // you-menu does setBiomarkersData(res.data.biomarkers)
    return json(route, { biomarkers: [] });
  }

  if (path.includes('show_brand_info') || path.includes('brand_info') || path.includes('/get_brand')) {
    return json(route, FIXTURE_BRAND);
  }

  if (path.includes('/mobile/get_html_report')) {
    return json(route, { html: null, available: false });
  }

  if (path.includes('get_messages_id')) {
    return json(route, { conversation_id: 1, messages: fixtureChatMessages() });
  }

  if (
    path.includes('/mobile_chat') &&
    !path.includes('feedback') &&
    !path.includes('report')
  ) {
    await new Promise((resolve) => setTimeout(resolve, 800));
    return json(route, {
      answer: 'Fixture copilot reply',
      current_conversation_id: 15,
      references: [],
    });
  }

  if (path.includes('/health')) {
    return json(route, { status: 'OK' });
  }

  if (path.includes('notification') || path.includes('Notification')) {
    return json(route, { new_notifications: false, notifications: [] });
  }

  if (path.includes('/mobile/') || path.includes('_mobile')) {
    return json(route, {});
  }

  if (method === 'GET') {
    return json(route, {});
  }
  return json(route, {});
}

/**
 * Mock axios/Vercel and local `/api/client_information_mobile`.
 * Unexpected external hosts fail the request so the suite stays offline.
 */
export async function installMobileApiMocks(page: Page) {
  await page.route('**/*', async (route) => {
    const url = route.request().url();

    // Vite HMR / assets / page documents
    if (isViteAsset(url)) {
      const path = pathOf(url);
      if (
        path.startsWith('/api/') ||
        path.includes('client_information_mobile')
      ) {
        return handleApi(route);
      }
      return route.continue();
    }

    // Mobile defaults to production Vercel API — mock it offline.
    if (
      url.includes('vercel-backend') ||
      url.includes('vercel.app') ||
      url.includes('127.0.0.1:3901') ||
      url.includes('localhost:3901') ||
      url.includes('127.0.0.1:3800') ||
      url.includes('localhost:3800')
    ) {
      return handleApi(route);
    }

    // Fail unexpected external traffic (no silent prod leakage).
    return route.fulfill({
      status: 599,
      contentType: 'application/json',
      body: JSON.stringify({
        detail: `Blocked unexpected external request in cleanup E2E: ${url}`,
      }),
    });
  });
}

export const prerender = false;

import type { APIRoute } from 'astro';
import { getSocialPublicGraph } from '@/lib/social';

const stageMap: Record<string, { label: string; period: string; category: 'learning' | 'career' | 'family' }> = {
  primary: { label: '小学', period: '2006-2012', category: 'learning' },
  middle: { label: '初中', period: '2012-2016', category: 'learning' },
  high: { label: '高中', period: '2016-2019', category: 'learning' },
  tongji: { label: '同济', period: '2019-2023', category: 'learning' },
  zju: { label: '浙大', period: '2024-2026', category: 'learning' },
  work: { label: '工作', period: '2022-Now', category: 'career' },
};

export const GET: APIRoute = async ({ locals }) => {
  const db = locals.runtime.env.BLOG_DB;

  try {
    const friends = await getSocialPublicGraph(db);
    return Response.json({
      ok: true,
      data: {
        stages: Object.entries(stageMap).map(([id, stage]) => ({ id, ...stage })),
        friends: friends.map((friend, index) => ({
          id: `public-${index + 1}`,
          stage_id: friend.stage_id,
          public_label: friend.public_label,
        })),
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '查询失败';
    return Response.json({ ok: false, error: { code: 'DB_ERROR', message } }, { status: 500 });
  }
};

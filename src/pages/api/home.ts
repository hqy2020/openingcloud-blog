export const prerender = false;

import type { APIRoute } from 'astro';
import { getHighlights } from '@/lib/highlights';
import { getSocialPublicGraph } from '@/lib/social';
import { getTimelineNodes } from '@/lib/timeline';
import { getTravelGrouped } from '@/lib/travel';

const socialStages = [
  { id: 'primary', label: '小学', period: '2006-2012', category: 'learning' as const },
  { id: 'middle', label: '初中', period: '2012-2016', category: 'learning' as const },
  { id: 'high', label: '高中', period: '2016-2019', category: 'learning' as const },
  { id: 'tongji', label: '同济', period: '2019-2023', category: 'learning' as const },
  { id: 'zju', label: '浙大', period: '2024-2026', category: 'learning' as const },
  { id: 'work', label: '工作', period: '2022-Now', category: 'career' as const },
];

export const GET: APIRoute = async ({ locals }) => {
  const db = locals.runtime.env.BLOG_DB;

  try {
    const [timelineResult, highlights, travel, socialFriends] = await Promise.all([
      getTimelineNodes(db, { page: 1, pageSize: 500 }),
      getHighlights(db),
      getTravelGrouped(db),
      getSocialPublicGraph(db),
    ]);

    const timeline = [...timelineResult.nodes]
      .sort((a, b) => {
        if (a.start_date === b.start_date) {
          return a.sort_order - b.sort_order;
        }
        return a.start_date.localeCompare(b.start_date);
      })
      .map((node) => ({
        id: node.id,
        title: node.title,
        description: node.description,
        start_date: node.start_date,
        end_date: node.end_date,
        type: node.type,
        impact: node.impact,
      }));

    return Response.json({
      ok: true,
      data: {
        timeline,
        highlights,
        travel,
        social: {
          stages: socialStages,
          friends: socialFriends.map((friend, index) => ({
            id: `public-${index + 1}`,
            stage_id: friend.stage_id,
            public_label: friend.public_label,
          })),
        },
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '查询失败';
    return Response.json({ ok: false, error: { code: 'DB_ERROR', message } }, { status: 500 });
  }
};

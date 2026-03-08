import { Hono } from 'hono';
import { db } from '../db';
import { blogPosts, exhibitions } from '../db/schema';

const route = new Hono();

route.get('/', async (c) => {
  const [posts, ex] = await Promise.all([
    db.select().from(blogPosts).limit(6),
    db.select().from(exhibitions)
  ]);
  return c.json({
    hero: "AILEEN MACHINA — 殖民你的世界观",
    latestWorldview: posts,
    exhibitions: ex,
    voiceAgentConfig: { welcomeScript: "欢迎来到我的机械殖民地..." }
  });
});

export default route;

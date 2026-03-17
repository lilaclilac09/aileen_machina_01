import { Hono } from 'hono';
import { db } from '../db';
import { blogPosts } from '../db/schema';
import { eq } from 'drizzle-orm';   // ←←← 这行必须有！

const route = new Hono();

route.get('/', async (c) => {
  const posts = await db.select().from(blogPosts);
  return c.json(posts);
});

route.get('/:slug', async (c) => {
  const post = await db.select().from(blogPosts).where(eq(blogPosts.slug, c.req.param('slug')));
  return c.json(post[0]);
});

export default route;

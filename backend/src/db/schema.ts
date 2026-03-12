
export const financeAnalyses = pgTable('finance_analyses', {
  id: text('id').primaryKey(),
  ticker: text('ticker').notNull(),
  companyName: text('company_name'),
  bottomSignal: text('bottom_signal'),
  rsi: real('rsi'),
  ma50: real('ma50'),
  ma200: real('ma200'),
  volatility: real('volatility'),
  fundamentals: json('fundamentals'),
  priceData: json('price_data'),
  alertTriggered: integer('alert_triggered').default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

export const blogPosts = pgTable('blog_posts', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  content: text('content'),
  slug: text('slug').unique(),
  voiceScript: text('voice_script'),
  gsapConfig: json('gsap_config'),
  category: text('category'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const exhibitions = pgTable('exhibitions', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  images: json('images'),
  date: text('date'),
  category: text('category'),
});

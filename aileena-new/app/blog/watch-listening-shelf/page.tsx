'use client';

import SubstackShell from '../_substack/SubstackShell';

const PODCAST_RECS = [
  {
    title: 'Fashion Neurosis with Bella Freud',
    label: 'podcast',
    meta: 'Kate Moss episode',
    href: 'https://open.spotify.com/episode/0ZxMxV8EiZ9DkAPJWU0If7',
    body:
      'A velvet couch, fashion as anxiety, and the kind of conversation that makes taste feel less like certainty and more like confession.',
  },
  {
    title: 'Do You Read Her',
    label: 'podcast',
    meta: 'women / reading / voice',
    href: 'https://open.spotify.com/episode/0cx1oBoJEwfaKGVbITcD5K',
    body:
      'A show about how we read the women we love, the women we resist, and the private canon we build around them.',
  },
];

const DOCUMENTARY_RECS = [
  {
    title: 'Joan Didion: The Center Will Not Hold',
    year: '2018',
    label: 'writer / witness',
    href: 'https://www.rottentomatoes.com/m/joan_didion_the_center_will_not_hold',
    image: '/shelf/didion-center.jpg',
    body:
      'Didion as calibration: how to watch a sentence hold together while the world refuses to.',
  },
  {
    title: 'Exhibition on Screen: David Hockney RA',
    year: '2017',
    label: 'exhibition film',
    href: 'https://en.wikipedia.org/wiki/Exhibition_on_Screen',
    image: '/shelf/hockney-ra.jpg',
    body:
      'A studio-eye film: colour, scale, looking slowly, and the pleasure of seeing a picture decide what it wants to be.',
  },
  {
    title: 'A Bigger Splash',
    year: '1973',
    label: 'Hockney / pool',
    href: 'https://en.wikipedia.org/wiki/A_Bigger_Splash_(1973_film)',
    image: '/shelf/bigger-splash.jpg',
    body:
      'Image-making as theatre: pool water, staged intimacy, and the strange flatness that makes Hockney feel alive.',
  },
];

/** Narrative cinema — life-texture, not a Letterboxd dump. Same Watch wall as docs. */
const FILM_RECS = [
  {
    title: 'Blue Is the Warmest Color',
    year: '2013',
    label: 'Léa · intimacy',
    href: 'https://en.wikipedia.org/wiki/Blue_Is_the_Warmest_Colour',
    image: '/shelf/blue-is-the-warmest-color.jpg',
    body: 'Léa early: intimacy, pain, growing up. Honesty in the body — not spectacle.',
  },
  {
    title: 'The French Dispatch',
    year: '2021',
    label: 'magazine life · Léa',
    href: 'https://en.wikipedia.org/wiki/The_French_Dispatch',
    image: '/shelf/french-dispatch.jpg',
    body: 'Fashion magazine, European literary rooms. Layout, short chapters, city as set — life aesthetics you can steal.',
  },
  {
    title: 'Spectre / No Time to Die',
    year: '2015–21',
    label: 'Bond girl arc',
    href: 'https://en.wikipedia.org/wiki/No_Time_to_Die',
    image: '/shelf/spectre.jpg',
    body: 'The Bond-girl line she already likes — restraint, distance, black-and-white emotion. Finish the arc.',
  },
  {
    title: 'The Crown',
    year: 'series',
    label: 'British public life',
    href: 'https://en.wikipedia.org/wiki/The_Crown_(TV_series)',
    image: '/shelf/the-crown.jpg',
    body:
      'British public life: crown, cabinet, marriage, press. Power worn on a body — cold elegance.',
  },
  {
    title: 'The Capture',
    year: 'series',
    label: 'new untrust',
    href: 'https://en.wikipedia.org/wiki/The_Capture_(TV_series)',
    image: '/shelf/the-capture.jpg',
    body:
      'Surveillance, deepfakes, fake evidence. Opposite of The Crown: old-order dignity vs a world you cannot trust.',
  },
  {
    title: 'Bodyguard',
    year: '2018',
    label: 'BBC thriller',
    href: 'https://en.wikipedia.org/wiki/Bodyguard_(British_TV_series)',
    image: '/shelf/bodyguard.jpg',
    body:
      'Protection detail, Westminster, paranoia paced like a thriller — same British-public-life room as The Crown, hotter pulse.',
  },
];

const WATCH_ITEMS = [...DOCUMENTARY_RECS, ...FILM_RECS];

/** 欧洲生活指南 — how to assemble a European life-texture off-screen. */
const EURO_LIFE_GUIDE = [
  {
    title: '城市漫游，不是观光',
    label: '走 / 咖啡馆',
    body:
      '火车站、咖啡桌、招牌、石头上的光。一次一个街区。Before Sunrise 法则：对话大于地标。',
  },
  {
    title: '黑白地看',
    label: '眼 / 构图',
    body:
      '手机就够。练构图与反差。同黑白电影——少颜色，多决定。',
  },
  {
    title: '语言碎片',
    label: '法 / 意',
    body:
      '法语或意大利语听懂大约 20% 对白就够。电影打开，城市也打开。',
  },
  {
    title: '衣橱做成 Bond 冷感',
    label: '剪裁 / 重复',
    body:
      'Léa / 邦女郎线：少颜色、更好剪裁、重复穿着。情绪板大于追趋势。',
  },
  {
    title: '慢博物馆',
    label: '一个展厅',
    body:
      '一个展厅，不是整栋楼。练同欧洲长镜头一样的耐心。',
  },
  {
    title: '餐桌当仪式',
    label: '意 / 法厨房',
    body:
      '橄榄油、番茄、面包、一把好刀。让一顿普通的饭有舞台感——但不表演给任何人看。',
  },
];

/** 生活方式 — practices that turn taste into a week. */
const LIFESTYLE_RECS = [
  {
    title: '城市漂移日记',
    label: '每周',
    body: '走路。记下光、门口、偷听到的句子。不必是「旅行」。',
  },
  {
    title: '一封信或一页拼贴',
    label: '纸',
    body: '实体「拼凑生活感」——每周一页。碎纸、票根、一句留下来的话。',
  },
  {
    title: '原声当房间',
    label: '听',
    body: '爵士、香颂、电影配乐当背景——比算法流行更接近欧洲电影。',
  },
  {
    title: '成对看，不成堆',
    label: '节奏',
    body: '《王冠》看英国公共生活，再看《真相捕捉》或《保镖》——质感大于刷完。',
  },
];

const CHANNEL_RECS = [
  {
    title: 'Asymmetrical Bets',
    label: 'markets / narratives',
    href: 'https://asymmetricalbets.substack.com',
    body:
      'Narrative-driven market reading with enough conviction to be useful and enough taste to stay readable.',
  },
  {
    title: 'SemiAnalysis',
    label: 'semis / AI infrastructure',
    href: 'https://www.semianalysis.com',
    body:
      'The semiconductor and AI-infrastructure shelf: supply chains, chips, clusters, and the bottlenecks underneath the headline.',
  },
];

export default function WatchListeningShelfArticle() {
  return (
    <SubstackShell
      category="Recommendations"
      date="2026.07.12"
      tags="Podcast · Film · European living · Lifestyle"
      title="The Listening and Watching Shelf"
      dek="A small rotation of podcasts, films, 欧洲生活指南, and 生活方式 weekly practices beside the essays — life-texture, not a moodboard dump."
      showNarration={false}
    >
      <main className="recommendation-issue" aria-label="Listening, watching, and living recommendations">
        <section className="rec-issue-note">
          <p className="rec-issue-kicker">fashion police</p>
          <h2>Trendy is obsolete.</h2>
          <p>
            This is where the listening shelf lives now: not mixed into the glass work,
            not glued onto every essay, just its own little issue. The rule is simple:
            if it changes how I hear a sentence, look at an image, assemble a week, or
            read a market, it can sit here.
          </p>
        </section>

        <section className="rec-section" id="podcasts" aria-labelledby="podcast-recs">
          <p className="rec-section-label">listen</p>
          <h2 id="podcast-recs">Podcasts</h2>
          <div className="podcast-rec-grid">
            {PODCAST_RECS.map((item) => (
              <a
                key={item.title}
                className="podcast-rec-card"
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="podcast-card-label">{item.label}</span>
                <span className="podcast-card-title">{item.title}</span>
                <span className="podcast-card-meta">{item.meta}</span>
                <span className="podcast-wave" aria-hidden>
                  {[18, 31, 22, 42, 27, 36, 20, 30, 16].map((height, index) => (
                    <span key={`${height}-${index}`} style={{ height }} />
                  ))}
                </span>
                <span className="podcast-card-body">{item.body}</span>
              </a>
            ))}
          </div>
        </section>

        <section className="rec-section" id="films" aria-labelledby="watch-recs">
          <p className="rec-section-label">watch · listening shelf</p>
          <h2 id="watch-recs">Watch — documentaries & films</h2>
          <p className="rec-section-dek">
            Didion / Hockney for calibration; Léa · Bond · The Crown · The Capture · Bodyguard
            for life-texture — pacing and temperature, not a checklist.
          </p>
          <div className="documentary-rec-wall">
            {WATCH_ITEMS.map((item) => (
              <a
                key={item.title}
                className="documentary-rec-card"
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span
                  className="documentary-rec-image"
                  aria-hidden
                  style={{ backgroundImage: `url("${item.image}")` }}
                />
                <span className="documentary-rec-meta">
                  {item.year} · {item.label}
                </span>
                <span className="documentary-rec-title">{item.title}</span>
                <span className="documentary-rec-body">{item.body}</span>
              </a>
            ))}
          </div>
        </section>

        <section className="rec-section" id="euro-life" aria-labelledby="euro-life-recs">
          <p className="rec-section-label">欧洲生活指南</p>
          <h2 id="euro-life-recs">欧洲生活指南 — European living</h2>
          <p className="rec-section-dek">
            银幕外的欧洲生活质感笔记——走、看、语言、剪裁、博物馆节奏、餐桌仪式。
            从电影里偷方法，不要 cosplay。
          </p>
          <div className="channel-rec-grid">
            {EURO_LIFE_GUIDE.map((item) => (
              <div key={item.title} className="channel-rec-card life-note-card">
                <span className="channel-rec-title">{item.title}</span>
                <span className="channel-rec-label">{item.label}</span>
                <span className="channel-rec-body">{item.body}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="rec-section" id="lifestyle" aria-labelledby="lifestyle-recs">
          <p className="rec-section-label">生活方式</p>
          <h2 id="lifestyle-recs">生活方式 — weekly practices</h2>
          <p className="rec-section-dek">
            把架子变成一周。小重复，胜过长清单。
          </p>
          <div className="channel-rec-grid">
            {LIFESTYLE_RECS.map((item) => (
              <div key={item.title} className="channel-rec-card life-note-card">
                <span className="channel-rec-title">{item.title}</span>
                <span className="channel-rec-label">{item.label}</span>
                <span className="channel-rec-body">{item.body}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="rec-section" id="channels" aria-labelledby="channel-recs">
          <p className="rec-section-label">read next</p>
          <h2 id="channel-recs">Substack Channels</h2>
          <div className="channel-rec-grid">
            {CHANNEL_RECS.map((item) => (
              <a
                key={item.title}
                className="channel-rec-card"
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="channel-rec-title">{item.title}</span>
                <span className="channel-rec-label">{item.label}</span>
                <span className="channel-rec-body">{item.body}</span>
              </a>
            ))}
          </div>
        </section>
      </main>
    </SubstackShell>
  );
}

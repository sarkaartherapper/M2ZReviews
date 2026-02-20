const { Client, Databases, Query } = require('appwrite');

const fallbackOg = 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1400&q=80';

const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, (m) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
}[m]));

const buildNotFoundHtml = (siteUrl, slug) => `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Post Not Found | M2Z Reviews</title>
  <meta name="robots" content="noindex,follow">
  <link rel="canonical" href="${siteUrl}/post/${encodeURIComponent(slug || '')}">
  <link rel="stylesheet" href="/css/style.css">
</head>
<body>
  <main class="layout" style="min-height:60vh;display:grid;place-items:center;">
    <article class="content article" style="max-width:680px;">
      <h1>404 – Post not found</h1>
      <p>The requested article is not available.</p>
      <p><a href="/reviews.html">Browse latest reviews</a></p>
    </article>
  </main>
</body>
</html>`;

exports.handler = async (event) => {
  const slug = event.queryStringParameters?.slug?.trim();
  const siteUrl = (process.env.SITE_URL || 'https://example.com').replace(/\/$/, '');

  if (!slug) {
    return {
      statusCode: 404,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
      body: buildNotFoundHtml(siteUrl, '')
    };
  }

  try {
    const client = new Client()
      .setEndpoint(process.env.APPWRITE_ENDPOINT)
      .setProject(process.env.APPWRITE_PROJECT)
      .setKey(process.env.APPWRITE_API_KEY);

    const databases = new Databases(client);

    const response = await databases.listDocuments(
      process.env.DB_ID,
      process.env.COLLECTION_ID,
      [Query.equal('slug', slug), Query.limit(1)]
    );

    const post = response.documents?.[0];
    if (!post) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
        body: buildNotFoundHtml(siteUrl, slug)
      };
    }

    const title = post.title || 'M2Z Reviews';
    const description = post.description || `Read ${title} on M2Z Reviews.`;
    const heroImage = post.heroImage || post.ogImage || fallbackOg;
    const canonical = `${siteUrl}/post/${encodeURIComponent(post.slug || slug)}`;
    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: title,
      description,
      image: [heroImage],
      datePublished: post.publishDate || post.$createdAt,
      dateModified: post.$updatedAt || post.$createdAt,
      author: { '@type': 'Person', name: post.author || 'M2Z Reviews' },
      publisher: { '@type': 'Organization', name: 'M2Z Reviews' },
      mainEntityOfPage: canonical,
      url: canonical
    };

    const bodyHtml = post.contentHtml || `<p>${escapeHtml(description)}</p>`;

    const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <link rel="canonical" href="${canonical}">
  <meta property="og:type" content="article">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:image" content="${escapeHtml(heroImage)}">
  <meta property="og:url" content="${canonical}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${escapeHtml(heroImage)}">
  <link rel="stylesheet" href="/css/style.css">
  <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
</head>
<body data-page="post" data-slug="${escapeHtml(post.slug || slug)}">
  <header class="site-header"><a class="logo" href="/">M2Z Reviews</a><nav class="nav"><a href="/reviews.html">Reviews</a><a href="/compare.html">Compare</a><a href="/about.html">About</a><button class="theme-toggle" data-theme-toggle>🌙</button></nav></header>
  <main class="layout">
    <article class="content article">
      <p class="meta">Published ${escapeHtml(post.publishDate || '')} • ${escapeHtml(post.readingTime || '')}</p>
      <h1 style="font-size:${Number(post.titleSize) || 32}px;font-weight:${escapeHtml(post.titleWeight || '700')};text-align:${escapeHtml(post.titleAlign || 'left')};">${escapeHtml(title)}</h1>
      <img class="hero-image" src="${escapeHtml(heroImage)}" alt="${escapeHtml(post.heroAlt || `${title} hero image`)}">
      ${bodyHtml}
      <section class="related"><h2>Related posts</h2><div class="posts-grid" data-related-posts></div></section>
    </article>
    <aside class="sidebar"><section class="card"><h3>Latest posts</h3><ul class="list" data-sidebar-latest></ul></section><section class="card"><h3>Trending</h3><ul class="list" data-sidebar-trending></ul></section></aside>
  </main>
  <footer class="site-footer">© 2026 M2Z Reviews.</footer>
  <script src="/js/appwrite-config.js" defer></script>
  <script src="/js/global.js" defer></script>
</body>
</html>`;

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=60, s-maxage=300'
      },
      body: html
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
      body: `<!doctype html><html><head><title>Server Error</title></head><body><h1>Server error</h1><p>${escapeHtml(error.message || 'Unexpected error')}</p></body></html>`
    };
  }
};

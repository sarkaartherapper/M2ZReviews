document.addEventListener("DOMContentLoaded", () => {


  injectAdAreas('home');
  // Dark Mode Toggle
  const toggle = document.getElementById("themeToggle");
  const currentTheme = localStorage.getItem("theme");

  async function injectHomepageAd() {
  const target = document.querySelector('.blocks');
  if (!target) return console.warn('.blocks not found');

  // wait for settings if not loaded
  if (!state.settings) await loadSettings();

  const homeAd = state.settings?.HPAdURL;
  const homeAdRed = state.settings?.HPAdRedURL || "#";
  if (!homeAd) return console.warn('HPAdURL not set in settings');

  const ad = document.createElement('section');
  ad.className = 'ad-area';
  ad.innerHTML = `
    <span class="ad-badge">Advertisement</span>
    <a href="${homeAdRed}" target="_blank" rel="nofollow noopener">
      <img loading="lazy" src="${homeAd}" alt="Sponsored banner advertisement">
    </a>
  `;
  target.parentElement.insertBefore(ad, target);
}


  if (currentTheme === "dark") {
    document.body.classList.add("dark");
  }

  toggle?.addEventListener("click", () => {
    document.body.classList.toggle("dark");

    if (document.body.classList.contains("dark")) {
      localStorage.setItem("theme", "dark");
    } else {
      localStorage.setItem("theme", "light");
    }
  });

  document.addEventListener('DOMContentLoaded', async () => {
  initThemeToggle();
  initHeaderEnhancements();
  injectBreadcrumb();
  setupUtilityUi();

  const settings = await loadSettings(); // load Appwrite settings
  applyGlobalMetaSettings(settings);

  const posts = await loadPosts();
  const page = document.body.dataset.page;

  // Inject homepage hero dynamically
  if (page === 'home') await injectHeroImage();

  if (page === 'home') await initHomepage();
  if (page === 'listing') {
    renderReviewsControls(posts);
    renderList(document.querySelector('[data-sidebar-latest]'), posts.slice(0, 5), { meta: true });
    renderList(document.querySelector('[data-sidebar-trending]'), posts.filter((p) => p.trending).slice(0, 5));
    injectSearch(posts);
  }
  if (page === 'post') await initPostPage();
  if (!['home', 'listing', 'post'].includes(page)) {
    renderList(document.querySelector('[data-sidebar-latest]'), posts.slice(0, 5), { meta: true });
    renderList(document.querySelector('[data-sidebar-trending]'), posts.filter((p) => p.trending).slice(0, 5));
    injectSearch(posts);
  }

  setupPostEnhancements();
  injectAdAreas(page);
  enhanceFooter(posts);
});


  // Load Posts
  fetch("/data/posts.json")
    .then(res => res.json())
    .then(posts => {

      posts.sort((a,b) => new Date(b.date) - new Date(a.date));

      // Featured
      const featured = posts.find(p => p.featured);
      if (featured) {
        const featuredDiv = document.getElementById("featuredPost");
        featuredDiv.innerHTML = `
          <div class="featured-card">
            <img src="${featured.thumbnail}" />
            <div>
              <h3><a href="/posts/${featured.id}.html">${featured.title}</a></h3>
              <p>${featured.description}</p>
            </div>
          </div>
        `;
      }

      // Latest Grid
      const grid = document.getElementById("postGrid");
      posts.forEach(post => {
        const card = document.createElement("div");
        card.className = "post-card";

        card.innerHTML = `
          <img src="${post.thumbnail}" />
          <h3><a href="/posts/${post.id}.html">${post.title}</a></h3>
          <p>${post.description}</p>
        `;

        grid.appendChild(card);
      });

      // Sidebar Latest
      const sidebar = document.getElementById("sidebarPosts");
      posts.slice(0, 5).forEach(post => {
        const li = document.createElement("li");
        li.innerHTML = `<a href="/posts/${post.id}.html">${post.title}</a>`;
        sidebar.appendChild(li);
      });

    });

});

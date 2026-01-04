document.addEventListener('DOMContentLoaded', () => {
    // Smooth scroll animations
    const observerOptions = {
        threshold: 0.2,
        rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    document.querySelectorAll('.role-content, .skill-category').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(50px)';
        el.style.transition = 'all 0.8s ease-out';
        observer.observe(el);
    });

    // Particle parallax removed to avoid cursor 'bubble' movement

    // Avatar coin hover effect (3D flip)
    const avatar = document.querySelector('.avatar');
    const coinContainer = document.querySelector('.coin-container');
    let coinCooldown = false;
    if (avatar && coinContainer) {
        avatar.addEventListener('mouseenter', () => {
            if (coinCooldown) return;
            coinCooldown = true;
            const coins = 10;
            for (let i = 0; i < coins; i++) {
                const coin = document.createElement('div');
                coin.className = 'coin';
                // set a random horizontal travel offset (px) and random duration
                const tx = Math.round((Math.random() - 0.5) * 160); // -80..80
                const dur = 700 + Math.round(Math.random() * 600); // 700..1300ms
                coin.style.setProperty('--tx', `${tx}px`);
                coin.style.setProperty('--dur', `${dur}ms`);
                // center each coin initially
                coin.style.left = '50%';
                coin.style.top = '50%';
                coin.style.animationDelay = `${i * 40}ms`;
                coinContainer.appendChild(coin);
                coin.addEventListener('animationend', () => coin.remove());
            }
            // reset cooldown after a short delay
            setTimeout(() => { coinCooldown = false; }, 600);
        });
    }

    // --- The Accountant Chronicles: Blog + Email simulation ---
    const CHRONICLES_KEY = 'chronicles_posts';
    const postsContainer = document.getElementById('chronicles-posts');
    const simulateForm = document.getElementById('simulate-email-form');
    const simulateToggle = document.getElementById('simulate-toggle');
    const instructionsToggle = document.getElementById('instructions-toggle');
    const instructionsBox = document.getElementById('chronicles-instructions');

    function loadPosts() {
        const posts = JSON.parse(localStorage.getItem(CHRONICLES_KEY) || '[]');
        renderPosts(posts);
    }

    function savePosts(posts) {
        localStorage.setItem(CHRONICLES_KEY, JSON.stringify(posts));
        renderPosts(posts);
    }

    function renderPosts(posts) {
        if (!postsContainer) return;
        postsContainer.innerHTML = '';
        if (!posts.length) {
            postsContainer.innerHTML = '<p class="meta">No posts yet — use the simulate form to add one.</p>';
            return;
        }
        posts.forEach(p => {
            const div = document.createElement('div');
            div.className = 'post';
            const date = new Date(p.date).toLocaleString();
            div.innerHTML = `<h4>${escapeHtml(p.title)}</h4><div class="meta">${date} ${p.from? ' • ' + escapeHtml(p.from):''}</div><div class="content">${escapeHtml(p.content)}</div>`;
            postsContainer.appendChild(div);
        });
    }

    function addPost(post) {
        const posts = JSON.parse(localStorage.getItem(CHRONICLES_KEY) || '[]');
        posts.unshift(post);
        // keep latest 100
        if (posts.length > 100) posts.length = 100;
        savePosts(posts);
    }

    function escapeHtml(str) { return String(str).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }

    simulateToggle && simulateToggle.addEventListener('click', ()=> {
        if (!simulateForm) return;
        simulateForm.style.display = simulateForm.style.display === 'none' ? 'block' : 'none';
    });

    instructionsToggle && instructionsToggle.addEventListener('click', ()=> {
        if (!instructionsBox) return;
        instructionsBox.style.display = instructionsBox.style.display === 'none' ? 'block' : 'none';
    });

    simulateForm && simulateForm.addEventListener('submit', (e)=> {
        e.preventDefault();
        const title = document.getElementById('sim-title').value.trim();
        const content = document.getElementById('sim-content').value.trim();
        const from = document.getElementById('sim-from').value.trim();
        if (!title || !content) return;
        addPost({title, content, from, date: new Date().toISOString()});
        simulateForm.reset();
        simulateForm.style.display = 'none';
    });

    // Optional polling from a remote feed (set your webhook URL here)
    const POSTS_FEED_URL = ''; // e.g. 'https://example.com/chronicles.json'
    async function pollFeed() {
        if (!POSTS_FEED_URL) return;
        try {
            const res = await fetch(POSTS_FEED_URL, {cache: 'no-store'});
            if (!res.ok) return;
            const remote = await res.json();
            // expect remote to be an array of posts {title, content, from, date}
            if (Array.isArray(remote)) {
                const local = JSON.parse(localStorage.getItem(CHRONICLES_KEY) || '[]');
                // merge new posts by date
                const merged = [...remote, ...local];
                // de-duplicate by title+date
                const unique = [];
                const seen = new Set();
                merged.forEach(p => {
                    const key = (p.title||'') + '|' + (p.date||'');
                    if (!seen.has(key)) { seen.add(key); unique.push(p); }
                });
                unique.sort((a,b) => new Date(b.date) - new Date(a.date));
                savePosts(unique);
            }
        } catch (err) {
            console.warn('Chronicles feed error', err);
        }
    }

    // initial load and poll
    loadPosts();
    pollFeed();
    setInterval(pollFeed, 60 * 1000); // poll every minute
});
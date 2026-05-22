document.addEventListener('DOMContentLoaded', () => {
  // ── Safety guard: if GSAP fails to load (CDN down / slow network), bail gracefully ──
  if (typeof gsap === 'undefined') {
    console.warn('GSAP not loaded — animations disabled, content still visible via CSS fallback.');
    return;
  }

  // ── Mobile / reduced-motion detection ──
  const isMobile = window.matchMedia('(max-width: 768px)').matches
                || window.matchMedia('(hover: none) and (pointer: coarse)').matches;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Register GSAP Plugins
  gsap.registerPlugin(ScrollTrigger);


  /* --- Advanced Cursor Animation with GSAP (desktop only) --- */
  if (!isMobile) {
    gsap.set('.cursor-dot', {xPercent: -50, yPercent: -50});
    gsap.set('.cursor-outline', {xPercent: -50, yPercent: -50});

    let xDot = gsap.quickTo('.cursor-dot', "x", {duration: 0.05, ease: "power3"});
    let yDot = gsap.quickTo('.cursor-dot', "y", {duration: 0.05, ease: "power3"});
    
    let xOutline = gsap.quickTo('.cursor-outline', "x", {duration: 0.25, ease: "power3"});
    let yOutline = gsap.quickTo('.cursor-outline', "y", {duration: 0.25, ease: "power3"});

    window.addEventListener('mousemove', e => {
      xDot(e.clientX);
      yDot(e.clientY);
      xOutline(e.clientX);
      yOutline(e.clientY);
    });

    // Cursor Hover Effects
    const interactiveElements = document.querySelectorAll('a, button, .magnetic-area');
    interactiveElements.forEach(el => {
      el.addEventListener('mouseenter', () => {
        document.body.classList.add('cursor-hover');
      });
      el.addEventListener('mouseleave', () => {
        document.body.classList.remove('cursor-hover');
      });
    });
  }

  /* --- Magnetic Elements (desktop only — too costly on mobile) --- */
  if (!isMobile) {
    const magneticAreas = document.querySelectorAll('.magnetic-area');
    
    magneticAreas.forEach(area => {
      const element = area.querySelector('.magnetic-element');
      
      if (element) {
        area.addEventListener('mousemove', (e) => {
          const rect = area.getBoundingClientRect();
          const centerX = rect.left + rect.width / 2;
          const centerY = rect.top + rect.height / 2;
          
          const distanceX = e.clientX - centerX;
          const distanceY = e.clientY - centerY;
          
          gsap.to(element, {
            x: distanceX * 0.3,
            y: distanceY * 0.3,
            duration: 0.4,
            ease: "power2.out"
          });
        });
        
        area.addEventListener('mouseleave', () => {
          gsap.to(element, {
            x: 0,
            y: 0,
            duration: 0.6,
            ease: "elastic.out(1, 0.3)"
          });
        });
      }
    });
  }

  /* --- Dynamic Electric Rays Generation & Scroll Animation --- */
  const generateElectricRays = () => {
    const svgContainer = document.getElementById('svg-container');
    const svg = document.getElementById('connecting-lines');
    if (!svg || !svgContainer) return;

    // On mobile: hide the SVG entirely to save GPU and CPU
    if (isMobile || prefersReducedMotion) {
      svgContainer.style.display = 'none';
      return;
    }

    const docHeight = document.documentElement.scrollHeight;
    const docWidth = document.documentElement.clientWidth;
    
    svgContainer.style.height = `${docHeight}px`;
    svg.setAttribute('viewBox', `0 0 ${docWidth} ${docHeight}`);
    
    svg.innerHTML = '';

    const numRays = 15;
    const baseGridCell = 40;
    
    const allSegments = [];

    for (let r = 0; r < numRays; r++) {
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.classList.add('electric-ray');
      
      const depth = Math.random();
      const gridCell = baseGridCell * (0.6 + depth * 0.6);
      
      path.style.opacity = 0.15 + depth * 0.85;
      path.style.strokeWidth = `${0.5 + depth * 1.5}px`;
      
      const blurAmount = (1 - depth) * 4;
      if (blurAmount > 0.5) {
        path.style.filter = `blur(${blurAmount}px) drop-shadow(0 0 5px #00ffff) drop-shadow(0 0 15px #00aaff)`;
      }

      let currentX = (docWidth / 2) + ((r - Math.floor(numRays/2)) * gridCell * 2.5);
      let currentY = 0;
      let d = `M ${currentX} ${currentY} `;
      
      let prevX = currentX;
      let prevY = currentY;

      let prefDir = (r < numRays / 2) ? -1 : (r > numRays / 2 ? 1 : (Math.random() > 0.5 ? 1 : -1));

      const addSegment = (nx, ny) => {
        allSegments.push({ x1: prevX, y1: prevY, x2: nx, y2: ny, rayId: r, depth: depth });
        prevX = nx;
        prevY = ny;
      };

      while (currentY < docHeight) {
        let downDist = (Math.floor(Math.random() * 4) + 2) * gridCell;
        
        const moveType = Math.random();
        
        if (moveType < 0.3) {
          currentY += downDist;
          d += `L ${currentX} ${currentY} `;
          addSegment(currentX, currentY);
        } else {
          let direction = Math.random() < 0.7 ? prefDir : -prefDir;
          if (currentX < 150) direction = 1;
          if (currentX > docWidth - 150) direction = -1;
          
          if (Math.random() > 0.4) {
            let diagDist = (Math.floor(Math.random() * 3) + 1) * gridCell;
            currentX += diagDist * direction;
            currentY += diagDist;
            d += `L ${currentX} ${currentY} `;
            addSegment(currentX, currentY);

            currentY += downDist;
            d += `L ${currentX} ${currentY} `;
            addSegment(currentX, currentY);
          } else {
            let horizDist = (Math.floor(Math.random() * 4) + 1) * gridCell;
            currentX += horizDist * direction;
            d += `L ${currentX} ${currentY} `;
            addSegment(currentX, currentY);

            currentY += downDist;
            d += `L ${currentX} ${currentY} `;
            addSegment(currentX, currentY);
          }
        }
      }
      
      path.setAttribute('d', d);
      svg.appendChild(path);

      const pathLength = path.getTotalLength();
      path.style.strokeDasharray = pathLength;
      path.style.strokeDashoffset = pathLength;

      gsap.to(path, {
        strokeDashoffset: 0,
        ease: "none",
        scrollTrigger: {
          trigger: "body",
          start: "top top",
          end: "bottom bottom",
          scrub: 0.5 + depth * 2.5
        }
      });
    }

    // --- Calculate Intersections and Add Nodes ---
    const getIntersection = (s1, s2) => {
      const p1 = {x: s1.x1, y: s1.y1}, p2 = {x: s1.x2, y: s1.y2};
      const p3 = {x: s2.x1, y: s2.y1}, p4 = {x: s2.x2, y: s2.y2};
      
      const denominator = (p4.y - p3.y) * (p2.x - p1.x) - (p4.x - p3.x) * (p2.y - p1.y);
      if (denominator === 0) return null;

      const ua = ((p4.x - p3.x) * (p1.y - p3.y) - (p4.y - p3.y) * (p1.x - p3.x)) / denominator;
      const ub = ((p2.x - p1.x) * (p1.y - p3.y) - (p2.y - p1.y) * (p1.x - p3.x)) / denominator;
      
      if (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1) {
        return {
          x: p1.x + ua * (p2.x - p1.x),
          y: p1.y + ua * (p2.y - p1.y)
        };
      }
      return null;
    };

    const intersections = [];
    for (let i = 0; i < allSegments.length; i++) {
      for (let j = i + 1; j < allSegments.length; j++) {
        const seg1 = allSegments[i];
        const seg2 = allSegments[j];
        
        if (seg1.rayId === seg2.rayId) continue;
        
        const x1Min = Math.min(seg1.x1, seg1.x2), x1Max = Math.max(seg1.x1, seg1.x2);
        const y1Min = Math.min(seg1.y1, seg1.y2), y1Max = Math.max(seg1.y1, seg1.y2);
        const x2Min = Math.min(seg2.x1, seg2.x2), x2Max = Math.max(seg2.x1, seg2.x2);
        const y2Min = Math.min(seg2.y1, seg2.y2), y2Max = Math.max(seg2.y1, seg2.y2);
        
        if (x1Max < x2Min || x1Min > x2Max || y1Max < y2Min || y1Min > y2Max) continue;

        const pt = getIntersection(seg1, seg2);
        if (pt) {
          const maxDepth = Math.max(seg1.depth, seg2.depth);
          if (maxDepth > 0.4) {
            intersections.push({ x: pt.x, y: pt.y, depth: maxDepth });
          }
        }
      }
    }

    intersections.forEach(pt => {
      const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
      
      const outer = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      outer.setAttribute('cx', pt.x);
      outer.setAttribute('cy', pt.y);
      outer.setAttribute('r', '6');
      outer.setAttribute('fill', 'transparent');
      outer.setAttribute('stroke', '#00ffff');
      outer.setAttribute('stroke-width', '1.5');
      
      const inner = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      inner.setAttribute('cx', pt.x);
      inner.setAttribute('cy', pt.y);
      inner.setAttribute('r', '2.5');
      inner.setAttribute('fill', '#00ffff');

      g.appendChild(outer);
      g.appendChild(inner);
      
      g.style.opacity = 0;
      
      svg.appendChild(g);

      gsap.set(g, { scale: 0, transformOrigin: `${pt.x}px ${pt.y}px` });
      gsap.to(g, {
        scale: 1,
        opacity: 0.2 + pt.depth * 0.8,
        duration: 0.15,
        ease: "power1.out",
        scrollTrigger: {
          trigger: "body",
          start: `top+=${pt.y - window.innerHeight * 0.6} top`,
          toggleActions: "play reverse play reverse"
        }
      });
    });
  };

  // Generate rays on page load
  generateElectricRays();

  window.addEventListener('resize', () => {
    clearTimeout(window.resizeTimer);
    window.resizeTimer = setTimeout(() => {
      ScrollTrigger.getAll().forEach(t => t.kill());
      generateElectricRays();
      ScrollTrigger.refresh();
    }, 200);
  });

  /* ─────────────────────────────────────────────────────────────────
     Scroll-reveal animations — desktop only.
     On mobile, CSS already shows all content via opacity:1 overrides,
     so no ScrollTriggers are needed and we save significant CPU/memory.
  ───────────────────────────────────────────────────────────────── */
  if (!isMobile) {

    /* --- Hero Typography Stagger --- */
    gsap.fromTo('.stagger-text', 
      { opacity: 0, y: 30 },
      {
        opacity: 1,
        y: 0,
        duration: 1,
        stagger: 0.2,
        ease: "power3.out",
        delay: 0.3
      }
    );

    /* --- Section Titles --- */
    gsap.utils.toArray('.section-title').forEach(title => {
      gsap.fromTo(title,
        { opacity: 0, y: 30 },
        {
          opacity: 0.9,
          y: 0,
          duration: 1,
          ease: 'power3.out',
          scrollTrigger: { trigger: title, start: 'top 88%' }
        }
      );
    });

    /* --- Skills --- */
    gsap.utils.toArray('.skill-category').forEach(cat => {
      const h3 = cat.querySelector('h3');
      const pills = cat.querySelectorAll('.skill-list li');

      if (h3) {
        gsap.fromTo(h3,
          { opacity: 0, y: 25 },
          {
            opacity: 1, y: 0,
            duration: 0.7,
            ease: 'power3.out',
            scrollTrigger: { trigger: cat, start: 'top 85%' }
          }
        );
      }

      gsap.fromTo(pills,
        { opacity: 0, y: 20, scale: 0.88 },
        {
          opacity: 1, y: 0, scale: 1,
          duration: 0.5,
          stagger: 0.07,
          ease: 'back.out(1.6)',
          scrollTrigger: { trigger: cat, start: 'top 82%' }
        }
      );
    });

    /* --- Timeline --- */
    const timelineItems = gsap.utils.toArray('.timeline-item');
    timelineItems.forEach((item, i) => {
      gsap.fromTo(item,
        { opacity: 0, x: -50 },
        {
          opacity: 1, x: 0,
          duration: 0.7,
          delay: i * 0.1,
          ease: 'power3.out',
          scrollTrigger: { trigger: item, start: 'top 88%' }
        }
      );

      const dot = item.querySelector('.timeline-dot');
      if (dot) {
        gsap.fromTo(dot,
          { scale: 0, opacity: 0 },
          {
            scale: 1, opacity: 1,
            duration: 0.4,
            delay: i * 0.1 + 0.3,
            ease: 'back.out(3)',
            scrollTrigger: { trigger: item, start: 'top 88%' }
          }
        );
      }

      const h3 = item.querySelector('.timeline-content h3');
      const p = item.querySelector('.timeline-content p');
      const date = item.querySelector('.timeline-date');
      [h3, p, date].forEach((el, j) => {
        if (!el) return;
        gsap.fromTo(el,
          { opacity: 0, y: 15 },
          {
            opacity: 1, y: 0,
            duration: 0.6,
            delay: i * 0.1 + 0.25 + j * 0.1,
            ease: 'power2.out',
            scrollTrigger: { trigger: item, start: 'top 88%' }
          }
        );
      });
    });

    /* --- Project Cards --- */
    gsap.utils.toArray('.project-card').forEach((card, i) => {
      gsap.fromTo(card,
        { opacity: 0, y: 50, scale: 0.96 },
        {
          opacity: 1, y: 0, scale: 1,
          duration: 0.8,
          delay: i * 0.15,
          ease: 'power3.out',
          scrollTrigger: { trigger: card, start: 'top 88%' }
        }
      );

      const infoEls = card.querySelectorAll('.project-info h3, .project-info p, .project-info a');
      gsap.fromTo(infoEls,
        { opacity: 0, y: 18 },
        {
          opacity: 1, y: 0,
          duration: 0.55,
          stagger: 0.1,
          delay: i * 0.15 + 0.3,
          ease: 'power2.out',
          scrollTrigger: { trigger: card, start: 'top 88%' }
        }
      );
    });

    /* --- Floating Code Pad --- */
    const floatingPad = document.getElementById('floating-pad');
    if (floatingPad) {
      gsap.fromTo(floatingPad,
        { opacity: 0, y: 60, scale: 0.95 },
        {
          opacity: 1, y: 0, scale: 1,
          duration: 1,
          ease: 'power3.out',
          scrollTrigger: { trigger: floatingPad, start: 'top 88%' }
        }
      );
    }

    /* --- Footer --- */
    const footerH2 = document.querySelector('.footer-brand h2');
    if (footerH2) {
      gsap.fromTo(footerH2,
        { opacity: 0, y: 30 },
        {
          opacity: 1, y: 0,
          duration: 0.9,
          ease: 'power3.out',
          scrollTrigger: { trigger: footerH2, start: 'top 90%' }
        }
      );
    }

    gsap.utils.toArray('.contact-box').forEach((box, i) => {
      gsap.fromTo(box,
        { opacity: 0, x: -35 },
        {
          opacity: 1, x: 0,
          duration: 0.65,
          delay: i * 0.12,
          ease: 'power3.out',
          scrollTrigger: { trigger: box, start: 'top 92%' }
        }
      );
    });

    gsap.utils.toArray('.social-link').forEach((link, i) => {
      gsap.fromTo(link,
        { opacity: 0, scale: 0.5 },
        {
          opacity: 1, scale: 1,
          duration: 0.5,
          delay: i * 0.1,
          ease: 'back.out(2)',
          scrollTrigger: { trigger: link, start: 'top 95%' }
        }
      );
    });

    /* --- Certificates --- */
    const certSection = document.getElementById('certificates');
    if (certSection) {
      const certCards = certSection.querySelectorAll('.project-card');
      gsap.fromTo(certCards,
        { opacity: 0, y: 40, scale: 0.95 },
        {
          opacity: 1, y: 0, scale: 1,
          duration: 0.65,
          stagger: 0.12,
          ease: 'power3.out',
          scrollTrigger: { trigger: certSection, start: 'top 80%' }
        }
      );

      const certH3s = certSection.querySelectorAll('h3, a');
      gsap.fromTo(certH3s,
        { opacity: 0, y: 14 },
        {
          opacity: 1, y: 0,
          duration: 0.5,
          stagger: 0.08,
          delay: 0.3,
          ease: 'power2.out',
          scrollTrigger: { trigger: certSection, start: 'top 80%' }
        }
      );
    }

    /* --- Wishes Section Text --- */
    const wishesTextEl = document.querySelector('.wishes-text');
    if (wishesTextEl) {
      gsap.fromTo(wishesTextEl,
        { opacity: 0, y: 30 },
        {
          opacity: 1, y: 0,
          duration: 1.1,
          ease: 'power3.out',
          scrollTrigger: { trigger: wishesTextEl, start: 'top 85%' }
        }
      );
    }

    /* --- Footer Bottom --- */
    const footerBottom = document.querySelector('.footer-bottom');
    if (footerBottom) {
      gsap.fromTo(footerBottom,
        { opacity: 0, y: 15 },
        {
          opacity: 1, y: 0,
          duration: 0.7,
          ease: 'power2.out',
          scrollTrigger: { trigger: footerBottom, start: 'top 98%' }
        }
      );
    }

  } /* end if (!isMobile) scroll-reveal block */



  /* --- Parallax for Project Cards (desktop only) --- */
  if (!isMobile && !prefersReducedMotion) {
    gsap.utils.toArray('.parallax-element').forEach(el => {
      gsap.to(el, {
        yPercent: -15,
        ease: "none",
        scrollTrigger: {
          trigger: el,
          start: "top bottom",
          end: "bottom top",
          scrub: true
        }
      });
    });
  }

  /* ─────────────────────────────────────────────────────────────
     GitHub Live Repos — fetches public repos, renders cards,
     then runs the GSAP stagger reveal.
  ───────────────────────────────────────────────────────────── */
  const GITHUB_USER = 'shloook';

  // Language → { gradient, badgeClass }
  const langConfig = {
    'JavaScript':  { gradient: 'linear-gradient(135deg,#090909,#1a0533,#090909)',  badge: 'js'     },
    'TypeScript':  { gradient: 'linear-gradient(135deg,#0f0c29,#302b63,#24243e)',  badge: 'ts'     },
    'Python':      { gradient: 'linear-gradient(135deg,#200122,#6f0000,#200122)',  badge: 'python' },
    'Dart':        { gradient: 'linear-gradient(135deg,#0f2027,#203a43,#2c5364)',  badge: 'dart'   },
    'Java':        { gradient: 'linear-gradient(135deg,#134e5e,#71b280)',           badge: 'java'   },
    'CSS':         { gradient: 'linear-gradient(135deg,#232526,#414345)',           badge: 'css'    },
    'HTML':        { gradient: 'linear-gradient(135deg,#e44d26,#f16529,#1a1a1a)',  badge: 'js'     },
    'Rust':        { gradient: 'linear-gradient(135deg,#2c1810,#8a3b1b,#2c1810)',  badge: 'js'     },
    'default':     { gradient: 'linear-gradient(135deg,#1a1a1a,#2d2d2d)',          badge: 'js'     },
  };

  const makeLangBadge = (lang) => {
    if (!lang) return '<span class="lang-badge css" style="background:rgba(255,255,255,0.08);color:rgba(255,255,255,0.45);border-color:rgba(255,255,255,0.12)">Misc</span>';
    const cfg = langConfig[lang] || langConfig['default'];
    return `<span class="lang-badge ${cfg.badge}">${lang}</span>`;
  };

  const makeGradient = (lang) =>
    (langConfig[lang] || langConfig['default']).gradient;

  const buildCard = (repo) => {
    const stars   = repo.stargazers_count || 0;
    const desc    = repo.description
      ? repo.description.slice(0, 120) + (repo.description.length > 120 ? '…' : '')
      : 'No description provided.';
    const title   = repo.name.replace(/[-_]/g, ' ');
    const lang    = repo.language;
    const gradient = makeGradient(lang);

    const card = document.createElement('div');
    card.className = 'project-card-h';
    card.style.cssText = 'opacity:0;transform:translateY(40px);';
    card.innerHTML = `
      <div class="project-card-h-header" style="background:${gradient};">
        ${makeLangBadge(lang)}
        <span class="star-badge">★ ${stars}</span>
      </div>
      <div class="project-card-h-body">
        <h3>${title}</h3>
        <p>${desc}</p>
        <a href="${repo.html_url}" target="_blank" rel="noopener" class="gh-link">View on GitHub ↗</a>
      </div>`;
    return card;
  };

  const fetchGitHubRepos = async () => {
    const track   = document.getElementById('projectsTrack');
    const loading = document.getElementById('gh-loading');
    if (!track) return;

    try {
      // Fetch all non-fork repos, sorted by stars (100 max)
      const res  = await fetch(
        `https://api.github.com/users/${GITHUB_USER}/repos?sort=stars&direction=desc&per_page=100`
      );
      if (!res.ok) throw new Error(`GitHub API: ${res.status}`);
      const repos = await res.json();

      const filtered = repos.filter(r => !r.fork);

      if (loading) loading.remove();

      if (filtered.length === 0) {
        track.innerHTML = `
          <div class="gh-error">
            <i class="ri-github-fill"></i>
            <span>No public repositories found.</span>
            <a href="https://github.com/${GITHUB_USER}" target="_blank" rel="noopener">
              Visit GitHub Profile ↗
            </a>
          </div>`;
        return;
      }

      filtered.forEach(repo => track.appendChild(buildCard(repo)));

      // GSAP stagger reveal after DOM is ready
      gsap.fromTo(track.querySelectorAll('.project-card-h'),
        { opacity: 0, y: 40 },
        {
          opacity: 1, y: 0,
          duration: 0.6,
          stagger: 0.07,
          ease: 'power3.out',
          scrollTrigger: { trigger: '#projectsTrack', start: 'top 88%' }
        }
      );
      ScrollTrigger.refresh();

    } catch (err) {
      console.warn('GitHub fetch failed:', err);
      if (loading) loading.remove();
      track.innerHTML = `
        <div class="gh-error">
          <i class="ri-wifi-off-line"></i>
          <span>Couldn't load repositories right now.<br>
            Check your connection or view them directly on GitHub.
          </span>
          <a href="https://github.com/${GITHUB_USER}" target="_blank" rel="noopener">
            github.com/${GITHUB_USER} ↗
          </a>
        </div>`;
    }
  };

  fetchGitHubRepos();

  /* --- Drag-to-scroll for projects track --- */
  const projectsTrack = document.getElementById('projectsTrack');
  if (projectsTrack) {
    let isDragging = false, startX = 0, scrollStart = 0;
    projectsTrack.addEventListener('mousedown', e => {
      isDragging = true;
      startX = e.pageX - projectsTrack.offsetLeft;
      scrollStart = projectsTrack.scrollLeft;
      projectsTrack.classList.add('dragging');
    });
    document.addEventListener('mouseup', () => {
      isDragging = false;
      projectsTrack.classList.remove('dragging');
    });
    projectsTrack.addEventListener('mousemove', e => {
      if (!isDragging) return;
      e.preventDefault();
      const x = e.pageX - projectsTrack.offsetLeft;
      projectsTrack.scrollLeft = scrollStart - (x - startX);
    });
    /* Arrow buttons */
    const SCROLL_BY = 340;
    document.getElementById('scrollLeft').addEventListener('click', () => {
      projectsTrack.scrollBy({ left: -SCROLL_BY, behavior: 'smooth' });
    });
    document.getElementById('scrollRight').addEventListener('click', () => {
      projectsTrack.scrollBy({ left: SCROLL_BY, behavior: 'smooth' });
    });
  }



  /* --- Interactive Text Reveal for Wishes Section (Line by Line) --- */
  const wishesText = document.getElementById('wishes-text');
  if (wishesText) {
    const textContent = wishesText.innerText;
    wishesText.innerHTML = '';
    const words = textContent.split(' ');
    const spans = [];
    
    words.forEach(word => {
      const span = document.createElement('span');
      span.innerText = word;
      span.style.transition = 'color 0.15s ease';
      wishesText.appendChild(span);
      wishesText.appendChild(document.createTextNode(' '));
      spans.push(span);
    });

    wishesText.addEventListener('mousemove', (e) => {
      let hoveredIndex = -1;
      
      for (let i = 0; i < spans.length; i++) {
        const rect = spans[i].getBoundingClientRect();
        
        if (e.clientY > rect.bottom) {
          hoveredIndex = i;
        } 
        else if (e.clientY >= rect.top && e.clientY <= rect.bottom) {
          if (e.clientX >= rect.left) {
            hoveredIndex = i;
          }
        }
      }
      
      spans.forEach((span, i) => {
        if (i <= hoveredIndex) {
          span.style.color = '#ff8c00';
        } else {
          span.style.color = 'var(--text-primary)';
        }
      });
    });

    wishesText.addEventListener('mouseleave', () => {
      spans.forEach(span => {
        span.style.color = 'var(--text-primary)';
      });
    });
  }

  /* --- Copy to Clipboard for Contact Buttons --- */
  document.querySelectorAll('.action-btn[data-copy]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const text = btn.getAttribute('data-copy');
      try {
        await navigator.clipboard.writeText(text);
        const tooltip = btn.querySelector('.action-tooltip');
        const icon = btn.querySelector('i');
        const origText = tooltip.textContent;
        const origIcon = icon.className;
        
        tooltip.textContent = 'Copied!';
        icon.className = 'ri-check-line';
        btn.classList.add('copied');
        
        setTimeout(() => {
          tooltip.textContent = origText;
          icon.className = origIcon;
          btn.classList.remove('copied');
        }, 1500);
      } catch (err) {
        console.error('Copy failed', err);
      }
    });
  });
});

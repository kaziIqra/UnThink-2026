const root = document.documentElement;
root.classList.add('dark');

const canUseGsapScroll = Boolean(window.gsap && window.ScrollTrigger);
const forceFallbackReveal = true;
const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isMobileViewport = window.matchMedia('(max-width: 900px)').matches;

function initCardTiltInteraction() {
  if (isReducedMotion || isMobileViewport) return;

  const cards = document.querySelectorAll('.glass-card, .timeline-item, #prizes .rounded-xl, #faq details, .register-action-card');
  cards.forEach((card) => {
    card.classList.add('tilt-card-3d');
    card.style.position = card.style.position || 'relative';

    const onMove = (event) => {
      const rect = card.getBoundingClientRect();
      const px = (event.clientX - rect.left) / rect.width;
      const py = (event.clientY - rect.top) / rect.height;
      const rotY = (px - 0.5) * 12;
      const rotX = (0.5 - py) * 10;

      card.style.setProperty('--mx', `${Math.round(px * 100)}%`);
      card.style.setProperty('--my', `${Math.round(py * 100)}%`);
      card.style.transform = `perspective(1000px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg) translateY(-2px)`;
      card.style.boxShadow = '0 20px 36px rgba(2, 10, 22, 0.35)';
      card.classList.add('is-hovered');
    };

    const onLeave = () => {
      card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg)';
      card.style.boxShadow = '';
      card.classList.remove('is-hovered');
    };

    card.addEventListener('mousemove', onMove, { passive: true });
    card.addEventListener('mouseleave', onLeave);
  });
}

function initThreeHeroScene() {
  if (isReducedMotion || isMobileViewport || !window.THREE) return;

  const canvas = document.getElementById('webglHero');
  const hero = document.querySelector('.hero-shell');
  if (!canvas || !hero) return;

  let scene;
  let camera;
  let renderer;
  let orb;
  let particleCloud;
  let animationFrameId = 0;
  const mouseTarget = { x: 0, y: 0 };

  const init = () => {
    try {
    const width = hero.clientWidth;
    const height = hero.clientHeight;

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(48, width / height, 0.1, 120);
    camera.position.set(0, 0.2, 6.8);

    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const hemi = new THREE.HemisphereLight(0x9fd6ff, 0x0a1f33, 0.8);
    scene.add(hemi);

    const keyLight = new THREE.DirectionalLight(0x9fd6ff, 1.1);
    keyLight.position.set(3, 4, 4);
    keyLight.castShadow = true;
    keyLight.shadow.blurSamples = 8;
    keyLight.shadow.mapSize.set(1024, 1024);
    scene.add(keyLight);

    const rimLight = new THREE.PointLight(0x35c6d6, 1.05, 16, 2);
    rimLight.position.set(-2.2, -0.8, 3.6);
    scene.add(rimLight);

    const geometry = new THREE.IcosahedronGeometry(1.2, 18);
    const material = new THREE.MeshPhysicalMaterial({
      color: 0x84cbff,
      roughness: 0.16,
      metalness: 0.55,
      clearcoat: 0.6,
      clearcoatRoughness: 0.2,
      reflectivity: 0.8,
      transmission: 0.02
    });

    orb = new THREE.Mesh(geometry, material);
    orb.castShadow = true;
    orb.receiveShadow = true;
    scene.add(orb);

    const particles = new THREE.BufferGeometry();
    const particleCount = 420;
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i += 1) {
      const radius = 3.2 + Math.random() * 1.8;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.cos(phi);
      positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
    }
    particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particleMaterial = new THREE.PointsMaterial({ color: 0xaadfff, size: 0.03, transparent: true, opacity: 0.5 });
    particleCloud = new THREE.Points(particles, particleMaterial);
    scene.add(particleCloud);

    const onResize = () => {
      const w = hero.clientWidth;
      const h = hero.clientHeight;
      if (!renderer || !camera) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const onMouseMove = (event) => {
      const rect = hero.getBoundingClientRect();
      mouseTarget.x = ((event.clientX - rect.left) / rect.width - 0.5) * 0.9;
      mouseTarget.y = ((event.clientY - rect.top) / rect.height - 0.5) * 0.7;
    };

    hero.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });

    const renderLoop = () => {
      animationFrameId = requestAnimationFrame(renderLoop);
      const t = performance.now() * 0.001;

      orb.rotation.x += 0.0022;
      orb.rotation.y += 0.0033;
      orb.position.x += (mouseTarget.x - orb.position.x) * 0.04;
      orb.position.y += (-mouseTarget.y - orb.position.y) * 0.04;
      orb.position.z = Math.sin(t * 0.75) * 0.14;

      particleCloud.rotation.y += 0.0009;
      particleCloud.rotation.x = Math.sin(t * 0.35) * 0.08;
      renderer.render(scene, camera);
    };

    renderLoop();

    document.addEventListener('visibilitychange', () => {
      if (document.hidden && animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      } else if (!document.hidden && renderer) {
        renderLoop();
      }
    });
    } catch (error) {
      console.error('WebGL hero init failed:', error);
      canvas.style.display = 'none';
    }
  };

  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(init, { timeout: 1500 });
  } else {
    setTimeout(init, 120);
  }
}

function initHeroSceneWhenVisible() {
  if (isReducedMotion || isMobileViewport) return;
  const hero = document.querySelector('.hero-shell');
  if (!hero) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          initThreeHeroScene();
          observer.disconnect();
        }
      });
    },
    { rootMargin: '180px 0px' }
  );

  observer.observe(hero);
}

const cursorGlow = document.getElementById('cursorGlow');
if (cursorGlow && window.matchMedia('(pointer:fine)').matches) {
  window.addEventListener('mousemove', (event) => {
    cursorGlow.style.opacity = '1';
    cursorGlow.style.left = `${event.clientX}px`;
    cursorGlow.style.top = `${event.clientY}px`;
  });

  window.addEventListener('mouseleave', () => {
    cursorGlow.style.opacity = '0';
  });
}

const menuBtn = document.getElementById('menuBtn');
const mobileNav = document.getElementById('mobileNav');
if (menuBtn && mobileNav) {
  const closeMobileMenu = () => {
    mobileNav.classList.add('hidden');
    menuBtn.setAttribute('aria-expanded', 'false');
  };

  menuBtn.addEventListener('click', () => {
    mobileNav.classList.toggle('hidden');
    const expanded = !mobileNav.classList.contains('hidden');
    menuBtn.setAttribute('aria-expanded', String(expanded));
  });

  document.querySelectorAll('.mobile-link').forEach((link) => {
    link.addEventListener('click', closeMobileMenu);
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth >= 768) closeMobileMenu();
  });

  document.addEventListener('click', (event) => {
    const clickedInsideMenu = mobileNav.contains(event.target);
    const clickedMenuButton = menuBtn.contains(event.target);
    if (!clickedInsideMenu && !clickedMenuButton) closeMobileMenu();
  });
}

const countdownDate = new Date('2026-03-31T23:59:59+05:30').getTime();
const daysEl = document.getElementById('days');
const hoursEl = document.getElementById('hours');
const minutesEl = document.getElementById('minutes');
const secondsEl = document.getElementById('seconds');

if (daysEl && hoursEl && minutesEl && secondsEl) {
  const updateCountdown = () => {
    const now = Date.now();
    const distance = countdownDate - now;

    if (distance <= 0) {
      daysEl.textContent = '00';
      hoursEl.textContent = '00';
      minutesEl.textContent = '00';
      secondsEl.textContent = '00';
      return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    daysEl.textContent = String(days).padStart(2, '0');
    hoursEl.textContent = String(hours).padStart(2, '0');
    minutesEl.textContent = String(minutes).padStart(2, '0');
    secondsEl.textContent = String(seconds).padStart(2, '0');
  };

  updateCountdown();
  setInterval(updateCountdown, 1000);
}

const timelineItems = document.querySelectorAll('.timeline-item');
if (timelineItems.length && !canUseGsapScroll) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('show');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.2 }
  );

  timelineItems.forEach((item) => observer.observe(item));
}

const revealItems = document.querySelectorAll('.reveal-up');
if (revealItems.length && !canUseGsapScroll) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('show');
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  revealItems.forEach((item) => revealObserver.observe(item));
}

if (!canUseGsapScroll || forceFallbackReveal) {
  const fallbackTargets = document.querySelectorAll(
    '#about .section-shell, #timeline .section-shell, #register .section-shell, #prizes .section-shell, #faq .section-shell, #contact .section-shell, #prizes .rounded-xl, #faq details, .glass-card'
  );

  if (fallbackTargets.length) {
    fallbackTargets.forEach((element) => element.classList.add('io-reveal'));

    const fallbackObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('show');
            fallbackObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.14 }
    );

    fallbackTargets.forEach((element, index) => {
      element.style.transitionDelay = `${Math.min(index * 35, 220)}ms`;
      fallbackObserver.observe(element);
    });
  }
}

const teamNameEl = document.getElementById('teamNameDisplay');
const statusEl = document.getElementById('teamStatus');
if (teamNameEl && statusEl) {
  const params = new URLSearchParams(window.location.search);
  const team = params.get('team') || 'VisionSpark';
  const status = params.get('status') || 'Shortlisted for Final Round';
  teamNameEl.textContent = team;
  statusEl.textContent = status;
}

const adminStats = document.getElementById('adminStats');
if (adminStats) {
  const stats = [
    { label: 'Total Registrations', value: '312' },
    { label: 'Shortlisted Teams', value: '50' },
    { label: 'Pending Reviews', value: '87' },
    { label: 'Payment Verified', value: '279' }
  ];

  adminStats.innerHTML = stats
    .map(
      ({ label, value }) => `
      <article class="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <p class="text-sm text-slate-500 dark:text-slate-400">${label}</p>
        <p class="mt-1 text-3xl font-black text-primary dark:text-white">${value}</p>
      </article>`
    )
    .join('');
}

  initCardTiltInteraction();
  initHeroSceneWhenVisible();

(function () {
  if (!canUseGsapScroll) return;

  const prefersReducedMotion = isReducedMotion;
  if (prefersReducedMotion) return;

  gsap.registerPlugin(ScrollTrigger);

  const $ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));
  const header = document.querySelector('header');
  const headerOffset = () => (header ? header.offsetHeight : 0);

  function initHeroIntro() {
    const hero = document.querySelector('.hero-shell');
    if (!hero) return;

    const introTimeline = gsap.timeline({ defaults: { ease: 'power3.out' } });

    introTimeline
      .from(header, { y: -28, duration: 0.6 }, 0)
      .from('.hero-title', { y: 38, duration: 0.85 }, 0.08)
      .from('.hero-shell p', { y: 26, duration: 0.7, stagger: 0.05 }, 0.2)
      .from('.hero-shell .cta-primary, .hero-shell a[href="#timeline"]', { y: 18, duration: 0.55, stagger: 0.09 }, 0.35)
      .from('#countdown > div', { y: 18, duration: 0.45, stagger: 0.06 }, 0.45);
  }

  function initSmoothScrolling() {
    $("a[href^='#']").forEach((link) => {
      link.addEventListener('click', (event) => {
        const href = link.getAttribute('href');
        if (!href || href.length < 2) return;

        const target = document.querySelector(href);
        if (!target) return;

        event.preventDefault();
        const y = target.getBoundingClientRect().top + window.pageYOffset - headerOffset() - 8;
        window.scrollTo({ top: y, behavior: 'smooth' });
      });
    });
  }

  function initParallaxLayers() {
    const hero = document.querySelector('.hero-shell');
    if (!hero) return;

    gsap.to('.parallax-layer.layer-a', {
      yPercent: -12,
      ease: 'none',
      scrollTrigger: {
        trigger: hero,
        start: 'top top',
        end: 'bottom top',
        scrub: 0.7
      }
    });

    gsap.to('.parallax-layer.layer-b', {
      yPercent: -20,
      xPercent: 4,
      ease: 'none',
      scrollTrigger: {
        trigger: hero,
        start: 'top top',
        end: 'bottom top',
        scrub: 0.9
      }
    });

    gsap.to('.parallax-layer.layer-c', {
      yPercent: -8,
      ease: 'none',
      scrollTrigger: {
        trigger: hero,
        start: 'top top',
        end: 'bottom top',
        scrub: 0.6
      }
    });
  }

  function initSectionReveal() {
    const sectionTargets = $(
      '#about .section-shell, #timeline .section-shell, #prizes .section-shell, #register .section-shell, #faq .section-shell, #sponsors .section-shell'
    );

    sectionTargets.forEach((section, index) => {
      gsap.fromTo(
        section,
        {
          y: 56,
          clipPath: 'inset(0% 0% 28% 0% round 20px)'
        },
        {
          y: 0,
          clipPath: 'inset(0% 0% 0% 0% round 20px)',
          z: 0,
          duration: 1,
          immediateRender: false,
          ease: 'power4.out',
          scrollTrigger: {
            trigger: section,
            start: `top ${84 - Math.min(index * 2, 8)}%`,
            toggleActions: 'play none none reverse'
          }
        }
      );
    });
  }

  function initGenericReveal() {
    const candidates = $('.reveal-up, .glass-card, #faq details, #prizes .rounded-xl, #register .cta-primary');
    const grouped = new Map();

    candidates.forEach((el, index) => {
      if (el.closest('#timeline')) return;

      const key = el.closest('section')?.id || 'default';
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key).push({ el, index });
    });

    grouped.forEach((items) => {
      items.forEach(({ el, index }, localIndex) => {
        let effect = 'up';
        if (el.classList.contains('glass-card')) effect = index % 2 === 0 ? 'left' : 'right';
        if (el.matches('#faq details')) effect = index % 2 === 0 ? 'left' : 'right';

        const fromVars = {
          fade: { z: -60 },
          up: { y: 30, z: -50 },
          left: { x: -40, y: 12, z: -60 },
          right: { x: 40, y: 12, z: -60 }
        }[effect];

        gsap.fromTo(
          el,
          fromVars,
          {
            x: 0,
            y: 0,
            z: 0,
            duration: 0.78,
            delay: localIndex * 0.04,
            immediateRender: false,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: el,
              start: 'top 88%',
              toggleActions: 'play none none reverse'
            }
          }
        );
      });
    });
  }

  function initTimelineAnimation() {
    const timelineLine = document.querySelector('.timeline-line');
    const items = $('.timeline-item');

    if (timelineLine) {
      gsap.to(timelineLine, {
        '--timeline-progress': 1,
        ease: 'none',
        scrollTrigger: {
          trigger: timelineLine,
          start: 'top 78%',
          end: 'bottom 30%',
          scrub: 0.9
        }
      });
    }

    items.forEach((item, index) => {
      const fromX = index % 2 === 0 ? -70 : 70;

      gsap.fromTo(
        item,
        { x: fromX, y: 24, scale: 0.97 },
        {
          x: 0,
          y: 0,
          z: 0,
          scale: 1,
          duration: 0.9,
          immediateRender: false,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: item,
            start: 'top 84%',
            end: 'bottom 65%',
            toggleActions: 'play none none reverse',
            onEnter: () => item.classList.add('is-active'),
            onEnterBack: () => item.classList.add('is-active'),
            onLeave: () => item.classList.remove('is-active'),
            onLeaveBack: () => item.classList.remove('is-active')
          }
        }
      );
    });
  }

  function initRegisterScrollEffects() {
    const registerSection = document.querySelector('#register');
    if (!registerSection) return;

    const registerPanel = registerSection.querySelector('.register-panel');
    const registerLayout = registerSection.querySelector('.register-layout');
    const titleKicker = registerSection.querySelector('.title-kicker');
    const title = registerSection.querySelector('.section-title');
    const subtext = registerSection.querySelector('.register-subtext');
    const actionCard = registerSection.querySelector('.register-action-card');

    if (registerPanel) {
      gsap.fromTo(
        registerPanel,
        { y: 42, scale: 0.97, transformOrigin: '50% 50%' },
        {
          y: 0,
          scale: 1,
          duration: 0.95,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: registerPanel,
            start: 'top 84%',
            toggleActions: 'play none none reverse'
          }
        }
      );
    }

    if (registerLayout) {
      gsap.to(registerLayout, {
        yPercent: -5,
        ease: 'none',
        scrollTrigger: {
          trigger: registerSection,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 0.8
        }
      });
    }

    const textTargets = [titleKicker, title, subtext].filter(Boolean);
    if (textTargets.length) {
      gsap.fromTo(
        textTargets,
        { y: 22 },
        {
          y: 0,
          duration: 0.72,
          stagger: 0.08,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: registerSection,
            start: 'top 82%',
            toggleActions: 'play none none reverse'
          }
        }
      );
    }

    if (actionCard) {
      gsap.fromTo(
        actionCard,
        { y: 18 },
        {
          y: 0,
          duration: 0.65,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: actionCard,
            start: 'top 88%',
            toggleActions: 'play none none reverse'
          }
        }
      );
    }
  }
  function initHeroParallax() {
    const hero = document.querySelector('.hero-shell');
    if (!hero) return;

    const blobs = $('.hero-shell .blob');
    blobs.forEach((blob, index) => {
      gsap.to(blob, {
        yPercent: -14 - index * 5,
        xPercent: index % 2 === 0 ? 8 : -8,
        ease: 'none',
        scrollTrigger: {
          trigger: hero,
          start: 'top top',
          end: 'bottom top',
          scrub: 0.8
        }
      });
    });

    const grid = document.querySelector('.hero-shell .tech-grid');
    if (grid) {
      gsap.to(grid, {
        backgroundPosition: '0px 70px',
        ease: 'none',
        scrollTrigger: {
          trigger: hero,
          start: 'top top',
          end: 'bottom top',
          scrub: 1
        }
      });
    }

    const heroContent = document.querySelector('.hero-shell > .relative');
    if (heroContent) {
      gsap.to(heroContent, {
        yPercent: 8,
        ease: 'none',
        scrollTrigger: {
          trigger: hero,
          start: 'top top',
          end: 'bottom top',
          scrub: 0.7
        }
      });
    }
  }

  function initHeroParticles() {
    const hero = document.querySelector('.hero-shell');
    if (!hero) return;

    const canvas = document.createElement('canvas');
    canvas.id = 'heroParticles';
    hero.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    const count = isMobile ? 18 : 30;
    let width = 0;
    let height = 0;
    let rafId = 0;

    const particles = Array.from({ length: count }, () => ({
      x: Math.random(),
      y: Math.random(),
      vx: (Math.random() - 0.5) * 0.00045,
      vy: (Math.random() - 0.5) * 0.00045,
      r: Math.random() * 1.9 + 0.7,
      a: Math.random() * 0.6 + 0.2
    }));

    const resize = () => {
      width = hero.clientWidth;
      height = hero.clientHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const step = () => {
      ctx.clearRect(0, 0, width, height);

      for (let index = 0; index < particles.length; index += 1) {
        const particle = particles[index];
        particle.x += particle.vx;
        particle.y += particle.vy;

        if (particle.x < 0 || particle.x > 1) particle.vx *= -1;
        if (particle.y < 0 || particle.y > 1) particle.vy *= -1;

        const px = particle.x * width;
        const py = particle.y * height;

        ctx.beginPath();
        ctx.arc(px, py, particle.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(127, 182, 230, ${particle.a})`;
        ctx.fill();
      }

      rafId = requestAnimationFrame(step);
    };

    resize();
    step();

    window.addEventListener('resize', resize, { passive: true });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        cancelAnimationFrame(rafId);
      } else {
        step();
      }
    });
  }

  function initMotion() {
    initHeroIntro();
    initSmoothScrolling();
    initParallaxLayers();
    initSectionReveal();
    initGenericReveal();
    initTimelineAnimation();
    initRegisterScrollEffects();
    initHeroParallax();
    initHeroParticles();
    ScrollTrigger.refresh();
  }

  const resetVisibility = () => {
    document.querySelectorAll('.timeline-item, .reveal-up, .section-shell, .glass-card').forEach((element) => {
      element.style.opacity = '';
      element.style.visibility = '';
      element.style.transform = '';
    });
  };

  try {
    initMotion();
  } catch (error) {
    console.error('Animation init failed:', error);
    resetVisibility();
  }
})();

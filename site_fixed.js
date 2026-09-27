(() => {
  const nav = document.getElementById('nav');
  if (nav) {
    const updateNav = () => nav.classList.toggle('up', window.scrollY > 60);
    updateNav();
    window.addEventListener('scroll', updateNav, { passive: true });
  }

  window.toggleMenu = function () {
    const mob = document.getElementById('mob');
    if (mob) mob.classList.toggle('on');
  };

  const pts = document.getElementById('pts');
  if (pts) {
    for (let i = 0; i < 38; i++) {
      const p = document.createElement('div');
      p.className = 'pt';
      const size = Math.random() * 10 + 8;
      const left = Math.random() * 100;
      const duration = Math.random() * 22 + 16;
      const delay = Math.random() * -22;
      const drift = (Math.random() - 0.5) * 120;
      const shade = Math.random() * 0.3 + 0.15;
      const color = Math.random() > 0.5 ? '255,255,255' : '235,245,255';
      p.style.cssText = `
        width:${size}px;
        height:${size}px;
        left:${left}%;
        background: radial-gradient(circle at 35% 35%, rgba(${color}, ${shade}), rgba(${color}, 0.06) 65%);
        --d:${duration}s;
        --x:${drift}px;
        --s:${Math.random() * 0.8 + 0.8};
        animation-delay:${delay}s;
      `;
      pts.appendChild(p);
    }
  }

  if ('IntersectionObserver' in window) {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add('on');
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );
    document.querySelectorAll('.r').forEach((el) => obs.observe(el));
  } else {
    document.querySelectorAll('.r').forEach((el) => el.classList.add('on'));
  }

  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', function (e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        window.scrollTo({ top: target.offsetTop - 80, behavior: 'smooth' });
      }
    });
  });

  const contactForm = document.getElementById('contactForm');
  const formSuccess = document.getElementById('formSuccess');

  // BUG-001 FIX: the previous handler called e.preventDefault() and then only
  // ran a setTimeout() that faked a success message — it never sent the form
  // data anywhere, so every real enquiry was silently lost. This version
  // actually POSTs to the form's own action URL (Formspree) and only shows
  // success once that request truly succeeds. On failure, it re-enables the
  // button and shows an error message instead of a false "Sent!" state.
  let formError = document.getElementById('formError');
  if (contactForm && !formError) {
    // Create an error banner if the page markup doesn't already have one,
    // so the fix works without requiring an HTML change.
    formError = document.createElement('div');
    formError.id = 'formError';
    formError.className = 'form-error';
    formError.setAttribute('role', 'alert');
    formError.style.display = 'none';
    formError.textContent = 'Sorry, something went wrong sending your message. Please try again, or email us directly.';
    contactForm.appendChild(formError);
  }

  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const button = contactForm.querySelector('button[type="submit"]');
      if (formSuccess) formSuccess.classList.remove('show');
      if (formError) formError.style.display = 'none';
      if (button) {
        button.disabled = true;
        button.textContent = 'Sending...';
      }

      fetch(contactForm.action, {
        method: contactForm.method || 'POST',
        body: new FormData(contactForm),
        headers: { Accept: 'application/json' },
      })
        .then((response) => {
          if (!response.ok) throw new Error('Request failed with status ' + response.status);
          if (formSuccess) formSuccess.classList.add('show');
          contactForm.reset();
        })
        .catch((err) => {
          console.error('Contact form submission failed:', err);
          if (formError) formError.style.display = 'block';
        })
        .finally(() => {
          if (button) {
            button.disabled = false;
            button.textContent = 'Send Message';
          }
        });
    });
  }

  document.querySelectorAll('img').forEach((img) => {
    if (!img.hasAttribute('loading')) {
      const isCritical = img.matches('.logo-img, .pre-logo img, .hero-bm-img, .hmi img, .hm img');
      img.setAttribute('loading', isCritical ? 'eager' : 'lazy');
    }
    if (!img.hasAttribute('decoding')) {
      img.setAttribute('decoding', 'async');
    }
    if (!img.hasAttribute('fetchpriority') && img.matches('.logo-img, .pre-logo img, .hero-bm-img, .hmi img, .hm img')) {
      img.setAttribute('fetchpriority', 'high');
    }
  });

  const preloader = document.getElementById('preloader');
  const hidePreloader = () => {
    if (!preloader) return;
    preloader.classList.add('hide');
    window.setTimeout(() => preloader.remove(), 500);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', hidePreloader, { once: true });
  } else {
    hidePreloader();
  }

  window.addEventListener('load', hidePreloader, { once: true });
  window.setTimeout(hidePreloader, 800);
})();

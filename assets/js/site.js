/* Crochet Petal Craft — shared site behaviour (mobile nav, copy code, reveals) */
(function () {
  'use strict';

  var doc = document;

  /* ---------- mobile navigation ---------- */
  var drawer = doc.getElementById('mobileNav');
  var openBtn = doc.getElementById('navToggle');
  var closeBtn = doc.getElementById('navClose');

  function setDrawer(open) {
    if (!drawer) return;
    drawer.setAttribute('data-open', open ? 'true' : 'false');
    drawer.setAttribute('aria-hidden', open ? 'false' : 'true');
    doc.body.classList.toggle('no-scroll', open);
    if (openBtn) openBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open && closeBtn) closeBtn.focus();
    else if (!open && openBtn) openBtn.focus();
  }

  if (openBtn) openBtn.addEventListener('click', function () { setDrawer(true); });
  if (closeBtn) closeBtn.addEventListener('click', function () { setDrawer(false); });
  if (drawer) {
    drawer.addEventListener('click', function (e) {
      if (e.target.closest('a')) setDrawer(false);
    });
  }

  /* ---------- toast ---------- */
  var toastEl = null;
  var toastTimer = null;

  function toast(message) {
    if (!toastEl) {
      toastEl = doc.createElement('div');
      toastEl.className = 'toast';
      toastEl.setAttribute('role', 'status');
      toastEl.setAttribute('aria-live', 'polite');
      doc.body.appendChild(toastEl);
    }
    toastEl.textContent = message;
    toastEl.setAttribute('data-show', 'true');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toastEl.setAttribute('data-show', 'false');
    }, 2200);
  }

  window.cpcToast = toast;

  /* ---------- copy product code ---------- */
  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (resolve, reject) {
      try {
        var ta = doc.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.top = '-1000px';
        doc.body.appendChild(ta);
        ta.select();
        doc.execCommand('copy');
        doc.body.removeChild(ta);
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  }

  doc.addEventListener('click', function (e) {
    var trigger = e.target.closest('[data-copy]');
    if (!trigger) return;
    e.preventDefault();
    var code = trigger.getAttribute('data-copy');
    copyText(code).then(
      function () {
        trigger.setAttribute('data-copied', 'true');
        toast('Product code ' + code + ' copied');
        setTimeout(function () { trigger.removeAttribute('data-copied'); }, 1800);
      },
      function () { toast('Product code: ' + code); }
    );
  });

  /* ---------- scroll reveal ---------- */
  var reveals = [].slice.call(doc.querySelectorAll('.reveal'));
  if (reveals.length) {
    if (!('IntersectionObserver' in window)) {
      reveals.forEach(function (el) { el.classList.add('is-in'); });
    } else {
      var io = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('is-in');
            io.unobserve(entry.target);
          });
        },
        { rootMargin: '0px 0px -8% 0px', threshold: 0.05 }
      );
      reveals.forEach(function (el) { io.observe(el); });
    }
  }

  /* ---------- product gallery ---------- */
  var gallery = doc.getElementById('gallery');
  if (gallery) {
    var mainImg = gallery.querySelector('[data-gallery-main]');
    var thumbs = [].slice.call(gallery.querySelectorAll('[data-gallery-thumb]'));

    function select(index) {
      var btn = thumbs[index];
      if (!btn || !mainImg) return;
      mainImg.src = btn.getAttribute('data-full');
      mainImg.alt = btn.getAttribute('data-alt') || mainImg.alt;
      thumbs.forEach(function (t, i) { t.setAttribute('aria-selected', i === index ? 'true' : 'false'); });
    }

    thumbs.forEach(function (btn, i) {
      btn.addEventListener('click', function () { select(i); });
    });

    var lightbox = doc.getElementById('lightbox');
    if (lightbox && mainImg) {
      var lbImg = lightbox.querySelector('img');
      var lbClose = lightbox.querySelector('.lightbox__close');
      var openLb = function () {
        lbImg.src = mainImg.src;
        lbImg.alt = mainImg.alt;
        lightbox.setAttribute('data-open', 'true');
        doc.body.classList.add('no-scroll');
        lbClose.focus();
      };
      var closeLb = function () {
        lightbox.setAttribute('data-open', 'false');
        doc.body.classList.remove('no-scroll');
      };
      gallery.querySelectorAll('[data-zoom]').forEach(function (el) {
        el.addEventListener('click', openLb);
      });
      lbClose.addEventListener('click', closeLb);
      lightbox.addEventListener('click', function (e) {
        if (e.target === lightbox) closeLb();
      });
      doc.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
          closeLb();
          setDrawer(false);
        }
      });
    }
  }

  doc.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && drawer && drawer.getAttribute('data-open') === 'true') setDrawer(false);
  });
})();

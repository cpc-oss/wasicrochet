/* Crochet Petal Craft — catalogue search, filtering and sorting.
   Operates on the pre-rendered product cards so the catalogue still works
   with JavaScript disabled (all products simply show, unfiltered). */
(function () {
  'use strict';

  var grid = document.getElementById('catalogueGrid');
  if (!grid) return;

  var cards = [].slice.call(grid.querySelectorAll('[data-product]'));
  var searchInput = document.getElementById('catalogueSearch');
  var clearBtn = document.getElementById('searchClear');
  var sortSelect = document.getElementById('catalogueSort');
  var availSelect = document.getElementById('filterAvailability');
  var colourSelect = document.getElementById('filterColour');
  var priceSelect = document.getElementById('filterPrice');
  var chips = [].slice.call(document.querySelectorAll('[data-chip]'));
  var toggles = [].slice.call(document.querySelectorAll('[data-toggle]'));
  var countEl = document.getElementById('resultCount');
  var activeEl = document.getElementById('activeFilterText');
  var emptyEl = document.getElementById('catalogueEmpty');
  var resetBtn = document.getElementById('resetFilters');
  var filterToggleBtn = document.getElementById('filterToggle');
  var filterPanel = document.getElementById('filterPanel');

  var state = {
    q: '',
    category: 'all',
    availability: 'all',
    colour: 'all',
    price: 'all',
    onlyNew: false,
    onlyCustom: false,
    sort: 'featured'
  };

  var PRICE_BANDS = {
    'under-200': [0, 199.99],
    '200-500': [200, 500],
    '500-1000': [500, 1000],
    'over-1000': [1000.01, Infinity]
  };

  function num(el, key) {
    return parseFloat(el.getAttribute(key)) || 0;
  }

  function matches(card) {
    if (state.category !== 'all' && card.getAttribute('data-cat') !== state.category) return false;
    if (state.availability !== 'all' && card.getAttribute('data-avail') !== state.availability) return false;
    if (state.onlyNew && card.getAttribute('data-new') !== 'true') return false;
    if (state.onlyCustom && card.getAttribute('data-custom') !== 'true') return false;

    if (state.colour !== 'all') {
      var colours = card.getAttribute('data-colours') || '';
      if (colours.split('|').indexOf(state.colour) === -1) return false;
    }

    if (state.price !== 'all') {
      var band = PRICE_BANDS[state.price];
      var price = num(card, 'data-price');
      if (!band || price < band[0] || price > band[1]) return false;
    }

    if (state.q) {
      var haystack = card.getAttribute('data-search') || '';
      var terms = state.q.split(/\s+/).filter(Boolean);
      for (var i = 0; i < terms.length; i += 1) {
        if (haystack.indexOf(terms[i]) === -1) return false;
      }
    }
    return true;
  }

  var comparators = {
    featured: function (a, b) {
      var fa = a.getAttribute('data-featured') === 'true' ? 0 : 1;
      var fb = b.getAttribute('data-featured') === 'true' ? 0 : 1;
      return fa - fb || num(a, 'data-order') - num(b, 'data-order');
    },
    newest: function (a, b) { return num(b, 'data-created') - num(a, 'data-created'); },
    'price-asc': function (a, b) { return num(a, 'data-price') - num(b, 'data-price'); },
    'price-desc': function (a, b) { return num(b, 'data-price') - num(a, 'data-price'); },
    name: function (a, b) {
      return (a.getAttribute('data-name') || '').localeCompare(b.getAttribute('data-name') || '');
    }
  };

  function describe() {
    var bits = [];
    if (state.q) bits.push('“' + state.q + '”');
    if (state.category !== 'all') {
      var chip = chips.filter(function (c) { return c.getAttribute('data-chip') === state.category; })[0];
      if (chip) bits.push(chip.getAttribute('data-label') || state.category);
    }
    if (state.availability !== 'all' && availSelect) {
      bits.push(availSelect.options[availSelect.selectedIndex].text);
    }
    if (state.colour !== 'all' && colourSelect) {
      bits.push(colourSelect.options[colourSelect.selectedIndex].text);
    }
    if (state.price !== 'all' && priceSelect) {
      bits.push(priceSelect.options[priceSelect.selectedIndex].text);
    }
    if (state.onlyNew) bits.push('New arrivals');
    if (state.onlyCustom) bits.push('Customisable');
    return bits.length ? bits.join(' · ') : '';
  }

  function apply() {
    var visible = [];
    cards.forEach(function (card) {
      var ok = matches(card);
      card.hidden = !ok;
      if (ok) visible.push(card);
    });

    visible.sort(comparators[state.sort] || comparators.featured);
    visible.forEach(function (card) { grid.appendChild(card); });

    if (countEl) {
      countEl.textContent = visible.length === 1 ? '1 product' : visible.length + ' products';
    }
    if (activeEl) {
      var text = describe();
      activeEl.textContent = text ? 'Filtered by ' + text : 'Showing everything we make';
    }
    if (emptyEl) emptyEl.hidden = visible.length !== 0;
    if (clearBtn) clearBtn.setAttribute('data-show', state.q ? 'true' : 'false');

    chips.forEach(function (chip) {
      chip.setAttribute('aria-pressed', chip.getAttribute('data-chip') === state.category ? 'true' : 'false');
    });
    toggles.forEach(function (t) {
      var key = t.getAttribute('data-toggle');
      t.setAttribute('aria-pressed', state[key] ? 'true' : 'false');
    });

    syncUrl();
  }

  function syncUrl() {
    if (!window.history || !window.history.replaceState) return;
    var params = new URLSearchParams();
    if (state.category !== 'all') params.set('category', state.category);
    if (state.q) params.set('q', state.q);
    if (state.availability !== 'all') params.set('availability', state.availability);
    if (state.sort !== 'featured') params.set('sort', state.sort);
    if (state.onlyNew) params.set('new', '1');
    var qs = params.toString();
    window.history.replaceState(null, '', qs ? '?' + qs : window.location.pathname);
  }

  function readUrl() {
    var params = new URLSearchParams(window.location.search);
    var cat = params.get('category');
    if (cat && chips.some(function (c) { return c.getAttribute('data-chip') === cat; })) state.category = cat;
    var q = params.get('q');
    if (q) {
      state.q = q.trim().toLowerCase();
      if (searchInput) searchInput.value = q;
    }
    var av = params.get('availability');
    if (av && availSelect) {
      availSelect.value = av;
      if (availSelect.value === av) state.availability = av;
    }
    var sort = params.get('sort');
    if (sort && comparators[sort] && sortSelect) {
      sortSelect.value = sort;
      state.sort = sort;
    }
    if (params.get('new') === '1') state.onlyNew = true;
  }

  var debounceTimer = null;
  if (searchInput) {
    searchInput.addEventListener('input', function () {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(function () {
        state.q = searchInput.value.trim().toLowerCase();
        apply();
      }, 130);
    });
    searchInput.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        searchInput.value = '';
        state.q = '';
        apply();
      }
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', function () {
      if (searchInput) searchInput.value = '';
      state.q = '';
      apply();
      if (searchInput) searchInput.focus();
    });
  }

  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      state.category = chip.getAttribute('data-chip');
      apply();
    });
  });

  toggles.forEach(function (t) {
    t.addEventListener('click', function () {
      var key = t.getAttribute('data-toggle');
      state[key] = !state[key];
      apply();
    });
  });

  [
    [availSelect, 'availability'],
    [colourSelect, 'colour'],
    [priceSelect, 'price'],
    [sortSelect, 'sort']
  ].forEach(function (pair) {
    var el = pair[0];
    var key = pair[1];
    if (!el) return;
    el.addEventListener('change', function () {
      state[key] = el.value;
      apply();
    });
  });

  if (resetBtn) {
    resetBtn.addEventListener('click', function () {
      state = { q: '', category: 'all', availability: 'all', colour: 'all', price: 'all', onlyNew: false, onlyCustom: false, sort: 'featured' };
      if (searchInput) searchInput.value = '';
      if (availSelect) availSelect.value = 'all';
      if (colourSelect) colourSelect.value = 'all';
      if (priceSelect) priceSelect.value = 'all';
      if (sortSelect) sortSelect.value = 'featured';
      apply();
    });
  }

  if (filterToggleBtn && filterPanel) {
    filterToggleBtn.addEventListener('click', function () {
      var open = filterPanel.hidden;
      filterPanel.hidden = !open;
      filterToggleBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  readUrl();
  apply();
})();

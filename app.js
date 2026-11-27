
(() => {
  'use strict';

  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];

  // ==================================================
  // 01 — REPRISE DE LECTURE
  // ==================================================

  const labels = {
    'index.html': 'Accueil',
    'horey.html': 'Horey',
    'aetherfall.html': 'Aetherfall',
    'ghost-protocol-projet.html': 'Ghost Protocol — Projet de jeu',
    'ghost-protocol.html': 'Ghost Protocol — Univers',
    'ghost-protocol-etude-de-cas.html': 'Ghost Protocol — Études de cas',
    'etudes-de-cas.html': 'Études de cas',
    'methode.html': 'Méthode & supports',
    'workflow.html': 'Méthode de travail',
    'documentation.html': 'Documentation'
  };

  const page = location.pathname.split('/').pop() || 'index.html';

  const saveReading = () => {
    try {
      if (page !== 'index.html' && labels[page]) {
        localStorage.setItem(
          'aetherfall-reading',
          JSON.stringify({
            page,
            hash: location.hash
          })
        );
      }
    } catch (_) {
      // La navigation reste disponible sans stockage local.
    }
  };

  try {
    const previous = JSON.parse(
      localStorage.getItem('aetherfall-reading') || 'null'
    );

    if (
      page === 'index.html' &&
      previous &&
      labels[previous.page] &&
      previous.page !== page
    ) {
      const resume = $('#resume');

      if (resume) {
        const link = $('a', resume);

        if (link) {
          resume.hidden = false;
          link.href = previous.page + (previous.hash || '');
          link.textContent = labels[previous.page];
        }
      }
    }

    saveReading();

  } catch (_) {
    // La navigation reste disponible sans stockage local.
  }


  // ==================================================
  // 02 — PROGRESSION ET SOMMAIRE LATÉRAL
  // ==================================================

  const progress = $('.progress span');
  const sections = $$('main [data-section]');

  const updateReading = () => {

    const range = document.documentElement.scrollHeight - innerHeight;

    if (progress) {
      progress.style.width = `${
        range > 0
          ? Math.min(100, Math.max(0, scrollY / range * 100))
          : 0
      }%`;
    }

    const visibleSections = sections.filter(
      section => section.getClientRects().length > 0
    );

    let current = visibleSections[0];

    for (const section of visibleSections) {
      if (section.getBoundingClientRect().top < 180) {
        current = section;
      }
    }

    $$('.toc a[href^="#"]').forEach(link => {

      if (current && link.hash === '#' + current.id) {
        link.setAttribute('aria-current', 'location');
      } else {
        link.removeAttribute('aria-current');
      }

    });

  };

  addEventListener('scroll', updateReading, { passive: true });
  addEventListener('resize', updateReading);
  addEventListener('load', updateReading);

  document.addEventListener('toggle', event => {
    if (event.target.tagName === 'DETAILS') {
      requestAnimationFrame(updateReading);
    }
  }, true);

  updateReading();


  // ==================================================
  // 03 — ANCRES ET ACCORDÉONS
  // ==================================================

  const openTarget = () => {

    if (!location.hash) return;

    let id;

    try {
      id = decodeURIComponent(location.hash.slice(1));
    } catch (_) {
      return;
    }

    const target = document.getElementById(id);

    if (!target) return;

    let layoutChanged = false;

    const study = target.closest('[data-study]');

    if (study && study.hidden) {
      const all = $('[data-filter="all"]');

      if (all) {
        all.click();
        layoutChanged = true;
      }
    }

    if (target.tagName === 'DETAILS' && !target.open) {
      target.open = true;
      layoutChanged = true;
    }

    let parent = target.parentElement;

    while (parent) {

      if (parent.tagName === 'DETAILS' && !parent.open) {
        parent.open = true;
        layoutChanged = true;
      }

      parent = parent.parentElement;

    }

    if (layoutChanged) {
      requestAnimationFrame(() => {
        target.scrollIntoView({ block: 'start' });
        updateReading();
      });
    }

  };

  addEventListener('hashchange', () => {
    openTarget();
    saveReading();
    requestAnimationFrame(updateReading);
  });

  if (location.hash) {
    openTarget();
  }


  // ==================================================
  // 04 — ONGLETS INTERACTIFS
  // ==================================================

  $$('[data-tabs]').forEach(group => {

    const buttons = $$('[role="tab"]', group);

    const select = button => {

      buttons.forEach(b => {

        b.setAttribute(
          'aria-selected',
          String(b === button)
        );

        b.tabIndex = b === button ? 0 : -1;

        const panel = document.getElementById(
          b.getAttribute('aria-controls')
        );

        if (panel) {
          panel.hidden = b !== button;
        }

      });

      requestAnimationFrame(updateReading);

    };

    buttons.forEach((button, index) => {

      button.addEventListener('click', () => select(button));

      button.addEventListener('keydown', e => {

        let next;

        if (e.key === 'ArrowRight') {
          next = (index + 1) % buttons.length;
        }

        if (e.key === 'ArrowLeft') {
          next = (index + buttons.length - 1) % buttons.length;
        }

        if (e.key === 'Home') {
          next = 0;
        }

        if (e.key === 'End') {
          next = buttons.length - 1;
        }

        if (next !== undefined) {
          e.preventDefault();
          select(buttons[next]);
          buttons[next].focus();
        }

      });

    });

  });


  // ==================================================
  // 05 — FILTRES DES ÉTUDES DE CAS
  // ==================================================

  const filters = $$('[data-filter]');

  filters.forEach(button => {

    button.addEventListener('click', () => {

      filters.forEach(b => {
        b.setAttribute(
          'aria-pressed',
          String(b === button)
        );
      });

      const category = button.dataset.filter;

      let count = 0;

      $$('[data-study]').forEach(study => {

        study.hidden =
          category !== 'all' &&
          !study.dataset.study.split(' ').includes(category);

        if (!study.hidden) {
          count++;
        }

      });

      const status = $('#filter-status');

      if (status) {
        status.textContent =
          `${count} étude${count > 1 ? 's' : ''} de cas affichée${count > 1 ? 's' : ''}.`;
      }

      requestAnimationFrame(updateReading);

    });

  });


  // ==================================================
  // 06 — RECHERCHE DOCUMENTAIRE
  // ==================================================

  const search = $('#document-search');

  if (search) {

    search.addEventListener('input', () => {

      const normalize = value =>
        value
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLowerCase();

      const term = normalize(search.value.trim());

      let count = 0;

      $$('[data-document]').forEach(row => {

        row.hidden = !normalize(row.textContent).includes(term);

        if (!row.hidden) {

          count++;

          if (term) {
            row.open = true;
          }

        }

      });

      const empty = $('#search-empty');
      const status = $('#search-status');

      if (empty) {
        empty.hidden = count > 0;
      }

      if (status) {
        status.textContent =
          `${count} section${count > 1 ? 's' : ''} trouvée${count > 1 ? 's' : ''}.`;
      }

      requestAnimationFrame(updateReading);

    });

  }


  // ==================================================
  // 07 — AGRANDISSEMENT DES IMAGES
  // ==================================================

  const dialog = $('#image-dialog');

  if (dialog && typeof dialog.showModal === 'function') {

    $$('[data-enlarge]').forEach(button => {

      button.addEventListener('click', () => {

        const source = $('img', button);
        const image = $('img', dialog);
        const caption = $('#image-caption', dialog);

        if (!source || !image) return;

        image.src = source.currentSrc || source.src;
        image.alt = source.alt;

        if (caption) {
          caption.textContent = button.dataset.enlarge;
        }

        if (!dialog.open) {
          dialog.showModal();
        }

      });

    });

    const close = $('.close', dialog);

    if (close) {
      close.addEventListener('click', () => dialog.close());
    }

    dialog.addEventListener('click', e => {

      if (e.target === dialog) {
        dialog.close();
      }

    });

  } else {

    $$('[data-enlarge]').forEach(button => {

      button.addEventListener('click', () => {

        const source = $('img', button);

        if (source) {
          location.href = source.currentSrc || source.src;
        }

      });

    });

  }


  // ==================================================
  // 08 — SIMULATION NARRATIVE AETHERFALL
  // ==================================================

  const simulation = $('#event-simulation');

  if (simulation) {

    const choices = $$('[data-choice]', simulation);

    const result = $('#event-result');
    const stage = $('#event-stage');
    const advance = $('#advance-event');
    const reset = $('#reset-event');
    const personalTitle = $('#event-personal-title');
    const personal = $('#event-personal');

    const outcomes = {

      bond: {
        title: 'Vous avez vécu Mariage Bond.',
        memory: 'Votre compte conserve les récompenses propres au parcours en duo associé à Shane. Les récompenses de Wolf ne sont pas réunies sur ce même compte.'
      },

      wolf: {
        title: 'Vous avez vécu Wolf.',
        memory: 'Votre compte conserve les récompenses propres au parcours solo associé à Wolf. Les récompenses de Mariage Bond ne sont pas réunies sur ce même compte.'
      },

      none: {
        title: 'Vous avez poursuivi votre propre aventure.',
        memory: 'Vous n’obtenez aucune récompense de ces deux événements. Vos autres activités, découvertes et mini-Events peuvent cependant constituer votre propre expérience de cette période.'
      }

    };

    let choice = 'bond';

    const pick = value => {

      if (!outcomes[value]) return;

      choice = value;

      choices.forEach(b => {

        b.setAttribute(
          'aria-pressed',
          String(b.dataset.choice === value)
        );

      });

      if (result) {
        result.hidden = true;
      }

      if (stage) {
        stage.textContent =
          'Avant la transition · choisissez un parcours';
      }

      if (advance) {
        advance.hidden = false;
      }

      requestAnimationFrame(updateReading);

    };

    choices.forEach(button => {

      button.addEventListener('click', () => {
        pick(button.dataset.choice);
      });

    });

    if (advance) {

      advance.addEventListener('click', () => {

        const outcome = outcomes[choice];

        if (personalTitle) {
          personalTitle.textContent = outcome.title;
        }

        if (personal) {
          personal.textContent = outcome.memory;
        }

        if (result) {
          result.hidden = false;
        }

        if (stage) {
          stage.textContent =
            'Après la transition · histoire commune, traces individuelles';
        }

        advance.hidden = true;

        requestAnimationFrame(updateReading);

      });

    }

    if (reset) {
      reset.addEventListener('click', () => pick('bond'));
    }

  }

})();

(() => {
  'use strict';
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const labels = {'index.html':'Accueil','horey.html':'Horey','aetherfall.html':'Aetherfall','etudes-de-cas.html':'Études de cas','methode.html':'Méthode','documentation.html':'Documentation'};
  const page = location.pathname.split('/').pop() || 'index.html';
  try {
    const previous = JSON.parse(localStorage.getItem('aetherfall-reading') || 'null');
    if (page === 'index.html' && previous && labels[previous.page] && previous.page !== page) {
      const resume = $('#resume');
      if (resume) {resume.hidden = false; const link = $('a', resume); link.href = previous.page + (previous.hash || ''); link.textContent = labels[previous.page];}
    }
    if (page !== 'index.html') localStorage.setItem('aetherfall-reading', JSON.stringify({page,hash:location.hash}));
  } catch (_) { /* Navigation remains available when storage is disabled. */ }
  const progress = $('.progress span');
  const sections = $$('main [data-section]');
  const updateReading = () => {
    const range = document.documentElement.scrollHeight - innerHeight;
    if (progress) progress.style.width = `${range > 0 ? Math.min(100, Math.max(0, scrollY / range * 100)) : 0}%`;
    let current = sections[0];
    for (const section of sections) if (section.getBoundingClientRect().top < 180) current = section;
    $$('.toc a[href^="#"]').forEach(link => {if (current && link.hash === '#' + current.id) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current');});
  };
  addEventListener('scroll', updateReading, {passive:true});
  addEventListener('resize', updateReading);
  updateReading();
  addEventListener('hashchange', () => {
    const id = decodeURIComponent(location.hash.slice(1));
    const target = document.getElementById(id);
    if (target && target.hasAttribute('data-study') && target.hidden) {
      const all = $('[data-filter="all"]');
      if (all) all.click();
      target.scrollIntoView();
    }
    if (target && target.tagName === 'DETAILS') target.open = true;
    if (target) {const parent = target.closest('details'); if (parent) parent.open = true;}
    try {if (page !== 'index.html') localStorage.setItem('aetherfall-reading',JSON.stringify({page,hash:location.hash}));} catch (_) {}
  });
  if (location.hash) {const target = document.getElementById(decodeURIComponent(location.hash.slice(1)));if (target && target.tagName === 'DETAILS') target.open = true;}
  $$('[data-tabs]').forEach(group => {
    const buttons = $$('[role="tab"]', group);
    const select = button => {
      buttons.forEach(b => {b.setAttribute('aria-selected', String(b === button));b.tabIndex = b === button ? 0 : -1;const panel = document.getElementById(b.getAttribute('aria-controls'));if(panel)panel.hidden = b !== button;});
    };
    buttons.forEach((button,index) => {
      button.addEventListener('click', () => select(button));
      button.addEventListener('keydown', e => {let next;if(e.key === 'ArrowRight')next=(index+1)%buttons.length;if(e.key === 'ArrowLeft')next=(index+buttons.length-1)%buttons.length;if(e.key==='Home')next=0;if(e.key==='End')next=buttons.length-1;if(next!==undefined){e.preventDefault();select(buttons[next]);buttons[next].focus();}});
    });
  });
  const filters = $$('[data-filter]');
  filters.forEach(button => button.addEventListener('click', () => {
    filters.forEach(b => b.setAttribute('aria-pressed',String(b===button)));
    const category=button.dataset.filter;
    let count=0;
    $$('[data-study]').forEach(study => {study.hidden=category!=='all' && !study.dataset.study.split(' ').includes(category);if(!study.hidden)count++;});
    const status=$('#filter-status');if(status)status.textContent=`${count} étude${count>1?'s':''} de cas affichée${count>1?'s':''}.`;
  }));
  const search = $('#document-search');
  if (search) search.addEventListener('input', () => {
    const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
    const term = normalize(search.value.trim());let count=0;
    $$('[data-document]').forEach(row => {row.hidden=!normalize(row.textContent).includes(term);if(!row.hidden){count++;if(term)row.open=true;}});
    $('#search-empty').hidden=count>0;
    $('#search-status').textContent=`${count} section${count>1?'s':''} trouvée${count>1?'s':''}.`;
  });
  const dialog = $('#image-dialog');
  if (dialog && typeof dialog.showModal === 'function') {
    $$('[data-enlarge]').forEach(button => button.addEventListener('click', () => {
      const source = $('img',button);$('img',dialog).src=source.src;$('img',dialog).alt=source.alt;$('#image-caption').textContent=button.dataset.enlarge;dialog.showModal();
    }));
    $('.close',dialog).addEventListener('click',()=>dialog.close());
    dialog.addEventListener('click', e => {if(e.target===dialog)dialog.close();});
  } else {
    $$('[data-enlarge]').forEach(button => button.addEventListener('click', () => {location.href=$('img',button).src;}));
  }
  const simulation = $('#event-simulation');
  if (simulation) {
    const choices=$$('[data-choice]',simulation);
    const result=$('#event-result');
    const outcomes={bond:{title:'Vous avez vécu Mariage Bond.',memory:'Votre compte conserve les récompenses propres au parcours en duo associé à Shane. Les récompenses de Wolf ne sont pas réunies sur ce même compte.'},wolf:{title:'Vous avez vécu Wolf.',memory:'Votre compte conserve les récompenses propres au parcours solo associé à Wolf. Les récompenses de Mariage Bond ne sont pas réunies sur ce même compte.'},none:{title:'Vous avez poursuivi votre propre aventure.',memory:'Vous n’obtenez aucune récompense de ces deux événements. Vos autres activités, découvertes et mini-Events peuvent cependant constituer votre propre expérience de cette période.'}};
    let choice='bond';
    const pick=value=>{choice=value;choices.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.choice===value)));result.hidden=true;$('#event-stage').textContent='Avant la transition · choisissez un parcours';$('#advance-event').hidden=false;};
    choices.forEach(button=>button.addEventListener('click',()=>pick(button.dataset.choice)));
    $('#advance-event').addEventListener('click',()=>{
      const outcome=outcomes[choice];$('#event-personal-title').textContent=outcome.title;$('#event-personal').textContent=outcome.memory;result.hidden=false;$('#event-stage').textContent='Après la transition · histoire commune, traces individuelles';$('#advance-event').hidden=true;
    });
    $('#reset-event').addEventListener('click',()=>pick('bond'));
  }
})();

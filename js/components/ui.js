/**
 * Cazana Store · Componentes de interacción v5.
 * Sin dependencias ni build: carrusel, filtros móviles, select y rating accesible.
 * No guarda credenciales ni implementa autenticación.
 */
(() => {
  'use strict';
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];

  function carousel() {
    const root = $('#hero-slider');
    if (!root) return;
    const hero = root.closest('.hero');
    const slides = $$('[data-hero-slide]', root);
    const dots = $$('[data-hero-dot]', hero);
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let active = 0;
    let timer;
    let x0 = null;
    const paint = (index) => {
      active = (index + slides.length) % slides.length;
      slides.forEach((slide, i) => {
        const current = i === active;
        slide.classList.toggle('is-active', current);
        slide.setAttribute('aria-hidden', String(!current));
      });
      dots.forEach((dot, i) => {
        const current = i === active;
        dot.classList.toggle('is-active', current);
        if (current) dot.setAttribute('aria-current','true');
        else dot.removeAttribute('aria-current');
      });
    };
    const stop = () => { clearInterval(timer); timer = undefined; };
    const start = () => {
      if (reducedMotion || document.hidden || timer || slides.length < 2) return;
      timer = setInterval(() => paint(active + 1), 6500);
    };
    const move = delta => { paint(active + delta); stop(); start(); };
    $('[data-hero-prev]',hero)?.addEventListener('click',() => move(-1));
    $('[data-hero-next]',hero)?.addEventListener('click',() => move(1));
    dots.forEach(dot => dot.addEventListener('click',() => { paint(Number(dot.dataset.heroDot)); stop(); start(); }));
    hero.addEventListener('mouseenter',stop);
    hero.addEventListener('mouseleave',start);
    hero.addEventListener('focusin',stop);
    hero.addEventListener('focusout',e => { if (!hero.contains(e.relatedTarget)) start(); });
    root.addEventListener('touchstart',e => { x0 = e.touches[0]?.clientX ?? null; },{passive:true});
    root.addEventListener('touchend',e => {
      if (x0 == null) return;
      const delta = (e.changedTouches[0]?.clientX ?? x0) - x0;
      if (Math.abs(delta) > 48) move(delta < 0 ? 1 : -1);
      x0 = null;
    },{passive:true});
    document.addEventListener('visibilitychange',() => document.hidden ? stop() : start());
    paint(0);start();
  }

  function filterDrawer() {
    const open = $('#filters-toggle');
    const panel = $('#filter-panel');
    const close = $('#filters-close');
    const backdrop = $('#filter-backdrop');
    const apply = $('#filters-apply');
    const form = $('#shop-filters');
    if (!open || !panel || !backdrop || !form) return;
    const mq = matchMedia('(max-width: 900px)');
    let previousFocus;
    const setOpen = (show, restore = true) => {
      if (!mq.matches) show = false;
      document.body.classList.toggle('filters-open',show);
      backdrop.hidden = !show;
      panel.inert = mq.matches && !show;
      open.setAttribute('aria-expanded',String(show));
      panel.setAttribute('aria-hidden',String(mq.matches && !show));
      if (show) { previousFocus = document.activeElement; close?.focus(); }
      else if (restore && previousFocus?.isConnected && mq.matches) previousFocus.focus();
    };
    const sync = () => {
      if (mq.matches) setOpen(false,false);
      else { document.body.classList.remove('filters-open'); backdrop.hidden = true;panel.inert = false;panel.removeAttribute('aria-hidden');open.setAttribute('aria-expanded','false'); }
    };
    open.addEventListener('click',() => setOpen(true));
    close?.addEventListener('click',() => setOpen(false));
    apply?.addEventListener('click',() => setOpen(false));
    backdrop.addEventListener('click',() => setOpen(false));
    document.addEventListener('keydown', e => {
      if(e.key === 'Escape' && document.body.classList.contains('filters-open')) setOpen(false);
      if(e.key !== 'Tab' || !document.body.classList.contains('filters-open')) return;
      const items = $$('button:not(:disabled),input:not(:disabled)',panel);
      if (!items.length) return;
      const first=items[0],last=items[items.length-1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault();last.focus(); }
      if (!e.shiftKey && document.activeElement === last) { e.preventDefault();first.focus(); }
    });
    const counter=$('#filter-count');
    const countText=$('#shop-mobile-count');
    const updateCount = () => {
      const category = form.querySelector('input[name="category"]:checked')?.value;
      const price = form.querySelector('input[name="price"]:checked')?.value;
      const active = Number(Boolean(category)) + Number(Boolean(price)) + Number(form.elements.offers.checked) + Number(form.elements.new.checked);
      if(counter){counter.hidden=active===0;counter.textContent=String(active);}
      if(countText)countText.textContent=$('#shop-count')?.textContent || 'Explora el catálogo';
    };
    form.addEventListener('input',updateCount);
    form.addEventListener('reset',() => setTimeout(updateCount,0));
    mq.addEventListener('change',sync);
    sync();updateCount();
  }

  function enhanceSelect(select) {
    if (!select || select.dataset.enhanced === 'true') return;
    if (select.disabled) return;
    select.dataset.enhanced = 'true';
    select.classList.add('native-select-hidden');
    select.setAttribute('tabindex','-1');
    select.setAttribute('aria-hidden','true');
    const wrapper=document.createElement('div');
    wrapper.className='ui-select';
    const trigger=document.createElement('button');
    trigger.className='ui-select-trigger';trigger.type='button';
    trigger.setAttribute('aria-label',select.dataset.selectLabel || 'Ordenar productos');
    trigger.setAttribute('aria-haspopup','listbox');
    trigger.setAttribute('aria-expanded','false');
    const list=document.createElement('div');
    list.id=select.id+'-list';list.className='ui-select-list';list.setAttribute('role','listbox');
    trigger.setAttribute('aria-controls',list.id);
    const choices = [...select.options];
    choices.forEach(o => {
      const button=document.createElement('button');
      button.type='button';button.className='ui-select-option';
      button.setAttribute('role','option');button.dataset.value=o.value;
      button.textContent=o.textContent;
      list.append(button);
    });
    wrapper.append(trigger,list);
    select.insertAdjacentElement('afterend',wrapper);
    const options = $$('.ui-select-option',list);
    const selectedText = () => {
      trigger.textContent=select.selectedOptions[0]?.textContent || 'Seleccionar';
      options.forEach(o => o.setAttribute('aria-selected',String(o.dataset.value===select.value)));
    };
    const setOpen = show => {
      wrapper.classList.toggle('open',show);
      trigger.setAttribute('aria-expanded',String(show));
      if(show) options.find(o => o.dataset.value===select.value)?.focus();
    };
    const choose = (value) => {
      select.value=value;selectedText();setOpen(false);trigger.focus();
      select.dispatchEvent(new Event('change',{bubbles:true}));
    };
    trigger.addEventListener('click',() => setOpen(!wrapper.classList.contains('open')));
    trigger.addEventListener('keydown',e => {
      if (['ArrowDown','ArrowUp','Enter',' '].includes(e.key)) { e.preventDefault();setOpen(true); }
    });
    options.forEach((option,i) => {
      option.addEventListener('click',() => choose(option.dataset.value));
      option.addEventListener('keydown',e => {
        if(e.key==='Escape'){ e.preventDefault();setOpen(false);trigger.focus(); }
        if(e.key==='ArrowDown'||e.key==='ArrowUp'){
          e.preventDefault();options[(i+(e.key==='ArrowDown'?1:-1)+options.length)%options.length].focus();
        }
        if(e.key==='Home'){e.preventDefault();options[0].focus();}
        if(e.key==='End'){e.preventDefault();options[options.length-1].focus();}
      });
    });
    document.addEventListener('click',e => { if(!wrapper.contains(e.target))setOpen(false); });
    document.addEventListener('keydown',e => { if(e.key==='Escape' && wrapper.classList.contains('open')){setOpen(false);trigger.focus();} });
    select.addEventListener('change',selectedText);
    selectedText();
  }

  function stars() {
    // Los formularios de reseña se regeneran con los datos del producto.
    document.addEventListener('change',e => {
      if(!e.target.matches('.star-picker input[name="rating"]'))return;
      const container=e.target.closest('.rating-field');
      const selected=Number(e.target.value);
      container.querySelectorAll('.rating-star').forEach(label => {
        const n=Number(label.querySelector('input')?.value||0);
        label.classList.toggle('is-on',n<=selected);
      });
      const result=container.querySelector('.rating-feedback');
      if(result)result.textContent=`${selected} de 5 estrellas`;
    });
  }

  document.addEventListener('DOMContentLoaded',() => {
    carousel();filterDrawer();
    $$('select[data-enhance-select]').forEach(enhanceSelect);
    stars();
  });
})();

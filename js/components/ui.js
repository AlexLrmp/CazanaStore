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

  // Cazana Store: controles de filtros consistentes en ordenador y movil.
  function filterDrawer() {
    const trigger = $('#filters-toggle');
    const panel = $('#filter-panel');
    const close = $('#filters-close');
    const backdrop = $('#filter-backdrop');
    const apply = $('#filters-apply');
    const form = $('#shop-filters');
    if (!trigger || !panel || !backdrop || !form) return;

    const mobile = window.matchMedia('(max-width: 900px)');
    const triggerText = [...trigger.childNodes].find(node => node.nodeType === 3 && node.textContent.trim());
    let desktopExpanded = false; // El boton permanece visible tambien en PC.
    let drawerOpen = false;
    let previousFocus = null;

    // Secciones de filtro plegables, sin alterar los valores elegidos.
    $$('.filter-group', form).forEach((group, index) => {
      const heading = $('h3', group);
      if (!heading || $('button', heading)) return;
      const title = heading.textContent.trim();
      const content = document.createElement('div');
      content.className = 'filter-group-body';
      content.id = `cazana-filter-section-${index + 1}`;
      while (heading.nextSibling) content.appendChild(heading.nextSibling);
      group.appendChild(content);
      const toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = 'filter-section-toggle';
      toggle.setAttribute('aria-expanded','true');
      toggle.setAttribute('aria-controls',content.id);
      const caption = document.createElement('span');
      caption.textContent = title;
      const chevron = document.createElement('span');
      chevron.className = 'filter-section-chevron';
      chevron.setAttribute('aria-hidden','true');
      chevron.textContent = '⌄';
      toggle.append(caption,chevron);
      heading.replaceChildren(toggle);
      toggle.addEventListener('click', () => {
        const collapsed = group.classList.toggle('is-collapsed');
        toggle.setAttribute('aria-expanded',String(!collapsed));
        content.hidden = collapsed;
      });
    });

    function paint() {
      const isMobile = mobile.matches;
      document.body.classList.toggle('filters-open',isMobile && drawerOpen);
      document.body.classList.toggle('filters-collapsed',!isMobile && !desktopExpanded);
      backdrop.hidden = !(isMobile && drawerOpen);
      const shown = isMobile ? drawerOpen : desktopExpanded;
      panel.inert = !shown;
      panel.setAttribute('aria-hidden',String(!shown));
      trigger.setAttribute('aria-expanded',String(shown));
      trigger.classList.toggle('is-expanded',shown);
      if (triggerText) triggerText.textContent = shown ? ' Ocultar filtros ' : ' Filtrar productos ';
    }
    const closeMobile = (restore = true) => {
      const wasOpen = drawerOpen;
      drawerOpen = false;
      paint();
      if (restore && wasOpen && previousFocus?.isConnected) previousFocus.focus();
    };
    trigger.addEventListener('click',() => {
      if(mobile.matches) {
        if(drawerOpen) { closeMobile(); return; }
        previousFocus = document.activeElement;
        drawerOpen = true;
        paint();
        close?.focus();
      } else {
        desktopExpanded = !desktopExpanded;
        paint();
        if (desktopExpanded) close?.focus();
        else trigger.focus();
      }
    });
    close?.addEventListener('click',() => {
      if (mobile.matches) closeMobile();
      else { desktopExpanded = false; paint(); trigger.focus(); }
    });
    apply?.addEventListener('click',() => { if (mobile.matches) closeMobile(); });
    backdrop.addEventListener('click',() => closeMobile());
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && mobile.matches && drawerOpen) {closeMobile();return;}
      if (e.key !== 'Tab' || !mobile.matches || !drawerOpen) return;
      const elements = $$('button:not(:disabled), input:not(:disabled), select:not(:disabled), a[href]',panel)
        .filter(element => !element.hidden && element.getClientRects().length && !element.closest('[hidden]'));
      if (!elements.length) return;
      const first = elements[0]; const last = elements[elements.length - 1];
      if (e.shiftKey && document.activeElement === first) {e.preventDefault(); last.focus();}
      else if (!e.shiftKey && document.activeElement === last) {e.preventDefault(); first.focus();}
    });
    mobile.addEventListener('change', () => {drawerOpen = false;paint();});

    const badge = $('#filter-count');
    const hint = $('#shop-mobile-count');
    const updateCount = () => {
      const category = form.querySelector('input[name="category"]:checked')?.value;
      const price = form.querySelector('input[name="price"]:checked')?.value;
      const active = Number(Boolean(category)) + Number(Boolean(price))
        + Number(Boolean(form.elements.offers?.checked)) + Number(Boolean(form.elements.new?.checked));
      if (badge) {badge.hidden = !active;badge.textContent = String(active);}
      if (hint) hint.textContent = $('#shop-count')?.textContent || 'Explora el catálogo';
    };
    form.addEventListener('input',updateCount);
    form.addEventListener('reset',() => window.setTimeout(updateCount,0));
    paint();
    updateCount();
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

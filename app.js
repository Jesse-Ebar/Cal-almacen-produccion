/* Inventory proposals are loaded from the supplied JSON; quantities are never inferred. */
let proposal, references, items = [], filter = 'all', returnFocus;
const byId = id => document.getElementById(id);
const search = byId('search'), overlay = byId('overlay');
const areaClasses = { Música:'music', Sonido:'sound', Producción:'production', Otros:'other' };
const normalize = value => String(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('es');
const escapeHtml = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const indicated = item => item.relacion_con_contenedor === 'relacion_indicada_por_usuario';
const realPhoto = item => item.imagen.tipo === 'foto_real';
function matches(item, query) { return normalize([item.nombre,item.id,item.observacion,item.container.nombre,item.container.codigo,item.container.area].join(' ')).includes(query); }
function imageFor(item) {
  if (realPhoto(item)) return {src:IMG[item.imagen.clave_original], label:'Fotografía real · CAL'};
  const ref = references[item.id];
  return ref ? {src:ref.path,label:'Imagen referencial',ref} : {src:'assets/items/placeholder.svg',label:'Ilustrativo · Foto pendiente'};
}
function protectImages(root) {
  root.querySelectorAll('img').forEach(img => img.addEventListener('error', () => {
    if (img.dataset.failed) return;
    img.dataset.failed = 'true'; img.src = 'assets/items/placeholder.svg';
    img.alt = 'Imagen no disponible';
    const label = img.parentElement.querySelector('.photo-type');
    if (label) label.textContent = 'Imagen no disponible';
  }, {once:true}));
}
function itemCard(item, linkToContainer = false) {
  const card = document.createElement('article'); card.className = 'tile item-card'; card.dataset.itemId = item.id;
  const image = imageFor(item), ref = image.ref;
  const credit = ref ? `<details class="image-credit"><summary>Crédito de imagen</summary><p><a href="${escapeHtml(ref.source)}" target="_blank" rel="noopener noreferrer">${escapeHtml(ref.title.replace(/^File:/,''))}</a> · ${escapeHtml(ref.author)}${ref.authorUrl ? ` · <a href="${escapeHtml(ref.authorUrl)}" target="_blank" rel="noopener noreferrer">Web del autor</a>` : ''} · <a href="${escapeHtml(ref.licenseUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(ref.license)}</a>. ${escapeHtml(ref.changes)}</p></details>` : '';
  card.innerHTML = `<div class="photo-wrap"><img class="photo" loading="lazy" src="${image.src}" alt="${escapeHtml(item.nombre)}${realPhoto(item) ? ', fotografía real de CAL' : ', referencia ilustrativa'}"><span class="photo-type">${image.label}</span></div><div class="tilebody"><span class="code">${escapeHtml(item.id)}</span><h4>${escapeHtml(item.nombre)}</h4><p class="item-description">${escapeHtml(item.observacion)}</p><p class="location"><strong>${indicated(item) ? 'Contenedor indicado' : 'Ubicación propuesta'}:</strong><br>${escapeHtml(item.container.codigo)} · ${escapeHtml(item.container.nombre)}</p><div class="item-status"><span class="validation ${indicated(item) ? 'identified' : ''}">${indicated(item) ? 'Asociación indicada por el usuario' : 'Ubicación propuesta · Por validar'}</span>${!realPhoto(item) ? '<span class="validation">Referencia por validar · Existencia no confirmada</span>' : ''}</div>${credit}${linkToContainer ? '<button class="open-container" type="button">Ver contenedor →</button>' : ''}</div>`;
  card.querySelector('.open-container')?.addEventListener('click', () => openContainer(item.container.codigo, item.id));
  protectImages(card); return card;
}
function containerCard(container) {
  const source = proposal.contenedores.find(c => c.codigo === container.id);
  const button = document.createElement('button'); button.type = 'button'; button.className = 'tile'; button.dataset.containerId = container.id;
  button.setAttribute('aria-label',`Ver contenido de ${container.id}, ${container.title}`);
  button.innerHTML = `<div class="photo-wrap"><img class="photo" loading="lazy" src="${IMG[container.img]}" alt="${escapeHtml(container.title)}, fotografía real de CAL"><span class="photo-type">Fotografía real · CAL</span></div><div class="tilebody"><div class="card-meta"><span class="code">${container.id}</span><span class="area"><span class="dot ${areaClasses[container.group]}"></span>${container.group}</span></div><h3>${escapeHtml(container.title)}</h3><p class="location">${source.items.length} ${source.items.length === 1 ? "tipo de objeto propuesto" : "tipos de objetos propuestos"}</p><div class="card-bottom"><span class="validation">Contenido preliminar</span><span class="detail-link">Ver contenido →</span></div></div>`;
  button.addEventListener('click',()=>openContainer(container.id)); protectImages(button); return button;
}
function emptyState(grid) {
  const box = document.createElement('div'); box.className = 'empty';
  box.innerHTML = '<strong>No hay coincidencias</strong><p>Prueba otro término o cambia el área.</p><button type="button" class="reset">Restablecer búsqueda y filtros</button>';
  box.querySelector('button').addEventListener('click',()=>{search.value='';setFilter('all');search.focus();}); grid.append(box);
}
function render() {
  const query = normalize(search.value.trim());
  const found = items.filter(item => (filter==='all'||item.container.area===filter) && matches(item,query));
  const visible = containers.filter(c => (filter==='all'||c.group===filter) && (!query || normalize([c.id,c.title,c.desc].join(' ')).includes(query) || found.some(i=>i.container.codigo===c.id)));
  byId('cards').replaceChildren(...visible.map(containerCard));
  if (!visible.length) emptyState(byId('cards'));
  byId('count').textContent = `${visible.length} de 9`;
  byId('searchItemsSection').classList.toggle('hide',!query);
  byId('searchItems').replaceChildren(...(query ? found.map(i=>itemCard(i,true)) : []));
  byId('itemCount').textContent = `${found.length} tipos`;
  if(query && !found.length) emptyState(byId('searchItems'));
  const speaker = proposal.equipos_sin_contenedor_confirmado[0];
  const showSpeaker = (filter==='all'||filter==='Sonido') && (!query||normalize(speaker.nombre+' '+speaker.codigo+' OB-06 '+speaker.nota).includes(query));
  byId('objects').replaceChildren();
  if (showSpeaker) {
    const card = document.createElement('article'); card.className='tile item-card';
    card.innerHTML=`<div class="photo-wrap"><img class="photo" src="${IMG[speaker.foto_original_clave]}" alt="Fotografía real de ${escapeHtml(speaker.nombre)}"><span class="photo-type">Fotografía real · CAL</span></div><div class="tilebody"><span class="code">${speaker.codigo} <span class="small">· Código anterior: OB-06</span></span><h3>${escapeHtml(speaker.nombre)}</h3><p class="item-description">${escapeHtml(speaker.nota)}</p><span class="validation">Ubicación pendiente · Sin contenedor asignado</span></div>`;
    byId('objects').append(card); protectImages(card);
  }
  byId('objectCount').textContent=showSpeaker?'1 equipo':'0 equipos';
  byId('results').textContent=`${visible.length} contenedores · ${query ? found.length+' tipos encontrados' : '25 tipos propuestos'}${showSpeaker?' · 1 equipo sin ubicación':''}`;
}
function setFilter(value) {
  filter=value;
  document.querySelectorAll('.tab').forEach(tab=>{const active=tab.dataset.filter===filter;tab.classList.toggle('active',active);tab.setAttribute('aria-pressed',String(active));}); render();
}
function openContainer(id, focusItem) {
  const container = containers.find(c=>c.id===id);
  returnFocus=document.activeElement;
  byId('modalImg').src=IMG[container.img]; byId('modalImg').alt=container.title+', fotografía real de CAL';
  byId('modalTag').textContent=id; byId('modalArea').textContent=container.group;
  byId('modalTitle').textContent=container.title; byId('modalDescription').textContent=container.desc;
  byId('modalStatus').textContent='Contenido preliminar · Cantidades por confirmar';
  const content=items.filter(i=>i.container.codigo===id);
  byId('contentsCount').textContent=content.length===1?'1 tipo propuesto':`${content.length} tipos propuestos`;
  byId('containerItems').replaceChildren(...content.map(item=>itemCard(item)));
  byId('modalList').replaceChildren(...container.notes.map(note=>{const li=document.createElement('li');li.textContent=note;return li;}));
  overlay.querySelector('.storage-notes').open=false;
  overlay.classList.remove('hide'); document.body.style.overflow='hidden';
  document.querySelector('main').inert=true; document.querySelector('.app-header').inert=true;
  overlay.querySelector('.modal').scrollTop=0; byId('back').focus();
  if(focusItem) {
    const target=[...byId('containerItems').children].find(card=>card.dataset.itemId===focusItem);
    target.classList.add('matched-item'); target.scrollIntoView({block:'nearest'});
  }
}
function closeDetail() {
  overlay.classList.add('hide');document.body.style.overflow='';
  document.querySelector('main').inert=false;document.querySelector('.app-header').inert=false;
  if(returnFocus?.isConnected)returnFocus.focus();
}
search.addEventListener('input',()=>{if(proposal)render();});
document.querySelectorAll('.tab').forEach(tab=>tab.addEventListener('click',()=>{if(proposal)setFilter(tab.dataset.filter);}));
byId('close').addEventListener('click',closeDetail);byId('back').addEventListener('click',closeDetail);
overlay.addEventListener('click',event=>{if(event.target===overlay)closeDetail();});
document.addEventListener('keydown',event=>{
  if(overlay.classList.contains('hide'))return;
  if(event.key==='Escape')closeDetail();
  if(event.key==='Tab') {
    const focusable=[...overlay.querySelectorAll('button,a[href],summary')].filter(el=>el.getClientRects().length);
    const first=focusable[0],last=focusable.at(-1);
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
  }
});
async function init() {
  byId('results').textContent='Cargando catálogo…';
  try {
    [proposal,references]=await Promise.all(['inventario_propuesto.json','assets/items/references.json'].map(async url=>{const r=await fetch(url);if(!r.ok)throw Error(url);return r.json();}));
    items=proposal.contenedores.flatMap(container=>container.items.map(item=>({...item,container})));
    if(items.length!==25||new Set(items.map(i=>i.id)).size!==25||proposal.contenedores.length!==9)throw Error('Inventario inconsistente');
    render();
  } catch(error) {
    byId('results').textContent='No se pudo cargar el catálogo. Abre el sitio desde un servidor web y vuelve a intentarlo.';
    const retry=document.createElement('button');retry.type='button';retry.className='reset';retry.textContent='Reintentar';retry.addEventListener('click',()=>{retry.remove();init();});byId('results').append(' ',retry);
    console.error(error);
  }
}
init();

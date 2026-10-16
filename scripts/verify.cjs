// Run with Playwright available through NODE_PATH; it is not a site dependency.
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),vm=require('node:vm');
const assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');
const data=JSON.parse(fs.readFileSync(path.join(root,'inventario_propuesto.json')));
const proposed=data.contenedores.flatMap(c=>c.items.map(i=>({...i,container:c.codigo})));
assert.equal(proposed.length,25);assert.equal(new Set(proposed.map(i=>i.id)).size,25);
assert(proposed.every(i=>i.cantidad===null));
const old=execFileSync('git',['show','HEAD:catalog.js'],{cwd:root,encoding:'utf8',maxBuffer:12e6});
const current=fs.readFileSync(path.join(root,'catalog.js'),'utf8');
const extract=source=>vm.runInNewContext(source.slice(0,source.indexOf('const containers='))+';JSON.stringify(IMG)');
assert.equal(extract(old),extract(current),'All original photos preserved byte-for-byte');
const sourceContainers=vm.runInNewContext(current+';JSON.stringify(containers)');
assert.deepEqual(JSON.parse(sourceContainers).map(c=>c.id),data.contenedores.map(c=>c.codigo));
const refs=JSON.parse(fs.readFileSync(path.join(root,'assets/items/references.json')));
for(const [id,ref] of Object.entries(refs)){assert(proposed.some(i=>i.id===id));assert(fs.existsSync(path.join(root,ref.path)));assert(ref.author&&ref.source&&ref.license&&ref.licenseUrl);}
const prefix='/Cal-almacen-produccion/';
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.jpg':'image/jpeg','.png':'image/png','.webp':'image/webp'};
const server=http.createServer((req,res)=>{
 const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
 if(!pathname.startsWith(prefix)){res.writeHead(404);res.end();return;}
 const target=path.resolve(root,pathname.slice(prefix.length)||'index.html');
 if(!target.startsWith(root+path.sep)||!fs.existsSync(target)||fs.statSync(target).isDirectory()){res.writeHead(404);res.end();return;}
 res.setHeader('Content-Type',types[path.extname(target)]||'application/octet-stream');fs.createReadStream(target).pipe(res);
});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try {
  const page=await browser.newPage();const errors=[],failed=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)failed.push(r.url());});
  await page.goto(`http://127.0.0.1:${server.address().port}${prefix}`);
  await page.locator('#cards .tile').first().waitFor();
  assert.equal(await page.locator('#cards .tile').count(),9);
  assert.equal(await page.locator('#objects .item-card').count(),1);
  assert.equal(await page.locator('#searchItemsSection').isVisible(),false);
  const decode=()=>page.evaluate(async()=>{for(const img of document.images)if(img.getAttribute('src')){await img.decode();if(!img.naturalWidth||img.dataset.failed)throw Error('Image failed: '+img.src);}});
  for(const c of data.contenedores){
   await page.locator(`[data-container-id="${c.codigo}"]`).click();
   assert.equal(await page.locator('#containerItems .item-card').count(),c.items.length);
   assert.equal(await page.locator('#modalTag').innerText(),c.codigo);
   for(const i of c.items){assert.equal(await page.locator(`#containerItems [data-item-id="${i.id}"]`).count(),1);}
   assert.equal((await page.locator('#containerItems h4').allTextContents()).some(t=>t.includes('JBL')),false);
   await decode();
   await page.keyboard.press('Shift+Tab');
   assert.equal(await page.evaluate(()=>document.activeElement.tagName),'SUMMARY');
   await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>document.activeElement.id),'back');
   await page.keyboard.press('Escape');assert.equal(await page.locator('#overlay').isVisible(),false);
   assert.equal(await page.evaluate(()=>document.activeElement.dataset.containerId),c.codigo);
  }
  for(const item of proposed){
   await page.locator('#search').fill(item.nombre);
   assert.equal(await page.locator(`#searchItems [data-item-id="${item.id}"]`).count(),1);
   assert.equal(await page.locator(`[data-container-id="${item.container}"]`).count(),1);
  }
  await page.locator('#search').fill('microfono');assert(await page.locator('#searchItems .item-card').count()>0);
  await page.locator('#search').fill('HDMI');await page.locator('#searchItems .open-container').click();
  assert.equal(await page.locator('#modalTag').innerText(),'PR-02');await page.locator('#back').click();
  await page.locator('#search').fill('xyz000notfound');assert.equal(await page.locator('#cards .tile').count(),0);
  await page.locator('.reset').first().click();
  for(const area of ['Música','Sonido','Producción','Otros']){
   await page.locator(`[data-filter="${area}"]`).click();assert.equal(await page.locator('#cards .tile').count(),data.contenedores.filter(c=>c.area===area).length);
  }
  await page.locator('[data-filter="all"]').click();
  fs.mkdirSync(path.join(root,'previews'),{recursive:true});
  for(const width of [1440,375,390,430]){
   await page.setViewportSize({width,height:width===1440?1000:844});await page.mouse.move(0,0);await page.locator('#search').blur();await decode();
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`main overflow ${width}`);
   await page.screenshot({path:path.join(root,`previews/presentation-${width}.png`),fullPage:true});
   await page.locator('[data-container-id="PR-02"]').click();await decode();
   assert(await page.evaluate(()=>{const m=document.querySelector('.modal');return m.scrollWidth<=m.clientWidth&&m.getBoundingClientRect().right<=innerWidth;}),`detail overflow ${width}`);
   await page.screenshot({path:path.join(root,`previews/contents-${width}.png`)});
   await page.locator('#back').click();
  }
  assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);
  console.log(JSON.stringify({containers:9,uniqueProposedTypes:25,originalPhotosUnchanged:true,referenceCards:Object.keys(refs).length,placeholders:proposed.filter(i=>i.imagen.tipo!=='foto_real'&&!refs[i.id]).map(i=>i.id),widths:[1440,375,390,430],search:'25 names, accents, filters, reset, open container',keyboard:'focus trap, Escape, focus restoration',images:'all decoded through project subpath HTTP',errors,failed},null,2));
 } finally {await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});

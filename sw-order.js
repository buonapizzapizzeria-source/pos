/* Service worker dell'ordine online: pagina, foto e script restano sul telefono del cliente (anche offline) */
var V='bp-order-v14', SHELL=['order.html','foto-menu.js?v=b14','manifest-order.json'];
self.addEventListener('install',function(e){
  e.waitUntil(caches.open(V).then(function(c){return Promise.all(SHELL.map(function(u){return c.add(u).catch(function(){})}))}).then(function(){return self.skipWaiting()}));
});
self.addEventListener('activate',function(e){
  e.waitUntil(caches.keys().then(function(ks){return Promise.all(ks.filter(function(k){return k.indexOf('bp-order-')===0&&k!==V}).map(function(k){return caches.delete(k)}))}).then(function(){return self.clients.claim()}));
});
function put(req,res){if(res&&(res.ok||res.type==='opaque')){var cp=res.clone();caches.open(V).then(function(c){c.put(req,cp)})}return res}
self.addEventListener('fetch',function(e){
  var r=e.request; if(r.method!=='GET')return;
  var u=new URL(r.url), same=u.origin===self.location.origin;
  if(!same&&u.hostname!=='cdn.jsdelivr.net')return;          /* Supabase / API: sempre in rete */
  if(r.mode==='navigate'||/order\.html$/.test(u.pathname)){    /* pagina: rete prima, cache se offline */
    e.respondWith(fetch(r).then(function(res){return put('order.html',res)}).catch(function(){return caches.match('order.html').then(function(m){return m||caches.match(r)})}));return;
  }
  e.respondWith(caches.match(r).then(function(m){               /* foto/script: cache subito, aggiorna in background */
    var net=fetch(r).then(function(res){return put(r,res)}).catch(function(){return m});
    return m||net;
  }));
});

(function() {
  'use strict';

  const SUPABASE_URL = "https://ghhnnfrmftttptcejizp.supabase.co";
  const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoaG5uZnJtZnR0dHB0Y2VqaXpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyNjA1ODksImV4cCI6MjA5NzgzNjU4OX0.FM-sPvJJzviX2kA0GEHnznOppivm4JNyC4IPFv_RkdE";

  let supabase = null;
  function getSupabase() {
    if (supabase) return supabase;
    if (window.supabase && window.supabase.createClient) {
      supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
      console.info('✅ Supabase tersambung');
    }
    return supabase;
  }

  const PRODUCTS = [
    { id:'p_m1', name:'Rujak Segar', desc:'Kombinasi buah pilihan dengan sambal original Rujak.Co.', price:28000, cat:'classic', tags:['Pilihan Klasik','5 Buah'], badge:null, badgeColor:null, container:'Thinwall 750ml (PP Food Grade)', size:'Porsi Reguler', sambal:'Sambal Original (1 Cup)', buah:['Mangga Muda','Nanas','Bengkoang','Jambu Air','Kedondong'], flavor:'Segar & Autentik', flavorTag:null, defaultSpice:3, portion:'1 Orang', thumbnail:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-segar-thumb.webp', image:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-segar-hd.webp', isHidden:false },
    { id:'p_m2', name:'Rujak Serut', desc:'Buah diserut halus untuk pengalaman rasa yang lebih menyatu.', price:26000, cat:'classic', tags:['Renyah','Serut'], badge:null, badgeColor:null, container:'Thinwall 750ml (PP Food Grade)', size:'Porsi Reguler', sambal:'Sambal Original (1 Cup)', buah:['Mangga Muda','Bengkoang','Nanas','Ubi Merah'], flavor:'Renyah Segar', flavorTag:'Renyah', defaultSpice:3, portion:'1 Orang', thumbnail:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-serut-thumb.webp', image:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-serut-hd.webp', isHidden:false },
    { id:'p_m3', name:'Rujak Gaco', desc:'Enam buah pilihan dengan sambal mete premium.', price:40000, cat:'signature', tags:['Mete Premium','Bestseller'], badge:'Koleksi Favorit', badgeColor:'red', container:'Thinwall 750ml (PP Food Grade)', size:'Porsi Reguler', sambal:'Sambal Mete Premium (1 Cup)', buah:['Jambu Kristal','Mangga Muda','Nanas','Bengkoang','Jambu Air','Kedondong'], flavor:'Gurih Mete Premium', flavorTag:null, defaultSpice:3, portion:'1 Orang', thumbnail:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-gaco-thumb.webp', image:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-gaco-hd.webp', isHidden:false },
    { id:'p_m4', name:'Rujak Rama', desc:'Porsi melimpah untuk dua hingga tiga orang.', price:48000, cat:'signature', tags:['Porsi Besar','Sharing'], badge:'Untuk Dibagi Bersama', badgeColor:'red', container:'Thinwall Jumbo 1000ml (PP Food Grade)', size:'Porsi Sharing', sambal:'Sambal Mete Premium (2 Cup)', buah:['Jambu Kristal','Mangga Muda','Nanas','Bengkoang','Jambu Air','Kedondong'], flavor:'Gurih Mete Extra Pedas', flavorTag:null, defaultSpice:4, portion:'2-3 Orang', thumbnail:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-rama-thumb.webp', image:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-rama-hd.webp', isHidden:false },
    { id:'p_m5', name:'Rujak Mahkota', desc:'Koleksi premium dengan Shine Muscat.', price:85000, cat:'reserve', tags:['Eksklusif','Shine Muscat'], badge:'Reserve Collection', badgeColor:'gold', container:'Thinwall Jumbo 1000ml + Paper Bag', size:'Porsi Premium', sambal:'Sambal Mete Premium (2 Cup)', buah:['Shine Muscat','Jambu Kristal','Mangga Muda','Nanas','Bengkoang','Jambu Air','Kedondong'], flavor:'Eksklusif & Premium', flavorTag:null, defaultSpice:3, portion:'1-2 Orang', thumbnail:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-mahkota-thumb.webp', image:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-mahkota-hd.webp', isHidden:false },
    { id:'p_m6', name:'Tampah Nusantara', desc:'Sajian kebersamaan dalam tampah bambu.', price:200000, cat:'reserve', tags:['Tampah','Pre-Order'], badge:'Untuk 8-10 Orang', badgeColor:'gold', container:'Tampah Bambu Ø40cm + Kardus + Wrap', size:'Porsi Besar', sambal:'Varian Original & Mete (4 Cup)', buah:['Shine Muscat','Jambu Kristal','Mangga Muda','Nanas','Bengkoang','Jambu Air','Kedondong','Ubi Merah'], flavor:'Kemegahan Berbagai Rasa', flavorTag:null, defaultSpice:3, portion:'8-10 Orang', thumbnail:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/tampah-nusantara-thumb.webp', image:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/tampah-nusantara-hd.webp', isHidden:false },
    { id:'p_vip', name:'Mahkota VIP', desc:'Menu rahasia eksklusif dengan komposisi premium.', price:125000, cat:'reserve', tags:['Eksklusif','VIP Only'], badge:'Menu Rahasia', badgeColor:'gold', container:'Box Premium + Paper Bag', size:'Porsi Eksklusif', sambal:'Sambal Mete Premium Spesial (2 Cup)', buah:['Shine Muscat','Jambu Kristal','Mangga Harum Manis','Nanas Madu','Bengkoang','Strawberry'], flavor:'Premium & Misterius', flavorTag:'Limited', defaultSpice:2, portion:'1-2 Orang', thumbnail:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-mahkota-thumb.webp', image:'https://dk1tnyskaoive0dn.public.blob.vercel-storage.com/rujak-mahkota-hd.webp', isHidden:true }
  ];

  const ADDONS = [
    { id:'a_sambal1', name:'Sambal Original', price:8000, icon:'flame', iconColor:'text-red-500', desc:'Warisan rasa klasik.' },
    { id:'a_sambal2', name:'Sambal Mete Premium', price:12000, icon:'flame', iconColor:'text-red-600', desc:'Lebih gurih dan kaya rasa.' },
    { id:'a_extra_jambu', name:'Extra Jambu Kristal', price:10000, icon:'apple', iconColor:'text-green-500', desc:'Tambahan jambu kristal segar' },
    { id:'a_extra_muscat', name:'Extra Shine Muscat', price:15000, icon:'grape', iconColor:'text-purple-500', desc:'Tambahan anggur Shine Muscat impor' }
  ];

  const SYSTEM = { 
    DISCOUNT_THRESHOLD: 100000, 
    WA_NUMBER: '6289677161680', 
    TOAST_DURATION: 3000, 
    MAX_DISTANCE: 50, 
    DEFAULT_DISTANCE: 2,
    SUBSIDY_TIER1: 75000,
    SUBSIDY_TIER2: 125000,
    SUBSIDY_TIER3: 200000,
    SUBSIDY_AMOUNT1: 5000,
    SUBSIDY_AMOUNT2: 10000,
    PRIORITY_SURCHARGE: 8000,
    MAX_SUBSIDY: 30000
  };

  const DISTRICT_MAP = { 'bekasi barat':3,'bekasi timur':5,'bekasi selatan':7,'bekasi utara':8,'rawalumbu':6,'jatiasih':9,'pondokgede':12,'cikarang':18,'jakarta pusat':18,'jakarta selatan':20,'jakarta timur':15,'jakarta barat':22,'jakarta utara':25,'depok':28,'bogor':35,'tangerang':30,'tangerang selatan':27 };

  const state = {
    cart:{}, activeFilter:'all', searchQuery:'', userDistance:null, isPriority:false, orderNotes:'',
    isCartMinimized:false, customerName:'', customerPhone:'', customerAddress:'', isGift:false,
    giftSender:'', giftMessage:'', useManualDistrict:false, selectedDistrict:'', hasShared:false,
    shippingProvider:'rujakco', vehicleType:'motor', currentStep:1, currentSurge:null
  };

  let addToCartLocked = false;
  function lockAddToCart() { addToCartLocked = true; setTimeout(() => { addToCartLocked = false; }, 300); }

  function escapeHTML(str) { return String(str||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;'); }

  function fmt(num) { return 'Rp' + num.toLocaleString('id-ID'); }
  function loadCart() { try { const s=localStorage.getItem('rujak_cart'); if(s){ const p=JSON.parse(s); if(typeof p==='object'&&p!==null) state.cart=p; } } catch(_){ state.cart={}; } }
  function saveCart() { try { localStorage.setItem('rujak_cart',JSON.stringify(state.cart)); } catch(_) {} }
  
  function getItemById(id) {
    let item = PRODUCTS.find(p => p.id === id) || ADDONS.find(a => a.id === id);
    if (item) return item;
    const underscoreIndex = id.lastIndexOf('_');
    if (underscoreIndex > 0) {
      const baseId = id.substring(0, underscoreIndex);
      return PRODUCTS.find(p => p.id === baseId) || ADDONS.find(a => a.id === baseId);
    }
    return null;
  }
  
  function debounce(fn,delay){ let t; return function(...args){ clearTimeout(t); t=setTimeout(()=>fn.apply(this,args),delay); }; }

  function calculateDiscount(subtotal) { let discount=0; if(subtotal>=SYSTEM.DISCOUNT_THRESHOLD) discount+=5000; if(state.hasShared) discount+=5000; return discount; }

  // ===================== TARIF LALAMOVE REAL =====================
  function calculateLalamoveCost(distance, vehicleType) {
    const dist = Math.ceil(distance);
    if (vehicleType === 'motor') {
      if (dist <= 3) return 8000;
      if (dist <= 25) return 8000 + ((dist - 3) * 2000);
      return 8000 + (22 * 2000) + ((dist - 25) * 2400);
    }
    if (vehicleType === 'mobil') {
      if (dist <= 3) return 24000;
      if (dist <= 15) return 24000 + ((dist - 3) * 4500);
      return 24000 + (12 * 4500) + ((dist - 15) * 5000);
    }
    return 0;
  }

  function getZoneLabel(distance) {
    if (distance <= 5) return 'Zona A (0-5 km)';
    if (distance <= 10) return 'Zona B (5-10 km)';
    if (distance <= 15) return 'Zona C (10-15 km)';
    if (distance <= 20) return 'Zona D (15-20 km)';
    return 'Zona E (>20 km)';
  }

  // ===================== SURGE DETECTION (FIXED) =====================
  function isPeakHour() {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay();
    if (day === 0 || day === 6) return (hour >= 11 && hour <= 13);
    return (hour >= 11 && hour <= 13) || (hour >= 16 && hour <= 19);
  }

  function getSurgeMultiplier() {
    if (!isPeakHour()) {
      state.currentSurge = null;
      return 1.0;
    }
    if (state.currentSurge) return state.currentSurge;
    const surge = 1.3 + (Math.random() * 0.2);
    state.currentSurge = Math.round(surge * 10) / 10;
    return state.currentSurge;
  }

  // ===================== SHIPPING CALCULATION =====================
  function calculateShipping(distance, priority) {
    if (state.shippingProvider === 'pembeli') {
      return { cost: 0, label: 'Kurir Saya', distance, zone: null, surge: 1.0, isSurge: false, lalamoveCost: 0, baseLalamoveCost: 0 };
    }
    const rawDistance = (distance === null || distance === undefined || isNaN(distance)) ? SYSTEM.DEFAULT_DISTANCE : distance;
    if (rawDistance > SYSTEM.MAX_DISTANCE) {
      return { cost: null, label: 'Admin Konfirmasi', distance: rawDistance, zone: 'E', surge: 1.0, isSurge: false, lalamoveCost: 0, baseLalamoveCost: 0 };
    }
    const surgeMultiplier = getSurgeMultiplier();
    const isSurge = surgeMultiplier > 1.0;
    const lalamoveCost = calculateLalamoveCost(rawDistance, state.vehicleType);
    const surgedCost = Math.round(lalamoveCost * surgeMultiplier);
    const priorityCost = priority ? SYSTEM.PRIORITY_SURCHARGE : 0;
    const totalCost = surgedCost + priorityCost;
    const zoneLabel = getZoneLabel(rawDistance);
    const surgeLabel = isSurge ? ' ⚡Jam Sibuk' : '';
    return {
      cost: totalCost, lalamoveCost: surgedCost, baseLalamoveCost: lalamoveCost,
      surgeMultiplier: surgeMultiplier, isSurge: isSurge,
      label: zoneLabel + ' • ' + (state.vehicleType === 'motor' ? 'Motor' : 'Mobil') + (priority ? ' • Prioritas' : '') + surgeLabel,
      distance: rawDistance,
      zone: rawDistance <= 20 ? (rawDistance <= 5 ? 'A' : rawDistance <= 10 ? 'B' : rawDistance <= 15 ? 'C' : 'D') : 'E'
    };
  }

  function calculateSubsidy(subtotal, shippingZone, rawShippingCost) {
    if (shippingZone === 'E' || !rawShippingCost) return 0;
    let subsidy = 0;
    if (subtotal >= SYSTEM.SUBSIDY_TIER3 && ['A','B','C','D'].includes(shippingZone)) {
      subsidy = rawShippingCost;
    } else if (subtotal >= SYSTEM.SUBSIDY_TIER2) {
      subsidy = SYSTEM.SUBSIDY_AMOUNT2;
    } else if (subtotal >= SYSTEM.SUBSIDY_TIER1) {
      subsidy = SYSTEM.SUBSIDY_AMOUNT1;
    }
    if (subsidy > SYSTEM.MAX_SUBSIDY) subsidy = SYSTEM.MAX_SUBSIDY;
    return subsidy;
  }

  // ===================== LOCATION (FIXED IPAPI CACHE) =====================
  function getLocationFallback() {
    return new Promise(resolve => {
      const cached = localStorage.getItem('rujak_location');
      if (cached) {
        try {
          const data = JSON.parse(cached);
          const age = Date.now() - data.timestamp;
          if (age < 86400000 && data.distance < 900) {
            return resolve(data);
          }
        } catch(e) {}
      }
      fetch('https://ipapi.co/json/')
        .then(r => r.json())
        .then(data => {
          const city = data.city || data.region || 'Lokasi';
          let distance = 999;
          const c = city.toLowerCase();
          if (c.includes('bekasi')) distance = 2;
          else if (c.includes('jakarta')) distance = 15;
          else if (c.includes('depok')) distance = 20;
          else if (c.includes('tangerang')) distance = 25;
          else if (c.includes('bogor')) distance = 30;
          const result = { city, distance, timestamp: Date.now() };
          if (distance < 900) {
            try { localStorage.setItem('rujak_location', JSON.stringify(result)); } catch(e) {}
          }
          resolve(result);
        })
        .catch(() => resolve({ city: 'Lokasi Tidak Diketahui', distance: 999 }));
    });
  }

  function updateShippingUI(distance, isPriority) {
    const shipping = calculateShipping(distance, isPriority);
    const distEl = document.getElementById('shippingDistance');
    const costEl = document.getElementById('shippingCost');
    const outEl = document.getElementById('outOfRange');
    if (distEl) distEl.textContent = '~' + Math.ceil(distance) + ' km';
    if (shipping.zone === 'E') {
      if (costEl) { costEl.textContent = 'Konfirmasi'; costEl.style.color = 'var(--red)'; }
      if (outEl) outEl.style.display = 'block';
    } else if (state.shippingProvider === 'pembeli') {
      if (costEl) { costEl.textContent = 'Gratis'; costEl.style.color = 'var(--green)'; }
      if (outEl) outEl.style.display = 'none';
    } else {
      if (costEl) { costEl.textContent = shipping.cost ? fmt(shipping.cost) : 'Gratis'; costEl.style.color = 'var(--red)'; }
      if (outEl) outEl.style.display = 'none';
    }
    const mm = document.getElementById('miniCartModal');
    if (mm && mm.classList.contains('active')) renderMiniCart();
  }

  function detectLocation() {
    const STORE_LAT=-6.2333,STORE_LNG=107.0;
    const costEl = document.getElementById('shippingCost');
    if (costEl) costEl.textContent = '⏳';
    if(state.useManualDistrict&&state.selectedDistrict){ const dist=DISTRICT_MAP[state.selectedDistrict]||SYSTEM.DEFAULT_DISTANCE; state.userDistance=dist; const distName=state.selectedDistrict.replace(/\b\w/g,l=>l.toUpperCase()); document.getElementById('locationDisplay').textContent=distName+' ▾'; updateShippingUI(dist,state.isPriority); return; }
    if(navigator.geolocation){ navigator.geolocation.getCurrentPosition(pos=>{ const lat=pos.coords.latitude,lng=pos.coords.longitude; const R=6371; const dLat=(lat-STORE_LAT)*Math.PI/180; const dLon=(lng-STORE_LNG)*Math.PI/180; const a=Math.sin(dLat/2)**2+Math.cos(STORE_LAT*Math.PI/180)*Math.cos(lat*Math.PI/180)*Math.sin(dLon/2)**2; const distance=R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a)); fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=10&accept-language=id`).then(r=>r.json()).then(data=>{ const city=data.address?.city||data.address?.town||'Lokasi Anda'; state.userDistance=distance; document.getElementById('locationDisplay').textContent=city+' ▾'; updateShippingUI(distance,state.isPriority); }).catch(()=>{ state.userDistance=distance; document.getElementById('locationDisplay').textContent='Lokasi Anda ▾'; updateShippingUI(distance,state.isPriority); }); },()=>{ getLocationFallback().then(({city,distance})=>{ state.userDistance=distance; document.getElementById('locationDisplay').textContent=city+' ▾'; updateShippingUI(distance,state.isPriority); }); },{enableHighAccuracy:true,timeout:10000}); } else { getLocationFallback().then(({city,distance})=>{ state.userDistance=distance; document.getElementById('locationDisplay').textContent=city+' ▾'; updateShippingUI(distance,state.isPriority); }); }
  }

  function getCartSummary() {
    const items=[]; let subtotal=0,totalQty=0;
    Object.keys(state.cart).forEach(id=>{ const entry=state.cart[id]; const item=getItemById(id); if(item&&entry&&entry.qty>0){ const lineTotal=item.price*entry.qty; subtotal+=lineTotal; totalQty+=entry.qty; items.push({id,name:item.name,price:item.price,qty:entry.qty,spice:entry.spice||null,lineTotal}); } else { delete state.cart[id]; } });
    const discount=calculateDiscount(subtotal);
    const distance=state.userDistance!==null?state.userDistance:SYSTEM.DEFAULT_DISTANCE;
    const shipping=calculateShipping(distance,state.isPriority);
    const rawShippingCost=shipping.cost||0;
    const shippingSubsidy=calculateSubsidy(subtotal,shipping.zone,rawShippingCost);
    const shippingCost=state.shippingProvider==='pembeli'?0:Math.max(0,rawShippingCost-shippingSubsidy);
    const total=subtotal-discount+shippingCost;
    return {items,totalQty,subtotal,discount,shippingCost,shippingSubsidy,rawShippingCost,lalamoveCost:shipping.lalamoveCost,baseLalamoveCost:shipping.baseLalamoveCost,surgeMultiplier:shipping.surgeMultiplier,isSurge:shipping.isSurge,shippingLabel:shipping.label,shippingDistance:shipping.distance,shippingZone:shipping.zone,total,isOutOfRange:shipping.zone==='E',shippingProvider:state.shippingProvider,vehicleType:state.vehicleType};
  }

  function renderMenu() {
    const container=document.getElementById('menuList'),empty=document.getElementById('emptyState'),skeleton=document.getElementById('skeletonContainer');
    if (skeleton) skeleton.style.display='none';
    if (!container) return;
    container.style.display='block';
    if(state.activeFilter==='addon'){ container.innerHTML=''; if(empty) empty.style.display='none'; return; }
    let filtered=PRODUCTS.filter(p=>{ if(p.isHidden&&!state.searchQuery.toLowerCase().includes('vip')) return false; const matchCat=(state.activeFilter==='all'||p.cat===state.activeFilter); const q=state.searchQuery.toLowerCase(); return matchCat&&(p.name.toLowerCase().includes(q)||p.desc.toLowerCase().includes(q)); });
    if(!filtered.length){ if(empty) empty.style.display='block'; container.innerHTML=''; return; }
    if(empty) empty.style.display='none';
    let html='';
    filtered.forEach(p=>{ let qty=0,firstCartKey=p.id; Object.keys(state.cart).forEach(k=>{ if(k===p.id||k.startsWith(p.id+'_')){ qty+=state.cart[k].qty; if(qty===state.cart[k].qty) firstCartKey=k; } }); const control=qty===0?`<button type="button" class="add-btn" data-action="open-modal" data-id="${p.id}"><i data-lucide="plus" class="w-4 h-4"></i></button>`:`<div class="qty-control"><button type="button" class="qty-btn" data-action="decrease" data-id="${firstCartKey}">−</button><span class="qty-num">${qty}</span><button type="button" class="qty-btn" data-action="increase" data-id="${firstCartKey}">+</button></div>`; const badgeRight=p.badge?`<span class="item-badge-right ${p.badgeColor}">${escapeHTML(p.badge)}</span>`:''; const flavorTag=p.flavorTag?`<span class="item-flavor-tag">${escapeHTML(p.flavorTag)}</span>`:'';
    const defaultSpice=p.defaultSpice||3; const spiceIcons=Array(5).fill(null).map((_,i)=>i<defaultSpice?'🌶️':'<span style="opacity:0.25">🌶️</span>').join('');
    const buahChips=(p.buah||[]).slice(0,4).map(b=>`<span class="item-buah-chip">${escapeHTML(b)}</span>`).join(''); const moreChips=(p.buah||[]).length>4?`<span class="item-buah-chip">+${p.buah.length-4}</span>`:''; html+=`<div class="menu-item" data-id="${p.id}" tabindex="0" role="button" aria-label="Detail ${escapeHTML(p.name)}"><div class="item-img-wrap"><img src="${p.thumbnail}" alt="${escapeHTML(p.name)}" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'; this.nextElementSibling.textContent='${escapeHTML(p.name.substring(0,20))}'"><div class="fallback" style="display:none;">${escapeHTML(p.name.substring(0,20))}</div></div><div class="item-body"><div class="item-name-row"><span class="item-name">${escapeHTML(p.name)}</span>${badgeRight}</div><div class="item-flavor-row"><span class="item-flavor">${escapeHTML(p.flavor)}</span>${flavorTag}</div><div class="item-spice" style="display:flex;align-items:center;gap:4px;font-size:11px;"><span style="font-size:10px;color:var(--gray-500);">Pedas:</span>${spiceIcons}<span style="font-size:10px;color:var(--gray-400);">(bisa diatur)</span></div><p class="item-desc">${escapeHTML(p.desc)}</p><div class="item-buah-chips">${buahChips}${moreChips}</div><div class="item-footer"><div><span class="item-price">${fmt(p.price)}</span><span class="item-portion"> · ${p.portion}</span></div>${control}</div></div></div>`; });
    container.innerHTML=html;
  }

  function renderAddons() {
    const container=document.getElementById('addonList'); if(!container) return;
    const q=state.searchQuery.toLowerCase(); const filtered=ADDONS.filter(a=>a.name.toLowerCase().includes(q)||a.desc.toLowerCase().includes(q)); let html='';
    filtered.forEach(a=>{ const entry=state.cart[a.id]; const qty=entry?entry.qty:0; const control=qty===0?`<button type="button" class="addon-add" data-action="add-addon" data-id="${a.id}"><i data-lucide="plus" class="w-4 h-4"></i></button>`:`<div class="qty-control"><button type="button" class="qty-btn" data-action="decrease" data-id="${a.id}">−</button><span class="qty-num">${qty}</span><button type="button" class="qty-btn" data-action="increase" data-id="${a.id}">+</button></div>`; html+=`<div class="addon-card"><div class="addon-icon ${a.iconColor}"><i data-lucide="${a.icon}" class="w-6 h-6"></i></div><div class="addon-name">${escapeHTML(a.name)}</div><div class="addon-desc">${escapeHTML(a.desc)}</div><div class="addon-footer"><span class="addon-price">${fmt(a.price)}</span>${control}</div></div>`; });
    container.innerHTML=html; const header=document.getElementById('addonHeader'),divider=document.getElementById('addonDivider'); const show=filtered.length>0; if(header) header.style.display=show?'flex':'none'; if(divider) divider.style.display=show?'block':'none';
  }

  function updateProgressBar(subtotal) { const container=document.getElementById('progressContainer'); if(!container) return; if(subtotal>=SYSTEM.DISCOUNT_THRESHOLD){ container.style.display='none'; return; } const remaining=SYSTEM.DISCOUNT_THRESHOLD-subtotal; const progressPercent=Math.min(100,Math.round((subtotal/SYSTEM.DISCOUNT_THRESHOLD)*100)); container.style.display='block'; document.getElementById('progressLabel').textContent=`Tambah ${fmt(remaining)} lagi untuk potongan Rp5.000`; document.getElementById('progressPercent').textContent=progressPercent+'%'; document.getElementById('progressFill').style.width=progressPercent+'%'; document.getElementById('progressFill').style.background=progressPercent>=80?'var(--green)':'var(--red)'; }
  function updateMissionCheckboxes(subtotal) { const ms=document.getElementById('missionSpend'),cs=document.getElementById('checkShare'); if(ms) ms.checked=subtotal>=SYSTEM.DISCOUNT_THRESHOLD; if(cs) cs.checked=state.hasShared; }

  function renderCart() {
    const summary=getCartSummary(); updateProgressBar(summary.subtotal); updateMissionCheckboxes(summary.subtotal);
    const bar=document.getElementById('bottom-bar'),dl=document.getElementById('discountLabel'),te=document.getElementById('cartTotalDisplay'),footer=document.querySelector('.footer-brand');
    if(summary.totalQty>0&&!state.isCartMinimized){ if(bar) bar.classList.add('visible'); if(footer) footer.style.paddingBottom='180px'; document.getElementById('cartPreview').textContent=summary.totalQty+' item'+(summary.totalQty>1?'s':''); if(summary.discount>0){ dl.style.display='inline-block'; dl.textContent='-Rp'+summary.discount.toLocaleString('id-ID'); te.innerHTML=`<span style="text-decoration:line-through;font-size:11px;color:#9CA3AF;margin-right:4px;">${fmt(summary.subtotal)}</span>${fmt(summary.subtotal-summary.discount)}`; } else { dl.style.display='none'; te.textContent=fmt(summary.subtotal); } } else { if(bar) bar.classList.remove('visible'); if(footer) footer.style.paddingBottom='0'; }
    saveCart(); updateFloatingButton();
  }

  function renderMiniCart() {
    const summary=getCartSummary(); const list=document.getElementById('miniCartList'); let html='';
    if(summary.items.length===0){ html='<p style="color:var(--gray-500);text-align:center;padding:20px 0;">Keranjang kosong</p>'; } else { summary.items.forEach(item=>{ const spiceText=item.spice?' (Level '+item.spice+')':''; html+=`<div class="mini-cart-item"><div class="mini-cart-info"><div class="mini-cart-name">${escapeHTML(item.name)}${spiceText}</div><div class="mini-cart-detail">${fmt(item.price)}</div></div><div class="mini-cart-qty"><button data-action="decrease" data-id="${item.id}">−</button><span>${item.qty}</span><button data-action="increase" data-id="${item.id}">+</button><button class="mini-cart-remove" data-action="remove" data-id="${item.id}">🗑️</button></div></div>`; }); }
    list.innerHTML=html; document.getElementById('cartSubtotalDisplay').textContent=fmt(summary.subtotal);

    const step1Progress=document.getElementById('step1Progress');
    if(step1Progress&&summary.items.length>0){
      let progressHTML='';
      const remaining=SYSTEM.DISCOUNT_THRESHOLD-summary.subtotal;
      const progressPercent=Math.min(100,Math.round((summary.subtotal/SYSTEM.DISCOUNT_THRESHOLD)*100));
      if(remaining>0){ progressHTML+=`<div style="background:white;border:1px solid var(--gray-200);border-radius:12px;padding:12px;margin-bottom:8px;"><div style="display:flex;justify-content:space-between;font-size:12px;font-weight:600;margin-bottom:6px;"><span>🎯 Tambah ${fmt(remaining)} lagi dapat potongan Rp5.000</span><span style="color:var(--green);">${progressPercent}%</span></div><div style="width:100%;height:6px;background:var(--gray-200);border-radius:10px;overflow:hidden;"><div style="width:${progressPercent}%;height:100%;background:${progressPercent>=80?'var(--green)':'var(--red)'};border-radius:10px;transition:width 0.4s;"></div></div></div>`; } else { progressHTML+=`<div style="background:var(--green-pale);border:1px solid var(--green);border-radius:12px;padding:10px 12px;text-align:center;font-weight:700;color:var(--green);font-size:13px;margin-bottom:8px;">✅ Diskon Rp5.000 aktif!</div>`; }
      
      if(!summary.isOutOfRange){
        if(state.shippingProvider==='pembeli'){
          progressHTML+=`<div style="background:white;border:1px solid var(--gold);border-radius:12px;padding:10px 12px;text-align:center;font-size:12px;font-weight:600;color:#92400e;">💡 Pilih <strong>Kurir Rujak.Co</strong> untuk dapat subsidi pengiriman!</div>`;
        } else {
          if(summary.isSurge){
            progressHTML+=`<div style="background:#FFF3CD;border:1px solid #F4C430;border-radius:10px;padding:8px 10px;margin-bottom:8px;text-align:center;font-size:11px;font-weight:600;color:#92400e;">⚡ Jam sibuk: tarif kurir sedang tinggi. Subsidi tetap berlaku maks. Rp30.000.</div>`;
          }
          if(summary.subtotal>=SYSTEM.SUBSIDY_TIER3){
            const afterSubsidy=Math.max(0,summary.rawShippingCost-SYSTEM.MAX_SUBSIDY);
            if(afterSubsidy>0){ progressHTML+=`<div style="background:var(--green-pale);border:1px solid var(--green);border-radius:12px;padding:10px 12px;text-align:center;font-weight:700;color:var(--green);font-size:13px;">🚚 Gratis Ongkir (Maks. Subsidi Rp30.000) — Sisa ${fmt(afterSubsidy)}</div>`; }
            else { progressHTML+=`<div style="background:var(--green-pale);border:1px solid var(--green);border-radius:12px;padding:10px 12px;text-align:center;font-weight:700;color:var(--green);font-size:13px;">🚚 Gratis Pengiriman!</div>`; }
          } else if(summary.subtotal>=SYSTEM.SUBSIDY_TIER2){ progressHTML+=`<div style="background:var(--green-pale);border:1px solid var(--green);border-radius:12px;padding:10px 12px;text-align:center;font-weight:700;color:var(--green);font-size:13px;">✅ Subsidi Pengiriman Rp10.000 aktif!</div>`; }
          else if(summary.subtotal>=SYSTEM.SUBSIDY_TIER1){ const toNext=SYSTEM.SUBSIDY_TIER2-summary.subtotal; progressHTML+=`<div style="background:white;border:1px solid var(--gold);border-radius:12px;padding:10px 12px;text-align:center;font-size:12px;font-weight:600;color:#92400e;">🚀 Tambah ${fmt(toNext)} lagi → Subsidi Rp10.000</div>`; }
          else { const toSubsidy=SYSTEM.SUBSIDY_TIER1-summary.subtotal; progressHTML+=`<div style="background:white;border:1px solid var(--gray-200);border-radius:12px;padding:10px 12px;text-align:center;font-size:12px;font-weight:600;color:var(--gray-500);">📦 Tambah ${fmt(toSubsidy)} lagi → Subsidi Rp5.000</div>`; }
        }
      }
      step1Progress.innerHTML=progressHTML;
    }

    const upsellDiv=document.getElementById('step1Upsell');
    if(upsellDiv&&summary.items.length>0){
      const hasGaco=summary.items.some(i=>i.id.startsWith('p_m3'));
      const hasMahkota=summary.items.some(i=>i.id.startsWith('p_m5'));
      const hasRama=summary.items.some(i=>i.id.startsWith('p_m4'));
      const hasTampah=summary.items.some(i=>i.id.startsWith('p_m6'));
      let upsellHTML='';
      if(hasGaco&&!hasRama&&!hasMahkota){ const diff=48000-40000; upsellHTML=`<div style="background:#fff3cd;border:1px solid #F4C430;border-radius:10px;padding:10px 12px;margin-top:8px;text-align:center;font-size:12px;font-weight:600;color:#3d2b00;">✨ Tambah ${fmt(diff)} lagi → Upgrade ke <strong>Rujak Rama</strong> (porsi 2-3 orang)</div>`; }
      else if(hasRama&&!hasMahkota&&!hasTampah){ const diff=85000-48000; upsellHTML=`<div style="background:#fff3cd;border:1px solid #F4C430;border-radius:10px;padding:10px 12px;margin-top:8px;text-align:center;font-size:12px;font-weight:600;color:#3d2b00;">👑 Tambah ${fmt(diff)} lagi → Upgrade ke <strong>Rujak Mahkota</strong> (premium)</div>`; }
      else if(hasMahkota&&!hasTampah){ upsellHTML=`<div style="background:#fff3cd;border:1px solid #F4C430;border-radius:10px;padding:10px 12px;margin-top:8px;text-align:center;font-size:12px;font-weight:600;color:#3d2b00;">🎉 Butuh untuk acara? <strong>Tampah Nusantara</strong> (8-10 orang) — Gratis Ongkir!</div>`; }
      upsellDiv.innerHTML=upsellHTML;
    }

    const s2c=document.getElementById('step2ShippingCost'),s2d=document.getElementById('step2Distance'),s2z=document.getElementById('step2Zone'),s2s=document.getElementById('step2Subsidy'),s2b=document.getElementById('step2BaseCost');
    if(s2c&&summary.shippingProvider==='rujakco'){
      if(summary.isOutOfRange){ s2c.textContent='Konfirmasi Admin'; if(s2z) s2z.textContent=summary.shippingLabel; if(s2s) s2s.style.display='none'; if(s2b) s2b.style.display='none'; }
      else { s2c.textContent=fmt(summary.shippingCost); if(s2z) s2z.textContent=summary.shippingLabel;
        if(s2b&&summary.lalamoveCost>0){ s2b.style.display='block'; let baseHTML=`🚚 Tarif Kurir: <strong>${fmt(summary.lalamoveCost)}</strong>`; if(summary.isSurge){ baseHTML+=` <span style="font-size:10px;color:#D62828;">(⚡Jam Sibuk ${summary.surgeMultiplier}x)</span>`; } s2b.innerHTML=baseHTML; }
        if(s2s&&summary.shippingSubsidy>0){ s2s.style.display='block'; s2s.innerHTML=`💰 Subsidi Rujak.Co: <strong style="color:var(--green);">-${fmt(summary.shippingSubsidy)}</strong> ${summary.rawShippingCost-summary.shippingSubsidy>SYSTEM.MAX_SUBSIDY?'(Maks. Rp30.000)':''}`; } else if(s2s){ s2s.style.display='none'; }
      }
    } else if(s2c&&summary.shippingProvider==='pembeli'){ s2c.textContent='Gratis'; if(s2z) s2z.textContent='Kurir Saya'; if(s2s) s2s.style.display='none'; if(s2b) s2b.style.display='none'; }
    if(s2d) s2d.textContent='~'+Math.ceil(summary.shippingDistance)+' km';

    document.getElementById('finalSubtotal').textContent=fmt(summary.subtotal);
    document.getElementById('finalDiscount').textContent=summary.discount>0?'-Rp'+summary.discount.toLocaleString('id-ID'):'Rp0';
    document.getElementById('finalShipping').textContent=summary.isOutOfRange?'Konfirmasi Admin':fmt(summary.shippingCost);
    const fs=document.getElementById('finalSubsidy'); if(fs&&summary.shippingSubsidy>0){ fs.style.display='flex'; fs.innerHTML=`<span>Subsidi Pengiriman</span><span style="color:var(--green);">-${fmt(summary.shippingSubsidy)}</span>`; } else if(fs){ fs.style.display='none'; }
    document.getElementById('finalTotal').textContent=summary.isOutOfRange?'Konfirmasi':fmt(summary.total);

    document.getElementById('orderNotes').value=state.orderNotes; document.getElementById('customerName').value=state.customerName; document.getElementById('customerPhone').value=state.customerPhone; document.getElementById('customerAddress').value=state.customerAddress; document.getElementById('giftToggle').checked=state.isGift; document.getElementById('giftSender').value=state.giftSender; document.getElementById('giftMessage').value=state.giftMessage; document.getElementById('giftFields').style.display=state.isGift?'block':'none';
    document.querySelectorAll('.ship-btn').forEach(b=>b.classList.toggle('active',b.dataset.provider===state.shippingProvider)); const ro=document.getElementById('rujakcoOptions'); if(ro) ro.style.display=state.shippingProvider==='rujakco'?'block':'none'; document.querySelectorAll('.veh-btn').forEach(b=>b.classList.toggle('active',b.dataset.vehicle===state.vehicleType));
    const bp=document.getElementById('btnOpenPayment'); if(state.userDistance===null){ bp.disabled=true; bp.textContent='⏳ Mencari lokasi...'; } else if(summary.isOutOfRange){ bp.disabled=true; bp.textContent='Admin Konfirmasi'; } else if(summary.items.length===0){ bp.disabled=true; bp.textContent='Keranjang kosong'; } else { bp.disabled=false; bp.textContent='💳 Bayar Via QRIS'; }
    if(typeof lucide!=='undefined'&&lucide.createIcons) lucide.createIcons();
  }

  function updateUI() { renderMenu(); renderAddons(); renderCart(); const mm=document.getElementById('miniCartModal'); if(mm&&mm.classList.contains('active')) renderMiniCart(); updateClearButton(); updateFloatingButton(); if(typeof lucide!=='undefined'&&lucide.createIcons) lucide.createIcons(); }

  function goToStep(step) { state.currentStep=step; document.querySelectorAll('.cart-step').forEach(el=>{ el.style.display='none'; el.classList.remove('active'); }); const se=document.getElementById(`cartStep${step}`); if(se){ se.style.display='block'; se.classList.add('active'); } document.querySelectorAll('.step').forEach((el,i)=>{ el.classList.remove('active','done'); if(i+1===step) el.classList.add('active'); else if(i+1<step) el.classList.add('done'); }); renderMiniCart(); }
  window.goToStep=goToStep;

  const productModal=document.getElementById('productModal'); let currentProductId=null; const SPICE_NAMES=['Mild','Sedang','Pedas','Extra Pedas','Very Hot'];

  function openProductModal(id) {
    const product=PRODUCTS.find(p=>p.id===id); if(!product) return; currentProductId=id;
    document.getElementById('modalImg').innerHTML=`<img src="${product.image}" alt="${escapeHTML(product.name)}" onerror="this.style.display='none'; this.parentElement.textContent='${escapeHTML(product.name.substring(0,20))}';">`;
    const be=document.getElementById('modalBadge'); if(product.badge){ be.style.display='inline-block'; be.textContent=product.badge; be.className='modal-badge-eyebrow '+(product.badgeColor||''); } else be.style.display='none';
    document.getElementById('modalTitle').textContent=product.name; document.getElementById('modalDesc').textContent=product.desc;
    document.getElementById('modalContainer').textContent=product.container||'-'; document.getElementById('modalSize').textContent=product.size||'-'; document.getElementById('modalSambal').textContent=product.sambal||'-';
    document.getElementById('modalBuahText').textContent=(product.buah||[]).join(', ');
    document.getElementById('modalTags').innerHTML=(product.tags||[]).map(t=>`<span class="modal-tag">${escapeHTML(t)}</span>`).join('');
    const ritualDiv=document.createElement('div'); ritualDiv.style.cssText='background:var(--ivory);border:1px solid var(--green-pale);border-radius:10px;padding:10px 12px;margin:8px 0;'; ritualDiv.innerHTML=`<div style="font-size:10px;font-weight:700;color:var(--green);text-transform:uppercase;letter-spacing:.05em;">🎯 Ritual Nikmat</div><div style="font-size:11px;color:var(--gray-700);margin-top:4px;line-height:1.6;"><span style="color:var(--green);font-weight:700;">①</span> Tuang sambal ke wadah<br><span style="color:var(--green);font-weight:700;">②</span> Aduk rata & nikmati tiap gigitan<br><span style="color:var(--green);font-weight:700;">③</span> Tambah level pedas sesuai selera</div>`; document.getElementById('modalTags').after(ritualDiv);
    const breakdown=product.price<=30000?`${(product.buah||[]).length} jenis buah segar • sambal homemade • wadah food grade`:product.price<=85000?`${(product.buah||[]).length} jenis buah premium • sambal spesial • wadah jumbo`:`${(product.buah||[]).length}+ jenis buah • tampah bambu • sambal variant`; const hargaDiv=document.createElement('div'); hargaDiv.style.cssText='font-size:10px;color:var(--gray-500);margin:4px 0 6px;line-height:1.4;text-align:center;'; hargaDiv.innerHTML=`💰 <strong>${fmt(product.price)}</strong> sudah termasuk:<br>${breakdown}`; const detailGrid=document.getElementById('modalDetailGrid'); if(detailGrid) detailGrid.after(hargaDiv);
    document.getElementById('btnPrice').textContent=fmt(product.price); document.getElementById('modalAdd').dataset.id=product.id;
    const sel=document.getElementById('spiceSelect'); const dv=product.defaultSpice||3; sel.value=dv; updateSpiceHighlight(dv); sel.onchange=function(){ updateSpiceHighlight(parseInt(this.value,10)); };
    productModal.classList.add('active'); document.body.style.overflow='hidden';
  }
  function updateSpiceHighlight(l){ document.getElementById('modalSpiceLabel').textContent=l+' - '+(SPICE_NAMES[l-1]||'Pedas'); }
  function closeProductModal(){ productModal.classList.remove('active'); document.body.style.overflow=''; currentProductId=null; }

  const miniCartModal=document.getElementById('miniCartModal');
  function openMiniCart(){ goToStep(1); if(miniCartModal){ miniCartModal.classList.add('active'); document.body.style.overflow='hidden'; } }
  function closeMiniCart(){ state.orderNotes=document.getElementById('orderNotes').value; state.customerName=document.getElementById('customerName').value.trim(); state.customerPhone=document.getElementById('customerPhone').value.trim(); state.customerAddress=document.getElementById('customerAddress').value.trim(); state.isGift=document.getElementById('giftToggle').checked; state.giftSender=document.getElementById('giftSender').value.trim(); state.giftMessage=document.getElementById('giftMessage').value.trim(); if(miniCartModal){ miniCartModal.classList.remove('active'); document.body.style.overflow=''; } saveCustomerData(); }
  function clearCart(){ if(Object.keys(state.cart).length===0) return showToast('Keranjang sudah kosong'); if(confirm('Yakin ingin mengosongkan keranjang?')){ state.cart={}; updateUI(); if(miniCartModal&&miniCartModal.classList.contains('active')) renderMiniCart(); showToast('Keranjang dikosongkan'); } }

  async function saveOrderToDatabase(orderItems,total,subtotal,shippingCost,discount) {
    const client=getSupabase(); if(!client){ console.warn('⚠️ Supabase belum siap'); return false; }
    try { const payload={ customer_name:state.customerName||'Guest',customer_phone:state.customerPhone||'',customer_address:state.customerAddress||'',items:orderItems,subtotal,shipping_cost:shippingCost,discount,total,status:'pending',is_gift:state.isGift,gift_sender:state.giftSender||null,gift_message:state.giftMessage||null,mission_shared:state.hasShared,shipping_provider:state.shippingProvider,vehicle:state.vehicleType,priority:state.isPriority }; const {error}=await client.from('orders').insert([payload]); if(error) throw error; return true; } catch(err){ console.error('Supabase error:',err); return false; }
  }

  function handleCheckout() {
    const summary=getCartSummary(); if(summary.isOutOfRange) return showToast('Maaf, area Anda di luar jangkauan. Admin akan menghubungi.');
    const name=state.customerName.trim(),phone=state.customerPhone.trim(),address=state.customerAddress.trim();
    if(!name||name.length<2) return showToast('❌ Nama penerima tidak valid'),document.getElementById('customerName').focus();
    const phoneRegex=/^(08\d{8,11}|\+628\d{8,10}|628\d{8,10})$/; const cleanedPhone=phone.replace(/[\s\-\(\)]/g,'');
    if(!cleanedPhone) return showToast('❌ Nomor HP wajib diisi'),document.getElementById('customerPhone').focus();
    if(!phoneRegex.test(cleanedPhone)){ if(cleanedPhone.startsWith('0')&&cleanedPhone.length<10) return showToast('❌ Nomor HP terlalu pendek (min 10 digit)'),document.getElementById('customerPhone').focus(); if(cleanedPhone.startsWith('0')&&cleanedPhone.length>13) return showToast('❌ Nomor HP terlalu panjang (max 13 digit)'),document.getElementById('customerPhone').focus(); return showToast('❌ Format: 08xx, +628xx, atau 628xx'),document.getElementById('customerPhone').focus(); }
    if(!address||address.length<5) return showToast('❌ Alamat pengiriman tidak valid'),document.getElementById('customerAddress').focus();
    if(summary.items.length===0) return showToast('Keranjang kosong');
    const payBtn=document.querySelector('[data-action="confirm-wa"]'); if(payBtn){ payBtn.textContent='⏳ Menyimpan...'; payBtn.disabled=true; }
    saveOrderToDatabase(summary.items,summary.total,summary.subtotal,summary.shippingCost,summary.discount).then((saved)=>{ showToast(saved?'✅ Pesanan tersimpan!':'⚠️ Lanjut WhatsApp tanpa simpan'); }).catch(()=>{ showToast('⚠️ Gagal menyimpan, lanjut WhatsApp'); }).finally(()=>{ setTimeout(()=>{ if(payBtn){ payBtn.textContent='💳 Kirim Bukti Transfer'; payBtn.disabled=false; } },1000); setTimeout(()=>{ let msg='Halo Rujak.Co! Saya ingin memesan:\n\n'; summary.items.forEach(item=>{ const spiceText=item.spice?' (Level '+item.spice+')':''; msg+='• '+item.name+spiceText+' (x'+item.qty+') — '+fmt(item.lineTotal)+'\n'; }); if(state.orderNotes) msg+='\n*Catatan Pesanan:*\n'+state.orderNotes+'\n'; if(state.isGift){ msg+='\n🎁 *PESANAN KADO*\n'; if(state.giftSender) msg+='Dari: '+state.giftSender+'\n'; if(state.giftMessage) msg+='Ucapan: '+state.giftMessage+'\n'; } msg+='\n*Pengiriman:* '+(state.shippingProvider==='pembeli'?'Kurir Saya':'Kurir Rujak.Co - '+state.vehicleType+(state.isPriority?' (Prioritas)':'')); msg+='\n*Data:*\nNama : '+name+'\nNo. HP : '+phone+'\nAlamat : '+address+'\n'; if(state.shippingProvider==='rujakco'){ msg+='\nBiaya Pengantaran: '+fmt(summary.rawShippingCost)+' ('+summary.shippingLabel+')'; if(summary.lalamoveCost>0) msg+='\n  └ Tarif Kurir: '+fmt(summary.lalamoveCost); if(summary.shippingSubsidy>0) msg+='\n  └ Subsidi Rujak.Co: -'+fmt(summary.shippingSubsidy); msg+='\n  └ Total Bayar: '+fmt(summary.shippingCost); } msg+='\nSubtotal: '+fmt(summary.subtotal); if(summary.discount>0) msg+='\nDiskon Misi Jajan: -'+fmt(summary.discount); msg+='\n*Total Akhir: '+fmt(summary.total)+'*\n\n*Saya sudah transfer via QRIS, ini bukti transfernya:*\n*(sertakan foto)*'; window.open('https://wa.me/'+SYSTEM.WA_NUMBER+'?text='+encodeURIComponent(msg),'_blank'); },500); });
  }

  function saveCustomerData(){ try { localStorage.setItem('rujak_customer',JSON.stringify({ name:state.customerName,phone:state.customerPhone,address:state.customerAddress,isGift:state.isGift,giftSender:state.giftSender,giftMessage:state.giftMessage,hasShared:state.hasShared,shippingProvider:state.shippingProvider,vehicleType:state.vehicleType })); } catch(_) {} }
  function loadCustomerData(){ try { const raw=localStorage.getItem('rujak_customer'); if(raw){ const data=JSON.parse(raw); state.customerName=data.name||''; state.customerPhone=data.phone||''; state.customerAddress=data.address||''; state.isGift=data.isGift||false; state.giftSender=data.giftSender||''; state.giftMessage=data.giftMessage||''; state.hasShared=data.hasShared||false; if(data.shippingProvider) state.shippingProvider=data.shippingProvider; if(data.vehicleType) state.vehicleType=data.vehicleType; } } catch(_) {} }

  let toastTimer; function showToast(msg){ const el=document.getElementById('toast'); if(!el) return; el.textContent=msg; el.classList.remove('show'); void el.offsetWidth; el.classList.add('show'); clearTimeout(toastTimer); toastTimer=setTimeout(()=>el.classList.remove('show'),SYSTEM.TOAST_DURATION); }

  function updateFloatingButton(){ const btn=document.getElementById('floatingCartBtn'),badge=document.getElementById('floatingBadge'); const summary=getCartSummary(); if(state.isCartMinimized&&summary.totalQty>0){ if(btn) btn.classList.add('visible'); if(badge) badge.textContent=summary.totalQty; } else { if(btn) btn.classList.remove('visible'); } }
  function minimizeCart(){ state.isCartMinimized=true; localStorage.setItem('rujak_cart_minimized','true'); const bar=document.getElementById('bottom-bar'); if(bar) bar.classList.remove('visible'); updateFloatingButton(); const footer=document.querySelector('.footer-brand'); if(footer) footer.style.paddingBottom='0'; }
  function expandCart(){ state.isCartMinimized=false; localStorage.setItem('rujak_cart_minimized','false'); updateFloatingButton(); renderCart(); }

  function handlePriorityToggle(checked){ state.isPriority=checked; document.getElementById('priorityToggle').checked=checked; const pm=document.getElementById('priorityToggleMini'); if(pm) pm.checked=checked; if(state.userDistance!==null) updateShippingUI(state.userDistance,checked); }
  function updateStoreStatus(){ const el=document.getElementById('storeStatusText'); if(el) el.textContent='Buka'; document.getElementById('storeStatus')?.classList.remove('closed'); }
  function shareToWhatsApp(){ window.open('https://wa.me/?text='+encodeURIComponent('Hai! Cobain Rujak.Co yuk — rujak premium dengan buah segar pilihan dan sambal khas Indonesia. Lihat menu dan pesan langsung di sini:\n'+window.location.href),'_blank'); }

  const promoModal=document.getElementById('promoModal'); function openPromoModal(){ const summary=getCartSummary(); updateMissionCheckboxes(summary.subtotal); if(promoModal){ promoModal.classList.add('active'); document.body.style.overflow='hidden'; } } function closePromoModal(){ if(promoModal){ promoModal.classList.remove('active'); document.body.style.overflow=''; } }
  const searchInput=document.getElementById('searchInput'),clearSearchBtn=document.getElementById('clearSearchBtn'); function updateClearButton(){ if(clearSearchBtn) clearSearchBtn.classList.toggle('visible',searchInput.value.length>0); }

  function bindCartEvents(){ const ma=document.getElementById('modalAdd'); if(ma){ ma.addEventListener('click',function(){ if(addToCartLocked) return; lockAddToCart(); const baseId=this.dataset.id; if(baseId){ const spice=parseInt(document.getElementById('spiceSelect').value,10)||3; const cartKey=baseId+'_'+spice; const entry=state.cart[cartKey]||{qty:0,spice:spice}; entry.qty+=1; entry.spice=spice; state.cart[cartKey]=entry; updateUI(); showToast('Berhasil ditambahkan ✓'); closeProductModal(); } }); } }
  function bindModalEvents(){ document.getElementById('priorityToggle').addEventListener('change',function(){ handlePriorityToggle(this.checked); }); const pm=document.getElementById('priorityToggleMini'); if(pm) pm.addEventListener('change',function(){ handlePriorityToggle(this.checked); }); document.getElementById('shareBtnModal').addEventListener('click',function(){ state.hasShared=true; saveCustomerData(); updateUI(); showToast('Diskon Rp5.000 berhasil diaktifkan!'); shareToWhatsApp(); }); document.getElementById('promoTrigger').addEventListener('click',openPromoModal); document.getElementById('promoClose').addEventListener('click',closePromoModal); if(promoModal) promoModal.addEventListener('click',function(e){ if(e.target===promoModal) closePromoModal(); }); document.getElementById('closeBottomBar').addEventListener('click',e=>{ e.stopPropagation(); minimizeCart(); }); const fb=document.getElementById('floatingCartBtn'); if(fb) fb.addEventListener('click',expandCart); document.getElementById('giftToggle').addEventListener('change',function(){ state.isGift=this.checked; document.getElementById('giftFields').style.display=this.checked?'block':'none'; saveCustomerData(); }); }
  function bindSearchEvents(){ const stw=document.getElementById('searchToggleWrap'),sib=document.getElementById('searchIconBtn'),siw=document.getElementById('searchInputWrap'); if(sib){ sib.addEventListener('click',()=>{ siw.classList.toggle('open'); if(siw.classList.contains('open')) searchInput.focus(); }); document.addEventListener('click',(e)=>{ if(stw&&!stw.contains(e.target)) siw.classList.remove('open'); }); } searchInput.addEventListener('input',debounce(function(){ state.searchQuery=this.value; updateUI(); updateClearButton(); },300)); searchInput.addEventListener('keyup',updateClearButton); }
  function bindShippingEvents(){ document.querySelectorAll('.ship-btn').forEach(btn=>{ btn.addEventListener('click',function(){ document.querySelectorAll('.ship-btn').forEach(b=>b.classList.remove('active')); this.classList.add('active'); state.shippingProvider=this.dataset.provider; const ro=document.getElementById('rujakcoOptions'); if(ro) ro.style.display=state.shippingProvider==='rujakco'?'block':'none'; updateUI(); }); }); document.querySelectorAll('.veh-btn').forEach(btn=>{ btn.addEventListener('click',function(){ document.querySelectorAll('.veh-btn').forEach(b=>b.classList.remove('active')); this.classList.add('active'); state.vehicleType=this.dataset.vehicle; updateUI(); }); }); }
  function bindStepEvents(){ document.getElementById('step1Next')?.addEventListener('click',()=>{ goToStep(2); }); document.getElementById('step2Next')?.addEventListener('click',()=>{ goToStep(3); }); }

  function bindEvents() {
    bindCartEvents(); bindModalEvents(); bindSearchEvents(); bindShippingEvents(); bindStepEvents();
    const ba=document.getElementById('btnAutoDetect'); if(ba){ ba.addEventListener('click',function(){ state.useManualDistrict=false; state.selectedDistrict=''; this.classList.add('active'); const bm=document.getElementById('btnManualDistrict'); if(bm) bm.classList.remove('active'); const dw=document.getElementById('districtSelectWrap'); if(dw) dw.style.display='none'; detectLocation(); }); }
    const bm=document.getElementById('btnManualDistrict'); if(bm){ bm.addEventListener('click',function(){ state.useManualDistrict=true; this.classList.add('active'); const ba2=document.getElementById('btnAutoDetect'); if(ba2) ba2.classList.remove('active'); const dw=document.getElementById('districtSelectWrap'); if(dw) dw.style.display='block'; }); }
    const ds=document.getElementById('districtSelect'); if(ds){ ds.addEventListener('change',function(){ state.selectedDistrict=this.value; if(state.selectedDistrict) detectLocation(); }); }

    document.addEventListener('click',function(e){
      const ab=e.target.closest('[data-action]'); if(ab){ const {action,id}=ab.dataset; if(action==='open-modal'&&id) return openProductModal(id); if(action==='open-cart') return openMiniCart(); if(action==='add-addon'&&id){ if(addToCartLocked) return; lockAddToCart(); state.cart[id]=state.cart[id]||{qty:0}; state.cart[id].qty++; updateUI(); showToast('Berhasil ditambahkan ✓'); return; } if(action==='increase'&&id&&state.cart[id]){ if(addToCartLocked) return; lockAddToCart(); state.cart[id].qty++; updateUI(); if(miniCartModal&&miniCartModal.classList.contains('active')) renderMiniCart(); return; } if(action==='decrease'&&id&&state.cart[id]){ if(addToCartLocked) return; lockAddToCart(); state.cart[id].qty--; if(state.cart[id].qty<=0) delete state.cart[id]; updateUI(); if(miniCartModal&&miniCartModal.classList.contains('active')) renderMiniCart(); return; } if(action==='remove'&&id&&state.cart[id]){ delete state.cart[id]; updateUI(); if(miniCartModal&&miniCartModal.classList.contains('active')) renderMiniCart(); showToast('Item dihapus'); return; } if(action==='confirm-wa') return handleCheckout(); if(action==='toast') return showToast(ab.dataset.msg); if(action==='share') return shareToWhatsApp(); if(action==='open-promo') return openPromoModal(); }
      if(e.target.closest('#btnOpenPayment')){ if(getCartSummary().items.length===0) return showToast('Keranjang kosong'); if(state.userDistance===null) return showToast('Mohon tunggu, menghitung jarak...'); if(state.userDistance>SYSTEM.MAX_DISTANCE) return showToast('Maaf, pengiriman di luar jangkauan'); document.getElementById('paymentTotalDisplay').textContent=document.getElementById('finalTotal').textContent; closeMiniCart(); const pmt=document.getElementById('paymentModal'); if(pmt){ pmt.classList.add('active'); document.body.style.overflow='hidden'; } return; }
      const mi=e.target.closest('.menu-item'); if(mi&&!e.target.closest('.add-btn')&&!e.target.closest('.qty-btn')) return openProductModal(mi.dataset.id);
      const cb=e.target.closest('.cat-pill'); if(cb&&cb.dataset.cat){ document.querySelectorAll('.cat-pill').forEach(b=>b.classList.remove('active')); cb.classList.add('active'); state.activeFilter=cb.dataset.cat; updateUI(); return; }
      const ft=e.target.closest('[data-toggle="faq"]'); if(ft) return ft.closest('.faq-item')?.classList.toggle('open');
      if(e.target.closest('#modalClose')||e.target===productModal) return closeProductModal(); if(e.target.closest('#miniCartClose')||e.target===miniCartModal) return closeMiniCart();
      if(e.target.closest('#paymentClose')||e.target===document.getElementById('paymentModal')){ const pmt=document.getElementById('paymentModal'); if(pmt){ pmt.classList.remove('active'); document.body.style.overflow=''; } return; }
      if(e.target.closest('#clearCartBtn')) return clearCart(); if(e.target.closest('.cart-summary')) return openMiniCart();
      if(e.target.closest('#downloadQrisBtnPayment')){ const qi=document.getElementById('qrisImagePayment'); if(qi){ const url=qi.src; fetch(url).then(r=>r.blob()).then(blob=>{ const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='QRIS-RujakCo.jpg'; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(a.href); }).catch(()=>{ window.location.href=url; }); } return; }
      if(e.target.closest('#clearSearchBtn')){ searchInput.value=''; state.searchQuery=''; updateUI(); updateClearButton(); return; }
    });

    document.addEventListener('keydown',e=>{ if(e.key==='Escape'){ if(productModal&&productModal.classList.contains('active')) closeProductModal(); if(miniCartModal&&miniCartModal.classList.contains('active')) closeMiniCart(); const pmt=document.getElementById('paymentModal'); if(pmt&&pmt.classList.contains('active')){ pmt.classList.remove('active'); document.body.style.overflow=''; } if(promoModal&&promoModal.classList.contains('active')) closePromoModal(); } });
    const qi=document.getElementById('qrisImagePayment'); if(qi){ qi.addEventListener('click',function(){ this.classList.toggle('qr-zoomed'); }); qi.addEventListener('dblclick',function(){ this.classList.toggle('qr-zoomed'); }); }
    window.addEventListener('scroll',()=>{ document.getElementById('header')?.classList.toggle('shadowed',window.scrollY>4); });
  }

  function init() { loadCart(); loadCustomerData(); updateStoreStatus(); const ss=document.getElementById('shareStrip'); if(ss) ss.style.display='none'; try { const s=localStorage.getItem('rujak_cart_minimized'); if(s!==null) state.isCartMinimized=s==='true'; } catch(_) {} updateUI(); detectLocation(); bindEvents(); if(typeof lucide!=='undefined'&&lucide.createIcons) lucide.createIcons(); else { const int=setInterval(()=>{ if(typeof lucide!=='undefined'&&lucide.createIcons){ lucide.createIcons(); clearInterval(int); } },100); } }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
})();
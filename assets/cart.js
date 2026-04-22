/* Forge Builder — cart runtime */
(function(){
  const KEY = 'fb_cart_v1';
  function read(){ try { return JSON.parse(localStorage.getItem(KEY)||'[]'); } catch { return []; } }
  function write(c){ localStorage.setItem(KEY, JSON.stringify(c)); update(); }
  function find(c, sku){ return c.findIndex(i => i.sku === sku); }
  function add(item){
    const c = read(); const i = find(c, item.sku);
    if (i >= 0) c[i].qty = (c[i].qty||1) + (item.qty||1);
    else c.push(Object.assign({qty:1}, item));
    write(c); open();
  }
  function remove(sku){ write(read().filter(i => i.sku !== sku)); }
  function setQty(sku, qty){
    const c = read(); const i = find(c, sku); if (i<0) return;
    if (qty<=0) c.splice(i,1); else c[i].qty = qty; write(c);
  }
  function total(c){ return c.reduce((s,i)=>s + (i.price||0) * (i.qty||1), 0); }
  function money(n){ return '$' + Number(n).toFixed(2); }
  function escape(s){ return String(s||'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function render(){
    const c = read();
    const el = document.querySelector('#fb-cart-items');
    const tot = document.querySelector('#fb-cart-total');
    const badge = document.querySelectorAll('.fb-cart-count');
    if (!el) return;
    if (c.length === 0) {
      el.innerHTML = '<p style="opacity:0.5;text-align:center;padding:2rem">Your cart is empty.</p>';
    } else {
      el.innerHTML = c.map(i => `
        <div style="display:flex;gap:0.75rem;padding:0.75rem 0;border-bottom:1px solid #eee">
          <img src="${escape(i.image)}" alt="" style="width:60px;height:60px;object-fit:cover;border-radius:4px;background:#f5f5f5">
          <div style="flex:1;min-width:0">
            <div style="font-weight:600;font-size:0.9rem">${escape(i.name)}</div>
            <div style="font-size:0.8rem;opacity:0.6">${escape(i.sku)}</div>
            <div style="display:flex;align-items:center;gap:0.5rem;margin-top:0.5rem">
              <button onclick="window.fbCart.setQty('${escape(i.sku)}',${i.qty-1})" style="width:24px;height:24px;border:1px solid #ddd;background:#fff;border-radius:4px">−</button>
              <span>${i.qty}</span>
              <button onclick="window.fbCart.setQty('${escape(i.sku)}',${i.qty+1})" style="width:24px;height:24px;border:1px solid #ddd;background:#fff;border-radius:4px">+</button>
              <button onclick="window.fbCart.remove('${escape(i.sku)}')" style="margin-left:auto;color:#c00;background:none;border:none;cursor:pointer;font-size:0.85rem">Remove</button>
            </div>
          </div>
          <div style="font-weight:700">${money(i.price * i.qty)}</div>
        </div>`).join('');
    }
    if (tot) tot.textContent = money(total(c));
    badge.forEach(b => b.textContent = c.reduce((s,i)=>s+(i.qty||1),0));
  }
  function open(){ document.getElementById('fb-cart-drawer')?.classList.add('open'); document.getElementById('fb-cart-overlay')?.classList.add('open'); }
  function close(){ document.getElementById('fb-cart-drawer')?.classList.remove('open'); document.getElementById('fb-cart-overlay')?.classList.remove('open'); }
  function update(){ render(); }
  async function checkout(){
    const c = read();
    if (c.length === 0) { alert('Your cart is empty.'); return; }
    try {
      const res = await fetch('/api/checkout', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({items:c}) });
      if (res.ok) {
        const data = await res.json();
        if (data.url) window.location.href = data.url;
        else alert('Checkout ready. Demo site — no payment processor configured.');
      } else {
        alert('Checkout is not yet configured for this site.');
      }
    } catch {
      alert('Checkout is not yet configured for this site.');
    }
  }
  window.fbCart = { add, remove, setQty, open, close, render, read, checkout };
  document.addEventListener('DOMContentLoaded', render);
})();

(function(){
	if(window.iterumGlobalSearchInitialized){return;} window.iterumGlobalSearchInitialized=true;
	const style = document.createElement('style');
	style.textContent = `
		.it-gs-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.5);backdrop-filter:blur(2px);display:none;z-index:9998}
		.it-gs{position:fixed;top:10%;left:50%;transform:translateX(-50%);width:min(760px,92vw);background:#0f172a;color:#e2e8f0;border:1px solid #334155;border-radius:12px;box-shadow:0 20px 60px rgba(0,0,0,.5);padding:12px 12px 8px;display:none;z-index:9999}
		.it-gs input{width:100%;padding:14px 16px;border-radius:10px;border:2px solid #334155;background:#0b1220;color:#fff;font-size:15px;outline:none}
		.it-gs-results{max-height:50vh;overflow:auto;margin-top:10px}
		.it-gs-group{margin-top:12px}
		.it-gs-title{font-size:12px;color:#94a3b8;margin:6px 4px}
		.it-gs-item{display:flex;justify-content:space-between;align-items:center;padding:10px 12px;border-radius:8px;cursor:pointer;border:1px solid transparent}
		.it-gs-item:hover{background:#111827;border-color:#1f2937}
		.it-gs-tag{font-size:11px;color:#93c5fd;background:#0b1220;border:1px solid #1f2937;border-radius:6px;padding:2px 6px}
	`;
	document.head.appendChild(style);

	const backdrop = document.createElement('div');backdrop.className='it-gs-backdrop';
	const modal = document.createElement('div');modal.className='it-gs';
	modal.innerHTML = `
		<input id="it-gs-input" placeholder="Search recipes, ingredients, vendors… (Ctrl+K)" aria-label="Global search" />
		<div id="it-gs-results" class="it-gs-results" role="listbox" aria-label="Search results"></div>
	`;
	document.body.appendChild(backdrop);document.body.appendChild(modal);

	function open(){backdrop.style.display='block';modal.style.display='block';input.value='';render('');setTimeout(()=>input.focus(),0)}
	function close(){backdrop.style.display='none';modal.style.display='none'}

	backdrop.addEventListener('click',close);
	document.addEventListener('keydown',e=>{ if(e.key==='Escape') close(); });
	document.addEventListener('keydown',e=>{
		const isCtrlK = (e.ctrlKey||e.metaKey) && (e.key==='k' || e.key==='K');
		if(isCtrlK){ e.preventDefault(); open(); }
	});

	const input = modal.querySelector('#it-gs-input');
	const resultsEl = modal.querySelector('#it-gs-results');

	function getData(){
		const safeParse = (k)=>{ try{ return JSON.parse(localStorage.getItem(k)||'[]'); }catch{return [];} };
		return {
			recipes: safeParse('recipes') || safeParse('iterum:recipes') || [],
			ingredients: safeParse('ingredients') || safeParse('iterum:ingredients') || [],
			vendors: safeParse('vendors') || [],
		};
	}

	function render(query){
		const {recipes, ingredients, vendors} = getData();
		const q = (query||'').toLowerCase();
		const match = (t)=> (''+(t||'')).toLowerCase().includes(q);
		const r = recipes.filter(x=>match(x.name||x.title)).slice(0,8);
		const i = ingredients.filter(x=>match(x.name)).slice(0,8);
		const v = vendors.filter(x=>match(x.name)).slice(0,8);
		let html = '';
		if(r.length){ html += `<div class="it-gs-group"><div class="it-gs-title">Recipes</div>${r.map(x=>`<div class="it-gs-item" data-link="recipe-library.html#id=${x.id||x.uuid||encodeURIComponent(x.name)}"><span>${x.name||x.title}</span><span class="it-gs-tag">open</span></div>`).join('')}</div>`; }
		if(i.length){ html += `<div class="it-gs-group"><div class="it-gs-title">Ingredients</div>${i.map(x=>`<div class="it-gs-item" data-link="ingredients.html#q=${encodeURIComponent(x.name)}"><span>${x.name}</span><span class="it-gs-tag">view</span></div>`).join('')}</div>`; }
		if(v.length){ html += `<div class="it-gs-group"><div class="it-gs-title">Vendors</div>${v.map(x=>`<div class="it-gs-item" data-link="vendor-management.html#q=${encodeURIComponent(x.name)}"><span>${x.name}</span><span class="it-gs-tag">open</span></div>`).join('')}</div>`; }
		if(!html){ html = `<div class="it-gs-group"><div class="it-gs-item"><span>No results</span></div></div>`; }
		resultsEl.innerHTML = html;
		resultsEl.querySelectorAll('.it-gs-item').forEach(el=>{
			el.addEventListener('click',()=>{ const link = el.getAttribute('data-link'); if(link){ window.location.href = link; close(); } });
		});
	}

	input.addEventListener('input',()=>render(input.value));

	// Expose simple API
	window.iterumGlobalSearch = { open, close, render };
})();

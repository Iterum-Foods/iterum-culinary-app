(function(){
	if(window.iterumAutosave){return;}
	function throttle(fn, wait){ let t=0; return function(){ const now=Date.now(); if(now-t>wait){ t=now; fn.apply(this,arguments); } } }
	function serialize(form){ const data={}; new FormData(form).forEach((v,k)=>{ if(data[k]!==undefined){ if(!Array.isArray(data[k])) data[k]=[data[k]]; data[k].push(v); } else { data[k]=v; } }); return data; }
	function init(){
		const forms = document.querySelectorAll('form[data-autosave]');
		forms.forEach(form=>{
			const key = form.getAttribute('data-autosave') || location.pathname+'#autosave';
			// restore
			try{ const raw = localStorage.getItem(key); if(raw){ const obj = JSON.parse(raw); Object.keys(obj).forEach(name=>{ const el = form.querySelector(`[name="${CSS.escape(name)}"]`); if(!el) return; if(el.type==='checkbox') el.checked = !!obj[name]; else el.value = obj[name]; }); } }catch{}
			const saveDraft = throttle(()=>{
				try{ localStorage.setItem(key, JSON.stringify(serialize(form))); if(window.iterumSync) window.iterumSync.set('saving'); }catch{}
			}, 3000);
			form.addEventListener('input', saveDraft);
			form.addEventListener('change', saveDraft);
			// optional real save
			const handlerName = form.getAttribute('data-autosave-handler');
			if(handlerName && typeof window[handlerName]==='function'){
				setInterval(async ()=>{ try{ if(window.iterumSync) window.iterumSync.set('saving'); await window[handlerName](form); if(window.iterumSync) window.iterumSync.set('saved'); }catch(e){ if(window.iterumSync) window.iterumSync.set('offline'); } }, 15000);
			}
		});
	}
	document.addEventListener('DOMContentLoaded', init);
	window.iterumAutosave = { init };
})();

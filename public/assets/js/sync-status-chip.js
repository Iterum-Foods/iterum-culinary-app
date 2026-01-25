(function(){
	if(window.iterumSync){return;}
	const chip = document.createElement('div');
	chip.setAttribute('aria-live','polite');
	chip.style.cssText = 'position:fixed;right:12px;bottom:12px;background:#0b1220;color:#a5b4fc;border:1px solid #334155;border-radius:999px;padding:6px 10px;font:600 12px/1.2 Inter,system-ui;box-shadow:0 8px 24px rgba(0,0,0,.35);z-index:9997';
	chip.textContent = 'Ready';
	document.addEventListener('DOMContentLoaded',()=>{ document.body.appendChild(chip); });
	function setStatus(text,color){ chip.textContent = text; if(color){ chip.style.color=color; } }
	const api = {
		set: (state)=>{
			if(state==='saving'){ setStatus('Saving…','#fde68a'); }
			else if(state==='saved'){ setStatus('Saved ✓','#a7f3d0'); }
			else if(state==='syncing'){ setStatus('Syncing…','#93c5fd'); }
			else if(state==='offline'){ setStatus('Offline','#fca5a5'); }
			else { setStatus(String(state||'Ready')); }
		}
	};
	window.iterumSync = api;
})();

window.addEventListener('load', function load(event) {
	document.getElementById('btn_quit').onclick = function(event) {
		window.ottoAPI.windowAction('close')
	}
	document.getElementById('btn_max').onclick = async function(event) {
		if(await window.ottoAPI.windowAction('isMaximized')){
            window.ottoAPI.windowAction('unmaximize')
        }else{
            window.ottoAPI.windowAction('maximize')
        }
	}
	document.getElementById('btn_min').onclick = function(event) {
		window.ottoAPI.windowAction('minimize')
	}
})
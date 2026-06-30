var connexion = false;

window.addEventListener('load', function load(event) {
	if(localStorage.getItem("baudrate")) {
		document.getElementById('vitesse').value = localStorage.getItem("baudrate");
	}else{
		localStorage.setItem("baudrate",9600);
	}
	connexion = false;
	document.getElementById('btn_envoi').disabled=true
	document.getElementById('btn_efface').onclick = function(event) {
		document.getElementById('fenetre_term').textContent = ''
	}
	document.getElementById('btn_envoi').onclick = function(event) {
		var entree = document.getElementById('schbox').value
		if (connexion) {
			document.getElementById('fenetre_term').innerHTML += entree+"<br>"
			window.ottoAPI.writePort(entree)
		}
	}
	var moniteur = document.getElementById('fenetre_term');
	document.getElementById('btn_quit').onclick = function(event) {
		window.ottoAPI.windowAction('close')
	}
	document.getElementById('btn_connect').onclick = async function(event) {
		var baud = parseInt(localStorage.getItem("baudrate"))
		var com = localStorage.getItem("com")
		if (connexion){
			document.getElementById('btn_connect').innerHTML="<span class='fa fa-play'> Open</span>"
			document.getElementById('btn_envoi').disabled=true
			await window.ottoAPI.closePort()
            moniteur.innerHTML += '--- CLOSED SERIAL PORT ---<br>'
			connexion = false
		} else {
			document.getElementById('btn_connect').innerHTML="<span class='fa fa-pause'> Close</span>"
			document.getElementById('btn_envoi').disabled=false
			try {
                await window.ottoAPI.openPort(com, baud)
                moniteur.innerHTML += '--- OPENED SERIAL PORT ---<br>'
                connexion = true
                window.ottoAPI.onSerialData(function(data){
                    if (connexion){
                        moniteur.innerHTML += data.toString().replace(/\r?\n/g, "<br />")
                        moniteur.scrollTop = moniteur.scrollHeight;
                        moniteur.animate({scrollTop: moniteur.scrollHeight})
                    }
                })
            } catch(err) {
                moniteur.innerHTML += '--- ERROR OPENING SERIAL PORT: '+err+' ---<br>'
                if (err && (err.toString().includes('EACCES') || err.toString().includes('Permission denied'))) {
                    window.alert("Permission Denied!\n\nTo access the USB port on Linux, open your terminal, run the following command, and then log out / log back in:\n\nsudo usermod -a -G dialout $USER");
                }
            }
		}
	}
	document.getElementById('btn_csv').onclick = function(event) {
		window.ottoAPI.send('save-csv')
	}
	window.ottoAPI.on('saved-csv', async function(event, path){
		var code = document.getElementById('fenetre_term').innerHTML
		code = code.split('<br>').join('\n')
		if (path === null) {
			return
		} else {
            try {
                await window.ottoAPI.writeFile(path, code)
            } catch(err) {
                console.log(err)
            }
		}
	})
})
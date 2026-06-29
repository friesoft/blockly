var arduino_basepath = window.navigator.userAgent.indexOf('Win') !== -1 ? './compilation/arduino' : '../../compilation/arduino'; // Path handled differently since we can't use 'path' module natively. Actually it's better to just leave it as is but without 'path.join'.
arduino_basepath = './compilation/arduino'; // In electron process.cwd() is project root.

var arduino_ide_cmd = '';

window.addEventListener('load', async function load(event) {
	var appVersion = await window.ottoAPI.getAppVersion()
	var quitDiv = '<button type="button" class="close" data-dismiss="modal" aria-label="Close">&#215;</button>'
	var checkBox = document.getElementById('verifyUpdate')
	var portserie = document.getElementById('portserie')
	var messageDiv = document.getElementById('messageDIV')
	localStorage.setItem("verif",false)
	document.getElementById('versionapp').textContent = " Otto Blockly V" + appVersion
	function uploadOK(){
		messageDiv.style.color = '#009000'
		messageDiv.innerHTML = Blockly.Msg.upload + ': ✅ OK code uploaded' + quitDiv
		$('#message').modal('show');
		setTimeout(function() {
		$('#message').modal('hide');
		}, 3000);
	}
	$('#btn_forum').on('click', function(){
		window.ottoAPI.openExternal('https://discord.gg/CZZytnw')
	})
	$('#btn_site').on('click', function(){
		window.ottoAPI.openExternal('https://www.ottodiy.com/')
	})
	$('#btn_contact').on('click', function(){
		window.ottoAPI.openExternal('https://github.com/OttoDIY/blockly/issues')
	})
	$('#portserie').mouseover(function(){
		window.ottoAPI.listPorts().then(ports => {
			var nb_com = localStorage.getItem("nb_com"), menu_opt = portserie.getElementsByTagName('option')
			if(ports.length > nb_com){
				ports.forEach(function(port){
					if (port.vendorId){
						var opt = document.createElement('option')
						opt.value = port.path || port.comName
						opt.text = port.path || port.comName
						portserie.appendChild(opt)
						localStorage.setItem("com", port.path || port.comName)
					}
				})
				localStorage.setItem("nb_com",ports.length)
				localStorage.setItem("com",portserie.options[1].value)
			}
			if(ports.length < nb_com){
				while(menu_opt[1]) {
					portserie.removeChild(menu_opt[1])
				}
				localStorage.setItem("com","com")
				localStorage.setItem("nb_com",ports.length)
			}
		}).catch(err => console.log(err));
	})
	$('#btn_copy').on('click', function(){
		window.ottoAPI.writeText($('#pre_previewArduino').text())
	})
	$('#btn_bin').on('click', function(){
		if (localStorage.getItem('verif') == "false"){
			$("#message").modal("show")
			messageDiv.style.color = '#000000'
			messageDiv.innerHTML = Blockly.Msg.verif + quitDiv
			return
		}
		localStorage.setItem("verif",false)
		window.ottoAPI.send('save-bin')
	})
	$.ajax({
	    cache: false,
	    url: "../config.json",
	    dataType: "json",
	    success : function(data) {
			$.each(data, function(i, update){
				if (update=="true") {
					$('#verifyUpdate').prop('checked', true)
					checkBox.dispatchEvent(new Event('change'))
					window.ottoAPI.send("version", "")
				} else {
					$('#verifyUpdate').prop('checked', false)
					checkBox.dispatchEvent(new Event('change'))
				}
			})
		}
	})
	checkBox.addEventListener('change', async function(event){
		if (event.target.checked) {
            await window.ottoAPI.writeFile('config.json', '{ "update": "true" }')
		} else {
            await window.ottoAPI.writeFile('config.json', '{ "update": "false" }')
		}
	})
	window.ottoAPI.listPorts().then(ports => {
		var opt = document.createElement('option')
		opt.value = "com"
		opt.text = Blockly.Msg.com1
		portserie.appendChild(opt)
		ports.forEach(function(port) {
			if (port.vendorId){
				var opt = document.createElement('option')
				opt.value = port.path || port.comName
				opt.text = port.path || port.comName
				portserie.appendChild(opt)
			}
		})
		localStorage.setItem("nb_com",ports.length)
		if (portserie.options.length > 1) {
			portserie.selectedIndex = 1
			localStorage.setItem("com",portserie.options[1].value)
		} else {
			localStorage.setItem("com","com")
		}
	}).catch(err => console.log(err));
	$('#btn_version').on('click', function(){
		$('#aboutModal').modal('hide')
		window.ottoAPI.send("version", "")
	})
	$('#btn_term').on('click', function(){
		if (portserie.value=="com"){
			$("#message").modal("show")
			messageDiv.style.color = '#ff0000'
			messageDiv.innerHTML = Blockly.Msg.com2 + quitDiv
			return
		}
		if (localStorage.getItem("prog") == "python") { window.ottoAPI.send("repl", "") } else { window.ottoAPI.send("prompt", "") }
	})
	$('#btn_factory').on('click', function(){
		window.ottoAPI.send("factory", "")
	})
	var isArduinoCliEnsured = false;

	async function ensureArduinoCli() {
		if (isArduinoCliEnsured) return;
		var baseDir = await window.ottoAPI.getArduinoBaseDir();
		let os = "Linux";
		let ext = "tar.gz";
		
		if (window.navigator.userAgent.indexOf('Win') !== -1) {
			os = "Windows";
			ext = "zip";
			arduino_ide_cmd = baseDir + '\\arduino-cli.exe';
		} else if (window.navigator.userAgent.indexOf('Mac') !== -1) {
			os = "macOS";
			arduino_ide_cmd = baseDir + '/arduino-cli';
		} else {
			arduino_ide_cmd = baseDir + '/arduino-cli';
		}
		
		let url = `https://downloads.arduino.cc/arduino-cli/arduino-cli_latest_${os}_64bit.${ext}`;
		
		let exists = await window.ottoAPI.exists(arduino_ide_cmd);
		if (exists) {
			isArduinoCliEnsured = true;
			return;
		}

		await window.ottoAPI.mkdir(baseDir);
		
		try {
			if (os === "Windows") {
				await window.ottoAPI.exec(`curl -L -o arduino-cli.zip "${url}"`, {cwd: baseDir});
				await window.ottoAPI.exec(`tar -xf arduino-cli.zip arduino-cli.exe`, {cwd: baseDir});
				await window.ottoAPI.exec(`del arduino-cli.zip`, {cwd: baseDir});
			} else {
				await window.ottoAPI.exec(`(curl -fsSL -o arduino-cli.tar.gz "${url}" || wget -qO arduino-cli.tar.gz "${url}")`, {cwd: baseDir});
				await window.ottoAPI.exec(`tar -xzf arduino-cli.tar.gz arduino-cli`, {cwd: baseDir});
				await window.ottoAPI.exec(`rm arduino-cli.tar.gz`, {cwd: baseDir});
			}
			
			let downloaded = await window.ottoAPI.exists(arduino_ide_cmd);
			if (!downloaded) throw new Error("Compiler executable was not generated successfully.");
			
			isArduinoCliEnsured = true;
			$('#message').modal('hide');
		} catch(e) {
			messageDiv.style.color = '#ff0000';
			messageDiv.innerHTML = 'Failed to download arduino-cli: ' + e.toString() + quitDiv;
			throw e;
		}
	}

	async function ensureCoreInstalled(coreName) {
		return new Promise(async (resolve, reject) => {
			try {
				await ensureArduinoCli();
			} catch(e) {
				return reject(e);
			}

			try {
				var res = await window.ottoAPI.exec(`${arduino_ide_cmd} core list`, {cwd: arduino_basepath});
				if (res.stdout.includes(coreName.split('@')[0])) {
					return resolve(); // Already installed
				}
			} catch (e) {
				// Might fail if no cores installed, proceed to install
			}

			messageDiv.style.color = '#000000';
			messageDiv.innerHTML = `Downloading ${coreName}... <br><br><progress id="coreProgress" value="0" max="100" style="width:100%"></progress><br><div style="width:100%; overflow-x:auto;"><span id="coreProgressText" style="font-size: 12px; font-family: monospace; white-space: nowrap; display: block;">Initializing...</span></div>` + quitDiv;
			$('#message').modal('show');
			
			// Update index first
			try {
				await window.ottoAPI.exec(`${arduino_ide_cmd} --config-file arduino-cli.yaml core update-index`, {cwd: arduino_basepath});
			} catch(e) {
				console.log("Failed to update index: " + e);
			}

			let currentProgress = 0;
			
			window.ottoAPI.spawn(
				arduino_ide_cmd,
				['--config-file', 'arduino-cli.yaml', 'core', 'install', coreName],
				{cwd: arduino_basepath},
				{
					onStdout: (data) => {
						let match = data.match(/(\d+)%/);
						if (match) {
							currentProgress = parseInt(match[1]);
							document.getElementById('coreProgress').value = currentProgress;
						}
						let lines = data.split('\n').filter(l => l.trim().length > 0);
						if (lines.length > 0) {
							let lastLine = lines[lines.length - 1].trim();
							let el = document.getElementById('coreProgressText');
							if (el) el.innerText = lastLine;
						}
					},
					onStderr: (data) => {
						console.log("stderr:", data);
					},
					onError: (err) => {
						reject(err);
					},
					onClose: (code) => {
						if (code === 0) resolve();
						else reject(new Error(`Exit code ${code}`));
					}
				}
			);
		});
	}

	async function updateCoreStatus() {
		var carte = localStorage.getItem('card') || 'OttoESP';
		var prog = window.profile && window.profile[carte] ? window.profile[carte].prog : null;
		if (prog === 'python' || !window.profile || !window.profile[carte].upload_arg) {
			$('#btn_core_status').hide();
			return;
		}
		$('#btn_core_status').show();
		$('#icon_core_status').removeClass().addClass('fa fa-spinner fa-spin');
		$('#btn_core_status').attr('title', 'Checking core status...');
		
		var upload_arg = window.profile[carte].upload_arg;
		var coreName = upload_arg.split(':').slice(0, 2).join(':');
		
		try {
			await ensureArduinoCli();
			var res = await window.ottoAPI.exec(`${arduino_ide_cmd} core list`, {cwd: arduino_basepath});
			var dataPath = await window.ottoAPI.getArduinoDataPath();
			
			if (res.stdout.includes(coreName.split('@')[0])) {
				$('#icon_core_status').removeClass().addClass('fa fa-check').css('color', '#009000');
				var vendor = coreName.split(':')[0];
				var arch = coreName.split(':')[1];
				$('#btn_core_status').attr('title', `Core files EXIST and are ready!\nPath: ${dataPath}/packages/${vendor}/hardware/${arch}`);
			} else {
				$('#icon_core_status').removeClass().addClass('fa fa-download').css('color', '#ff0000');
				$('#btn_core_status').attr('title', `Core files MISSING! Click to download.\n(Will install to: ${dataPath})`);
			}
		} catch (e) {
			$('#icon_core_status').removeClass().addClass('fa fa-download').css('color', '#ff0000');
			$('#btn_core_status').attr('title', 'Core files MISSING! Click to download.');
		}
	}

	$('#boards').on('change', function() {
		setTimeout(updateCoreStatus, 100); // Wait for BlocklyDuino.change_card to update localStorage
	});
	
	setTimeout(updateCoreStatus, 500); // Initial check

	$('#menu_core_download').on('click', async function(e) {
		e.preventDefault();
		var carte = localStorage.getItem('card') || 'OttoESP';
		var upload_arg = window.profile && window.profile[carte] ? window.profile[carte].upload_arg : null;
		if (!upload_arg) return;
		var coreName = upload_arg.split(':').slice(0, 2).join(':');
		try {
			await ensureCoreInstalled(coreName);
			updateCoreStatus();
			$('#message').modal('hide');
		} catch(err) {
			messageDiv.style.color = '#ff0000';
			messageDiv.innerHTML = 'Failed to install core: ' + err.toString() + quitDiv;
			$('#message').modal('show');
		}
	});

	$('#menu_core_update').on('click', async function(e) {
		e.preventDefault();
		var carte = localStorage.getItem('card') || 'OttoESP';
		var upload_arg = window.profile && window.profile[carte] ? window.profile[carte].upload_arg : null;
		if (!upload_arg) return;
		var coreName = upload_arg.split(':').slice(0, 2).join(':');
		
		messageDiv.style.color = '#000000';
		messageDiv.innerHTML = `Updating ${coreName}... <br><br><progress id="coreProgress" value="0" max="100" style="width:100%"></progress><br><div style="width:100%; overflow-x:auto;"><span id="coreProgressText" style="font-size: 12px; font-family: monospace; white-space: nowrap; display: block;">Initializing...</span></div>` + quitDiv;
		$('#message').modal('show');
		
		try {
			await window.ottoAPI.exec(`${arduino_ide_cmd} --config-file arduino-cli.yaml core update-index`, {cwd: arduino_basepath});
			let currentProgress = 0;
			await new Promise((resolve, reject) => {
				window.ottoAPI.spawn(
					arduino_ide_cmd,
					['--config-file', 'arduino-cli.yaml', 'core', 'upgrade', coreName],
					{cwd: arduino_basepath},
					{
						onStdout: (data) => {
							let match = data.match(/(\d+)%/);
							if (match) {
								currentProgress = parseInt(match[1]);
								document.getElementById('coreProgress').value = currentProgress;
							}
							let lines = data.split('\n').filter(l => l.trim().length > 0);
							if (lines.length > 0) {
								let lastLine = lines[lines.length - 1].trim();
								let el = document.getElementById('coreProgressText');
								if (el) el.innerText = lastLine;
							}
						},
						onStderr: (data) => console.log("stderr:", data),
						onError: reject,
						onClose: (code) => {
							if (code === 0) resolve();
							else reject(new Error(`Exit code ${code}`));
						}
					}
				);
			});
			updateCoreStatus();
			$('#message').modal('hide');
		} catch(err) {
			messageDiv.style.color = '#ff0000';
			messageDiv.innerHTML = 'Failed to update core: ' + err.toString() + quitDiv;
		}
	});

	$('#menu_core_open_dir').on('click', async function(e) {
		e.preventDefault();
		var dataPath = await window.ottoAPI.getArduinoDataPath();
		window.ottoAPI.openPath(dataPath);
	});

	$('#menu_compiler_update').on('click', async function(e) {
		e.preventDefault();
		isArduinoCliEnsured = false;
		await window.ottoAPI.exec(window.navigator.userAgent.indexOf('Win') !== -1 ? `del arduino-cli.exe` : `rm -f arduino-cli`, {cwd: arduino_basepath}).catch(() => {});
		await ensureArduinoCli();
		updateCoreStatus();
	});

	$('#btn_verify').on('click', async function(){
		if (localStorage.getItem('content') == "off") {
			var data = editor.getValue()
		} else {
			var data = $('#pre_previewArduino').text()
		}
		var carte = localStorage.getItem('card')
		var prog = localStorage.getItem('prog')
		var com = portserie.value
		messageDiv.style.color = '#000000'
		messageDiv.innerHTML = Blockly.Msg.check + '<i class="fa fa-spinner fa-pulse fa-1_5x fa-fw"></i>'

		if (prog == "python") {
			await window.ottoAPI.writeFile('./compilation/python/py/sketch.py', data)
			try {
                await window.ottoAPI.exec('python -m pyflakes ./py/sketch.py', {cwd:"./compilation/python"})
                messageDiv.style.color = '#009000'
				messageDiv.innerHTML = Blockly.Msg.check + ':✅ OK' + quitDiv
            } catch(err) {
                var stderr = err.toString()
                rech=RegExp('token')
                if (rech.test(stderr)){
                    messageDiv.style.color = '#ff0000'
                    messageDiv.innerHTML = Blockly.Msg.error + quitDiv
                } else {
                    messageDiv.style.color = '#ff0000'
                    messageDiv.innerHTML = stderr + quitDiv
                }
            }
		} else {
            await window.ottoAPI.writeFile(`${arduino_basepath}/sketch/sketch.ino`, data)
            var upload_arg = window.profile[carte].upload_arg
            var coreName = upload_arg.split(':').slice(0, 2).join(':');

			try {
				await ensureCoreInstalled(coreName);
			} catch(e) {
				messageDiv.style.color = '#ff0000';
                messageDiv.innerHTML = 'Failed to install core: ' + e.toString() + quitDiv;
				return;
			}

            messageDiv.style.color = '#000000';
		    messageDiv.innerHTML = Blockly.Msg.check + '<i class="fa fa-spinner fa-pulse fa-1_5x fa-fw"></i>';

            var cmd = `${arduino_ide_cmd} compile --fqbn ` + upload_arg +' sketch/sketch.ino'

            try {
                await window.ottoAPI.exec(cmd, {cwd: arduino_basepath})
                messageDiv.style.color = '#009000'
				messageDiv.innerHTML = Blockly.Msg.check + ': ✅ Code is ready to upload' + quitDiv
				$('#message').modal('show');
				setTimeout(function() {
    			$('#message').modal('hide');
				}, 3000);
            } catch(error) {
                messageDiv.style.color = '#ff0000'
                messageDiv.innerHTML = error.toString() + quitDiv
            }
		}
		localStorage.setItem("verif",true)
	})
	$('#btn_flash').on('click', async function(){
		var data = $('#pre_previewArduino').text()
		var carte = localStorage.getItem('card')
		var prog = profile[carte].prog
		var speed = profile[carte].speed
		var cpu = profile[carte].cpu
		var com = portserie.value
		var upload_arg = window.profile[carte].upload_arg
		var coreName = upload_arg ? upload_arg.split(':').slice(0, 2).join(':') : null;

		if ( com == "com" ){
			messageDiv.style.color = '#ff0000'
			messageDiv.innerHTML = Blockly.Msg.com2 + quitDiv
			return
		}
		if ( localStorage.getItem('verif') == "false" ){
			if (prog !== "python" && coreName) {
				try {
					await ensureCoreInstalled(coreName);
				} catch(e) {
					messageDiv.style.color = '#ff0000';
					messageDiv.innerHTML = 'Failed to install core: ' + e.toString() + quitDiv;
					return;
				}
			}

			messageDiv.style.color = '#000000'
			messageDiv.innerHTML = Blockly.Msg.check + '<i class="fa fa-spinner fa-pulse fa-1_5x fa-fw"></i>'
			await window.ottoAPI.writeFile(`${arduino_basepath}/sketch/sketch.ino`, data)

			var cmd = `${arduino_ide_cmd} compile --fqbn ` + upload_arg +' sketch/sketch.ino'

            try {
			    await window.ottoAPI.exec(cmd , {cwd: `${arduino_basepath}`})
			    messageDiv.style.color = '#009000'
				messageDiv.innerHTML = Blockly.Msg.check + ': ✅ OK' + quitDiv
            } catch(error) {
                messageDiv.style.color = '#ff0000'
                messageDiv.innerHTML = error.toString() + quitDiv
                return
            }
		}

		if (prog !== "python" && coreName) {
			try {
				await ensureCoreInstalled(coreName);
			} catch(e) {
				messageDiv.style.color = '#ff0000';
				messageDiv.innerHTML = 'Failed to install core: ' + e.toString() + quitDiv;
				return;
			}
		}

		messageDiv.style.color = '#000000'
		messageDiv.innerHTML = Blockly.Msg.upload + '<i class="fa fa-spinner fa-pulse fa-1_5x fa-fw"></i>'
		if ( prog == "python" ) {
			if ( cpu == "cortexM0" ) {
				var cheminFirmware = "./compilation/python/firmware.hex"
				var fullHexStr = ""
                try {
				    var res1 = await window.ottoAPI.exec('wmic logicaldisk get volumename')
					localStorage.setItem("volumename", res1.stdout.split('\r\r\n').map(value => value.trim()))
				    var res2 = await window.ottoAPI.exec('wmic logicaldisk get name')
					localStorage.setItem("name", res2.stdout.split('\r\r\n').map(value => value.trim()))
                } catch(e) { console.log(e) }

				var volume = localStorage.getItem("volumename") || ""
				var drive = localStorage.getItem("name") || ""
				var volumeN = volume.split(',')
				var driveN = drive.split(',')
				var count = volumeN.length
				var disk = ""
				for (var i = 0 ; i < count ; i++) {
					if (volumeN[i]=="MICROBIT") disk = driveN[i]
				}
				if (disk!="") {
                    try {
                        var firmware = await window.ottoAPI.readFile(cheminFirmware)
						fullHexStr = upyhex.injectPyStrIntoIntelHex(firmware, data)
						await window.ottoAPI.writeFile(disk + '\\sketch.hex', fullHexStr)
                        setTimeout(uploadOK, 7000)
                    } catch(err) {
                        messageDiv.style.color = '#ff0000'
                        messageDiv.innerHTML = err.toString() + quitDiv
                    }
				} else {
					messageDiv.style.color = '#000000'
					messageDiv.innerHTML = 'Connect micro:bit!' + quitDiv
				}
			} else {
                try {
				    await window.ottoAPI.exec( 'python -m ampy -p ' + com + ' -b 115200 -d 1 run --no-output ./py/sketch.py', {cwd: "./compilation/python"})
					uploadOK()
                } catch(err) {
                    messageDiv.style.color = '#ff0000'
                    messageDiv.innerHTML = err.toString() + quitDiv
                    return
                }
			}
		} else {
			cmd = `${arduino_ide_cmd} upload --port `+portserie.value +' --fqbn ' + upload_arg +' sketch/sketch.ino'
            try {
		        await window.ottoAPI.exec( cmd, {cwd:`${arduino_basepath}`})
				uploadOK()
            } catch(err) {
                messageDiv.style.color = '#ff0000'
                messageDiv.innerHTML = err.toString() + quitDiv
                return
            }
		}
		localStorage.setItem("verif",false)
	})
	$('#btn_saveino').on('click', function(){
		if (localStorage.getItem("prog") == "python") { window.ottoAPI.send('save-py') } else { window.ottoAPI.send('save-ino') }
	})
	$('#btn_saveXML').on('click', function(){
		if (localStorage.getItem("content") == "on") {
			window.ottoAPI.send('save-bloc')
		} else {
			if (localStorage.getItem("prog") == "python") { window.ottoAPI.send('save-py') } else { window.ottoAPI.send('save-ino') }
		}
	})
	window.ottoAPI.on('saved-ino', async function(event, path){
		var code = $('#pre_previewArduino').text()
		if (path === null) {
			return
		} else {
            await window.ottoAPI.writeFile(path, code)
		}
	})
	window.ottoAPI.on('saved-py', async function(event, path){
		var code = $('#pre_previewArduino').text()
		if (path === null) {
			return
		} else {
            await window.ottoAPI.writeFile(path, code)
		}
	})
	window.ottoAPI.on('saved-bloc', async function(event, path){
		if (path === null) {
			return
		} else {
			var xml = Blockly.Xml.workspaceToDom(Blockly.mainWorkspace)
			var toolbox = localStorage.getItem("toolbox")
			if (!toolbox) {
				toolbox = $("#toolboxes").val()
			}
			if (toolbox) {
				var newel = document.createElement("toolbox")
				newel.appendChild(document.createTextNode(toolbox))
				xml.insertBefore(newel, xml.childNodes[0])
			}
			var toolboxids = localStorage.getItem("toolboxids")
			if (toolboxids === undefined || toolboxids === "") {
				if ($('#defaultCategories').length) {
					toolboxids = $('#defaultCategories').html()
				}
			}
			var code = Blockly.Xml.domToPrettyText(xml)
            await window.ottoAPI.writeFile(path, code)
		}
	})
	window.ottoAPI.on('saved-bin', async function(event, path){
		if (path === null) {
			return
		} else {
			var xml = Blockly.Xml.workspaceToDom(Blockly.mainWorkspace)
			var toolbox = localStorage.getItem("toolbox")
			if (!toolbox) {
				toolbox = $("#toolboxes").val()
			}
			if (toolbox) {
				var newel = document.createElement("toolbox")
				newel.appendChild(document.createTextNode(toolbox))
				xml.insertBefore(newel, xml.childNodes[0])
			}
			var toolboxids = localStorage.getItem("toolboxids")
			if (toolboxids === undefined || toolboxids === "") {
				if ($('#defaultCategories').length) {
					toolboxids = $('#defaultCategories').html()
				}
			}
			var code = Blockly.Xml.domToPrettyText(xml)
			var res = path.split(".")
            await window.ottoAPI.writeFile(res[0]+'.bloc', code)
            try {
			    await window.ottoAPI.copyFile(`${arduino_basepath}/build/sketch.ino.with_bootloader.hex`, res[0]+'_with_bootloader.hex')
			    await window.ottoAPI.copyFile(`${arduino_basepath}/build/sketch.ino.hex`, res[0]+'.hex')
			    await window.ottoAPI.copyFile(`${arduino_basepath}/ino/sketch.ino`, res[0]+'.ino')
            } catch(e) { console.log(e) }
		}
	})
})

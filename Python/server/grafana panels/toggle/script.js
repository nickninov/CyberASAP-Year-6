// Light/Dark toggle
let darkMode = localStorage.getItem('darkMode');
const darkModeToggle = document.querySelector('input#status');
const darkModeToggleAlt = document.querySelector('input#dark');
const lightModeToggleAlt = document.querySelector('input#light');

darkMode = null;

document.body.classList.remove('light-mode');

const enableDarkMode = () => {
	document.body.classList.add('light-mode');
	localStorage.setItem('darkMode', 'enabled');
};

const disableDarkMode = () => {
	document.body.classList.remove('light-mode');
	localStorage.setItem('darkMode', null);
};

if (darkMode === 'enabled') {
	enableDarkMode();
	darkModeToggle.classList.add('enabled');
} else {
	disableDarkMode();
	// darkModeToggle.classList.add('enabled');
}

darkModeToggle.addEventListener('click', () => {
	darkMode = localStorage.getItem('darkMode');
	darkModeToggle.classList.toggle('enabled');

	// var url = "http://127.0.0.1:5000/models/toggling/"
	var url = URLS['create_file']
	var status = false;

	if (darkMode !== 'enabled' || darkMode == null) {
		enableDarkMode()
		// Disable inference
		status = true;
	} 
	else {
		disableDarkMode()
		// Enable inference
		status = false;
	}
	const body = {
		"status": status
	};

    var data = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    }

	// Make create model request
	const resp = fetch(url, data).catch((error) => {
		alert(error)
	}).then(async (resp) => {
		const output = await resp.json();
		console.log(output['message'])
	});

});
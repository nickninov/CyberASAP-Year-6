// Upload model button
const submit = document.querySelector('#submit_button');
// Loading wrapper
var wrapper = document.getElementById('loader-wrapper');

// Clickable modal
const modal = document.querySelector(".modal");
const overlay = document.querySelector(".overlay");
const openModalBtn = document.querySelector(".btn-open");
const closeModalBtn = document.querySelector(".btn");

const outputModal = document.getElementById("output_text")

// close modal function
function closeModal(){
    modal.classList.add("hidden");
    outputModal.innerHTML = "";
};

// Open modal function
function openModal(text, colour){
	// Show loading wrapper animation
	wrapper.classList.remove("fade-in-fwd");
	// Make modal appear
    modal.classList.remove("hidden");
	// Show loading wrapper
	wrapper.classList.add("loader-hide");

    outputModal.innerHTML = text;
    closeModalBtn.style.backgroundColor = colour;
};


submit.addEventListener("click", function () {
	// Get data
	var minutes = document.getElementsByClassName('minutes')[0].value;
	var auto_train = document.getElementsByClassName('auto_train')[0].value;
	var epochs = document.getElementsByClassName('epochs')[0].innerHTML;
	var batch_size = document.getElementsByClassName('batch_size')[0].innerHTML;

    var url = URLS['auto_train']

	var body = {
		'minutes': minutes,					
		'auto_train': auto_train,
		'batch': batch_size,
		'epochs': epochs
	}

    var data = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    }

	// Check if variables are empty
	if(minutes == "" || auto_train == ""){
		openModal("Auto train or Minutes - empty...", "red");
	}
	// Variables are not empty
	else {
		// Check if variables are NaN
		if(isNaN(minutes) || isNaN(auto_train)){
			openModal("Auto train or Minutes - not a number...", "red");
		}
		// Numbers
		else {
			// Check if variables are negative numbers
			if(parseInt(minutes) <= 0 || parseInt(auto_train) <= 0){
				openModal("Auto train or Minutes - negative number(s)...", "red");
			}
			// Positive number
			else {
				// Show loading wrapper
				wrapper.classList.remove("loader-hide");
				// Remove loading wrapper vanish animation
				wrapper.classList.remove("fade-out");
				// Show loading wrapper show in animation
				wrapper.classList.add("fade-in-fwd");

				// Make create model request
				const resp = fetch(url, data).catch((error) => {
					openModal(error, "red");
				}).then(async (resp) => {
					const output = await resp.json();
					openModal(output['message'], "green");
				}); 
			}
		}
	}
});
// Close the modal when the close button and overlay is clicked
closeModalBtn.addEventListener("click", closeModal);

/*
When the page loads - disable inference. This code is 
put here because The Inference toggle window.onload()
activates when the user has scrolled down to the page.
This panel is seen in the initial landing page and will
trigger the code.
*/
window.onload = function(){
	// var url = "http://127.0.0.1:5000/models/toggling/"
	var url = URLS['create_file']

	// Disable inference
	const body = {
		"status": false
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
};
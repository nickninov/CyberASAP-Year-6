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
	// Refresh the page
	location.reload();
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


var statusVal = 0;
let id = null;
let speed = 3000;
var run = true;
var training = true;
var initial = true;

const progressBar = document.getElementById("progress-bar");
const epochs_id = document.getElementById("current_epoch");
const estimated_time = document.getElementById("estimated_time");

submit.addEventListener("click", function () {
	// Get tag name
	var tag = document.getElementById('custom-select-input').value;
	var epochs = document.getElementsByClassName('epochs')[0].innerHTML;
	var batch_size = document.getElementsByClassName('batch_size')[0].innerHTML;

	// Show loading wrapper
	wrapper.classList.remove("loader-hide");
	// Remove loading wrapper vanish animation
	wrapper.classList.remove("fade-out");
	// Show loading wrapper show in animation
	wrapper.classList.add("fade-in-fwd");

	statusVal = 0;
	epochs_id.innerHTML = ""
	estimated_time.innerHTML = ""

	id = null;
	run = true;
	training = true

	// Initialise training + refresh bar and estimated time
	id = setInterval(() => {
		if (run){
			updateProgressBar(tag, epochs, batch_size);
		}
	}, speed);

});


// Close the modal when the close button and overlay is clicked
closeModalBtn.addEventListener("click", closeModal);


function updateProgressBar(tag, epochs, batch_size) {

	var body = {
		'tag': tag,
		'batch': batch_size,
		'epochs': epochs,
		'training': training
	}
	training = false;

	var data = {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(body),
	}
	// var url_create = "http://127.0.0.1:5000/models/creating/"
    var url_create = URLS['create_model']
	// var url_update = "http://127.0.0.1:5000/models/train status/"
    var url_update = URLS['train_status']
	// var url_delete = "http://127.0.0.1:5000/models/deleting/"
    var url_delete = URLS['delete_trainining_file']

	// Check if training has been completed
	const isMaxVal = statusVal === 100;

	// If 100% has been reached
	if (isMaxVal) {
		clearInterval(id);
		statusVal = 0;
		
	}
	else {
		// The URL which will make the calls
		var fetch_url = "";

		// Check if this is the first time doing a REST call
		if(initial){
			// Initial URL - creates the model
			fetch_url = url_create;
			initial = false;
		}
		else{
			// The update URL - checks the current training status
			fetch_url = url_update;
		}

		// Make GET request for model training status
		const resp = fetch(fetch_url, data).catch((error) => {
			// There was an error
			openModal(error, "red");
			run = false;
			initial = true;

		}).then(async (resp) => {
			const output = await resp.json();

			// There was some error with starting the training
			if(output.status == -1){
				run = false;
				initial = true;
				openModal(output.message, "red");
			}

			// Model has started training / currently training
			if(output.status == 0 || output.status == 1){

				// Check if this is not the last epoch
				if (output.data.epoch < output.data.total){
					// Calculate the current % to show on the bar
					statusVal = Math.round((output.data.epoch / output.data.total) * 100);
					// Show the current epoch
					epochs_id.innerHTML = "Current epoch: "+ output.data.epoch + " / " + output.data.total;
					estimated_time.innerHTML = "Estimated time: " + output.data.remaining_time;
					
					// Fix last epoch bug
					if(output.data.epoch + 1 == output.data.total){
						delete_json(url_delete, output);
					}
				}
			}

			// Training has finished => delete the file
			if (output.status == 2){
				statusVal = 100;
				// Delete JSON file
				delete_json(url_delete, output);
			}

			progressBar.dataset.status = statusVal + "%";
			progressBar.setAttribute(
			"style",
			`--__progress-bar__status_wh: ${statusVal}%;`
			);
			
		});	
	}
}

// REST call to Flask to delete the train.json file
function delete_json(url, output){
	var data = {
		method: 'GET',
		headers: {
			'Content-Type': 'application/json',
		}
	}

	// Delete JSON file
	const resp = fetch(url, data).catch((error) => {
		openModal(error, "red");
	}).then(async (resp) => {
		const inner_output = await resp.json();

		epochs_id.innerHTML = "Completed"
		estimated_time.innerHTML = ""
		run = false;
		initial = true;
		openModal(output.message, "green");
	})
}
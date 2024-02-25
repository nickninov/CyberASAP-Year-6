// Close modal function
function close_modal(){
    modal.classList.add("hidden");
    output_modal.innerHTML = "";
    btn_close.style.visibility = "visible";
    delete_btn.style.visibility = "visible";
    // Refresh the page after modal has been closed
    document.location.reload();
};

// Open modal function
function open_modal(text, innerHTML){
    modal.classList.remove("hidden");
    output_modal.innerHTML = text;
    close_modal_btn.style.backgroundColor = "green";

    var body = {
        'innerHTML': innerHTML,
        'delete': false // Delete or load status
    }
    
    data = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: body
    }

};

// Fetch the file's HTML tag + name
var file_click = function() {
    close_modal_btn.innerHTML = "Load model";
    delete_btn.style.display = "block";
    // Page will stop refreshing until an action is chosen
    refresh = false;

    open_modal("What would you like to do?", this.innerHTML);
};

// Make Flask REST request
function flask_request(){

    var request_data = data;

    request_data["body"] = JSON.stringify(data["body"])

    const resp = fetch(url, request_data).catch((error) => {
        // Show error message
        output_modal.innerHTML = error;
        // Make button red
        close_modal_btn.style.backgroundColor = "red";

    }).then(async (resp) => {
        const output = await resp.json();
        
        // Show success message
        output_modal.innerHTML = output["message"];
    });

    // Change the default value of "Load model" to "Ok"
    close_modal_btn.innerHTML = "Ok";
    // Hide  delete button
    delete_btn.style.display = "none";
    // Hide close button (top left)
    btn_close.style.visibility = "hidden";
}

function load_model() {

    // Check if model already loaded
    if(this.innerHTML == "Ok"){
        close_modal();
    }
    else{
        data["body"]["delete"] = false;
        flask_request();
    }
}

function delete_model() {
    data["body"]["delete"] = true;
    flask_request();
}

// Clickable modal
const modal = document.querySelector(".modal");
const overlay = document.querySelector(".overlay");

const open_modal_btn = document.querySelector(".btn-open");
const close_modal_btn = document.querySelector(".btn");
const btn_close = document.querySelector(".btn-close");
const delete_btn = document.getElementById("delete_button");
const output_modal = document.getElementById("output_text");

// Get array of li elements
var elements = document.getElementsByClassName("clicked");

// Store POST data
var data = {};
// Checks if the page should be refreshed
var refresh = true;
// Flask REST url
var url = URLS["select_model"]

btn_close.addEventListener("click", close_modal);
delete_btn.addEventListener("click", delete_model)

// Add event for all li elements
for (var i = 0; i < elements.length; i++) {
    elements[i].addEventListener('click', file_click, false);
}

// Close the modal when the close button and overlay is clicked
close_modal_btn.addEventListener("click", load_model);

// Make the page refresh every 1 min
setTimeout(() => {
    // Check if page should refresh
    if(refresh){
        document.location.reload();
    }
    
  }, 60 * 1000);
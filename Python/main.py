# Used for server
from flask import Flask, request, render_template
from flask_cors import CORS
# Used for date checks
from datetime import datetime, timedelta
# Adds higher directory to python modules path
import sys
# Used for Grafana HTTP API calls - we do them in here because it is more reliable than handling the REST calls in the Volkov forms
import requests
# Used to check if files exist
import os
# Used for database
import server.database as db
# Used for Inference Model commands
import server.inference as inf
# Common functions
import utilities.common_functions as cf
# Live inference logic
import utilities.live_inference as li
# Auto training for model
import utilities.auto_training as at
# Regex for file name
import re
# Multiprocessing
import multiprocessing
# Fetch JSON data per epoch
import json

running = False

# Load config file
config = cf.yaml_loader("config.yaml")

app = Flask(__name__, template_folder=config['flask']['template_folder'], static_folder=config['flask']['static_folder'])
CORS(app)



# Initial page - http://127.0.0.1:5000/
@app.route('/')
def index():
    return {"message": "Hello from Deep Safe Bot :)"}



# Return Grafana annotation tags
@app.route('/data/tags/')
def data_tags():
    global config

    # Create tag url
    url = config['grafana_urls']['base'] + config['grafana_urls']['tags'] 
    
    # Get request for tag from Flask -> Grafana 
    resp = requests.get(url)
    # Store JSON data in a dictionary
    data = resp.json()

    tags = []
    # Go over every object
    for tag in data['result']['tags']:
        # Add current tag
        tags.append(tag['tag'])

    return {"message": tags}



# Model selecting HTML
@app.route('/models/select/')
def models_select():
    global config

    file_names = []
    
    directory = config['paths']['model']

    for file_name in os.listdir(directory):
        full_path = os.path.join(directory, file_name)
        # Check if it is a .h5 file
        if os.path.isfile(full_path) and ".h5" in file_name:
            file_names.append(file_name)

    return render_template('file manager/index.html', len=len(file_names), file_names=file_names)



# Model selecting logic
@app.route('/models/selecting/', methods=["POST"])
def selecting():
    global config
    request_data = request.get_json()
    text = request_data['innerHTML']
    # Check if model needs to be loaded (False) or deleted (True)
    delete = request_data['delete']

    my_response = {
        "message": ""
    }

    # Extract file's name
    regex = "name\">.+\.h5"
    start = re.search(regex, text).span()[0]
    end = re.search(regex, text).span()[1]
    
    # Remove name\"> from file name
    file_name = text[start+6:end]
    full_path = os.path.join(config['paths']['model'], file_name)

    # Check if file needs to be deleted
    if not delete:

        # Check if model already exists
        if os.path.isfile(config['paths']['user']):
            # Load existing model
            model_config = cf.yaml_loader(config['paths']['user'])
            # Change model that will be loaded next time
            model_config['path'] = full_path
            # Save change
            cf.yaml_dump(config['paths']['user'], model_config)
            my_response['message'] = f"Model {file_name} successfully loaded!"

        # Model does not exist
        else:
            # Set up new model's configuration
            model_config = {
                "tag": "N/A",
                "auto_train": 0,
                "minutes": 0,
                "batch": 0,
                "epochs": 0,
                "path": full_path,
                "date": datetime.now(),
                "next_train": datetime.now()
            }
            cf.yaml_dump(config['paths']['user'], model_config)
            my_response['message'] = f"Model {file_name} successfully loaded! Please set 2. Auto training."

        # Tell inference.py to load the file
        cf.create_empty_file(config["paths"]["update"])
    
    # File will be deleted
    else:
        my_response['message'] = f"Model {file_name} successfully deleted!"
        cf.delete_file(full_path)

        # Generate threshold path
        threshold_name = file_name.split(".h5")[0] + ".npy"
        threshold_path = os.path.join(config['paths']['threshold'], threshold_name)
        # Delete .npy threshold file
        cf.delete_file(threshold_path)

    return my_response



# Model creation page
@app.route('/models/create/')
def create():
    return render_template('inputs/model creator/index.html')



def multiprocessing_train(config, train_data, request_data):
    # Train the model
    model = inf.Model(config)
    # Create new model - train must start from scratch
    model._model = model._create_model()
    path = model.train(train_data, int(request_data["batch"]), int(request_data["epochs"]))
    # Set up new model's configuration
    model_config = {
        "tag": request_data["tag"],
        "auto_train": 0,
        "minutes": 0,
        "batch": int(request_data["batch"]),
        "epochs": int(request_data["epochs"]),
        "path": path,
        "date": datetime.now(),
        "next_train": datetime.now()
    }
    # Save model configuration 
    cf.yaml_dump(config["paths"]["user"], model_config)



# Delete JSON file
@app.route('/models/deleting/')
def json_delete():
    global config
    # Delete JSON file - training has finished
    cf.delete_file(config["paths"]["logs"])

    return {
        "message": "Complete!"
    }



# Create the model
@app.route('/models/creating/', methods=["POST"])
def models_createing():
    global running, config

    db_caller = db.Database(config)

    """
    status values:
        - -1 - checking
        -  0 - started
        -  1 - training
        -  2 - finished
    """
    my_response = {
        "message": "",
        "status": -1,
        "data": []
    }

    # This route has been called only once
    if not running:
        # Route is currently running - we do not need any more instances of this
        running = True
        # Get Grafana POST data
        request_data = request.get_json()

        # Train model if JavaScript has made a training request
        if request_data["training"]:
            # Tag has been entered
            if request_data['tag'] != "":
                # Create tag url
                url = config['grafana_urls']['base'] + config['grafana_urls']['annotations'] + f"?tags={request_data['tag']}"
                # Get request for tag from Flask -> Grafana 
                resp = requests.get(url)
                # Get the status code of the request
                status = resp.status_code

                # Check if data has been fetched
                if status == 200:
                    # Convert Grafana data to JSON
                    data = resp.json()
                    # Check if there are objects
                    if len(data) > 0:
                        # Grafana pushes latest tags at position 0
                        latest = data[0]
                        
                        # Fix the start and end dates of selected period
                        start_date = cf.to_influxdb_date(latest["time"])
                        end_date = cf.to_influxdb_date(latest["timeEnd"])

                        # Fetch data
                        status, train_data = db_caller.get_model_data(start_date, end_date)
                        
                        # There is data for given start and end dates
                        if status:
                            # Call multiprocessing_train() in seperate thread
                            training = multiprocessing.Process(target=multiprocessing_train, args = (config, train_data, request_data,))
                            training.start()

                            my_response["message"] = "Started training!"
                            my_response["status"] = 0
                            
                        # No data in database
                        else:
                            my_response["message"] = "No data found for given start and end dates"
                        
                    # There is no data
                    else:
                        my_response["message"] = f"Tag {request_data['tag']} does not have any data in it" 

                # Status was not successful
                else:
                    my_response["message"] = f"Grafana status: {status}"

            # User did not enter a tag
            else:
                my_response["message"] = "Grafana tag name is empty"
            
            # Finished running
            running = False

    # REST POST call was made already
    else:
        my_response["message"] = "Currently running! Please wait..."

    # Close database connection
    db_caller._client.close()
    del db_caller

    return my_response



# Get current training status (linked with) model_creating
@app.route('/models/train status/', methods=["POST"])
def train_status():
    """
    status values:
        - -1 - checking
        -  0 - started
        -  1 - training
        -  2 - finished
    """
    my_response = {
        "message": "",
        "status": -1,
        "data": []
    }

    # Check if model has started training
    if os.path.exists(config["paths"]["logs"]):
        # Load json file
        my_response["data"] = json.load(open(config["paths"]["logs"]))["data"]
        # Get last json data
        my_response["data"] = my_response["data"][-1]
        # Fix the displayed time - add a 0 at the beginning if needed
        my_response["data"]["remaining_time"] = cf.fix_time(my_response["data"]["remaining_time"])
        # Check if training has finished
        if my_response["data"]["epoch"] == my_response["data"]["total"]:
            # Indicate that training has finished
            my_response["status"] = 2
            my_response["message"] = "Training successfully completed!"
        # Training is ongoing
        else:
            my_response["message"] = "Model is training."
            # Training has started
            my_response["status"] = 1
        
    # Model is still on first epoch / has not started training
    else:
        my_response["message"] = "Currently on epoch 1"
        my_response["status"] = 0

    return my_response



# Auto training logic
@app.route('/models/auto training/', methods=["POST"])
def auto_training():
    global running, config

    my_response = {
        "message": ""
    }

    # This route has been called only once
    if not running:
        # Route is currently running - we do not need any more instances of this
        running = True
        
        # Get Grafana POST data
        request_data = request.get_json()

        request_data['minutes'] = int(request_data['minutes'])
        request_data['auto_train'] = int(request_data['auto_train'])
        request_data['batch'] = int(request_data['batch'])
        request_data['minutes'] = int(request_data['minutes'])

        # Check if model yaml file exists
        if os.path.isfile(config['paths']['user']):
            # Load existing file
            model_config = cf.yaml_loader(config['paths']['user'])
            # Update file
            model_config['auto_train'] = int(request_data['auto_train'])
            model_config['batch'] = int(request_data['batch'])
            model_config['date'] = datetime.now()
            model_config['epochs'] = int(request_data['epochs'])
            model_config['minutes'] = int(request_data['minutes'])
            model_config['next_train'] = model_config['date'] + timedelta(days = model_config['auto_train'])
            
            cf.yaml_dump(config['paths']['user'], model_config)

            my_response["message"] = "Auto training successfully set!"
            
            # Finished running
            running = False

        # No model yaml file found
        else:
            my_response["message"] = "No model found... Please create or load a model first!"
            running = False
    # REST POST call was made already
    else:
        my_response["message"] = "Currently running! Please wait..."

    return my_response



# Auto training HTML
@app.route('/models/auto train/')
def auto_train():
    return render_template('inputs/auto train/index.html')



# Toggle HTML
@app.route('/models/toggle/')
def models_toggle():
    return render_template('toggle/index.html')



# Toggle inference
@app.route('/models/toggling/', methods=["POST"])
def models_toggling():
    global running, config

    my_response = {
        "message": ""
    }

    # This route has been called only once
    if not running:
        # Route is currently running - we do not need any more instances of this
        running = True
        # Get Grafana POST data
        request_data = request.get_json()

        # Trigger inference
        if request_data['status']:
            
            # Check if model has been created
            if os.path.isfile(config['paths']['user']):
                # Delete temp file to trigger inference (if it exists)
                cf.delete_file(config['paths']['switch'])

                my_response["message"] = "Anomaly detection has been enabled!"
            # No model
            else:
                my_response["message"] = "No model found... Please create a model first!"
        # Disable inference
        else:
            my_response["message"] = "Anomaly detection has been disabled!"

            # Create empty file - if it doesn't exist
            cf.create_empty_file(config['paths']['switch'])

        running = False
        
    # REST POST call was made already
    else:
        my_response["message"] = "Currently running! Please wait..."
    
    return my_response



if __name__ == "__main__":
    # Set up the working files
    cf.start(config)

    # # Live inference
    # live_inference_process = multiprocessing.Process(target=li.run, args = (config,))
    
    # # Auto training checker
    # live_auto_training_process = multiprocessing.Process(target=at.run, args = (config,))

    # live_auto_training_process.start()
    # live_inference_process.start()

    # # Grafana -> Flask requests
    # app.run(debug=True, host='0.0.0.0', port=config['flask']['port'])
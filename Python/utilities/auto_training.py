# Adds higher directory to python modules path
import sys
# Go back 1 folder
sys.path.append("..")
# Used for InfluxDB commands
import server.database as db
# Used for Inference Model commands
import server.inference as inf
# Common functions
import utilities.common_functions as cf
# Used to check if files exist
import os
# Used to make the file sleep
import time
# Used to calculate training dates for InfluxDB
import datetime

def run(config):
    """
    Function description:
    Automatically train the model

    Parameters:
        - config - the configuration yaml file
    """
    # How many minutes to sleep
    seconds = 60 * config['model']['minutes']
    # Current train status
    trained = True

    print("Starting auto training")
    # Run forever
    while True:

        # Check if model yaml file exists
        if os.path.isfile(config['paths']['user']):
            # Load model yaml file
            model_config = cf.yaml_loader(config['paths']['user'])
            # Check if auto training has been set
            if model_config['auto_train'] > 0:
                # Check if model has already been trained
                if not trained:
                    
                    # Check if minutes  or auto training period is set
                    if model_config['auto_train'] > 0 or model_config['minutes'] > 0:
                        # Load model
                        model = inf.Model(config)
                        # Load database
                        database = db.Database(config)

                        # Get start and end date timestamps
                        end_date = datetime.datetime.now()
                        start_date = end_date - datetime.timedelta(minutes = model_config['minutes'])
                        
                        # Convert to InfluxDB valid dates
                        start_date = cf.to_influxdb_date(cf.to_miliseconds(start_date))
                        end_date = cf.to_influxdb_date(cf.to_miliseconds(end_date))

                        # Fetch data from InfluxDB
                        status, data = database.get_model_data(start_date, end_date)

                        # Check if there is data for the given period
                        if status == True:
                            # Train model
                            model_config['path'] = model.train(data, model_config["batch"], model_config["epochs"])
                            model_config['date'] = datetime.datetime.now()
                            model_config['next_train'] = model_config['date'] + datetime.timedelta(days = model_config['auto_train'])

                            # Update current yaml model file
                            cf.yaml_dump(config["paths"]["user"], model_config)
                            # Create empty file to tell live_inference.py to load the new model
                            cf.create_empty_file(config["paths"]["update"])
                            trained = True
                
                # Model was previously trained
                else:
                    # Get YYYY-MM-DD of today
                    current_date = datetime.datetime.now().date()
                    # Get YYYY-MM-DD of next training date
                    next_train_date = model_config['next_train'].date()
                    
                    # Check if model has to be trained again
                    if current_date == next_train_date:
                        trained = False
                    # Does not have to train
                    else:
                        # Sleep for given number of minutes in config file
                        time.sleep(seconds)
            # Model auto training not set up yet
            else:
                # Sleep for given number of minutes in config file
                time.sleep(seconds)
            
        else:
            time.sleep(60 * 60)

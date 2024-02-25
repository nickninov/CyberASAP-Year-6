# Adds higher directory to python modules path
import sys
# Go back 1 folder
sys.path.append("..")
# Used for data manipulation
import pandas as pd
import numpy as np
# Used for model
import tensorflow as tf
import keras
# Used for generating the model's name
import datetime
# Used to load model
import os
# Common functions
import utilities.common_functions as cf
# Calculate time per epoch
import time
# Write JSON file per epoch
import json

class Model:

    def __init__(self, config):
        self._config = config
        # Initialize threshold
        self._threshold = 0
        # Load model - either Origin or currently used model
        self._model = self._load_model()
        # Empty list - used in prediction
        self.samples = []



    def predict(self, msg):
        """
        Function description:
        The raw data is preprocessed (converted to numpy and shape is corrected)
        and returns the anomalies

        Parameters:
            - msg - raw robot ROS signals
            - threshold - if the mean absolute error is above it => there is an anomaly

        Output:
            - anomaly - a np array of True / False values of anomaly positions within
                        the robot.
            - output - a np array of what the model's predictions are for msg
        """
        # Append array to list
        self.samples.append(msg.position)
        # Get last position
        self.samples = self.samples[-1:]
        # Convert the robot joint positions to numpy
        in_sample = np.asarray(self.samples)
        # Change the shape for LSTM
        in_sample = in_sample.reshape(in_sample.shape[0], 1, in_sample.shape[1])
        output = self._model.predict(in_sample, verbose=0)
        
        # Get the mean absolute difference between input and expected values
        loss_mae = np.mean(np.abs(in_sample - output), axis = 1)
        # Get anomaly values in np list
        anomaly = loss_mae > self._threshold

        # Reshape np arrays to 1D
        anomaly = anomaly.reshape(anomaly.shape[1])
        output = output.reshape(-1)

        return anomaly, output



    def _load_model(self):
        """
        Function description:
        Load selected or trained model by the user 
        from current_model.yaml and the threshold for
        the model.

        Output:
            - model - previously trained model or fresh model
        """
        model = None
        
        # Check if user has set up a file
        if os.path.isfile(self._config["paths"]["user"]):
            # Load current_model.yaml file that Grafana user has made
            model_config = cf.yaml_loader(self._config["paths"]["user"])

            # Check if .h5 exists
            if os.path.isfile(model_config["path"]):

                model = tf.keras.models.load_model(model_config["path"])

                print(f"Loaded {model_config['path']}")

                # Get threshold file's name
                threshold_name = model_config["path"].split(self._config["paths"]["model"])[1].split(".h5")[0]
                threshold_path = self._config["paths"]["threshold"] + threshold_name + ".npy"

                # Load threshold
                self._threshold = np.load(threshold_path)
                
                print(f"Loaded threshold ({self._threshold}) - {threshold_path}")

                # Not needed anymore
                del threshold_name, threshold_path
            
            # .h5 file does not exist
            else:
                # Delete current_model.yaml
                cf.delete_file(self._config["paths"]["user"])
                print(f'{self._config["paths"]["user"]} was not found.\nNew model created!')
                # Create non-trained model
                model = self._create_model()

            # Not needed anymore
            del model_config

        # Load initial model
        else:
            model = self._create_model()
            print("Model successfully created!")
        
        return model



    def train(self, train_data, batch_size, epochs):
        """
        Function description:
        Train the model and save its weights. 
        The weights are saved in a h5 file.
        Exaple: Model_30-10-2022_16-19-01.h5

        Parameters:
            - train_data - the training data - used for X and Y values
            - batch_size - batch size for the model
            - epochs - epochs for the model

        Output:
            - path - the trained model's full path location
        """

        model_name = "Model_" + datetime.datetime.now().strftime("%d-%m-%Y_%H-%M-%S") + ".h5"
        path = self._config["paths"]["model"] + model_name
        self._model.compile(optimizer='adam', loss='mae')

        print("Starting training")
        self._model.fit(train_data, train_data, epochs = epochs, batch_size = batch_size, validation_split = 0.05, verbose = 1, callbacks=[GenerateLog(epochs, self._config["paths"]["logs"])])
        print("Finished training")
        self._model.save(path)

        # Get the model's predictions on the training data - for threshold
        predictions = self._model.predict(train_data)
        # Calculate the loss (Mean Absolute Error)
        loss_mae = np.mean(np.abs(predictions - train_data), axis = 1)
        # Threshold is the largest number
        self._threshold = loss_mae.max()
        # Generate threshold full path
        threshold_path = self._config["paths"]["threshold"] + model_name.split(".h5")[0] + ".npy"
        print(f"Saved threshold ({self._threshold}) for {model_name}")
        # Save threshold numpy number
        np.save(threshold_path, self._threshold)

        return path



    def _create_model(self):
        """
        Function description:
        Create a fresh anomaly detection model
 
        Output:
            - model - non trained model
        """
        # How many samples the LSTM to take into consideration when training and predicting
        timesteps = self._config["model"]["timesteps"]
        # How many columns does the original dataset have
        columns = self._config["model"]["columns"]
        # Build model
        model_inputs = keras.layers.Input(shape=(timesteps, columns))
        L1 = keras.layers.LSTM(32, activation='relu', return_sequences=True, kernel_regularizer=keras.regularizers.l2(0.00))(model_inputs)
        L2 = keras.layers.LSTM(16, activation='relu', return_sequences=False)(L1)
        L3 = keras.layers.RepeatVector(timesteps)(L2)
        L4 = keras.layers.LSTM(16, activation='relu', return_sequences=True)(L3)
        L5 = keras.layers.LSTM(32, activation='relu', return_sequences=True)(L4)
        model_output = keras.layers.TimeDistributed(keras.layers.Dense(columns))(L5)    
        model = keras.models.Model(inputs=model_inputs, outputs=model_output)

        return model



class GenerateLog(tf.keras.callbacks.Callback):
  def __init__(self, total_epochs, log_file):
    # Store total number of epochs
    self.total_epochs = total_epochs
    # Store the path of the log file
    self.log_file = log_file
    # Store the format of the JSON file
    self.json_dict = {
        "data": []
    }
    # Initialize variable for keeping track of time per epoch
    self.start_time = time.time()



  def on_epoch_begin(self, epoch, logs=None):
    """
    Function description:
    This function is called when the current epoch of the 
    model's training begins. We start tracking how much time
    it takes an epoch to complete.

    Parameters:
      - epoch - current epoch (starts from 0)
      - logs - dictionary containing loss values and all metrics
    """
    # Get new start for next epoch
    self.start_time = time.time()



  def on_epoch_end(self, epoch, logs=None):
    """
    Function description:
    This function is called when the current epoch of the
    model's training begins. We write a "log" file in JSON
    format that will be shown in Grafana.

    The log file contains:
      - epoch - current epoch (starts from 1 - not from 0)
      - total - total number of epochs
      - remaining_time - approximately how much time is left for the training
      - timestamp - the current time

    Parameters:
      - epoch - current epoch (starts from 0)
      - logs - dictionary containing loss values and all metrics
    """
    current = datetime.datetime.fromtimestamp(time.time())
    difference = current - datetime.datetime.fromtimestamp(self.start_time)
    remaining_time = difference * (self.total_epochs - (epoch + 1))
    remaining_time = str(remaining_time).split(".")[0]
    
    current_json = {
        "epoch": epoch + 1,
        "total": self.total_epochs, 
        "remaining_time": remaining_time,
        "timestamp": str(datetime.datetime.now())
    }

    self.json_dict["data"].append(current_json)
    
    with open(self.log_file, "w", encoding="utf-8") as f:
      json.dump(self.json_dict, f, ensure_ascii=False, indent=4)
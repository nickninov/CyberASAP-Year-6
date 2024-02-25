# Used to send data to Database
from influxdb_client import InfluxDBClient, Point
from influxdb_client.client.write_api import SYNCHRONOUS
# Used for data manipulation
import numpy as np
import pandas as pd
# Used for indexing
from datetime import datetime
from influxdb_client import WritePrecision

class Database:
    def __init__(self, config):
        # Get configuration
        self._config = config
        # Connect to database
        self._client = InfluxDBClient(url=self._config["influxdb"]["url"], token=self._config["influxdb"]["token"], org=self._config["influxdb"]["org"])
        self._write_api = self._client.write_api(write_options=SYNCHRONOUS)



    def write_raw_data(self, msg):
        """
        Function description:
        Write raw robot data to database

        Parameters:
            - msg - raw robot ROS signals
            - datetime_now - the current time that will be written to InfluxDB
            - nano_seconds - the current nano second that will be written to InfluxDB
        """
        # Store the names of the columns
        names = list(msg.name)
        # Store the robot joint positions
        positions = list(msg.position)
        
        self._write_df(names, positions)
        print("No anomalies\n")


    def write_data(self, msg, output, anomaly):
        """
        Function description:
        Write to database the following values: 
            - raw robot data to database
            - anomaly values if any exist
            - model's output
            - difference between input (msg.position) and output

        Parameters:
            - msg - raw robot ROS signals
            - output - model's prediction
            - anomaly - a np array of True / False values of anomaly positions within the robot.
            - datetime_now - the current time that will be written to InfluxDB
            - nano_seconds - the current nano second that will be written to InfluxDB
        """
        # Store the names of the columns
        names = list(msg.name)
        # Store the robot joint positions
        positions = list(msg.position)
        # Convert np list to normal Python list
        anomaly = anomaly.tolist()
        # Convert np list to normal Python list
        outputs = output.tolist()
        # Count the total number of anomalies
        anomaly_number = np.count_nonzero(anomaly)

        # Get current anomalies within the robot joints
        anomalies = dict(map(lambda current_anomaly, position, name: (f"anomaly_{name}", position) if current_anomaly else ("", ""), anomaly, positions, names))
        # Remove non anomalies
        if '' in anomalies: del anomalies['']
        
        # Set column names for DataFrame - joint names + prediction_joint_names + difference_joint_names + anomalies_joint_names + total number of anomalies
        columns = names + list(map(lambda name: "prediction_" + name, names)) + list(map(lambda name: "difference_" + name, names)) + list(anomalies.keys()) + list(["anomalies"])
        # Set values for DataFrame - joint names + prediction_joint_names + difference_joint_names + anomalies_joint_names + total number of anomalies
        values = positions + outputs + list(map(lambda position, prediction: position - prediction, positions, outputs)) +  list(anomalies.values()) + [anomaly_number]
        
        self._write_df(columns, values)

        print(f"Anomalies:\t{anomaly_number}\n")



    def _write_df(self, columns, values):
        """
        Function description:
        Write a pandas dataframe to InfluxDB. Usually it is one full sample of ROS2 data.

        Parameters:
            - columns - column names of DataFrame
            - values - values of DataFrame
        """
        
        # Make 1 row Pandas DataFrame in format {"joint_name": value}
        record = pd.DataFrame([dict(zip(columns, values))], index=[datetime.utcnow()])

        # Write the current datapoint
        self._write_api.write(bucket=self._config["influxdb"]["bucket"], record=record, data_frame_measurement_name=self._config["influxdb"]["measurement"])
        print(f"Wrote:\t{record.shape}")


    def get_model_data(self, start_date, end_date):
        """
        Function description:
        Fetch data from InfluxDB for the given start and end date 
        and prepare it to be given to the inference model.

        Parameters:
            - start_date - the start date for pulling data
            - end_date - the end date for pulling data

        Output:
            - status - boolean which tells if there is data or not within InfluxDB
            - data - the database's empty output or preprocessed model data
                      (this is based on if there is any data for that time period)
        """

        # Generate InfluxDB robot joints query
        joint_query = ""
        robot_joints = self._config['influxdb']['robot_joints']

        # Go over every robot joint
        for index in range(len(robot_joints)):
            # Add current robot joint to query
            joint_query += f'r["_field"] == "{robot_joints[index]}"'
            # Do not add ' or ' to the last joint
            if index != len(robot_joints) - 1:
                joint_query += ' or '

        # InfluxDB database query to pick up data for all robot joints for given start  and end date
        query = f'''
        from(bucket: "{self._config["influxdb"]["bucket"]}")
            |> range(start: time(v: "{start_date}"), stop: time(v: {end_date}))
            |> filter(fn: (r) => r["_measurement"] == "{self._config["influxdb"]["measurement"]}")
            |> filter(fn: (r) => {joint_query})
            |> pivot(rowKey:["_time"], columnKey: ["_field"], valueColumn: "_value")
        '''
        # Fetch data for all joints from InfluxDB for given start_date and end_date
        data = self._client.query_api().query_data_frame(org=self._config["influxdb"]["org"], query=query)
        # Flag which tells if there is data in InfluxDB or not
        status = False

        # Check if there is any data
        if len(data) > 0:
            # Data preprocessing
            # Sort by current time - just in case
            data = data.sort_values(by=['_time'])            
            # Drop unecessary columns
            data = data.drop(["result", "table", "_start", "_stop", "_measurement", self._config["influxdb"]["tag"]["key"], "_time"], axis = 1)
            # Rearrange the columns for ROS2
            data = data[self._config['influxdb']['robot_joints']]
            
            # Convert to numpy for model
            data = data.to_numpy()
            # Reshape data for LSTM (samples, timesteps, features)
            data = data.reshape(data.shape[0], 1, data.shape[1])
            
            # Change flag - there was data in InfluxDB
            status = True
       
        return status, data



    def _write_single_point(self, name, position, datetime_now, nano_seconds):
        """
        Function description:
        !!! Currently not used !!!
        Write single datapoint to InfluxDB

        Parameters:
            - name - column name
            - position - robot joint value
            - datetime_now - the current time that will be written to InfluxDB
            - nano_seconds - the current nano second that will be written to InfluxDB
        """
        
        nano_seconds = WritePrecision.NS

        record = Point(self._config["influxdb"]["measurement"])\
                    .tag(self._config["influxdb"]["tag"]["key"], self._config["influxdb"]["tag"]["value"])\
                    .field(name, position)\
                    .time(datetime_now, nano_seconds)
        
        # Write to database
        self._write_api.write(self._config["influxdb"]["bucket"], self._config["influxdb"]["org"], record)
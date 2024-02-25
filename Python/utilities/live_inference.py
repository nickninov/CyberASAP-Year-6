# Used for robot signals
import rclpy
from rclpy.node import Node
from sensor_msgs.msg import JointState
import threading
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

class JointStateSubscriber(Node):

    def __init__(self, config):
        super().__init__('JointState_subscriber')
        self.lock = threading.Lock()
        self.positions = []
        self.JointState_subscriber = self.create_subscription(
            JointState, 'joint_states', self.listener_callback, 10)
        
        self._db = db.Database(config)
        self._model = inf.Model(config)
        self._config = config

        
        
    def listener_callback(self, msg):
        """
        Function description:
        Inference model

        Parameters:
            - msg - raw robot ROS signals
        """

        self.lock.acquire()

        # Check if new model is available
        if os.path.isfile(self._config['paths']['update']):
            # Load model
            self._model._model = self._model._load_model()
            # Delete empty text file
            cf.delete_file(self._config['paths']['update'])
        
        # If toggle is switched off or if model has been created => no inference
        if os.path.isfile(self._config['paths']['switch']):
            self._db.write_raw_data(msg)
            
        # File has been deleted => start inference
        else:
            # Check if user has turned on toggle
            # Get which positions have anomalies
            anomaly, output = self._model.predict(msg)
            # Write anomalies to InfluxDB
            self._db.write_data(msg, output, anomaly)
        
        self.lock.release()



def run(config):
    """
    Function description:
    Launches the ROS2 listening process

    Parameters:
        - config - the configuration yaml file
    """
    rclpy.init()
    node = JointStateSubscriber(config)
    print("Starting live inference")
    rclpy.spin(node)
    node.destroy_node()
    rclpy.shutdown()
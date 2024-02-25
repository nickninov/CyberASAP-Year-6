# Load and write config file data
import yaml
# Used for date editing
from datetime import datetime
# Used to check if files exist / delete them
import os

def yaml_loader(file_path):
    """
    Function description:
    Load a yaml file

    Parameters:
        - file_path - the yaml file's location

    Output:
        - data - the loaded data from yaml
    """
    with open(file_path, "r") as file_descriptor:
        data = yaml.safe_load(file_descriptor)
    
    print(f"{file_path} loaded!")

    return data



def yaml_dump(file_path, data):
    """
    Function description:
    Dump a data in a yaml file

    Parameters:
        - file_path - the yaml file's location
    """
    with open(file_path, "w") as file_descriptor:
        yaml.dump(data, file_descriptor)

    print(f"SAVED - {file_path}")



def to_influxdb_date(milliseconds):
    """
    Function description:
    Converts the miliseconds to InfluxDB format date

    Parameters:
        - milliseconds - date in milliseconds
    
    Output:
        - date - the formatted date
    """
    # Convert milisecond timestamp to string date time
    date = str(datetime.fromtimestamp(milliseconds / 1000.0))
    # Convert start date - add T and Z to timestamp for InfluxDB
    date = date.replace(" ", "T")
    date = date + "Z"

    return date



def to_miliseconds(date):
    """
    Function description:
    Converts the date to miliseconds.
    This function was designed to support to_influxdb_date

    Parameters:
        - date - a date object
    
    Output:
        - milliseconds - the given date in milliseconds
    """
    date = datetime.strptime(str(date), "%Y-%m-%d %H:%M:%S.%f")
    milliseconds = date.timestamp() * 1000
    
    return milliseconds



def delete_file(path):
    """
    Function description:
    Check if the file exists and if it does delete it

    Parameters:
        - path - the full path of the file
    """
    # Check if file exists
    if os.path.isfile(path):
        # Delete file
        os.remove(path)



def fix_time(remaining_time):
  """
  Function description:
  Add a 0 at the beginning of the time if needed.
  If the calculated timestamps do not have
  hours then the first 0 of the timestamp
  is omitted. Before this is shown in the 
  browser, we check if a 0 has to be added.

  Parameters:
    - remaining_time - string timestamp in format hours:minutes:seconds

  Output:
    - fixed_time - adds a 0 at the beginning of the string (if needed)
  """

  # Get hours, minutes, seconeds in a list
  time_parts = remaining_time.split(":")[0]
  fixed_time = ""

  # Check if there is a missing number (only happens when the hours are between 0 and 9)
  if len(remaining_time.split(":")[0]) == 1:
    fixed_time += "0" + remaining_time
    
  # The timestamp is ok and does not need any modifications
  else:
    fixed_time = remaining_time

  return fixed_time



def start(config):
    """
    Function description:
    Delete JSON log file if it exists and disable inference.

    Parameters:
        - config - the configuration yaml file
    """
    
    # Initialize the Inference toggle txt file
    create_empty_file(config['paths']['switch'])

    # Delete JSON file if it exists
    delete_file(config['paths']['logs'])

    # Go through every path
    for path in config['javascript']['paths']:
        # Delete file - if it already exists
        delete_file(path)

        # Create file if it doesn't exist
        if not os.path.isfile(path):
            # Write JavaScript code
            content = f"var URLS = {config['javascript']['mappings']}"
            
            # Create empty file
            f = open(path, 'w')
            f.write(content.strip().replace("{PORT}", str(config['flask']['port'])))
            f.close()


def create_empty_file(path):
    """
    Function description:
    Write an empty file - used to toggle internal switches.

    Parameters:
        - path - path to the file
    """

    # Create file if it doesn't exist
    if not os.path.isfile(path):
        # Create empty file
        with open(path, 'w'):
            pass

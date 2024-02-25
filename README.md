# CyberASAP Year 6 - ROS-PCon

<p align="center">
  <img width="550" height="150" src="https://github.com/nickninov/CyberASAP-Year-6/blob/main/Images/uwl-logo.png">
</p>

Designed by [University of West London](https://www.uwl.ac.uk/)

## About

<p align="center">
  <img width="350" height="250" src="https://github.com/nickninov/CyberASAP-Year-6/blob/main/Images/ros-pcon-logo.jpg">
</p>

Robotics have been used in industries such as car manufacturing and aerospace for many years, allowing for automation of these supply chains. Now, the robotics space is moving towards autonomy and the use of robotics in so-called ‘smart factories’, but with this comes an increased risk to security.

Despite the huge benefits robotics brings to many businesses, there’s also a constant risk of attacks on the industrial robotic operations. Industrial robots are widely integrated within the network ecosystem for remote interaction, leaving robots compromised via cyber-physical attacks through system vulnerabilities, misconfigurations and insider attacks.

Whilst there are products that focus on the security hardening of the robotic system, the industry is yet to deliver a real-time anomaly detection and prevention system dedicated to commercial robots.

Robotic security comes in two forms. The first line of defence is front-end prevention, such as the security hardening. It helps, but it isn’t a reliable solution on its own as hackers will always manage to find a way in. Existing solutions are built into the system, scanning for vulnerability and attempting to prevent front line security breach, such as system penetration.

But what happens when this fails or controllers are compromised undetected, meaning hackers can take control and launch stealthily on robotic operations? That’s where ROS-PCon comes in. Standing at the second line of defence, it analyses verified critical problems such as:

- Changing of robot operation (hijack attack)
- Robotic operation behavioural anomalies (rogue robot)
- Machinery health and safety (robot motor/joint defects)
- Risk for robotic operators, other systems and operation environment.

## Market Need

Despite the huge benefits robotics brings to many businesses, there's also a constant risk of attacks on the industrial robotic operations, especially as the robotics space moves towards autonomy in so-called "smart factories". Industrial robots are widely integrated within the network ecosystem for remote interaction, leaving them compromised through system vulnterabilities, misconfigurations and insider attacks.

Whilst there are products that focus on the security hardening of the robotic system - providing front-line defence - the industry is yet to deliver a real-time anomaly detection and prevention system.

## Solution

ROS-PCon stands as at the second line of defence, analysing problems such as changing of robot operation, behavioural anomalies, machinery health and safety and the risk to robotic operators. By learning the robotic movement in a best-case environment, ROS-PCon can highlight anomalies when it spots something unusual.

The system helps expose any stealthy hacking activity, but can also serve health and safety purposes too. Anomalies may also be caused by technical malfunctions or failures, which ROS-PCon can detect before these break down or cause potential harm to workers.

## Target Market

- Industry 4.0 Manufacturing & Automation
- Nuclear Robotics
- Biomedical Robotics

<br>

# How to run

## 1. Telegraf, InfluxDB, Grafana (TIG) Stack

![Logo](https://github.com/nickninov/CyberASAP-Year-6/blob/main/Images/tig.png)

### Getting Started

Navigate to the project directory within project.

```bash
cd Server/tig/
```

Change the environment variables define in `.env` that are used to setup and deploy the stack
```bash
├── telegraf/
├── .env         <---
├── docker-compose.yml
├── entrypoint.sh
├── grafana.ini
└── ...
```

Customize the `telegraf.conf` file which will be mounted to the container as a persistent volume

```bash
├── telegraf/
│   ├── telegraf.conf <---
├── .env
├── docker-compose.yml
├── entrypoint.sh
├── grafana.ini
└── ...
```

Customize the `grafana.ini` file which will be used to set up Grafana. File cannot be modified after the docker image has been created.
```bash
├── telegraf/
├── .env         
├── docker-compose.yml
├── entrypoint.sh
├── grafana.ini. <---
└── ...
```

Start the services
```bash
docker-compose up -d
```

Configure Grafana to work with InfluxDB. Go to `Settings > Configuration > Data Sources`.
```
Query Language: Flux

HTTP:
- URL: http://influxdb:8086/ (check file .env - variables DOCKER_INFLUXDB_INIT_HOST and DOCKER_INFLUXDB_INIT_PORT)

Basic Auth Details:
- User: admin
- Password: admin

InfluxDB Details:
- Organization: check file .env - variable DOCKER_INFLUXDB_INIT_ORG
- Token: check file .env - variable DOCKER_INFLUXDB_INIT_ADMIN_TOKEN
- Default Bucket - check file .env - variable DOCKER_INFLUXDB_INIT_BUCKET
```

After Grafana has been configured to connect to InfluxDB the JSON dashboard can be imported - `./Server/dashboards/`.

**Note**: When starting the tig stack from docker, they need to be launched in the following order
1. Telegraf
2. InfluxDB
3. Grafana

4. Access Grafana
```
http://localhost:3000/
``` 

Default Grafana Credentials are `admin` for the username and password

**❗️ Make sure the `./Python/config.yaml` credentials for InfluxDB (section `influxdb`) match the credentials in `./Server/tig/.env` ❗️**

## 2. How to run?

1. Go to the Python folder.
```
cd Python
```

2. Run `main.py`
```
python main.py
```

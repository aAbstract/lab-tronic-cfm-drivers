# lab-tronic-cfm-drivers

## Description
- LabTronic Cross Flow Membrane Filtration Trainer Device Protocol, Drivers and Basic Data Processing Tools.

## How to Run
1. Install node from https://nodejs.org/
2. Run the following commands
```
npm install
npm run start
```

## User Guide
```
RESET: Calibrate Device Scale (Set to 0)
RECOVER: Recover From Device Error

CONNECT port_name: Connect to Device Over Port port_name
Example: CONNECT /dev/ttyACM0
Example: CONNECT COM3

SET set_target_name value: Change Device Control Parameter
set_target_name = { PISP:PISTON_PUMP, PERP:PERISTALTIC_PUMP }
Example: SET PIST 50

PLOT param: Send Parameter to Single Chart Widget
param = { TEMP, WGHT, PRES }
Example: PLOT WGHT

WRITE data_source file_name
data_source = { LOG, DATA }
Example: WRITE DATA exp1_data.csv
Example: WRITE LOG exp1_log.csv

EXIT: Exit the tool

CMD_ALIASES = {
    'RS': 'RESET',
    'SI': 'SET PISP',
    'SE': 'SET PERP',
    'WD': 'WRITE DATA',
    'WL': 'WRITE LOG',
    'PT': 'PLOT TEMP',
    'PW': 'PLOT WGHT',
    'PP': 'PLOT PRES',
    'CN': 'CONNECT',
    'DC': 'DISCONNECT',
    'RV': 'RECOVER',
    'EX': 'EXIT',
}
```

## Miscellaneous
### Scripts
- linux run script: <b>run.bash</b>
- windows run script: <b>run.bat</b>

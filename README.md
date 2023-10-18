# lab-tronic-cfm-drivers

## Description
- LabTronic Cross Flow Membrane Filtration Trainer Device Protocol, Drivers and Basic Data Processing Tools.

## How to Run
```
npm install
npm run start
```

## User Guide
```
RESET: Calibrate Device Scale (Set to 0)

SET set_target_name value: Change Device Control Parameter
set_target_name = { PISP:PISTON_PUMP, PERP:PERISTALTIC_PUMP }
Example: SET PIST 50

WRITE data_source file_name
data_source = { LOG, DATA }
Example: WRITE DATA exp1_data.csv
Example: WRITE LOG exp1_log.csv

EXIT: Exit the tool
```

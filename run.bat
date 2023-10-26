@echo off

if not exist ".\node_modules" (
  echo "node_modules" folder not found in the current directory.
  echo Running 'npm install'...
  npm install
  start /max wt -d . cmd /k "npm run start"
) else (
    start /max wt -d . cmd /k "npm run start"
)

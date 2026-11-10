@echo off
rem Same checkout on the LAN. Prints the Wi-Fi URL; does not open a browser on this PC.
cd /d "%~dp0"
node codex\serve.mjs 4190 --lan --update
if errorlevel 1 pause

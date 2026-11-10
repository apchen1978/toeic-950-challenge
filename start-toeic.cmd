@echo off
rem Desktop practice. Fast-forwards main when it is safe, then serves codex at http://127.0.0.1:4190/
cd /d "%~dp0"
node codex\serve.mjs 4190 --open --update
if errorlevel 1 pause

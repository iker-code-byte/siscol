@echo off
cd /d "%~dp0"
echo Iniciando Sistema Escolar SISCOL en http://localhost:8000 ...
start "" "http://localhost:8000"
"d:\iker\siscol\backend\venv\Scripts\python.exe" "d:\iker\siscol\backend\manage.py" runserver 0.0.0.0:8000
pause


@echo off
cd /d "%~dp0"
echo =====================================================================
echo   Iniciando Sistema Escolar SISCOL en http://localhost:8000
echo   (Auto-guardado visual activado: presiona Ctrl+S y recarga con F5)
echo =====================================================================
if exist "C:\Users\linet\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" (
    start /B "" cmd /c "cd /d "%~dp0frontend" && "C:\Users\linet\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" node_modules\vite\bin\vite.js build --watch"
)
start "" "http://localhost:8000"
"d:\iker\siscol\backend\venv\Scripts\python.exe" "d:\iker\siscol\backend\manage.py" runserver 0.0.0.0:8000
pause

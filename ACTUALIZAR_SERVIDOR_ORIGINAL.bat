@echo off
chcp 65001 >nul
echo ============================================================================
echo   ACTUALIZANDO SERVIDOR ORIGINAL (https://siscol360.cloud - 179.198.100.133)
echo ============================================================================
echo.
echo Cuando te pida "passphrase" o "password", escribe tu clave y presiona ENTER
echo (recuerda que al escribirla no se ven letras ni asteriscos en pantalla).
echo.

ssh -o StrictHostKeyChecking=no root@179.198.100.133 "for d in /root/siscol /opt/siscol /var/www/siscol /home/*/siscol ~/siscol; do if [ -d \"$d/.git\" ]; then echo \"Carpeta encontrada: $d\"; cd \"$d\" && git fetch origin main && git reset --hard origin/main && docker compose up -d --build && docker compose exec -T backend python manage.py import_excel_bjp && echo '=== ACTUALIZACION COMPLETADA EN SISCOL360.CLOUD ===' && break; fi; done"

echo.
pause

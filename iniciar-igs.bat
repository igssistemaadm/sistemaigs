@echo off
setlocal

cd /d %~dp0

if not exist node_modules (
  echo Instalando dependencias...
  call npm install
  if errorlevel 1 goto :error
)

echo Iniciando o sistema IGS...
call npm run dev
goto :eof

:error
echo Falha ao iniciar o sistema.
pause

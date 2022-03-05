@IF EXIST "%~dp0\node.exe" (
  "%~dp0\node.exe"  "%~dp0\node_modules\composer-watch\bin\composer-watch" %*
) ELSE (
  node  "%~dp0\node_modules\composer-watch\bin\composer-watch" %*
)
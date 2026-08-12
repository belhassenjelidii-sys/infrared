@echo off
echo === Conteneurs Docker ===
docker ps
echo.
echo === Variables PostgreSQL du conteneur ===
docker inspect infrared-optic-storelogo --format "{{range .Config.Env}}{{println .}}{{end}}"
echo.
echo Pour ouvrir psql :
echo docker exec -it infrared-optic-storelogo psql -U postgres
pause

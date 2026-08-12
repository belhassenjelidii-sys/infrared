Write-Host "=== InfraRed PostgreSQL ===" -ForegroundColor Cyan
docker ps --filter "name=infrared-postgres"
Write-Host "`n=== PostgreSQL environment ===" -ForegroundColor Cyan
docker inspect infrared-postgres --format "{{range .Config.Env}}{{println .}}{{end}}"
Write-Host "`n=== Tables ===" -ForegroundColor Cyan
docker exec -it infrared-postgres psql -U infrared -d infrared -c "\dt"
Write-Host "`n=== Prisma Studio ===" -ForegroundColor Cyan
Write-Host "Run: npx prisma studio"

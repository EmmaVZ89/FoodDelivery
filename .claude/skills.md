# Skills - Lo de Luna

## /gen-magic-link [email]
Genera un magic link de acceso para testing local.
```bash
curl -s -X POST http://localhost:5050/api/auth/magic-link -H "Content-Type: application/json" -d "{\"email\":\"EMAIL\"}" > /dev/null
sleep 1
PGPASSWORD=QuoteFlow2026 psql -h localhost -p 5433 -U postgres -d lodeluna -t -c "SELECT \"Token\" FROM magic_links WHERE \"Email\"='EMAIL' AND \"UsedAt\" IS NULL ORDER BY \"CreatedAt\" DESC LIMIT 1"
```
Luego dar al usuario: http://localhost:4200/auth/verify?token=TOKEN

## /restart-backend
Mata y reinicia el backend .NET.
```bash
taskkill //F //IM "LosDeLuna.API.exe" 2>/dev/null
sleep 2
cd /c/Users/Note/OneDrive/Desktop/delivery/backend
dotnet run --project src/LosDeLuna.API --launch-profile http
```

## /build-check
Verifica que ambos proyectos compilen sin errores.
```bash
cd /c/Users/Note/OneDrive/Desktop/delivery/backend && dotnet build 2>&1 | tail -3
cd /c/Users/Note/OneDrive/Desktop/delivery/frontend && npx ng build 2>&1 | grep -E "ERROR|Output"
```

## /new-migration [Name]
Crea una nueva migración EF Core.
```bash
cd /c/Users/Note/OneDrive/Desktop/delivery/backend
dotnet ef migrations add NAME --project src/LosDeLuna.Infra --startup-project src/LosDeLuna.API
```

## /seed-data
Inserta datos de prueba en la BD local.
```bash
PGPASSWORD=QuoteFlow2026 psql -h localhost -p 5433 -U postgres -d lodeluna -c "SQL"
```

## /add-admin [email]
Promueve un usuario a admin.
```bash
PGPASSWORD=QuoteFlow2026 psql -h localhost -p 5433 -U postgres -d lodeluna -c "UPDATE users SET \"Role\"='Admin' WHERE \"Email\"='EMAIL'"
```

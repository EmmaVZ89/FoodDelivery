# ===== Stage 1: Build Angular frontend =====
FROM node:20-alpine AS frontend-build
WORKDIR /frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ .
RUN npx ng build --configuration production

# ===== Stage 2: Build .NET backend =====
FROM mcr.microsoft.com/dotnet/sdk:10.0-preview AS backend-build
WORKDIR /src
COPY backend/src/LosDeLuna.API/LosDeLuna.API.csproj src/LosDeLuna.API/
COPY backend/src/LosDeLuna.Core/LosDeLuna.Core.csproj src/LosDeLuna.Core/
COPY backend/src/LosDeLuna.Infra/LosDeLuna.Infra.csproj src/LosDeLuna.Infra/
RUN dotnet restore src/LosDeLuna.API/LosDeLuna.API.csproj
COPY backend/ .
RUN dotnet publish src/LosDeLuna.API/LosDeLuna.API.csproj -c Release -o /app/publish

# ===== Stage 3: Final runtime =====
FROM mcr.microsoft.com/dotnet/aspnet:10.0-preview AS final
WORKDIR /app

COPY --from=backend-build /app/publish .
COPY --from=frontend-build /frontend/dist/frontend/browser ./wwwroot

RUN mkdir -p /app/storage

ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production

EXPOSE 8080
ENTRYPOINT ["dotnet", "LosDeLuna.API.dll"]

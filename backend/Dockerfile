FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY WorldCup.Api/*.csproj WorldCup.Api/
RUN dotnet restore WorldCup.Api/WorldCup.Api.csproj
COPY WorldCup.Api/ WorldCup.Api/
RUN dotnet publish WorldCup.Api/WorldCup.Api.csproj -c Release -o /app

FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build /app .
EXPOSE 8080
ENTRYPOINT ["dotnet", "WorldCup.Api.dll"]

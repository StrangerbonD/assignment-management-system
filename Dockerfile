FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy project files and restore
COPY ["backend/AssignmentSystem.Api/AssignmentSystem.Api.csproj", "backend/AssignmentSystem.Api/"]
RUN dotnet restore "backend/AssignmentSystem.Api/AssignmentSystem.Api.csproj"

# Copy all files and publish
COPY . .
WORKDIR "/src/backend/AssignmentSystem.Api"
RUN dotnet publish "AssignmentSystem.Api.csproj" -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app
COPY --from=build /app/publish .
ENV ASPNETCORE_URLS=http://+:80
EXPOSE 80
ENTRYPOINT ["dotnet", "AssignmentSystem.Api.dll"]

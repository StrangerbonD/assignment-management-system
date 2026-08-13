using Microsoft.EntityFrameworkCore;
using AssignmentSystem.Api.Data;

namespace AssignmentSystem.Tests.TestHelpers;

public static class DbContextMock
{
    public static AppDbContext CreateInMemoryDbContext(string dbName)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: dbName)
            .EnableSensitiveDataLogging()
            .Options;

        var context = new AppDbContext(options);
        context.Database.EnsureDeleted();
        context.Database.EnsureCreated();
        return context;
    }
}

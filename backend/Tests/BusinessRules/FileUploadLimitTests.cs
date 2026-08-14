using FluentAssertions;
using Xunit;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.FileProviders;
using AssignmentSystem.Api.Controllers;
using AssignmentSystem.Api.Dtos;

namespace AssignmentSystem.Tests.BusinessRules;

public class FileUploadLimitTests
{
    private readonly IWebHostEnvironment _mockEnvironment = new MockWebHostEnvironment();

    [Fact]
    public async Task UploadFile_ShouldReturnBadRequest_WhenFileExceeds5MB()
    {
        // Arrange
        var controller = new FileUploadController(_mockEnvironment);
        
        // Create a mock file with size 6MB (exceeding 5MB limit)
        var fileMock = new MockFormFile(length: 6 * 1024 * 1024, fileName: "large_document.pdf");

        // Act
        var result = await controller.UploadFile(fileMock);

        // Assert
        var badRequestResult = result.Should().BeOfType<BadRequestObjectResult>().Subject;
        badRequestResult.Value.Should().NotBeNull();
    }

    [Fact]
    public async Task UploadFile_ShouldSucceed_WhenFileIsUnder5MB()
    {
        // Arrange
        var controller = new FileUploadController(_mockEnvironment);
        
        // Create a mock text file with size 1KB (under 5MB limit)
        var content = "Sample assignment answer content";
        var fileMock = new MockFormFileWithContent(content, fileName: "assignment.pdf");

        // Act
        var result = await controller.UploadFile(fileMock);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        okResult.Value.Should().NotBeNull();
    }
}

internal class MockWebHostEnvironment : IWebHostEnvironment
{
    public string WebRootPath { get; set; } = "";
    public IFileProvider WebRootFileProvider { get; set; } = null!;
    public string ApplicationName { get; set; } = "TestApp";
    public IFileProvider ContentRootFileProvider { get; set; } = null!;
    public string ContentRootPath { get; set; } = "";
    public string EnvironmentName { get; set; } = "Development";
}

internal class MockFormFile : IFormFile
{
    private readonly long _length;
    public string ContentType => "application/pdf";
    public string ContentDisposition => "form-data";
    public IHeaderDictionary Headers => new HeaderDictionary();
    public long Length => _length;
    public string Name => "file";
    public string FileName { get; }

    public MockFormFile(long length, string fileName)
    {
        _length = length;
        FileName = fileName;
    }

    public void CopyTo(Stream target) { }
    public Task CopyToAsync(Stream target, CancellationToken cancellationToken = default) => Task.CompletedTask;
    public Stream OpenReadStream() => new MemoryStream(new byte[_length]);
}

internal class MockFormFileWithContent : IFormFile
{
    private readonly byte[] _bytes;
    public string ContentType => "application/pdf";
    public string ContentDisposition => "form-data";
    public IHeaderDictionary Headers => new HeaderDictionary();
    public long Length => _bytes.Length;
    public string Name => "file";
    public string FileName { get; }

    public MockFormFileWithContent(string textContent, string fileName)
    {
        _bytes = System.Text.Encoding.UTF8.GetBytes(textContent);
        FileName = fileName;
    }

    public void CopyTo(Stream target) => target.Write(_bytes, 0, _bytes.Length);
    public async Task CopyToAsync(Stream target, CancellationToken cancellationToken = default)
    {
        await target.WriteAsync(_bytes, 0, _bytes.Length, cancellationToken);
    }
    public Stream OpenReadStream() => new MemoryStream(_bytes);
}

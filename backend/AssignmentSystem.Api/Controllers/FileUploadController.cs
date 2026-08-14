using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AssignmentSystem.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class FileUploadController : ControllerBase
{
    private readonly IWebHostEnvironment _environment;

    public FileUploadController(IWebHostEnvironment environment)
    {
        _environment = environment;
    }

    [HttpPost]
    [AllowAnonymous]
    public async Task<IActionResult> UploadFile(IFormFile file)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest(new { message = "No file was uploaded." });
        }

        // Validate allowed file extensions (Images and PDFs)
        var allowedExtensions = new[] { ".pdf", ".jpg", ".jpeg", ".png", ".gif", ".webp" };
        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();

        if (!allowedExtensions.Contains(extension))
        {
            return BadRequest(new { message = "Invalid file type. Only PDF documents and Image files (.jpg, .png, .webp, .pdf) are allowed." });
        }

        // Limit file size strictly to 5MB to prevent DB bloat in Base64 Data URL storage
        if (file.Length > 5 * 1024 * 1024)
        {
            return BadRequest(new { message = "File size exceeds maximum allowed limit of 5MB." });
        }

        using var ms = new MemoryStream();
        await file.CopyToAsync(ms);
        var fileBytes = ms.ToArray();
        var base64String = Convert.ToBase64String(fileBytes);

        string mimeType = extension switch
        {
            ".pdf" => "application/pdf",
            ".jpg" or ".jpeg" => "image/jpeg",
            ".png" => "image/png",
            ".gif" => "image/gif",
            ".webp" => "image/webp",
            _ => "application/octet-stream"
        };

        var dataUrl = $"data:{mimeType};base64,{base64String}";

        return Ok(new { url = dataUrl, fileName = file.FileName, fileType = extension });
    }

    [HttpGet("/uploads/{fileName}")]
    [AllowAnonymous]
    public IActionResult GetUploadedFile(string fileName)
    {
        var webRoot = _environment.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
        var filePath = Path.Combine(webRoot, "uploads", fileName);

        if (!System.IO.File.Exists(filePath))
        {
            var fallbackPath = Path.Combine(Directory.GetCurrentDirectory(), "uploads", fileName);
            if (System.IO.File.Exists(fallbackPath))
            {
                filePath = fallbackPath;
            }
            else
            {
                return NotFound(new { message = "Uploaded file not found." });
            }
        }

        var provider = new Microsoft.AspNetCore.StaticFiles.FileExtensionContentTypeProvider();
        if (!provider.TryGetContentType(fileName, out var contentType))
        {
            contentType = "application/octet-stream";
        }

        return PhysicalFile(filePath, contentType);
    }
}

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace YourProject.Controllers
{
    [ApiController]
    [Route("Admin")]
    [Authorize(Roles = "Admin")] // Only admins can access
    public class AdminController : ControllerBase
    {
        private readonly IGuildService _guildService;
        private readonly IFileStorageService _fileStorageService;
        private readonly ILogger<AdminController> _logger;

        public AdminController(
            IGuildService guildService,
            IFileStorageService fileStorageService,
            ILogger<AdminController> logger)
        {
            _guildService = guildService;
            _fileStorageService = fileStorageService;
            _logger = logger;
        }

        [HttpPost("Guild/{guildId}/Emblem/Upload")]
        public async Task<IActionResult> UploadGuildEmblem(int guildId, IFormFile file)
        {
            try
            {
                // Validate file
                if (file == null || file.Length == 0)
                {
                    return BadRequest(new { status = 400, message = "No file uploaded", error = "File is required" });
                }

                // Validate file type (same as avatar upload)
                var allowedTypes = new[] { "image/jpeg", "image/jpg", "image/png", "image/webp" };
                if (!allowedTypes.Contains(file.ContentType.ToLower()))
                {
                    return BadRequest(new { status = 400, message = "Invalid file type", error = "Please upload a valid image file (JPG, PNG, or WebP)" });
                }

                // Validate file size (5MB max, same as avatar)
                const long maxSize = 5 * 1024 * 1024; // 5MB
                if (file.Length > maxSize)
                {
                    return BadRequest(new { status = 400, message = "File too large", error = "File size must be less than 5MB" });
                }

                // Verify guild exists
                var guild = await _guildService.GetGuildByIdAsync(guildId);
                if (guild == null)
                {
                    return NotFound(new { status = 404, message = "Guild not found", error = $"Guild with ID {guildId} does not exist" });
                }

                // Generate unique filename (same pattern as avatar)
                var fileExtension = Path.GetExtension(file.FileName).ToLower();
                var uniqueFileName = $"{Guid.NewGuid()}{fileExtension}";
                var folderPath = $"emblems/{guildId}";
                var filePath = $"{folderPath}/{uniqueFileName}";

                // Upload to storage (Google Cloud Storage, Azure Blob, etc.)
                using (var stream = file.OpenReadStream())
                {
                    var uploadedUrl = await _fileStorageService.UploadFileAsync(stream, filePath, file.ContentType);
                    
                    // Update guild emblem URL in database
                    var updated = await _guildService.UpdateEmblemUrlAsync(guildId, uploadedUrl);
                    
                    if (!updated)
                    {
                        // If database update fails, try to delete uploaded file
                        await _fileStorageService.DeleteFileAsync(filePath);
                        return StatusCode(500, new { status = 500, message = "Failed to update guild emblem", error = "Database update failed" });
                    }

                    return Ok(new { status = 200, message = "Emblem uploaded successfully", data = true });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading guild emblem via admin");
                return StatusCode(500, new { status = 500, message = "Internal server error", error = ex.Message });
            }
        }
    }
}

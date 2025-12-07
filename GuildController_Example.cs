using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace YourProject.Controllers
{
    [ApiController]
    [Route("[controller]")]
    [Authorize]
    public class GuildController : ControllerBase
    {
        private readonly IGuildService _guildService;
        private readonly IFileStorageService _fileStorageService; // Your file storage service (e.g., Google Cloud Storage)
        private readonly ILogger<GuildController> _logger;

        public GuildController(
            IGuildService guildService,
            IFileStorageService fileStorageService,
            ILogger<GuildController> logger)
        {
            _guildService = guildService;
            _fileStorageService = fileStorageService;
            _logger = logger;
        }

        [HttpPost("Emblem/Upload")]
        public async Task<IActionResult> UploadEmblem(IFormFile file)
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

                // Get current user ID from claims
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
                    ?? User.FindFirst("sub")?.Value 
                    ?? User.FindFirst("nameid")?.Value;

                if (string.IsNullOrEmpty(userIdClaim))
                {
                    return Unauthorized(new { status = 401, message = "Unauthorized", error = "User not found" });
                }

                // Get user's guild (only GM/Leader can upload)
                var guild = await _guildService.GetMyGuildAsync(userIdClaim);
                if (guild == null)
                {
                    return NotFound(new { status = 404, message = "Guild not found", error = "You are not a member of any guild" });
                }

                // Check if user is GM or Leader
                if (guild.UserRole != "GM" && guild.UserRole != "Leader" && guild.UserRole != "0")
                {
                    return Forbid(new { status = 403, message = "Forbidden", error = "Only Guild Masters and Leaders can upload emblems" });
                }

                // Generate unique filename (same pattern as avatar)
                var fileExtension = Path.GetExtension(file.FileName).ToLower();
                var uniqueFileName = $"{Guid.NewGuid()}{fileExtension}";
                var folderPath = $"emblems/{guild.Id}";
                var filePath = $"{folderPath}/{uniqueFileName}";

                // Upload to storage (Google Cloud Storage, Azure Blob, etc.)
                using (var stream = file.OpenReadStream())
                {
                    var uploadedUrl = await _fileStorageService.UploadFileAsync(stream, filePath, file.ContentType);
                    
                    // Update guild emblem URL in database
                    var updated = await _guildService.UpdateEmblemUrlAsync(guild.Id, uploadedUrl);
                    
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
                _logger.LogError(ex, "Error uploading guild emblem");
                return StatusCode(500, new { status = 500, message = "Internal server error", error = ex.Message });
            }
        }
    }
}

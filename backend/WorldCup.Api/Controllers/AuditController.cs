using Microsoft.AspNetCore.Mvc;
using WorldCup.Api.Services;

namespace WorldCup.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuditController : ControllerBase
{
    private readonly AuditChainService _audit;

    public AuditController(AuditChainService audit) => _audit = audit;

    // Anyone (including a suspicious coach) can call this to independently confirm the
    // draft-pick/match-result history hasn't been edited - the tamper-evidence guarantee
    // the blockchain requirement was really asking for. See README "On the blockchain requirement".
    [HttpGet("verify")]
    public async Task<IActionResult> VerifyChain()
    {
        var (valid, firstBrokenId) = await _audit.VerifyChainAsync();
        return Ok(new { valid, firstBrokenId });
    }
}

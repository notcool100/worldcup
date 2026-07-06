namespace WorldCup.Api.Models;

// One of the 70+ historical national squads that can be revealed by "Scout".
public class NationalSquad
{
    public int Id { get; set; }
    public string Nation { get; set; } = "";
    public int Year { get; set; } // World Cup year, 1954-2022
    public string Tournament { get; set; } = ""; // e.g. "1970 World Cup"
    public bool IsJackpot { get; set; }

    public List<Player> Players { get; set; } = new();
}

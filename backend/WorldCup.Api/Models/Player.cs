namespace WorldCup.Api.Models;

// A single historical footballer belonging to a NationalSquad "pack" that can be scouted.
public class Player
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public string Nation { get; set; } = "";
    public int Era { get; set; } // e.g. 1998, 2010, 2022 - the World Cup squad year they represent
    public string Position { get; set; } = ""; // GK, CB, LB, RB, CDM, CM, CAM, LW, RW, ST
    public int Rating { get; set; } // overall 1-99
    public int Pace { get; set; }
    public int Shooting { get; set; }
    public int Passing { get; set; }
    public int Defending { get; set; }
    public int Physical { get; set; }
    public bool IsJackpot { get; set; } // rare, high-impact legendary pull

    public int NationalSquadId { get; set; }
    public NationalSquad? NationalSquad { get; set; }
}

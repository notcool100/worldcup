using WorldCup.Api.Models;

namespace WorldCup.Api.Data;

public static class SeedData
{
    public static void EnsureSeeded(AppDbContext db)
    {
        // Incremental seeding: add any squad not yet in DB (keyed by Nation+Year)
        var existingKeys = db.NationalSquads
            .Select(s => s.Nation + s.Year.ToString())
            .ToHashSet();

        var allSquads = BuildSquads();
        var newSquads = allSquads.Where(s => !existingKeys.Contains(s.Nation + s.Year.ToString())).ToList();
        if (newSquads.Count == 0) return;

        db.NationalSquads.AddRange(newSquads);
        db.SaveChanges();
    }

    private static List<NationalSquad> BuildSquads() => new()
    {
        // ── BRAZIL ───────────────────────────────────────────────────────────────
        Squad("Brazil", 1970, false, new[]
        {
            P("Felix",          "GK",  84, 40, 30, 55, 70, 60),
            P("Carlos Alberto", "RB",  90, 82, 68, 80, 74, 80),
            P("Brito",          "CB",  85, 65, 45, 68, 88, 82),
            P("Piazza",         "CB",  83, 60, 40, 65, 86, 78),
            P("Everaldo",       "LB",  84, 80, 52, 72, 80, 76),
            P("Clodoaldo",      "CDM", 86, 72, 65, 84, 80, 74),
            P("Gerson",         "CM",  88, 65, 78, 92, 60, 72),
            P("Tostao",         "CAM", 88, 76, 84, 88, 42, 68),
            P("Jairzinho",      "RW",  90, 92, 86, 78, 42, 78),
            P("Pele",           "ST",  97, 88, 94, 88, 45, 82),
            P("Rivelino",       "LW",  88, 80, 82, 88, 45, 70),
        }),

        Squad("Brazil", 1982, false, new[]
        {
            P("Valdir Peres",   "GK",  82, 42, 30, 52, 78, 64),
            P("Leandro",        "RB",  84, 82, 55, 74, 78, 74),
            P("Oscar",          "CB",  85, 65, 45, 68, 86, 80),
            P("Luizinho",       "CB",  83, 62, 42, 65, 84, 78),
            P("Junior",         "LB",  86, 84, 60, 80, 78, 76),
            P("Socrates",       "CDM", 91, 70, 82, 92, 62, 72),
            P("Falcao",         "CM",  90, 72, 80, 90, 68, 74),
            P("Zico",           "CAM", 93, 76, 90, 94, 45, 70),
            P("Eder",           "LW",  86, 84, 82, 78, 42, 72),
            P("Serginho",       "ST",  84, 86, 80, 72, 40, 74),
            P("Cerezo",         "RW",  85, 80, 74, 82, 55, 70),
        }),

        Squad("Brazil", 1994, false, new[]
        {
            P("Taffarel",       "GK",  87, 45, 30, 58, 82, 68),
            P("Aldair",         "CB",  87, 65, 42, 70, 88, 80),
            P("Marcio Santos",  "CB",  85, 60, 40, 66, 86, 78),
            P("Branco",         "LB",  86, 80, 65, 76, 80, 78),
            P("Cafu",           "RB",  89, 90, 62, 78, 78, 80),
            P("Mazinho",        "CDM", 84, 70, 60, 80, 82, 76),
            P("Mauro Silva",    "CM",  83, 68, 58, 78, 84, 76),
            P("Zinho",          "CAM", 86, 72, 76, 86, 55, 70),
            P("Romario",        "ST",  93, 78, 95, 82, 35, 68),
            P("Bebeto",         "ST",  89, 80, 88, 80, 38, 70),
            P("Mazinho2",       "LW",  82, 76, 70, 76, 48, 68),
        }),

        Squad("Brazil", 2002, false, new[]
        {
            P("Marcos",         "GK",  85, 42, 30, 55, 80, 66),
            P("Cafu",           "RB",  88, 88, 62, 78, 78, 80),
            P("Roberto Carlos", "LB",  90, 92, 80, 78, 76, 84),
            P("Lucio",          "CB",  88, 74, 52, 72, 88, 84),
            P("Edmilson",       "CB",  85, 70, 45, 68, 86, 80),
            P("Kleberson",      "CDM", 84, 76, 62, 78, 80, 76),
            P("Gilberto Silva", "CM",  86, 70, 55, 80, 86, 78),
            P("Ronaldinho",     "CAM", 90, 84, 84, 90, 45, 72),
            P("Rivaldo",        "LW",  91, 82, 90, 85, 42, 74),
            P("Ronaldo",        "ST",  96, 90, 96, 78, 38, 78),
            P("Juninho",        "RW",  86, 82, 76, 82, 45, 70),
        }),

        // ── ARGENTINA ────────────────────────────────────────────────────────────
        Squad("Argentina", 1978, false, new[]
        {
            P("Ubaldo Fillol",  "GK",  88, 42, 30, 56, 82, 68),
            P("Jorge Olguin",   "RB",  83, 80, 52, 72, 80, 74),
            P("Luis Galvan",    "CB",  84, 62, 42, 68, 86, 80),
            P("Daniel Passarella","CB",88, 70, 70, 76, 88, 82),
            P("Alberto Tarantini","LB",83, 80, 55, 70, 80, 76),
            P("Osvaldo Ardiles","CDM", 87, 76, 68, 88, 68, 72),
            P("Rene Houseman",  "LW",  85, 84, 78, 80, 42, 68),
            P("Mario Kempes",   "ST",  90, 82, 90, 80, 40, 76),
            P("Leopoldo Luque", "RW",  85, 80, 80, 76, 42, 72),
            P("Ricardo Villa",  "CM",  84, 74, 72, 82, 58, 70),
            P("Hector Baley",   "LB",  80, 76, 48, 66, 78, 72),
        }),

        Squad("Argentina", 1986, true, new[]
        {
            P("Nery Pumpido",      "GK",  82, 38, 28, 52, 74, 62),
            P("Jose Brown",        "CB",  85, 65, 45, 68, 86, 80),
            P("Oscar Ruggeri",     "CB",  86, 64, 50, 70, 88, 82),
            P("Julio Olarticoechea","LB", 83, 80, 52, 70, 80, 76),
            P("Sergio Batista",    "CDM", 84, 70, 58, 80, 82, 76),
            P("Ricardo Giusti",    "RB",  82, 78, 48, 68, 78, 74),
            P("Jorge Burruchaga",  "CM",  86, 80, 78, 84, 55, 70),
            P("Jorge Valdano",     "ST",  87, 82, 84, 78, 45, 74),
            P("Diego Maradona",    "CAM", 98, 85, 90, 95, 45, 68),
            P("Hector Enrique",    "CM",  83, 72, 65, 80, 62, 68),
            P("Claudio Caniggia",  "LW",  87, 94, 82, 76, 38, 74),
        }),

        Squad("Argentina", 2022, true, new[]
        {
            P("Emiliano Martinez","GK",  89, 52, 32, 62, 84, 76),
            P("Nahuel Molina",    "RB",  85, 84, 62, 76, 80, 78),
            P("Cristian Romero",  "CB",  87, 76, 48, 70, 88, 84),
            P("Nicolas Otamendi", "CB",  85, 68, 50, 70, 88, 84),
            P("Nicolas Tagliafico","LB", 84, 82, 58, 76, 80, 76),
            P("Rodrigo De Paul",  "CDM", 86, 80, 72, 86, 72, 78),
            P("Leandro Paredes",  "CM",  84, 70, 65, 86, 70, 70),
            P("Alexis Mac Allister","CM",85, 76, 72, 86, 70, 74),
            P("Lionel Messi",     "RW",  93, 82, 92, 92, 40, 66),
            P("Julian Alvarez",   "ST",  86, 86, 82, 78, 52, 76),
            P("Angel Di Maria",   "LW",  87, 88, 82, 86, 42, 68),
        }),

        // ── GERMANY / WEST GERMANY ───────────────────────────────────────────────
        Squad("West Germany", 1974, false, new[]
        {
            P("Sepp Maier",       "GK",  89, 45, 30, 55, 80, 68),
            P("Berti Vogts",      "RB",  86, 80, 55, 72, 86, 76),
            P("Franz Beckenbauer","CB",  95, 76, 72, 90, 90, 80),
            P("Hans-Georg Schwarzenbeck","CB",85,65,45,68,88,82),
            P("Paul Breitner",    "LB",  87, 82, 68, 80, 82, 80),
            P("Uli Hoeness",      "CDM", 86, 82, 72, 80, 72, 78),
            P("Rainer Bonhof",    "CM",  85, 76, 70, 82, 68, 74),
            P("Wolfgang Overath", "CM",  86, 68, 72, 88, 64, 72),
            P("Juergen Grabowski","RW",  85, 86, 76, 80, 45, 70),
            P("Gerd Muller",      "ST",  93, 78, 96, 72, 40, 76),
            P("Bernhard Cullmann","LW",  82, 80, 70, 76, 48, 68),
        }),

        Squad("Germany", 2014, false, new[]
        {
            P("Manuel Neuer",     "GK",  93, 62, 42, 76, 84, 80),
            P("Philipp Lahm",     "RB",  90, 80, 62, 90, 82, 74),
            P("Mats Hummels",     "CB",  88, 70, 55, 80, 88, 84),
            P("Jerome Boateng",   "CB",  88, 74, 50, 76, 88, 82),
            P("Benedikt Howedes", "LB",  84, 74, 48, 72, 84, 78),
            P("Bastian Schweinsteiger","CDM",89,72,72,88,78,80),
            P("Toni Kroos",       "CM",  91, 65, 80, 94, 58, 68),
            P("Mesut Ozil",       "CAM", 88, 74, 76, 92, 40, 60),
            P("Thomas Muller",    "RW",  88, 78, 84, 84, 54, 74),
            P("Mario Gotze",      "LW",  86, 78, 80, 86, 46, 66),
            P("Miroslav Klose",   "ST",  87, 72, 86, 74, 52, 76),
        }),

        // ── FRANCE ───────────────────────────────────────────────────────────────
        Squad("France", 1998, true, new[]
        {
            P("Fabien Barthez",   "GK",  88, 45, 30, 58, 82, 68),
            P("Lilian Thuram",    "RB",  88, 84, 55, 78, 88, 84),
            P("Marcel Desailly",  "CB",  90, 72, 55, 80, 92, 90),
            P("Laurent Blanc",    "CB",  89, 70, 52, 78, 90, 80),
            P("Bixente Lizarazu", "LB",  87, 82, 60, 78, 84, 78),
            P("Didier Deschamps", "CDM", 87, 72, 60, 86, 84, 78),
            P("Christian Karembeu","CM", 85, 80, 65, 80, 78, 80),
            P("Zinedine Zidane",  "CAM", 96, 78, 86, 94, 56, 76),
            P("Youri Djorkaeff",  "CM",  86, 76, 82, 86, 50, 70),
            P("Thierry Henry",    "LW",  90, 94, 88, 80, 46, 78),
            P("Stephane Guivarc'h","ST", 83, 80, 80, 68, 40, 74),
        }),

        Squad("France", 2018, false, new[]
        {
            P("Hugo Lloris",      "GK",  90, 52, 32, 64, 84, 76),
            P("Benjamin Pavard",  "RB",  86, 76, 62, 78, 82, 78),
            P("Raphael Varane",   "CB",  88, 82, 52, 76, 88, 84),
            P("Samuel Umtiti",    "CB",  86, 74, 48, 72, 88, 82),
            P("Lucas Hernandez",  "LB",  86, 80, 52, 74, 86, 82),
            P("N'Golo Kante",     "CDM", 90, 80, 65, 84, 90, 78),
            P("Paul Pogba",       "CM",  88, 80, 80, 87, 66, 82),
            P("Blaise Matuidi",   "CM",  84, 84, 68, 80, 80, 82),
            P("Kylian Mbappe",    "LW",  93, 98, 90, 82, 42, 80),
            P("Antoine Griezmann","CAM", 90, 82, 88, 88, 52, 72),
            P("Olivier Giroud",   "ST",  85, 68, 82, 74, 62, 82),
        }),

        // ── ITALY ────────────────────────────────────────────────────────────────
        Squad("Italy", 1982, false, new[]
        {
            P("Dino Zoff",        "GK",  91, 40, 30, 58, 86, 70),
            P("Claudio Gentile",  "RB",  86, 72, 48, 70, 92, 84),
            P("Gaetano Scirea",   "CB",  90, 70, 50, 80, 90, 80),
            P("Fulvio Collovati", "CB",  85, 65, 42, 68, 88, 80),
            P("Antonio Cabrini",  "LB",  86, 80, 65, 78, 80, 76),
            P("Marco Tardelli",   "CDM", 87, 80, 78, 82, 70, 80),
            P("Gabriele Oriali",  "CM",  84, 72, 62, 80, 78, 76),
            P("Bruno Conti",      "RW",  86, 84, 76, 84, 46, 68),
            P("Francesco Graziani","ST", 84, 76, 80, 70, 40, 72),
            P("Paolo Rossi",      "ST",  90, 82, 92, 74, 44, 70),
            P("Giancarlo Antognoni","CAM",88,68,76,90,50,68),
        }),

        Squad("Italy", 2006, false, new[]
        {
            P("Gianluigi Buffon", "GK",  93, 46, 30, 62, 86, 72),
            P("Gianluca Zambrotta","RB", 88, 86, 62, 80, 84, 80),
            P("Fabio Cannavaro",  "CB",  94, 76, 48, 78, 94, 84),
            P("Alessandro Nesta", "CB",  91, 72, 46, 76, 92, 80),
            P("Fabio Grosso",     "LB",  84, 78, 58, 74, 80, 74),
            P("Gennaro Gattuso",  "CDM", 87, 74, 62, 78, 88, 86),
            P("Andrea Pirlo",     "CM",  92, 65, 72, 94, 64, 68),
            P("Daniele De Rossi", "CM",  88, 72, 72, 84, 80, 82),
            P("Francesco Totti",  "CAM", 91, 72, 86, 88, 50, 72),
            P("Alberto Gilardino","ST",  85, 78, 84, 70, 48, 76),
            P("Luca Toni",        "ST",  86, 72, 88, 68, 52, 82),
        }),

        // ── SPAIN ────────────────────────────────────────────────────────────────
        Squad("Spain", 2010, true, new[]
        {
            P("Iker Casillas",    "GK",  92, 44, 32, 62, 86, 70),
            P("Sergio Ramos",     "CB",  90, 80, 70, 80, 90, 88),
            P("Carles Puyol",     "CB",  88, 72, 45, 72, 92, 86),
            P("Joan Capdevila",   "LB",  84, 80, 55, 76, 80, 74),
            P("Sergio Busquets",  "CDM", 88, 65, 55, 90, 80, 72),
            P("Xabi Alonso",      "CM",  89, 68, 72, 92, 72, 74),
            P("Xavi",             "CM",  92, 68, 72, 97, 60, 64),
            P("Andres Iniesta",   "CAM", 93, 80, 84, 92, 56, 68),
            P("David Villa",      "ST",  90, 86, 90, 78, 44, 72),
            P("Jesus Navas",      "RB",  84, 90, 62, 78, 68, 72),
            P("Fernando Torres",  "LW",  87, 90, 84, 74, 40, 74),
        }),

        // ── NETHERLANDS ──────────────────────────────────────────────────────────
        Squad("Netherlands", 1974, false, new[]
        {
            P("Jan Jongbloed",    "GK",  84, 44, 30, 52, 78, 64),
            P("Wim Suurbier",     "RB",  84, 82, 55, 72, 78, 76),
            P("Arie Haan",        "CB",  86, 72, 65, 82, 80, 74),
            P("Ruud Krol",        "LB",  88, 84, 60, 84, 82, 78),
            P("Wim Rijsbergen",   "CB",  84, 68, 45, 68, 86, 80),
            P("Johan Neeskens",   "CDM", 91, 80, 80, 88, 80, 82),
            P("Wim Jansen",       "CM",  85, 76, 68, 82, 72, 76),
            P("Johnny Rep",       "RW",  87, 88, 82, 78, 42, 72),
            P("Johan Cruyff",     "ST",  97, 90, 88, 94, 45, 74),
            P("Rob Rensenbrink",  "LW",  88, 86, 82, 82, 42, 70),
            P("Rinus Michels",    "CAM", 84, 72, 72, 86, 55, 68),
        }),

        Squad("Netherlands", 2010, false, new[]
        {
            P("Maarten Stekelenburg","GK",85,44,30,58,80,68),
            P("Gregory van der Wiel","RB",85,84,60,78,78,76),
            P("John Heitinga",    "CB",  86, 74, 50, 72, 86, 80),
            P("Joris Mathijsen",  "CB",  84, 68, 45, 68, 84, 78),
            P("Giovanni van Bronckhorst","LB",87,82,65,80,80,76),
            P("Mark van Bommel",  "CDM", 87, 72, 68, 82, 82, 82),
            P("Nigel de Jong",    "CM",  86, 76, 62, 78, 84, 82),
            P("Wesley Sneijder",  "CAM", 90, 74, 84, 90, 56, 72),
            P("Arjen Robben",     "RW",  91, 92, 88, 84, 42, 72),
            P("Dirk Kuyt",        "LW",  86, 82, 78, 78, 60, 78),
            P("Robin van Persie", "ST",  90, 82, 90, 82, 42, 74),
        }),

        // ── ENGLAND ──────────────────────────────────────────────────────────────
        Squad("England", 1966, false, new[]
        {
            P("Gordon Banks",     "GK",  93, 42, 30, 56, 86, 70),
            P("George Cohen",     "RB",  84, 80, 52, 72, 82, 76),
            P("Jack Charlton",    "CB",  86, 65, 48, 70, 88, 84),
            P("Bobby Moore",      "CB",  93, 68, 52, 84, 92, 80),
            P("Ray Wilson",       "LB",  88, 82, 52, 74, 84, 76),
            P("Nobby Stiles",     "CDM", 85, 70, 62, 78, 86, 82),
            P("Alan Ball",        "CM",  87, 80, 72, 86, 68, 76),
            P("Bobby Charlton",   "CM",  92, 78, 82, 92, 62, 76),
            P("Roger Hunt",       "ST",  85, 78, 82, 72, 42, 74),
            P("Geoff Hurst",      "ST",  87, 76, 86, 70, 48, 80),
            P("Martin Peters",    "LW",  86, 76, 78, 82, 58, 74),
        }),

        Squad("England", 2018, false, new[]
        {
            P("Jordan Pickford",  "GK",  85, 52, 32, 58, 78, 70),
            P("Kyle Walker",      "RB",  87, 92, 60, 76, 80, 78),
            P("John Stones",      "CB",  86, 74, 48, 78, 84, 78),
            P("Harry Maguire",    "CB",  85, 68, 50, 74, 86, 84),
            P("Kieran Trippier",  "LB",  85, 80, 65, 82, 78, 74),
            P("Jordan Henderson", "CDM", 85, 74, 65, 82, 78, 78),
            P("Dele Alli",        "CM",  87, 80, 80, 84, 60, 74),
            P("Jesse Lingard",    "CAM", 84, 82, 76, 80, 52, 70),
            P("Raheem Sterling",  "LW",  88, 93, 82, 82, 46, 72),
            P("Harry Kane",       "ST",  91, 78, 92, 80, 52, 82),
            P("Trент Alexander-Arnold","RW",85,80,68,84,72,72),
        }),

        // ── PORTUGAL ─────────────────────────────────────────────────────────────
        Squad("Portugal", 2016, false, new[]
        {
            P("Rui Patricio",     "GK",  87, 46, 30, 60, 82, 70),
            P("Cedric Soares",    "RB",  83, 82, 56, 74, 78, 74),
            P("Pepe",             "CB",  88, 72, 52, 74, 90, 88),
            P("Jose Fonte",       "CB",  84, 68, 45, 70, 86, 80),
            P("Raphael Guerreiro","LB",  86, 84, 68, 82, 76, 72),
            P("William Carvalho", "CDM", 86, 70, 58, 82, 86, 80),
            P("Joao Moutinho",    "CM",  87, 72, 68, 88, 66, 70),
            P("Adrien Silva",     "CM",  83, 72, 65, 82, 70, 72),
            P("Cristiano Ronaldo","ST",  94, 90, 94, 82, 52, 86),
            P("Ricardo Quaresma","RW",  85, 84, 76, 80, 42, 70),
            P("Nani",             "LW",  84, 86, 76, 80, 44, 70),
        }),

        // ── CROATIA ──────────────────────────────────────────────────────────────
        Squad("Croatia", 2018, false, new[]
        {
            P("Danijel Subasic",  "GK",  86, 44, 30, 58, 80, 68),
            P("Sime Vrsaljko",    "RB",  85, 84, 58, 76, 78, 76),
            P("Domagoj Vida",     "CB",  86, 72, 48, 72, 86, 82),
            P("Dejan Lovren",     "CB",  84, 70, 46, 70, 84, 80),
            P("Ivan Strinic",     "LB",  82, 78, 52, 72, 78, 72),
            P("Ivan Rakitic",     "CDM", 88, 74, 72, 88, 74, 76),
            P("Luka Modric",      "CM",  92, 74, 74, 94, 64, 68),
            P("Marcelo Brozovic","CM",   87, 76, 70, 86, 72, 76),
            P("Mario Mandzukic", "ST",   86, 76, 84, 72, 56, 82),
            P("Ante Rebic",       "LW",  85, 86, 80, 76, 52, 74),
            P("Ivan Perisic",     "RW",  87, 84, 80, 82, 58, 78),
        }),

        // ── BELGIUM ──────────────────────────────────────────────────────────────
        Squad("Belgium", 2018, false, new[]
        {
            P("Thibaut Courtois", "GK",  90, 50, 32, 62, 84, 76),
            P("Thomas Meunier",   "RB",  85, 82, 65, 78, 76, 78),
            P("Toby Alderweireld","CB",  89, 74, 52, 80, 88, 80),
            P("Vincent Kompany",  "CB",  88, 74, 52, 76, 90, 86),
            P("Jan Vertonghen",   "LB",  88, 76, 52, 80, 88, 80),
            P("Axel Witsel",      "CDM", 87, 72, 68, 84, 80, 80),
            P("Kevin De Bruyne",  "CM",  92, 76, 82, 94, 62, 76),
            P("Marouane Fellaini","CM",  84, 70, 74, 76, 70, 86),
            P("Eden Hazard",      "LW",  91, 88, 85, 88, 46, 72),
            P("Romelu Lukaku",    "ST",  90, 82, 88, 72, 52, 88),
            P("Dries Mertens",    "RW",  87, 82, 84, 82, 42, 66),
        }),

        // ── MOROCCO ──────────────────────────────────────────────────────────────
        Squad("Morocco", 2022, false, new[]
        {
            P("Yassine Bounou",   "GK",  88, 50, 32, 60, 82, 72),
            P("Achraf Hakimi",    "RB",  89, 92, 72, 82, 74, 78),
            P("Nayef Aguerd",     "CB",  85, 74, 48, 72, 84, 80),
            P("Romain Saiss",     "CB",  84, 70, 48, 72, 84, 80),
            P("Noussair Mazraoui","LB",  84, 82, 60, 76, 78, 74),
            P("Sofyan Amrabat",   "CDM", 86, 76, 62, 80, 84, 82),
            P("Azzedine Ounahi",  "CM",  83, 78, 68, 82, 70, 74),
            P("Selim Amallah",    "CM",  82, 74, 68, 80, 68, 72),
            P("Ziyech Hakim",     "RW",  86, 80, 78, 86, 48, 68),
            P("Youssef En-Nesyri","ST",  85, 80, 82, 70, 48, 78),
            P("Sofiane Boufal",   "LW",  84, 82, 76, 78, 44, 68),
        }),

        // ── URUGUAY ──────────────────────────────────────────────────────────────
        Squad("Uruguay", 1950, false, new[]
        {
            P("Roque Maspoli",    "GK",  86, 40, 30, 52, 82, 66),
            P("Matias Gonzalez",  "RB",  82, 78, 48, 68, 80, 74),
            P("Obdulio Varela",   "CB",  90, 68, 60, 82, 88, 84),
            P("Eusebio Tejera",   "CB",  84, 64, 44, 68, 86, 80),
            P("Victor Rodriguez", "LB",  82, 76, 50, 68, 78, 72),
            P("Schubert Gambetta","CDM", 84, 72, 60, 76, 82, 78),
            P("Juan Schiaffino",  "CM",  92, 72, 82, 92, 55, 70),
            P("Alcides Ghiggia",  "RW",  90, 92, 84, 78, 40, 70),
            P("Oscar Miguez",     "ST",  86, 78, 84, 72, 40, 72),
            P("Ruben Moran",      "LW",  83, 82, 76, 76, 40, 68),
            P("Carlos Tejera",    "CAM", 84, 70, 76, 82, 50, 68),
        }),

        // ── HUNGARY ──────────────────────────────────────────────────────────────
        Squad("Hungary", 1954, true, new[]
        {
            P("Gyula Grosics",    "GK",  88, 44, 30, 56, 84, 68),
            P("Jenő Buzánszky",   "RB",  84, 76, 52, 68, 82, 74),
            P("Mihály Lantos",    "LB",  85, 78, 58, 72, 82, 76),
            P("Gyula Lóránt",     "CB",  86, 65, 45, 68, 88, 82),
            P("József Bozsik",    "CDM", 91, 72, 72, 90, 72, 74),
            P("Nándor Hidegkuti", "CAM", 90, 72, 86, 88, 50, 70),
            P("Zoltán Czibor",    "LW",  88, 88, 82, 80, 42, 68),
            P("Sándor Kocsis",    "ST",  92, 80, 92, 78, 40, 74),
            P("Ferenc Puskás",    "LW",  97, 78, 95, 88, 38, 70),
            P("Péter Palotás",    "RW",  84, 82, 78, 74, 42, 68),
            P("László Budai",     "CM",  83, 76, 70, 80, 55, 68),
        }),

        // ── JAPAN ────────────────────────────────────────────────────────────────
        Squad("Japan", 2022, false, new[]
        {
            P("Shuichi Gonda",    "GK",  82, 46, 30, 56, 76, 66),
            P("Hiroki Sakai",     "RB",  82, 80, 55, 74, 76, 74),
            P("Maya Yoshida",     "CB",  83, 68, 46, 70, 82, 78),
            P("Ko Itakura",       "CB",  83, 72, 46, 72, 82, 78),
            P("Yuto Nagatomo",    "LB",  82, 80, 55, 74, 76, 72),
            P("Wataru Endo",      "CDM", 84, 74, 60, 80, 82, 78),
            P("Hidemasa Morita",  "CM",  83, 74, 64, 82, 72, 74),
            P("Daichi Kamada",    "CAM", 85, 78, 76, 84, 60, 70),
            P("Ritsu Doan",       "RW",  85, 84, 78, 80, 50, 68),
            P("Ayase Ueda",       "ST",  83, 80, 80, 70, 46, 74),
            P("Kaoru Mitoma",     "LW",  86, 88, 78, 80, 46, 68),
        }),
    };

    private static NationalSquad Squad(string nation, int year, bool jackpot, Player[] players)
    {
        var squad = new NationalSquad
        {
            Nation = nation,
            Year = year,
            Tournament = $"{year} World Cup",
            IsJackpot = jackpot,
        };
        foreach (var p in players)
        {
            p.Nation = nation;
            p.Era = year;
            p.IsJackpot = jackpot && p.Rating >= 90;
            squad.Players.Add(p);
        }
        return squad;
    }

    private static Player P(string name, string pos, int rating, int pace, int shooting, int passing, int defending, int physical)
        => new()
        {
            Name = name,
            Position = pos,
            Rating = rating,
            Pace = pace,
            Shooting = shooting,
            Passing = passing,
            Defending = defending,
            Physical = physical,
        };
}

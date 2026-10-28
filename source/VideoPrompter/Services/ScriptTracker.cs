using System.Text.RegularExpressions;
namespace VideoPrompter.Services;
public sealed class ScriptTracker
{
    private string[] Words = [];
    private string[] Keys = [];
    private readonly Dictionary<string,List<int>> Index = new(StringComparer.Ordinal);
    public int Position { get; private set; }
    public int Count => Words.Length;
    public IReadOnlyList<string> DisplayWords => Words;
    private static string[] Tokenize(string text) => Regex.Matches(text.ToLowerInvariant(), @"[\p{L}\p{N}']+").Select(m => m.Value.Replace("'","")).Where(s=>s.Length>0).ToArray();
    private static string Key(string word) => word switch { "a" or "the" => "article", "an" or "and" => "and", "to" or "too" or "two" => "to", "your" or "youre" => "your", "their" or "there" or "theyre" => "there", _ => word };
    public void Load(string script)
    {
        Words = Regex.Matches(script, @"\S+").Select(m=>m.Value).ToArray();
        Keys = Words.Select(w=>Key(Tokenize(w).FirstOrDefault()??"")).ToArray();
        Index.Clear();
        for (var i=0;i<Keys.Length;i++) { if(!Index.TryGetValue(Keys[i],out var positions)) Index[Keys[i]]=positions=[]; positions.Add(i); }
        Position=0;
    }
    public void Seek(int position) => Position=Math.Clamp(position,0,Math.Max(0,Words.Length-1));
    public int Match(string transcript)
    {
        var spoken=Tokenize(transcript).Select(Key).ToArray();
        if(spoken.Length==0 || Keys.Length==0) return Position;
        var candidates=new HashSet<int>();
        foreach(var token in spoken)
            if(Index.TryGetValue(token,out var positions))
                foreach(var pos in positions)
                    for(var offset=0;offset<spoken.Length;offset++)
                    {var start=pos-offset;if(start>=0 && start<Keys.Length)candidates.Add(start);}
        double best=0; int next=Position;
        foreach(var start in candidates)
        {
            if(start < Position-8 || start>Position+100) continue;
            var len=Math.Min(spoken.Length,Keys.Length-start);
            if(len==0)continue;
            var d=Distance(spoken,Keys,start,len);
            var score=1d-d/(double)Math.Max(spoken.Length,len);
            score*=Math.Exp(-Math.Max(0,start-Position)/35d);
            if(score>best){best=score;next=Math.Min(Keys.Length-1,start+len);}
        }
        if(best>=.52 && next>=Position-2) Position=Math.Max(Position,next);
        return Position;
    }
    private static int Distance(string[] spoken,string[] script,int start,int length)
    {
        var previous=Enumerable.Range(0,length+1).ToArray();
        for(var i=1;i<=spoken.Length;i++)
        {
            var current=new int[length+1]; current[0]=i;
            for(var j=1;j<=length;j++)
                current[j]=spoken[i-1]==script[start+j-1]?previous[j-1]:1+Math.Min(previous[j-1],Math.Min(previous[j],current[j-1]));
            previous=current;
        }
        return previous[length];
    }
}
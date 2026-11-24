"""A small, original blocky short example. Replace it with your approved story."""
import json
import os

CAST = {
    "Kai": {
        "skin": [0.92, 0.69, 0.52],
        "shirt": [0.13, 0.46, 0.78],
        "pants": [0.18, 0.22, 0.31],
        "shoes": [0.91, 0.90, 0.85],
        "hair": "short",
        "hair_color": [0.16, 0.10, 0.06],
        "height": 1.0,
    }
}

KAI = [0.0, 0.0]


def A(who, at, **kw):
    return {"who": who, "at": at, **kw}


def S(t0, t1, text, cam, actors, **kw):
    return {
        "t0": t0,
        "t1": t1,
        "text": text,
        "set": "Classroom",
        "cam": cam,
        "subject": "Kai",
        "mood": "sunny",
        "actors": actors,
        **kw,
    }


shots = [
    S(0.0, 3.0, "You drop your phone. It stops.", "mcu", [A("Kai", KAI, anim="shock", face="shock")]),
    S(3.0, 6.0, "Now every dropped thing hangs.", "two", [A("Kai", KAI, anim="point", face="think")]),
    S(6.0, 9.0, "The whole room fills up.", "ws", [A("Kai", KAI, anim="scared", face="scared")]),
    S(9.0, 12.0, "You switch gravity back on.", "cu", [A("Kai", KAI, anim="shock", face="shock")], flash=True),
]

spec = {
    "dur": 12.0,
    "theme": "blocky-3d",
    "voice": "system",
    "keys": ["stops", "fills", "gravity"],
    "music": [[0, "playful"], [0.72, "suspense"]],
    "cast": CAST,
    "shots": shots,
}

output = os.path.join(os.path.dirname(os.path.abspath(__file__)), "timed.json")
with open(output, "w", encoding="utf-8") as handle:
    json.dump(spec, handle, ensure_ascii=False, indent=2)
print("timed.json:", len(shots), "shots,", spec["dur"], "s")

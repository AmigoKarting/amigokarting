# -*- coding: utf-8 -*-
"""Charge le CONTENU de formation (lecture) depuis scripts/data/content/*.json
et génère des fichiers SQL compacts appelant public.set_chapter_content(jsonb).

Format JSON: {"category": "...", "sort_order": N, "title": "...", "content": "..."}
"""
import json, glob, os, sys, re

BASE = r"C:\Users\xavpo\OneDrive\Desktop\amigo-karting\scripts"
DATA = os.path.join(BASE, "data", "content")

def slug(cat):
    s = cat.lower()
    for a, b in [("é","e"),("è","e"),("ê","e"),("à","a"),("â","a"),("ô","o"),("î","i"),("ç","c"),("û","u")]:
        s = s.replace(a, b)
    return re.sub(r"[^a-z0-9]+", "_", s).strip("_")[:24]

def validate(mod):
    errs = []
    if not mod.get("title", "").strip():
        errs.append("titre vide")
    c = mod.get("content", "")
    if not isinstance(c, str) or len(c.strip()) < 200:
        errs.append(f"contenu trop court ({len(c) if isinstance(c,str) else 0} car.)")
    return errs

if __name__ == "__main__":
    prefix = sys.argv[1] if len(sys.argv) > 1 else ""
    files = sorted(glob.glob(os.path.join(DATA, f"{prefix}*.json")))
    if not files:
        print("Aucun fichier JSON dans", DATA, "pour préfixe:", prefix); sys.exit(1)
    mods, total_errs = [], 0
    for f in files:
        mod = json.load(open(f, encoding="utf-8"))
        errs = validate(mod)
        if errs:
            total_errs += len(errs)
            print(f"[ERREURS] {os.path.basename(f)}: " + "; ".join(errs))
        mods.append(mod)
    if total_errs:
        print(f"\n{total_errs} erreur(s)."); sys.exit(1)
    by_cat = {}
    for m in mods:
        by_cat.setdefault(m["category"], []).append(m)
    for cat, cmods in by_cat.items():
        cmods.sort(key=lambda m: m["sort_order"])
        sg = slug(cat)
        for ci in range(0, len(cmods), 4):
            chunk = cmods[ci:ci+4]
            arr = json.dumps(chunk, ensure_ascii=False)
            assert "$q$" not in arr, "délimiteur $q$ présent dans les données"
            sql = ("SELECT public.set_chapter_content(j) FROM jsonb_array_elements($q$"
                   + arr + "$q$::jsonb) AS j;")
            path = os.path.join(BASE, f"_content_{sg}_{chunk[0]['sort_order']}.sql")
            open(path, "w", encoding="utf-8").write(sql)
            print(f"  écrit {os.path.basename(path)} ({len(chunk)} modules, {len(sql)} car.)")
    print(f"\nOK — {len(mods)} formations, 0 erreur.")
    for m in sorted(mods, key=lambda x: x['sort_order']):
        print(f"  {m['sort_order']}: {m['title']} — {len(m['content'])} car.")

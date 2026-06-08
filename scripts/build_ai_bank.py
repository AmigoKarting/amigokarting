# -*- coding: utf-8 -*-
"""Construit le banc de connaissances de l'IA (formateur vocal mock) à partir
des quiz améliorés (scripts/data/*.json). Produit src/lib/ai/training-bank.json.

Chaque entrée: {id, cat, mod, sort, type, q, correct, distractors[], explanation}
type: 'mc' (4 choix), 'on' (Oui/Non), 'vf' (Vrai/Faux)
"""
import json, glob, os

BASE = r"C:\Users\xavpo\OneDrive\Desktop\amigo-karting"
DATA = os.path.join(BASE, "scripts", "data")
OUT = os.path.join(BASE, "src", "lib", "ai", "training-bank.json")

def qtype(choices):
    low = [c.strip().lower() for c in choices]
    if low == ["vrai", "faux"] or low == ["faux", "vrai"]:
        return "vf"
    if low == ["oui", "non"] or low == ["non", "oui"]:
        return "on"
    return "mc"

def main():
    files = sorted(glob.glob(os.path.join(DATA, "*.json")))
    questions = []
    for f in files:
        mod = json.load(open(f, encoding="utf-8"))
        cat = mod.get("category", "")
        title = mod.get("title", "")
        sort = mod.get("sort_order", 0)
        prefix = os.path.splitext(os.path.basename(f))[0]
        for i, q in enumerate(mod.get("questions", []), 1):
            ch = q.get("choices", [])
            ci = q.get("correct", 0)
            if not ch or ci < 0 or ci >= len(ch):
                continue
            t = qtype(ch)
            correct = ch[ci]
            distractors = [c for j, c in enumerate(ch) if j != ci]
            questions.append({
                "id": f"{prefix}_{i}",
                "cat": cat,
                "mod": title,
                "sort": sort,
                "type": t,
                "q": q.get("q", "").strip(),
                "correct": correct,
                "distractors": distractors,
                "explanation": (q.get("explanation") or "").strip(),
            })
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    json.dump({"questions": questions}, open(OUT, "w", encoding="utf-8"),
              ensure_ascii=False, separators=(",", ":"))
    # stats
    from collections import Counter
    byt = Counter(q["type"] for q in questions)
    byc = Counter(q["cat"] for q in questions)
    print(f"OK — {len(questions)} questions -> {os.path.relpath(OUT, BASE)}")
    print("  types:", dict(byt))
    for c, n in byc.items():
        print(f"  {c}: {n}")

if __name__ == "__main__":
    main()

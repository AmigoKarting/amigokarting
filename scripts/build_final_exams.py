# -*- coding: utf-8 -*-
"""Construit un EXAMEN FINAL de certification par catégorie, en échantillonnant
des questions réparties sur tous les modules de la catégorie (banc scripts/data/*.json).
Génère un SQL qui appelle public.seed_quiz_module() pour les 3 examens."""
import json, glob, os

BASE = r"C:\Users\xavpo\OneDrive\Desktop\amigo-karting"
DATA = os.path.join(BASE, "scripts", "data")

# (catégorie, sort_order de l'examen final, titre, nb questions par module)
FINALS = [
    ("Caisse - Amigo Karting", 29, "Examen final — Caisse", 3),
    ("Piste", 49, "Examen final — Piste", 3),
    ("Superviseur du service à la clientèle", 69, "Examen final — Superviseur", 3),
]
PASSING = 0.80

def spread(lst, n):
    """Choisit n éléments répartis également dans lst."""
    if len(lst) <= n:
        return lst
    step = len(lst) / n
    return [lst[int(i * step)] for i in range(n)]

def load_modules():
    by_cat = {}
    for f in sorted(glob.glob(os.path.join(DATA, "*.json"))):
        m = json.load(open(f, encoding="utf-8"))
        if not isinstance(m, dict) or "category" not in m or "questions" not in m:
            continue  # ignore kb.json et autres
        by_cat.setdefault(m["category"], []).append(m)
    for c in by_cat:
        by_cat[c].sort(key=lambda x: x["sort_order"])
    return by_cat

def build():
    by_cat = load_modules()
    exams = []
    for cat, so, title, per in FINALS:
        mods = by_cat.get(cat, [])
        questions = []
        for mod in mods:
            qs = mod.get("questions", [])
            mc = [q for q in qs if len(q.get("choices", [])) >= 3]  # privilégier les choix multiples
            pool = mc if len(mc) >= per else qs
            for q in spread(pool, per):
                questions.append({
                    "q": q["q"],
                    "choices": q["choices"],
                    "correct": q["correct"],
                    "explanation": q.get("explanation", ""),
                })
        exams.append({
            "category": cat,
            "sort_order": so,
            "title": title,
            "passing_score": PASSING,
            "questions": questions,
        })
        print(f"  {title}: {len(questions)} questions (de {len(mods)} modules)")
    return exams

if __name__ == "__main__":
    exams = build()
    arr = json.dumps(exams, ensure_ascii=False)
    assert "$q$" not in arr
    sql = "SELECT public.seed_quiz_module(j) FROM jsonb_array_elements($q$" + arr + "$q$::jsonb) AS j;"
    out = os.path.join(BASE, "scripts", "_final_exams.sql")
    open(out, "w", encoding="utf-8").write(sql)
    print(f"\nSQL écrit: {os.path.basename(out)} ({len(sql)} car.)")

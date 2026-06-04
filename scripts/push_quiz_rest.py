# -*- coding: utf-8 -*-
"""Insère les 6 examens texte dans Supabase via l'API REST (service role).
La clé est lue depuis .env.local — jamais codée en dur.
Idempotent : supprime puis recrée chaque module par son titre.
"""
import json, urllib.request, urllib.parse, os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from seed_quiz_text import MODULES, choices_for, explanation_for

# ── Charger .env.local ──
ENV = {}
env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env.local")
for line in open(env_path, encoding="utf-8"):
    line = line.strip()
    if "=" in line and not line.startswith("#"):
        k, v = line.split("=", 1)
        ENV[k.strip()] = v.strip()

BASE = ENV["NEXT_PUBLIC_SUPABASE_URL"].rstrip("/") + "/rest/v1"
KEY = ENV["SUPABASE_SERVICE_ROLE_KEY"]
HEADERS = {
    "apikey": KEY,
    "Authorization": "Bearer " + KEY,
    "Content-Type": "application/json",
    "Prefer": "return=representation",
}

def req(method, path, body=None):
    url = BASE + path
    data = json.dumps(body).encode("utf-8") if body is not None else None
    r = urllib.request.Request(url, data=data, headers=HEADERS, method=method)
    with urllib.request.urlopen(r) as resp:
        raw = resp.read().decode("utf-8")
        return json.loads(raw) if raw else []

def post(table, rows):
    return req("POST", "/" + table, rows)

def delete_module(title):
    q = "/training_modules?title=eq." + urllib.parse.quote(title, safe="")
    req("DELETE", q)

total = 0
for title, desc, sort_order, questions in MODULES:
    delete_module(title)
    m = post("training_modules", {"title": title, "description": desc,
                                  "content_type": "text", "sort_order": sort_order, "is_active": True})[0]
    c = post("training_chapters", {"module_id": m["id"], "title": title, "sort_order": 0})[0]
    qz = post("quizzes", {"chapter_id": c["id"], "title": "Examen — " + title,
                          "description": desc, "passing_score": 0.80, "is_active": True})[0]
    for idx, q in enumerate(questions, start=1):
        qq = post("quiz_questions", {"quiz_id": qz["id"], "question_text": q[1],
                                     "explanation": explanation_for(q), "points": 1, "sort_order": idx})[0]
        choice_rows = [{"question_id": qq["id"], "choice_text": ctext,
                        "is_correct": correct, "sort_order": ci}
                       for ci, (ctext, correct) in enumerate(choices_for(q), start=1)]
        post("quiz_choices", choice_rows)
        total += 1
    print(f"OK  {title}  ({len(questions)} questions)")

print(f"\nTerminé : {total} questions insérées dans {len(MODULES)} modules.")

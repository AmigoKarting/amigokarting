# -*- coding: utf-8 -*-
"""Charge les modules de quiz améliorés depuis scripts/data/*.json
et génère des fichiers SQL idempotents (groupés) pour exécution via MCP.

Format JSON attendu par fichier:
{
  "category": "...", "sort_order": 50, "title": "...",
  "passing_score": 0.70,
  "questions": [{"q": "...", "choices": ["..."], "correct": 0, "explanation": "..."}]
}
"""
import json, glob, os, sys, re

BASE = r"C:\Users\xavpo\OneDrive\Desktop\amigo-karting\scripts"
DATA = os.path.join(BASE, "data")

def esc(s):
    return str(s).replace("'", "''")

def slug(cat):
    s = cat.lower()
    s = (s.replace("é", "e").replace("è", "e").replace("ê", "e").replace("à", "a")
          .replace("â", "a").replace("ô", "o").replace("î", "i").replace("ç", "c").replace("û", "u"))
    s = re.sub(r"[^a-z0-9]+", "_", s).strip("_")
    return s[:24]

WH = ("qui ", "quel ", "quelle ", "quels ", "quelles ", "comment ", "combien ",
      "lesquel", "pourquoi ", "à quel ", "a quel ", "où ", "ou ", "quand ", "que fais", "que doit", "que faire")

def validate(mod, fname):
    errs = []
    qs = mod.get("questions", [])
    if not qs:
        errs.append("aucune question")
    seen = set()
    for i, q in enumerate(qs, 1):
        txt = q.get("q", "").strip()
        ch = q.get("choices", [])
        co = q.get("correct", None)
        if not txt:
            errs.append(f"Q{i}: texte vide")
        if txt.lower() in seen:
            errs.append(f"Q{i}: doublon « {txt[:40]} »")
        seen.add(txt.lower())
        if not isinstance(ch, list) or len(ch) < 2:
            errs.append(f"Q{i}: <2 choix")
        if not isinstance(co, int) or co < 0 or co >= len(ch):
            errs.append(f"Q{i}: index correct invalide ({co})")
        if not q.get("explanation", "").strip():
            errs.append(f"Q{i}: explication manquante")
        # cohérence: une question ouverte (wh-) ne doit pas avoir des choix Vrai/Faux
        norm = [str(c).strip().lower() for c in ch] if isinstance(ch, list) else []
        binaire_vf = norm == ["vrai", "faux"] or norm == ["faux", "vrai"]
        low = txt.lower()
        if binaire_vf and any(low.startswith(w) for w in WH):
            errs.append(f"Q{i}: choix Vrai/Faux incohérents avec une question ouverte « {txt[:50]} »")
        # choix dupliqués
        if isinstance(ch, list) and len(set(norm)) != len(norm):
            errs.append(f"Q{i}: choix dupliqués")
    return errs

def module_sql(mod):
    cat = mod["category"]; title = mod["title"]; so = mod["sort_order"]
    passing = mod.get("passing_score", 0.70)
    desc = f"Examen de certification — {cat}. {title}."
    out = [f"DELETE FROM public.training_modules WHERE title = '{esc(title)}';",
           "DO $$", "DECLARE m_id uuid; c_id uuid; q_id uuid; qq uuid;", "BEGIN",
           f"  INSERT INTO public.training_modules (title, description, content_type, category, sort_order, is_active) "
           f"VALUES ('{esc(title)}', '{esc(desc)}', 'text', '{esc(cat)}', {so}, true) RETURNING id INTO m_id;",
           f"  INSERT INTO public.training_chapters (module_id, title, sort_order) VALUES (m_id, '{esc(title)}', 0) RETURNING id INTO c_id;",
           f"  INSERT INTO public.quizzes (chapter_id, title, description, passing_score, is_active) "
           f"VALUES (c_id, 'Examen — {esc(title)}', '{esc(desc)}', {passing}, true) RETURNING id INTO q_id;"]
    for idx, q in enumerate(mod["questions"], start=1):
        expl = q.get("explanation", "").strip()
        expl_sql = "'" + esc(expl) + "'" if expl else "NULL"
        out.append(f"  INSERT INTO public.quiz_questions (quiz_id, question_text, explanation, points, sort_order) "
                   f"VALUES (q_id, '{esc(q['q'].strip())}', {expl_sql}, 1, {idx}) RETURNING id INTO qq;")
        rows = []
        for i, ch in enumerate(q["choices"]):
            correct = "true" if i == q["correct"] else "false"
            rows.append(f"(qq, '{esc(ch)}', {correct}, {i+1})")
        out.append("  INSERT INTO public.quiz_choices (question_id, choice_text, is_correct, sort_order) VALUES " + ", ".join(rows) + ";")
    out.append("END $$;")
    return "\n".join(out)

if __name__ == "__main__":
    prefix = sys.argv[1] if len(sys.argv) > 1 else "*"
    files = sorted(glob.glob(os.path.join(DATA, f"{prefix}*.json")))
    if not files:
        print("Aucun fichier JSON trouvé pour le préfixe:", prefix); sys.exit(1)
    mods = []
    total_errs = 0
    for f in files:
        mod = json.load(open(f, encoding="utf-8"))
        errs = validate(mod, f)
        if errs:
            total_errs += len(errs)
            print(f"[ERREURS] {os.path.basename(f)}:")
            for e in errs:
                print("   -", e)
        mods.append(mod)
    if total_errs:
        print(f"\n{total_errs} erreur(s) — corrige avant de charger."); sys.exit(1)
    # group by category
    by_cat = {}
    for m in mods:
        by_cat.setdefault(m["category"], []).append(m)
    for cat, cmods in by_cat.items():
        cmods.sort(key=lambda m: m["sort_order"])
        sg = slug(cat)
        # chunks of 3 modules per SQL file — compact: pass JSON to seed_quiz_module()
        for ci in range(0, len(cmods), 3):
            chunk = cmods[ci:ci+3]
            arr = json.dumps(chunk, ensure_ascii=False)
            assert "$q$" not in arr, "le délimiteur $q$ apparaît dans les données"
            sql = ("SELECT public.seed_quiz_module(j) FROM jsonb_array_elements($q$"
                   + arr + "$q$::jsonb) AS j;")
            path = os.path.join(BASE, f"_load_{sg}_{chunk[0]['sort_order']}.sql")
            open(path, "w", encoding="utf-8").write(sql)
            print(f"  écrit {os.path.basename(path)} ({len(chunk)} modules, {len(sql)} car.)")
    grand = sum(len(m["questions"]) for m in mods)
    print(f"\nOK — {len(mods)} modules, {grand} questions, 0 erreur.")
    for m in sorted(mods, key=lambda x: x['sort_order']):
        print(f"  {m['sort_order']}: {m['title']} — {len(m['questions'])} q")

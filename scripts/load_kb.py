# -*- coding: utf-8 -*-
"""Charge la base de connaissances Q&A (scripts/data/kb.json) dans la table
knowledge_documents via public.seed_knowledge_doc(jsonb). Le premier fichier
généré vide d'abord la table (rechargement idempotent)."""
import json, os

BASE = r"C:\Users\xavpo\OneDrive\Desktop\amigo-karting"
SRC = os.path.join(BASE, "scripts", "data", "kb.json")
CHUNK = 40

def main():
    docs = json.load(open(SRC, encoding="utf-8"))
    n = 0
    for ci in range(0, len(docs), CHUNK):
        chunk = docs[ci:ci + CHUNK]
        arr = json.dumps(chunk, ensure_ascii=False)
        assert "$q$" not in arr, "délimiteur $q$ présent dans les données"
        head = "DELETE FROM public.knowledge_documents;\n" if ci == 0 else ""
        sql = head + ("SELECT public.seed_knowledge_doc(j) FROM jsonb_array_elements($q$"
                      + arr + "$q$::jsonb) AS j;")
        path = os.path.join(BASE, "scripts", f"_kb_{ci}.sql")
        open(path, "w", encoding="utf-8").write(sql)
        print(f"  écrit {os.path.basename(path)} ({len(chunk)} docs, {len(sql)} car.)")
        n += 1
    print(f"\nOK — {len(docs)} documents en {n} fichiers.")

if __name__ == "__main__":
    main()

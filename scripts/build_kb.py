# -*- coding: utf-8 -*-
"""Construit la base de connaissances Q&A (table knowledge_documents) à partir
des formations de lecture (scripts/data/content/*.json). Chaque manuel est
découpé par SECTION (titres en MAJUSCULES) pour une recherche précise.
Produit scripts/data/kb.json."""
import json, glob, os, re

BASE = r"C:\Users\xavpo\OneDrive\Desktop\amigo-karting"
CONTENT = os.path.join(BASE, "scripts", "data", "content")
OUT = os.path.join(BASE, "scripts", "data", "kb.json")

CAT_TAG = {
    "Caisse - Amigo Karting": "caisse",
    "Piste": "piste",
    "Superviseur du service à la clientèle": "superviseur",
}

def is_heading(line):
    s = line.strip()
    if len(s) < 3 or len(s) > 70 or s.startswith("•") or s.startswith("-"):
        return False
    letters = [c for c in s if c.isalpha()]
    if not letters:
        return False
    up = sum(1 for c in letters if c.isupper())
    return up / len(letters) >= 0.75

def chunk_sections(content):
    """Retourne [(heading, body), ...]"""
    lines = content.split("\n")
    sections = []
    cur_head = None
    cur_body = []
    pre = []
    for ln in lines:
        if is_heading(ln):
            if cur_head is not None:
                sections.append((cur_head, "\n".join(cur_body).strip()))
            elif "".join(cur_body).strip():
                pre = cur_body[:]  # contenu avant la 1re section
            cur_head = ln.strip()
            cur_body = []
        else:
            cur_body.append(ln)
    if cur_head is not None:
        sections.append((cur_head, "\n".join(cur_body).strip()))
    intro = "\n".join(pre).strip()
    return intro, sections

def main():
    files = sorted(glob.glob(os.path.join(CONTENT, "*.json")))
    docs = []
    for f in files:
        mod = json.load(open(f, encoding="utf-8"))
        cat = mod.get("category", "")
        title = mod.get("title", "")
        tag = CAT_TAG.get(cat, "general")
        prefix = os.path.splitext(os.path.basename(f))[0]
        content = mod.get("content", "")
        intro, sections = chunk_sections(content)
        idx = 0
        # Intro (si présente)
        if intro and len(intro) > 40:
            docs.append({
                "title": title,
                "content": intro,
                "category": tag,
                "source_file": f"manuel:{prefix}",
                "chunk_index": idx,
            })
            idx += 1
        for head, body in sections:
            if not body or len(body) < 25:
                # garde quand même si le titre est informatif
                body = (body + "\n" + head).strip()
            doc_content = f"{head}\n{body}".strip()
            docs.append({
                "title": f"{title} — {head.title() if head.isupper() else head}",
                "content": doc_content,
                "category": tag,
                "source_file": f"manuel:{prefix}",
                "chunk_index": idx,
            })
            idx += 1
    json.dump(docs, open(OUT, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    from collections import Counter
    byc = Counter(d["category"] for d in docs)
    print(f"OK — {len(docs)} documents -> {os.path.relpath(OUT, BASE)}")
    print("  par catégorie:", dict(byc))
    sizes = [len(d["content"]) for d in docs]
    print(f"  taille contenu: min {min(sizes)}, moy {sum(sizes)//len(sizes)}, max {max(sizes)}")

if __name__ == "__main__":
    main()

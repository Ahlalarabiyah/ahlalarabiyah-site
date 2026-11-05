#!/usr/bin/env python3
# Verifie les textes du livre (js/book-data.js) et des defis de concentration
# (js/concentration-data.js) AVANT de publier. A lancer : python3 tools/verifier-textes-harakat.py
# Il signale :
#   1. une harakat "toute seule" (qui ne suit aucune lettre : apres un espace, en debut de
#      texte, ou juste apres une balise {r}/{f}/{/}) - c'est ce qui fait apparaitre des
#      marques rouges orphelines et decale les lignes dans l'exercice ;
#   2. deux fois la meme harakat de suite sur une lettre (ex. "َََ") ;
#   3. un livre dont les lettres (sans harakat) ne correspondent plus au texte des defis
#      de concentration (le texte a corriger doit rester le meme que le texte avec harakat).
# Code de sortie 1 s'il y a un probleme, 0 sinon.
import json
import os
import re
import sys
import difflib

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "js")
MARKS = "ً-ْٰ"
LETTERS = "ء-يٱ-ۓ"
TAGS = re.compile(r"\{[rf/]\}")


def load(fname, var):
    s = open(os.path.join(ROOT, fname), encoding="utf8").read()
    head = "window." + var + " = "
    i = s.index(head) + len(head)
    return json.loads(s[i:s.rindex("}") + 1])


def strings(o, path=""):
    if isinstance(o, str):
        yield path, o
    elif isinstance(o, list):
        for i, v in enumerate(o):
            yield from strings(v, path + "/%d" % i)
    elif isinstance(o, dict):
        for k, v in o.items():
            yield from strings(v, path + "/" + k)


def skeleton(text):
    t = TAGS.sub("", text)
    t = re.sub("[" + MARKS + "ـ]", "", t)
    t = t.replace("أ", "ا").replace("إ", "ا").replace("آ", "ا")
    return re.sub(r"\s+", "", t)


problems = 0
LONE = re.compile("(?:^|[^" + LETTERS + MARKS + "ـ])[" + MARKS + "]+")
DOUBLE = re.compile("([" + MARKS + "])\\1")

book = load("book-data.js", "AHL_BOOK")
conc = load("concentration-data.js", "AHL_CONC")

for fname, data in (("book-data.js", book), ("concentration-data.js", conc)):
    for path, s in strings(data):
        # on retire les balises en gardant un separateur : "{/} ِ" doit rester une harakat isolee
        t = TAGS.sub("\u0000", s)
        for m in list(LONE.finditer(t)) + list(DOUBLE.finditer(t)):
            problems += 1
            ctx = t[max(0, m.start() - 25):m.end() + 25].replace("\u0000", "|")
            print("HARAKAT ISOLEE/DOUBLE  %s %s : %r" % (fname, path, ctx))

# 2bis. une chadda sur une lettre qui ne peut pas etre doublee (alif, ta marbouta, alif maqsoura, hamza seule)
BAD_SHADDA = re.compile("[\u0627\u0629\u0649\u0621][\u064b-\u0651]*\u0651")
for path, s in strings(book):
    t = TAGS.sub("", s)
    for m in BAD_SHADDA.finditer(t):
        problems += 1
        print("CHADDA IMPOSSIBLE  book-data.js %s : %r" % (path, t[max(0, m.start() - 20):m.end() + 20]))

for k in book:
    bx = book[k].get("x", [])
    cx = conc.get(k, {}).get("x", [])
    for a, b in zip(bx, cx):
        ta = skeleton("".join("".join(p) for p in a["p"]))
        tb = skeleton("".join("".join(p) for p in b["p"]))
        if ta != tb:
            problems += 1
            print("LIVRE <> DEFIS  %s : %s" % (k, a["t"]))
            for tag, i1, i2, j1, j2 in difflib.SequenceMatcher(None, ta, tb).get_opcodes():
                if tag != "equal":
                    print("   livre : ...%s...   defis : ...%s..." % (ta[max(0, i1 - 8):i2 + 8], tb[max(0, j1 - 8):j2 + 8]))

print("OK : aucun probleme." if not problems else "%d probleme(s) a corriger avant de publier." % problems)
sys.exit(1 if problems else 0)

# Translating Matemati-Kal

The app teaches school math (grades 1–12, Israeli curriculum) to children. Hebrew is the source language. Every Hebrew sentence is a translation key in `src/i18n/keys.json`; each language is one file, `src/i18n/locales/<code>.json`, mapping key → translation.

## Workflow

```bash
npx tsx scripts/i18n-todo.ts <code> 150 > /tmp/<code>-batch.json   # next 150 untranslated keys (context examples go to stderr)
# fill in the values in a copy of that file, then:
npx tsx scripts/i18n-merge.ts <code> /tmp/<code>-done.json          # validates and saves; rejected items are printed
npx tsx scripts/i18n-check.ts <code>                                 # progress and broken entries
```

Repeat until `i18n-check` shows 100% and no broken entries. Never edit `keys.json`, and never touch another language's file.

## Placeholders ⟨0⟩, ⟨1⟩ …

Numbers, math expressions (`$...$`), typed answers and character names were replaced by numbered placeholders. Every placeholder in the key must appear exactly once in the translation. You may move them to the right place for your language's word order, but never drop, add or renumber them. The examples printed by `i18n-todo` show what the placeholders stood for in one real case.

- A placeholder is usually a number or a formula. Hebrew glues prepositions to them (`ב-⟨0⟩` = "in ⟨0⟩", `ל-⟨0⟩` = "to ⟨0⟩", `מ-⟨0⟩` = "from ⟨0⟩"). Translate the preposition as a separate word.
- Keep `$` math that is still inside a key (rare) exactly as is.
- Keep backtick text exactly as is.

## Style

- The reader is a child doing math homework. Use short, clear sentences, the way a good school textbook in your language would write them.
- Address the student the way school textbooks in your language do. Where the language has a gender-neutral plural or polite form, use it consistently (Hebrew uses plural imperative: "פתרו" = "solve"). Never assume the student's gender.
- Characters in word problems keep their names (names are placeholders or separate keys: translate a name key by transliterating it into your script; in Latin-script languages keep a natural spelling such as Dani, Noa, Yoav, Maya, Omer, Tamar). A verb that agrees with the character's gender in Hebrew should agree in your language too.
- Use the standard school math terms of your language (numerator, denominator, hypotenuse, derivative...). Be consistent: the same Hebrew term always gets the same translation.
- Arrows `→` and `←` inside text: copy them exactly as in the key. The app mirrors them for left-to-right languages.
- Keep emoji, punctuation marks like `·`, and quotation structure.
- Units: ס"מ = cm, סמ"ר = cm², סמ"ק = cm³, מ"ר = m², ש"ח / ₪ = shekels (₪). Keep metric units.
- Israeli-specific terms: `כיתה ⟨0⟩` = "Grade ⟨0⟩" (the placeholder will be a number). `יח"ל` (study units, the level of the high-school matriculation exam) = "units" in the sense of 3/4/5-unit math. `בגרות` = matriculation exam.
- Hebrew letters used as labels (א, ב, ג, ד in lists, charts and answer options) become the first letters of your alphabet (A, B, C, D; Arabic أ ب ج د; Russian А Б В Г; Amharic ሀ ለ ሐ መ; Yiddish keeps א ב ג ד).
- Hebrew notation remarks in content (e.g. which multiplication sign is used in which grade) are about math notation, not language: translate them literally.

## Numbers

Decimals are written with a dot in the keys. For ru, fr, de, it and ro the app shows them with a decimal comma (3,5) and writes points as A(2; 3), in German A(2 | 3). So in those languages call the decimal mark a comma, as in school.

## Language notes

- **ar** (Arabic): Modern Standard Arabic as used in Arab-sector schools in Israel. Western digits stay as they are (they are placeholders). Plural imperative (احسبوا، حُلّوا) for instructions.
- **yi** (Yiddish): common modern Yiddish spelling, readable by Haredi Yiddish-speaking children in Israel and abroad. Hebrew-origin words keep their traditional spelling.
- **am** (Amharic): standard Amharic for the Ethiopian-Israeli community.
- **ru, fr, es, de, it, ro, en**: standard school language of each country. French and Romanian may use the polite plural imperative; German "ihr"/imperative plural or neutral infinitive style as in German textbooks; English plain imperative.

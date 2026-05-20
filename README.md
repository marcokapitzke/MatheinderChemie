# Mathematik für Biochemie

Interaktive, deutschsprachige Begleitplattform zum Buch **Mathematik für Biochemie**. Die Website ist als kostenlose GitHub-Pages-App gebaut: React, Vite, TypeScript, KaTeX, Plotly und rein browserbasierte Mathematikfunktionen.

## Module

- Startseite mit akademischem Springer-Nature-nahem Design
- Ableitungsrechner für Standardfälle mit Regelhinweisen und Plot
- Integrationsrechner für unbestimmte und bestimmte Standardintegrale mit Flächenvisualisierung; endliche bestimmte Integrale können bei fehlender Stammfunktion numerisch mit Stabilitätscheck ausgewertet werden
- Funktionsplotter mit numerischer Kurvendiskussion
- Komplexe-Zahlen-Rechner mit Gaußscher Zahlenebene, Formkonverter und Darstellungsauswahl
- Grenzwerte, Folgen und Reihen mit numerischer Visualisierung

Die Eingabe akzeptiert `exp(x)` und `e^x`; die Ausgabe folgt der Buchnotation mit `exp(x)`.

Der Rechner selbst benötigt kein Backend. Nur der dezente Besucherzähler in der Navigation nutzt einen kostenlosen öffentlichen CounterAPI-Endpunkt und zählt höchstens einmal pro Browser-Tab-Sitzung.

## Lokal starten

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

Das statische Ergebnis liegt anschließend in `dist/`.

## Tests

```bash
npm run test
```

Die Tests prüfen zentrale mathematische Standardfälle: Ableitungen, Integrale, komplexe Zahlen, numerische Kurvendiskussion sowie Grenzwerte/Folgen/Reihen.

Zusätzlich enthält `src/lib/stress.test.ts` eine deterministische 999-Fall-Prüfung pro Rechner. Diese Suite vergleicht Ableitungen mit numerischen Differenzenquotienten, kontrolliert Integrale durch Rückableitung, prüft komplexe Zahlen gegen direkte Algebra und streut Plotter-, Grenzwert-, Folgen- und Reihenfälle über unterschiedliche Ausdrucksfamilien. Der vollständige Testlauf dauert deshalb deutlich länger als ein reiner Smoke-Test.

## Deployment über GitHub Pages

Die veröffentlichte Version wird als statischer Build auf dem Branch `gh-pages` bereitgestellt. Vor dem Deployment:

```bash
npm run test
VITE_BASE_PATH=/MatheinderChemie/ npm run build
```

In GitHub Pages ist als Source der Branch `gh-pages` mit Ordner `/` vorgesehen. Für andere Repository-Namen muss `VITE_BASE_PATH` entsprechend angepasst werden.

## Mathematische Grenzen

Diese Plattform ist kein universelles CAS. Sie priorisiert verlässliche Standardfälle aus dem Chemie-/Biochemie-Grundstudium. Nicht unterstützte Eingaben werden sauber abgewiesen statt symbolisch geraten. Details stehen in [KNOWN_LIMITS.md](KNOWN_LIMITS.md).

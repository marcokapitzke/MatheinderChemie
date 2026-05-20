# Competitor Analysis

Stand: 20. Mai 2026

Referenzen: [ableitungsrechner.net](https://www.ableitungsrechner.net/), [integralrechner.de](https://www.integralrechner.de/), [GeoGebra Graphing](https://www.geogebra.org/graphing) und offizielle GeoGebra-Hilfeseiten zu Funktionen, Spezialpunkten und CAS-nahen Befehlen.

Diese Analyse dient nur als funktionale Orientierung. Es werden keine Texte, Layouts, Logos, Assets oder geschützten Inhalte übernommen.

## Executive Benchmark

Die Plattform ist im aktuellen Zustand nicht breiter als die etablierten Spezialrechner und nicht interaktiver als GeoGebra. Das ist fachlich erwartbar: Ableitungsrechner.net und Integralrechner.de nutzen serverseitige CAS-Infrastruktur, GeoGebra ist ein ausgewachsenes dynamisches Mathematiksystem.

Die starke Positionierung liegt deshalb nicht in "mehr Funktionen als alle anderen", sondern in einer klaren didaktischen und visuellen Spezialisierung:

- Buchnaher Lernraum für *Mathe in der (Bio-)Chemie I* statt allgemeiner Universalrechner.
- Springer-Nature-nahe akademische Gestaltung statt klassischer Rechnerseiten.
- Rechenweg, Formelbild, Plot und Kapitelbezug in einem konsistenten Flow.
- Chemiekompatible Schreibweise mit `exp(...)`, aufrechter Darstellung von `exp`, `i` und `d`.
- Browser-only, kostenlos, schnell verlinkbar, gut als Portfolio-Projekt präsentierbar.
- Fokus auf Standardaufgaben aus dem naturwissenschaftlichen Grundstudium mit hoher Transparenz.

Kurzfassung:

| Vergleich | Aktueller Befund |
| --- | --- |
| Gegen Ableitungsrechner.net | Schwächer im CAS-Umfang, stärker in akademischer Gestaltung und Buchkontext. |
| Gegen Integralrechner.de | Schwächer bei allgemeinen Integralen und Spezialfunktionen, stärker bei kuratierter Standarddidaktik und bestimmter Flächenvisualisierung. |
| Gegen GeoGebra Graphing | Schwächer bei dynamischer Graphik, Slidern, Geometrie und Tool-Vielfalt, stärker als geführter Kurvendiskussions-Workflow für Studierende. |
| Echte UVP | Nicht Universal-CAS, sondern hochwertiges digitales Begleitlabor zum Buch. |

## 1. Relevante Funktionen für diese Buchplattform

- Eingabefeld für mathematische Funktionen mit Beispielen.
- Ableitungen und Integrale mit Ergebnisdarstellung und Rechenweg beziehungsweise Methode.
- Interaktive Graphen zur visuellen Kontrolle.
- Standardbeispiele wie Polynome, Exponentialfunktionen, Logarithmen, trigonometrische Funktionen und einfache Quotienten.
- Kurvendiskussion mit Nullstellen, Extrempunkten und Wendepunkten.
- Klare Hinweise zur korrekten Eingabe.
- Bestimmte Integrale mit Grenzen und Flächenvisualisierung.
- Kapitelnahe Beispielauswahl statt generischer Funktionssammlung.
- Konsistente LaTeX/KaTeX-Darstellung in Ergebnis, Lösungsweg und Beispielkarten.

## 2. Funktionaler Vergleich

### Ableitungsrechner.net

Stärken der Referenz:

- Sehr breiter Ableitungsumfang.
- Erste bis fünfte Ableitung.
- Partielle und implizite Ableitungen.
- Nullstellenberechnung und Lösungsprüfung.
- Große virtuelle Tastatur, viele Sonderfunktionen und Übungsmodus.
- Servergestützter CAS-Ansatz mit Maxima.

Einordnung unserer Plattform:

- Unterstützt solide Standardableitungen in einer Variable.
- Produktregel, Quotientenregel, Kettenregel, Potenzregel und elementare Funktionen werden erkannt.
- Komplexere Terme wie `exp(a*x^b)/(sin(x)+c)` oder `ln(sin(x)+c)*x^a` werden symbolisch differenziert.
- Der Lösungsweg ist didaktisch lesbarer, aber noch nicht so detailliert wie ein Schritt-für-Schritt-CAS.
- Keine partiellen Ableitungen, keine impliziten Ableitungen, kein Lösungsprüfer.

Fazit: Nicht besser im Funktionsumfang. Potenziell besser für buchnahe, visuell saubere Standardaufgaben.

### Integralrechner.de

Stärken der Referenz:

- Sehr breiter Integralumfang.
- Unbestimmte und bestimmte Integrale.
- Viele übliche Integrationstechniken.
- Spezialfunktionen.
- Mehrere Variablen und Lösungsprüfung.
- Servergestützter CAS-Ansatz mit Maxima und Risch-nahen Verfahren.

Einordnung unserer Plattform:

- Unterstützt wichtige Standardfälle des Grundstudiums.
- `p(x)*exp(a*x+b)` wird für Polynome bis Grad 6 über wiederholte partielle Integration behandelt.
- `x^n*sin(a*x+b)` und `x^n*cos(a*x+b)` werden über rekursive partielle Integration behandelt.
- Trigonometrische Standardfälle wie `tan(a*x+b)`, `cot(a*x+b)`, `sec^2`, `csc^2`, `sec*tan`, `csc*cot` sind hinterlegt.
- Bestimmte Integrale können symbolisch über die Stammfunktion oder numerisch mit Stabilitätscheck berechnet werden.
- Nicht unterstützt sind allgemeine Partialbruchzerlegung, allgemeine Substitutionen, uneigentliche Integrale und Spezialfunktionen.

Fazit: Nicht besser im CAS-Umfang. Besser positionierbar als schöner, zielgruppenspezifischer Integralraum mit Flächenbild und buchnaher Standardauswahl.

### GeoGebra Graphing

Stärken der Referenz:

- Hoch interaktive 2D-Graphik.
- Algebra View, Graphics View, Tools View und Table View.
- Spezialpunkte, Nullstellen, Extrema und Schnittpunkte.
- Sliders, Parameter, Tabellen und dynamische Objekte.
- In der GeoGebra Suite zusätzlich CAS, 3D, Geometrie und Statistik.

Einordnung unserer Plattform:

- Der Funktionsplotter liefert sofort Kurvendiskussion: `f`, `f'`, `f''`, Nullstellen, Extrempunkte, Wendepunkte, Monotonie und Krümmung.
- Er ist für eine typische Kurvendiskussionsaufgabe schneller verständlich als GeoGebra, weil keine Toolauswahl nötig ist.
- Die Graphik ist visuell hochwertiger als ein Standard-Plot, aber noch nicht so interaktiv und explorativ wie GeoGebra.
- Es fehlen Parameter-Slider, Tangentenwerkzeug, Punktverfolgung, Tabellenansicht, Export, Spezialpunkt-Toggles und tiefe Objektinteraktion.

Fazit: Nicht besser als GeoGebra als Graphiksystem. Besser als fokussierter Kurvendiskussions-Assistent für das Buch.

## 3. UVP der Plattform

Die UVP sollte auf der Website explizit so formuliert werden:

> Ein buchnahes Mathematik-Labor für die (Bio-)Chemie: Formeln, Rechenwege und Visualisierungen in der Schreibweise des Buches, ohne den Overhead eines Universal-CAS.

Was diese Positionierung glaubwürdig macht:

- Kapitelbezug: Jede Rechnerseite gehört sichtbar zu einem Buchkapitel.
- Schreibweise: `exp(...)` als Standardanzeige, mathematisch korrekte aufrechte Operatoren.
- Didaktik: Ergebnisse werden nicht isoliert gezeigt, sondern mit Formelbild, Rechenweg und Plot verbunden.
- Gestaltung: Akademisch, weißraumstark, portfoliofähig.
- Kosten und Deployment: Statisch, kostenlos, GitHub Pages, kein Backend.
- Qualitätssicherung: Tests prüfen Ableitungen, Integrale, komplexe Zahlen, Kurvendiskussion und Konvergenzfamilien.

## 4. Wo die Plattform noch nicht stark genug ist

Wenn die Seite wirklich auf Top-Portfolio-Niveau wirken soll, sind diese Punkte wichtiger als noch 50 seltene CAS-Fälle:

- Live-LaTeX direkt im Eingabefeld oder als eng gekoppelte Eingabezeile, nicht nur als Vorschau darunter.
- Ausdrucksspezifischere Lösungswege, besonders bei Ableitungen und Integralen.
- Interaktivere Plots: Crosshair, Werte-Tabelle am Mauspunkt, Tangente an frei wählbarer Stelle, Flächenslider bei bestimmten Integralen.
- Sichtbare Trace-Toggles für `f`, `f'`, `f''`, Stammfunktion und Fläche.
- Beispielbibliothek nach Buchkapiteln und Aufgabentypen.
- Bessere Asymptoten- und Polstellenanalyse im Funktionsplotter.
- Mehr symbolische Integralstandardfälle: Partialbruchzerlegung einfacher rationaler Funktionen, `exp(a*x)*sin(b*x)`, `exp(a*x)*cos(b*x)`, `u'/u`, weitere lineare Substitutionen.
- Code-Splitting für Plotly, damit der initiale Seitenaufbau leichter wird.
- Eine kurze Startseiten-Aussage, die den Unterschied zu GeoGebra und klassischen Rechnern positiv erklärt, ohne defensiv zu wirken.

## 5. Bewusst nicht nachgebaute Funktionen

- Kein universelles CAS mit beliebigen Spezialfunktionen.
- Keine mehrvariablen Funktionen, impliziten Ableitungen oder vollständigen Gleichungslöser.
- Keine umfangreiche virtuelle Mathe-Tastatur.
- Kein Übungsaufgabengenerator.
- Kein serverseitiges Maxima-/CAS-Backend.
- Keine GeoGebra-ähnliche Geometrie-, CAS-, 3D- oder Wahrscheinlichkeitsumgebung.

## 6. UI-/UX-Schwächen der Referenzseiten

- Klassische Rechnerseiten wirken funktional stark, aber visuell teilweise dicht und werkzeuglastig.
- Viele Optionen, Sonderfunktionen und Eingabehilfen können Einsteigerinnen und Einsteiger im Grundstudium überfordern.
- Der didaktische Fokus ist allgemein mathematisch, nicht buch- oder kapitelnah.
- Das Interface fühlt sich eher wie ein allgemeines Rechentool als wie ein kuratierter Lernraum an.
- GeoGebra ist extrem mächtig, verlangt für typische Kurvendiskussionen aber oft Befehlswissen oder Toolauswahl.
- Die Referenzen sind weniger als ästhetisches Buch-/Portfolio-Produkt inszeniert.

## 7. Positive Abgrenzung unserer Website

- Eigene visuelle Identität: tiefes akademisches Blau, Bordeaux-Akzente, viel Weißraum, Serif-Headlines und ruhige Karten.
- Fokus auf das Buch und typische Aufgaben aus Chemie-/Biochemie-Grundstudium.
- Jedes Modul kombiniert Eingabe, Beispiele, Ergebnis, Lösungsweg, Visualisierung und Grenzen in einem konsistenten Layout.
- Alle Rechner laufen vollständig im Browser und bleiben kostenlos über GitHub Pages hostbar.
- Die Oberfläche kann Studierenden direkte Orientierung geben, ohne sie mit CAS-Sonderfällen zu überfordern.
- Die Seite kann im Portfolio als eigenständiges wissenschaftliches Produkt auftreten, nicht nur als Rechner.

## 8. Priorisierte mathematische Standardfälle

- Ableitungen: Polynome, rationale Funktionen, Exponentialfunktionen, Logarithmen, trigonometrische Funktionen, Produkte, Quotienten, einfache Verkettungen.
- Integrale: Potenzregel, `exp(ax+b)`, `p(x)*exp(ax+b)`, `x^n*sin(ax+b)`, `x^n*cos(ax+b)`, `1/x`, `1/(ax+b)`, einfache rationale Funktionen, Standardfälle partieller Integration.
- Kurvendiskussion: Nullstellen, Extrempunkte, Wendepunkte, Monotonie und Krümmung als numerische Näherungen.
- Komplexe Zahlen: kartesische Form, Polarform, Exponentialform, Grundrechenarten, Potenzen, Gaußsche Zahlenebene.
- Grenzwerte/Folgen/Reihen: direkte Standardgrenzwerte, einfache L'Hospital-Fälle, explizite Folgen, geometrische Reihe, harmonische Reihe, p-Reihe und einfache alternierende Reihen.

# Known Limits

Diese Plattform ist bewusst konservativ. Sie soll typische Grundstudiumsaufgaben zuverlässig begleiten, aber keine allgemeine Alternative zu WolframAlpha, GeoGebra oder einem vollständigen CAS sein.

## Allgemein

- Es wird nur die Variable `x` für Funktionen und `n` für Folgen/Reihen unterstützt.
- Mehrdimensionale Funktionen, Parameterfamilien und implizite Gleichungen sind nicht Teil dieses Rechners.
- Numerische Ergebnisse werden als Näherungen behandelt.
- Definitionslücken und Polstellen werden im Plot abgefangen, aber nicht vollständig symbolisch klassifiziert.

## Ableitungen

- Standardfunktionen wie Polynome, rationale Funktionen, `exp`, `ln/log`, `sin`, `cos`, `tan` sowie einfache Produkte, Quotienten und Verkettungen werden unterstützt.
- Die Ableitung wird symbolisch mit mathjs berechnet.
- Der Lösungsweg zeigt erkannte Regeln und robuste Zwischenschritte, aber keine vollständig menschliche CAS-Herleitung für jeden möglichen Ausdruck.

## Integrale

Unterstützt sind vor allem:

- Potenzregel und Polynome
- `exp(ax+b)`
- Produkte `p(x) exp(ax+b)` für Polynome bis Grad 6 über wiederholte partielle Integration
- `sin(ax+b)` und `cos(ax+b)`
- `tan(ax+b)`, `cot(ax+b)`, `sec(ax+b)^2`, `csc(ax+b)^2`, `sec(ax+b)tan(ax+b)` und `csc(ax+b)cot(ax+b)`
- `1/x` und `1/(ax+b)`
- einfache lineare rationale Funktionen
- Standardfälle partieller Integration wie `x*exp(x)`, `x*sin(x)`, `x*cos(x)`, `x*ln(x)`

Nicht unterstützt sind unter anderem:

- allgemeine Substitutionen
- trigonometrische Spezialidentitäten
- uneigentliche Integrale
- allgemeine Partialbruchzerlegung höherer Ordnung
- Spezialfunktionen wie Fehlerfunktion, Exponentialintegral oder Fresnel-Integrale

Bestimmte Integrale werden bevorzugt über die erkannte Stammfunktion ausgewertet und im Plot als orientierte Fläche dargestellt. Wenn keine symbolische Stammfunktion hinterlegt ist, kann der Rechner endliche bestimmte Integrale numerisch mit zusammengesetzter Simpson-Regel und Stabilitätscheck auswerten. Uneigentliche Integrale oder symbolische Konvergenzprüfungen an unendlichen Grenzen bleiben bewusst außerhalb des Umfangs.

Wenn kein sicherer Standardfall erkannt wird, erscheint eine Nicht-unterstützt-Meldung.

## Funktionsplotter

- Nullstellen, Extrempunkte und Wendepunkte werden numerisch über Vorzeichenwechsel gesucht.
- Sehr flache Nullstellen, enge Oszillationen oder kritische Punkte außerhalb des gewählten Intervalls können fehlen.
- Monotonie und Krümmung sind Intervallnäherungen.
- Asymptoten werden derzeit nicht symbolisch bewiesen.

## Komplexe Zahlen

- Unterstützt sind einfache Formen wie `a + bi`, `a - bi`, `r*exp(i*phi)` und `exp(i*phi)`.
- Exotische CAS-Ausdrücke, verschachtelte komplexe Funktionen und symbolische Parameter werden nicht unterstützt.
- Potenzen sind als einfache ganzzahlige Potenzen gedacht.

## Grenzwerte, Folgen und Reihen

- Grenzwerte unterstützen direkte Auswertung, einfache numerische Stabilisierung und einfache `0/0`-L'Hospital-Fälle.
- Folgen werden numerisch ausgewertet; Grenzwertangaben sind Abschätzungen.
- Reihen werden über Partialsummen visualisiert.
- Sichere symbolische Klassifikation gibt es nur für erkannte Standardfälle wie harmonische Reihe, p-Reihe, geometrische Reihe und alternierende harmonische Reihe.

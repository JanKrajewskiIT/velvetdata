# Audyt zgodności VelvetData z design systemem

Stan: 17 października 2026. Audyt i przegląd poprawek wykonano statycznie. Nie uruchamiano aplikacji, testów, kompilacji, lintowania, formatowania ani skryptów weryfikacyjnych. Nie zmieniano testów, wygenerowanego `dist` ani referencji design systemu.

## Zakres i mapowanie

Referencją jest komplet źródeł w `../VelvetUi/velvet`: JSX, deklaracje, CSS i specimens pięciu rodzin należących do VelvetData. Templates i osobna aplikacja VelvetDemo pozostają poza zakresem. Sprawdzono też własne rozszerzenia VelvetData pod kątem regresji i integracji ze wspólnymi prymitywami; nie dopisywano im nieistniejących odpowiedników referencyjnych.

Inwentaryzacja obejmuje 5 wejściowych deklaracji, 13 referencyjnych interfejsów i 24 eksportowane nazwy. Wszystkie mają właściciela w publicznym `src/bare.ts`; dwie nazwy są świadomie zmienione. Nie znaleziono brakującej rodziny komponentów.

| Referencja    | Publiczne odpowiedniki VelvetData                                                                                         |
| ------------- | ------------------------------------------------------------------------------------------------------------------------- |
| DataGrid      | `DataGrid`, `DataGridProps`, `GridColumn`, `defaultGridView`, `reconcileGridView`; `GridView` → `GridViewState`           |
| ColumnManager | `ColumnManager`, `ColumnManagerProps`, `ManagedColumn`, `ColumnState`; `ApplyColumns` → `applyColumns`                    |
| VirtualList   | `VirtualList`, `VirtualListProps`                                                                                         |
| VirtualTable  | `VirtualTable`, `VirtualTableProps`, `VirtualColumn`                                                                      |
| QueryBuilder  | `QueryBuilder`, `QueryBuilderProps`, `QueryField`, `QueryRule`, `QueryGroup`, `emptyQuery`, `clearQuery`, `describeQuery` |

Porównanie objęło props, wartości domyślne, aliasy callbacków, DOM, role i atrybuty ARIA, obsługę klawiatury i fokusu, drag and drop, kontrolowany i lokalny stan, renderery, filtrowanie/sortowanie, edycję, zaznaczanie, zapis widoku, wirtualizację oraz sprzątanie pracy asynchronicznej. Specimens sprawdzano jako przykłady obsługiwanych scenariuszy; ich Reactowe API i prezentacja demonstracyjna nie są kopiowane do biblioteki.

Pięć arkuszy referencyjnych porównano z odpowiadającymi im częściami 35 lokalnych CSS Modules, w tym modułami współdzielonymi i rozszerzeniami wykresu. Granice plików i hashe lokalnego CSS celowo różnią się przez scoped selectors, `composes`, logiczne kierunki, typografię prymitywów i rozszerzenia. Same różnice tekstowe nie są dowodem braku. VelvetData nie utrzymuje własnych kopii tokenów ani fontów; korzysta z VelvetUi i jego entry stylesheet.

Identyfikatory SHA-256 odczytanych arkuszy referencji:

| Arkusz             | SHA-256                                                            |
| ------------------ | ------------------------------------------------------------------ |
| data-grid.css      | `34f7a674c2597f42f888834440fcda7363cfe207585b44e495c0b30198a1ae6d` |
| column-manager.css | `81b87b98fa5e9d9526fc2359dee58e8ba35d8a04751e9abb4c19c947e13b897c` |
| virtual-list.css   | `d78a441edc55b7d83eec7b70c7866d74eec19db6ff81582b709d067c8d3d6ba9` |
| virtual-table.css  | `b62068430bcb5a9c054419edc66d2fee3a834d460f2f058919d730f57439e760` |
| query-builder.css  | `8cdf26a2068aa7938b7b660e0e9db7bf01f8007f0afd1fb2b83f5913018ec729` |

## Potwierdzone problemy i poprawki

Wszystkie poniższe poprawki są zaimplementowane w źródłach i ponownie przejrzane statycznie. Nie oznacza to potwierdzenia wykonawczego ani zgodności pikselowej.

| ID  | Priorytet | Obszar i scenariusz                                                                                                                                               | Poprawka i źródło                                                                                                                                                                                     |
| --- | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DG1 | P2        | Własny renderer komórki zachowuje stary rekord po zastąpieniu obiektu nowym z tym samym ID. Gałąź była keyed tylko po funkcji renderera, która się nie zmieniała. | `GridCell.tsx`: wewnętrzny `Show keyed` odtwarza wynik renderera po zmianie obiektu rekordu.                                                                                                          |
| DG2 | P2        | Cień krawędzi przypiętej kolumny i oznaczenie aktywnej/edytowanej komórki konkurują regułami tej samej specyficzności. Wynik zależy od kolejności CSS.            | `GridCell.module.css`, `shared/gridSurface.module.css`: reguły krawędzi używają wspólnej zmiennej oznaczenia komórki; każda komórka resetuje ją lokalnie.                                             |
| DG3 | P2        | Skrót kopiowania rzuca synchroniczny wyjątek, gdy Clipboard API jest niedostępne. Dotychczasowy `.catch` obsługiwał tylko odrzuconą obietnicę.                    | `createGridKeyboard.ts`: asynchroniczna granica obejmuje również dostęp do API; oba rodzaje niepowodzenia trafiają do istniejącego `reportAsyncError`. Bez przywracania przestarzałego `execCommand`. |
| CM1 | P2        | Upuszczenie kolumny na nią samą może przestawić ją na początek sekcji, bo po odfiltrowaniu przeciąganego elementu indeks celu wynosi -1.                          | `createColumnDrag.ts`: samoupuszczenie kończy drag bez zmiany kolejności. Błąd występuje również w referencji; to świadoma korekta błędu referencyjnego.                                              |
| CM2 | P3        | Akcja przypinania utraciła referencyjną widoczność zależną od hover/fokusu/przypięcia, kolor brand oraz wygląd ghost.                                             | `ColumnManagerItem.tsx/.module.css`: przywrócone stany, z widocznością na urządzeniach bez hover i zachowaniem disabled.                                                                              |
| CM3 | P3        | Nagłówki przypiętych sekcji nie mają koloru brand.                                                                                                                | `ColumnManagerZone.tsx`: kolor przez obsługiwany `SectionLabel.tone`.                                                                                                                                 |
| CM4 | P3        | Geometria uchwytu, jego glyph i szerokość toru przycisku przypinania odbiegają od referencji.                                                                     | `ColumnManagerItem.module.css`: uchwyt 24px, glyph 14px i tor 28px wyrażone istniejącymi tokenami.                                                                                                    |
| CM5 | P3        | Kolumna niemobilna przez `movable=false` lub `canMove=false` nadal pokazuje grip zamiast kłódki.                                                                  | `ColumnManagerItem.tsx`: ikona zależy od rzeczywistej możliwości przesunięcia, tak jak disabled uchwytu. Usunięto nieużywany prywatny `isLocked`.                                                     |
| CM6 | P3        | Przypięta nazwa kolumny otrzymuje mniejszy wariant typograficzny zamiast zachować rozmiar body i zmienić wagę.                                                    | `ColumnManagerItem.tsx/.module.css`: body z referencyjną wagą etykiety dla przypiętych wierszy.                                                                                                       |
| VL1 | P2        | Renderer VirtualList zwracający celowo `null` lub `undefined` zostaje zastąpiony tekstem rekordu.                                                                 | `VirtualList.tsx`: fallback tekstowy dotyczy wyłącznie braku renderera.                                                                                                                               |
| VL2 | P2        | Nowy `dataKey` przy tej samej liczbie elementów nie ponawia sprawdzenia końca listy; kolejny zbiór może czekać na scroll/resize zamiast zacząć doładowanie.       | `createVirtualScroll.ts`: zmiana datasetu uruchamia zaplanowane sprawdzenie odległości od końca. Istniejące anulowanie i ochrona przed pętlą pozostają.                                               |
| VT1 | P3        | Aktywny wiersz VirtualTable ma tło, lecz utracił referencyjny pasek oznaczenia.                                                                                   | `VirtualTable.module.css`: przywrócony inset accent i jego kierunek RTL, z zachowaniem obrysu fokusu.                                                                                                 |
| QB1 | P2        | Wszystkie przyciski przesuwania warunków/grup mają te same ogólne nazwy.                                                                                          | `QueryGroupEditor.tsx`, słowniki EN/PL: nazwa zawiera rodzaj elementu i pozycję wśród rodzeństwa.                                                                                                     |
| QB2 | P3        | Migracja CSS utraciła wygląd secondary/brand kombinatora i kolor danger akcji usuwania grupy/czyszczenia.                                                         | `QueryGroupEditor.tsx/.module.css`: wariant secondary i własne selektory o skutecznej specyficzności.                                                                                                 |
| QB3 | P3        | Kod podsumowania zapytania używa większego rozmiaru zamiast referencyjnego caption.                                                                               | `QueryBuilder.module.css`: rozmiar caption na klasie opisu z priorytetem niezależnym od importu typografii.                                                                                           |
| TC1 | P2        | Błąd silnika lub danych wykresu nie ma etykiety statusu przy domyślnym `status=idle`, mimo udokumentowanego kontraktu.                                            | `TradingViewChart.tsx`: błąd również otwiera gałąź statusu. To regresja rozszerzenia, nie pominięty komponent referencji.                                                                             |

## Uzupełnienia po ponownym przeglądzie

Poniższe trzy problemy również poprawiono w źródłach i przejrzano statycznie, bez testów i komend weryfikacyjnych.

| ID  | Priorytet | Problem                                                                                                                                                  | Poprawka                                                                                                                                                       |
| --- | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DG4 | P2        | Natywny edytor usuwa outline, a cień komórki nie zapewnia oznaczenia fokusu w trybie wymuszonych kolorów. Fallback VelvetUi nie obejmuje klas `vdata-*`. | `GridNativeEditor.module.css`: własny obrys `Highlight` dla `:focus-visible` w `forced-colors`, umieszczony wewnątrz pola przez ujemny offset.                 |
| DG5 | P3        | Ołówek w nagłówku sprawdza tylko deklarację kolumny, mimo że brak `onRowsChange`, ładowanie lub błąd wyłączają zapis.                                    | `GridHeaderCell.tsx`: ikona korzysta z tego samego `active.canEdit` co komórki i rozpoczęcie edycji, dla bieżącej pozycji kolumny.                             |
| VL3 | P2        | Przy `error=false` lub pustym stringu wewnętrzna awaria doładowania otwiera alert, lecz nullish fallback pomija opis błędu.                              | `VirtualList.tsx`: opis stosuje ten sam warunek obecności błędu zewnętrznego co alert; dla wartości falsy pokazuje zlokalizowany komunikat awarii doładowania. |

## Zachowane decyzje i rozszerzenia

- `applyColumns` i `GridViewState` to przyjęte nazwy biblioteki. Migracja do VelvetData i właścicielstwo helperów są opisane w dokumentacji Recron, w `projects/velvet-data/docs/migration.md`.
- Oddzielne pliki, CSS Modules, komponenty `Text`, `Heading`, `SectionLabel`, kontrolki VelvetUi, lokalizacja i wspólne helpery `/common` są adaptacją biblioteczną. Rozszerzone API nie jest redukowane do pierwotnego Reactowego kontraktu.
- ColumnManager zachowuje jawne `minVisible` (domyślnie 0); integracja DataGrid wymaga co najmniej jednej widocznej kolumny. Aliasy możliwości kolumn i pierwszeństwo `canHide`/`canPin`/`canMove` pozostają. Reset uwzględnia bieżące definicje.
- QueryBuilder zachowuje domyślne `reorderable=true`, ścisłą listę dozwolonych operatorów, dodatkowy operator `ends`, walidację wartości i responsywność względem własnego kontenera. Pusta lista dozwolonych operatorów nie zostaje rozszerzona do wszystkich.
- DataGrid zachowuje stabilne klucze i rozszerzenia: wirtualizację, pomiary detali, prawą stronę przypinania, kontrolowany widok, import/eksport i opcjonalny zapis ustawień, własne edytory, walidację i asynchroniczny zapis. `loading`/`error` pozostawiają dostarczone rekordy, blokując zapis. Zaznaczenie może obejmować niewczytane rekordy, a `dataKey` rozdziela logiczne zbiory.
- VirtualList zachowuje odrębne tryby list/listbox/grid, typeahead, kontrolowane zaznaczenie, anulowanie doładowania, retry i `hasMore`. Aktywny rekord jest zachowany poza oknem renderowania. Stabilna tożsamość obiektu zamiast indeksu jest celowa; skorygowano dwa mylące opisy JSDoc tego fallbacku.
- Ograniczenia payloadów ustawień, pełne parsowanie liczb, kalendarzowe porównania dat, boolean operators na rzeczywistych wartościach logicznych i neutralizacja formuł w CSV pozostają kontrolami biblioteki. Nie przywracano bardziej liberalnych zachowań referencji.
- Własne animacje są lokalne, w `shared/reveal.module.css`, wraz z reduced-motion. Nie znaleziono konsumentów usuniętych globalnych nazw animacji VelvetUi. Data nie potrzebuje ich odtwarzania.
- TradingViewChart, adapter Lightweight Charts i feedy są udokumentowanymi rozszerzeniami. Przejrzano życie instancji, błędy, czyszczenie, aktualizacje świec, wskaźników i poziomów, zmianę motywu, timeouty, retry, generacje subskrypcji i stale data. Nie dodawano kolejnych wskaźników ani rysowania interaktywnego.

Własne kontrakty zachowania są opisane także w dokumentach Recron `data-behavior.md` i `collection-contracts.md`. Ich historyczne numery wersji nie zastępują obecnego manifestu.

## Zależność VelvetUi 3.8.1

W `package.json` ustawiono `devDependencies.@jankrajewskiit/ui` na `^3.8.1` oraz minimalny peer na `>=3.8.1 <4`. Minimalna wersja gwarantuje, że zadeklarowany kontrakt wymaga paczki z poprawkami wspólnych kontrolek i paneli. Nie zmieniano wersji samej paczki Data ani pozostałych zależności.

Zgodnie z odpowiedzią użytkownika agent zmienił wyłącznie deklaracje w `package.json`, bez wykonywania komendy instalacji i bez edycji lockfile lub `node_modules`. Podczas pracy pojawiła się niezależna aktualizacja środowiska: końcowy odczyt `package-lock.json` i manifestu zainstalowanej paczki wskazuje już VelvetUi 3.8.1. Zachowano tę zmianę. Nie podstawiano ręcznie adresu tarballa ani integrity.

## Ograniczenia dowodów

Ponownie odczytano zmienione źródła i różnice, w tym selektory/composes, reset zmiennej fokusu, renderowanie po zmianie rekordu, kontrakty tłumaczeń i odtwarzanie gałęzi Solid. Nie potwierdzano zachowania w przeglądarce, pikselowej zgodności, wszystkich kombinacji fokusu/klawiatury ani wydajności dużych zbiorów. Istniejący `dist` nie jest wynikiem tych zmian.

`npm run verify` pozostaje nieuruchomione. Nie uruchamiano również osobno kompilacji, lintowania, formatowania, analizatorów ani testów. Nie stwierdzono dalszego potwierdzonego braku w przejrzanym zakresie; nie jest to gwarancja braku usterek wykonawczych.

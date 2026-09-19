# Notatki: wygląd / front-end

Zapis tego, co ustaliłyśmy w czacie na temat wyglądu aplikacji — żeby nie trzeba było tego pamiętać ani szukać w historii rozmowy.

## Źródło designu: "Forma" w Lovable

Paula ma pełny mockup zbudowany w **Lovable** (Vite + TanStack Router + shadcn/ui):
- Live preview: `https://bloom-grace-plan.lovable.app`
- To jest **jedyne prawdziwe źródło** kolorów/spacingu/efektów — nie zgadujemy już na oko.
- Nazwa **"Forma"** widoczna w mockupie to **przypadek**, nie docelowa nazwa appki — nie zakładać jej nigdzie w kodzie/metadanych. Nazwa aplikacji wciąż nieustalona (temat odłożony wcześniej w rozmowie).

**19.09.2026 — przeniesione 1:1 do naszej appki** (`src/app/globals.css`, `src/app/layout.tsx`):
- Pełny system kolorów w **oklch** (nie hex) — `background`, `foreground`, `card`, `primary`, `secondary`, `muted`, `accent`, `destructive`, `border`, `input`, `ring`, `soft`, `surface`, `line`, `success`. Używane jako klasy Tailwind: `bg-primary`, `text-muted-foreground`, `border-line` itd. — **nie używać już `rose-500`/`neutral-200` z palety Tailwind**, tylko te tokeny.
- Font: **DM Sans** (był Geist).
- `border-radius` bazowy: `0.625rem`, ze skalą `sm/md/lg/xl/2xl/3xl` liczoną z niego.
- **Prawdziwy halo-efekt**: to nie rozmyty div w tle, tylko klasa `.workout-glow` = `box-shadow` w kolorze `primary` (`color-mix` w oklab, 45% primary). Druga klasa `.paper-shadow` — subtelniejszy cień neutralny, używana na zwykłych kartach (np. karta ćwiczenia, karta planu na liście).
- Dark mode: appka jest **tylko jasna** (patrz sekcja "Motyw jasny" niżej) — tokeny `.dark` z referencji Lovable pominęłyśmy, bo nie są nam na razie potrzebne.

Jeśli coś w wyglądzie budzi wątpliwość — **sprawdzić najpierw `https://bloom-grace-plan.lovable.app`**, nie zgadywać.

### 19.09.2026 — druga tura: prawdziwy kod zamiast zgadywania

Paula wkleiła realne pliki źródłowe z Lovable (roadmap.md, AGENTS.md projektu Lovable, potem komponenty). Kluczowy wniosek: **kolory to nie wszystko** — brakowało układu (sidebar, spacing, typografia). Przeniesione 1:1 z `src/routes/__root.tsx` + `src/components/app-shell.tsx`:

- **`src/components/AppShell.tsx`** (nowy) — sidebar nawigacyjny na desktopie (`w-60`, stały, po lewej), górny pasek + wysuwane menu na mobile, dolny pasek z 5 ikon na mobile (Profile celowo pominięty w dolnym pasku — dostępny przez górne menu). Logo: różowe serduszko w kwadracie + nazwa appki. Ikony z **lucide-react** (nowa zależność, celowo dodana — to jest biblioteka ikon używana w całym referencyjnym designie, nie róbmy własnych symboli unicode).
- **`src/components/Page.tsx`** (nowy) — współdzielony wrapper strony: eyebrow (mały różowy uppercase) → H1 (`text-3xl sm:text-4xl font-medium`) → opis, w kontenerze `max-w-[1180px]`. Używany teraz na każdej stronie w `(app)` — **każda nowa strona powinna przez niego przechodzić**, żeby nagłówki były spójne.
- **`src/lib/utils.ts`** (nowy) — helper `cn()` (clsx + tailwind-merge), standard z ekosystemu shadcn, potrzebny bo referencyjny kod go używa wszędzie.
- **`src/components/ui/Button.tsx`** (nowy) — lekka wersja (bez `class-variance-authority`/Radix Slot, których celowo nie dodawałyśmy — niepotrzebna złożoność na razie), ale te same warianty/rozmiary co w referencji.
- **Ważne dla przyszłych sesji**: większość plików w folderze `ui/` Lovable projektu to **standardowy shadcn** (Accordion, AlertDialog, Alert, NavigationMenu, Sidebar-primitive itd.) — **nie trzeba** ich przeklejać, są dobrze znane. Warto prosić Paulę konkretnie o pliki, które faktycznie komponują appkę (route'y, `app-shell.tsx`, `__root.tsx`), a nie przechodzić alfabetycznie przez cały folder — to strata czasu i kontekstu.

## Ogólny vibe

- **"Girly clean"** — czysto, minimalistycznie, delikatnie różowo. Nie "gym bro", nie ciężkie/mroczne.
- **Motyw jasny na stałe** — appka miała łapać ciemny motyw z systemu/Chrome, przez co wszystko wyglądało czarno. Poprawione: strona jest teraz zawsze jasna, tło biało-różowe (`#fff8f9`), dark mode wyłączony do czasu aż będzie potrzebny.
- **Halo wokół planu treningowego** — delikatna, rozmyta różowa poświata za kartą planu. Ma być **mega subtelna**, nie krzycząca (pierwsza wersja była za mocna, poprawione na jaśniejszą/mniejszą).
- Zastrzeżenie od Pauli: obecny wygląd wciąż "wygląda jak AI" — nie do końca to, co ma w głowie. W trakcie dopracowywania.

## Plan treningowy — harmonogram tygodnia

Ze szkiców:

- 7 dni tygodnia jako prostokątne boksy z różową obwódką, **pełne nazwy** (Poniedziałek, Wtorek...), nie skróty.
- Klik w dzień → pokazuje jego zawartość (na razie: rozwija się sekcja poniżej z ćwiczeniami tego dnia).
- **Dzień bez ćwiczeń = REST** (domyślny stan).
- **Własna nazwa dnia** nadawana przez użytkowniczkę, np. "Glute Day" — nie tylko nazwa dnia tygodnia. Zaimplementowane jako osobna tabelka w bazie (`plan_days`).
- **Zrobione (19.09.2026):** widok tygodnia to teraz pasek 7 kart (jedna na dzień), każda pokazuje od razu: nazwę dnia, nazwę treningu (albo "Rest"), liczbę ćwiczeń (albo "Recovery") — widać cały tydzień na pierwszy rzut oka bez klikania. Kliknięcie karty rozwija szczegóły tego dnia poniżej. Wzorowane na referencji "Forma" (zrzuty ekranu od Pauli, mockup z sidebarem: Home/Workouts/Progress/History/Goals/Profile, różowy heart-icon jako logo).
- Kolory akcji zmienione z czarno-białych na `bg-primary`/`text-primary-foreground` w całej sekcji planów **i na stronach logowania/rejestracji/profilu** — przyciski „Nowy plan”, „Zapisz”, „Dodaj ćwiczenie”, „Zaloguj się”, „Zarejestruj się”, „Wyloguj się”.
- Karta ćwiczenia przeprojektowana na układ z referencji: nazwa + rząd ikon (↑ ↓ ✎ ✕) w jednej linii, potem siatka SETS / REPS / WEIGHT / RPE, notatka, przycisk „Progress”.

### Przyszła, większa funkcja: kalendarz z konkretnymi datami (Runna-style)

Paula chce docelowo (referencja: appka **Runna**):
- Treningi **przesuwalne** między dniami (drag & drop) w widoku kalendarza.
- Możliwość **skipnięcia** konkretnego treningu (np. ten jeden poniedziałek, nie każdy poniedziałek).
- Możliwość **przełożenia** treningu na inny dzień, jednorazowo.

To wymaga innej warstwy danych niż to co mamy teraz — obecny `DayScheduler` to **szablon tygodniowy** (który dzień tygodnia = jaki trening, powtarza się co tydzień). Skip/przesunięcie dotyczy **konkretnego wystąpienia** treningu w konkretnym tygodniu z konkretną datą — to należy do funkcji **Workout Sessions** (STEP 6 z AGENTS.md), jeszcze niezaczętej. Nie robić tego przy okazji zmian w Workout Plans — to osobny kawałek pracy, do zaplanowania jako następny duży krok.

**Dodatkowa referencja (zrzut z "Forma", 19.09.2026)** — dokładny mockup tego widoku, potwierdza powyższe 1:1:
- Nagłówek: nazwa planu + miesiąc ("Balanced strength · September"), obok nawigacja tygodniami: `< 14–20 września 2026 >`.
- 7 kolumn z **prawdziwymi datami** (Poniedziałek 14, Wtorek 15, ...), każda z kartą treningu: nazwa, czas trwania, liczba ćwiczeń.
- Status na karcie: **zielony ✓** = wykonany, różowa plakietka **"MISSED"** = pominięty, ikona **⇄** = reschedule/zamień.
- Podpowiedź pod paskiem: *"Drag a workout to another day, or use Reschedule below."* — czyli DWIE metody: przeciągnij ALBO użyj przycisku.
- Po kliknięciu dnia: szczegóły — data, nazwa treningu, `↻ Repeats weekly` (tag pokazujący że to powtarzalny wpis z szablonu), przycisk **"📅 Reschedule"** + osobna ikona odśwież/cofnij.

**Pełny kod referencyjny (Paula wkleiła `routes/workouts.tsx` z Lovable, 19.09.2026)** — działający prototyp na mock-danych (`weekPlan` z `lib/fitness-data`, nie prawdziwa baza), ale UX/logika 1:1 do odwzorowania gdy będziemy robić Workout Sessions:

- **Model danych dnia** (per konkretna data w tygodniu): `title`, `duration`, `rest: boolean`, `status: "planned" | "completed" | "missed"`, `recurrence: "once" | "weekly"`, `createdBy: "user" | "coach"`, `exercises[]`. Pole `createdBy` sugeruje przyszłą funkcję trenera/coacha przypisującego treningi — pasuje do pierwotnego kontekstu projektu (apka ma zastąpić panel od trenerki, patrz AGENTS.md §1).
- **Przenoszenie treningu**: albo drag&drop (desktop, `draggable` + `onDragStart/onDragEnd/onDrop`), albo przycisk „Reschedule” → wchodzi w tryb wyboru dnia → klik dnia = ten sam kod co drop. Jedna funkcja `requestMove(from, to)` obsługuje obie ścieżki.
- **Konflikt (dzień docelowy zajęty)**: pojawia się panel z wyborem: **„Swap workouts”** (zamień miejscami) albo **„Shift plan forward”** (przesuń resztę planu o jeden dzień do przodu, aż do najbliższego dnia REST — `shiftForward` szuka najbliższego wolnego dnia i kaskadowo przesuwa wszystko pomiędzy). Shift jest wyłączony (`disabled`), jeśli nie ma żadnego dnia REST dalej w tygodniu.
- **Dodawanie treningu**: formularz z nazwą, wyborem dnia, przełącznikiem **„Me” / „Coach”** (kto tworzy — user vs przyszły trener), i wyborem powtarzalności **„One time” / „Repeat weekly”**.
- **Rest ↔ trening**: przycisk z ikoną „cofnij” (RotateCcw) przełącza dzień między REST a treningiem w dowolną stronę.
- **Nawigacja tygodniami**: `< [zakres dat] >`, stan `weekOffset` (liczba tygodni od bieżącego).
- Status "missed" pokazuje różową plakietkę „MISSED”; "completed" pokazuje zielony checkmark (`text-success`).

Ten kod **nie jest do wklejenia wprost** (inny router, mock state zamiast Supabase) — jest referencją do zaprojektowania prawdziwego modelu danych (potrzebne: `workout_sessions` z konkretną datą, statusem, i regułą powtarzania) i dokładnego odwzorowania UX, gdy przyjdzie kolej na ten etap.

## Inne strony — pełny kod referencyjny z Lovable (19.09.2026)

Paula wkleiła kod prawie całego folderu `routes/`. To są dokładne specyfikacje, nie zgadywanki — gdy budujemy którąś z tych stron naprawdę, wracać tutaj zamiast improwizować.

**Home (`/`)** — brak eyebrow. Nagłówek: data (`text-sm text-muted-foreground`) → H1 „Good morning, {imię} ♡" (serduszko w kolorze primary) → podtytuł. Główna karta (`workout-glow rounded-xl border border-primary/20 bg-surface`, grid `lg:grid-cols-[1.5fr_0.7fr]`): lewo — eyebrow „Today's workout" (ikona Sparkles) + nazwa treningu (duża) + `{liczba ćwiczeń} exercises · about {czas} min` + przycisk „Start workout" (rozmiar lg, ikona ArrowRight); prawo — panel z obramowaniem po lewej, „Weekly progress", duży ułamek (3 / 4), pasek postępu (shadcn `Progress`, wysokość 1.5), zachęcający tekst. Niżej grid `lg:grid-cols-[1.35fr_0.65fr]`: „Latest report" (pierwsze 3 pomiary, wiersz label/wartość/zmiana) + „Quick actions" (3 linki z ikonami: Add weekly report, View progress, Edit workout plan).

**Progress (`/progress`)** — bez eyebrow, title „Progress", action „Add report" → `/weekly-report`. Sekcja „Body measurements" (ikona TrendingUp): siatka statystyk `grid-cols-2 sm:grid-cols-4` z obramowaniem góra/dół, każda: label, duża wartość+jednostka, `+X since last week` w kolorze primary. Niżej grid 2-kolumnowy: „Strength" (ikona Dumbbell) — **pusty stan** „No workout data yet" + „Complete your first workout to start tracking your progress." + przycisk „View workout plan" (potwierdza naszą zasadę: żadnych zmyślonych danych, prawdziwy pusty stan dopóki nie ma sesji treningowych); „Progress photos" (ikona Camera) — 3 kafelki Front/Side/Back, przerywana obwódka, **tylko podgląd** (bez uploadu — upload jest na `/weekly-report`).

**Weekly report (`/weekly-report`)** — eyebrow „Weekly check-in", title „How was your week?", opis „A quick moment to notice how you feel — beyond the numbers." Formularz 2 kolumny (`lg:grid-cols-[1.05fr_0.95fr]`): lewo — „Measurements" (siatka 2×2: Weight/Waist/Hips/Thigh, każde pole z jednostką jako `absolute` w prawym rogu inputu) + „A note to yourself" (Mood jako Input, Notes jako Textarea); prawo — „Progress photos" (3 klikalne kafelki Front/Side/Back, `<input type="file" accept="image/*" className="sr-only">` + ikona Camera + label, `hover:bg-secondary`) + przycisk „Save weekly report" → po zapisie zmienia się na „Report saved" z checkmarkiem.

**Profile (`/profile`)** — eyebrow „Personal space", title „Profile", opis „Your details and training preferences." Awatar: koło `size-20 bg-secondary text-primary` z inicjałem, obok imię + przycisk „Change photo" (ghost, ikona Camera). Formularz `sm:grid-cols-2`: Name, Training focus, Weekly goal (pełna szerokość, `sm:col-span-2`). Przycisk „Save changes" → „Saved" z checkmarkiem.

**History (`/history`)** — eyebrow „Your rhythm", title „History", opis „A simple record of the work you've already done." Grid `lg:grid-cols-[0.65fr_1.35fr]`: lewo — prawdziwy kalendarz miesiąca (eyebrow z nazwą miesiąca, siatka 7 kolumn liter dni tygodnia + numery dni, dni z aktywnością podświetlone `bg-secondary text-primary`); prawo — „Recent activity", lista wpisów (okrągła ikonka checkmark `bg-secondary text-primary`, nazwa, data, statystyka typu „5 km · 34 min"), rozdzielone `border-line`.

**Goals (`/goals`)** — eyebrow „Your intention", title „Goals", opis „Keep your focus small, clear and kind.", action „+ New goal". Lista celów rozdzielona `divide-y divide-line border-y`: ikona po lewej (Check jeśli 100%, inaczej pusty Circle, kolor primary), tytuł + procent po prawej, opis postępu tekstem, cienki pasek postępu (`Progress`, `h-1`) pod spodem. **Uwaga:** w referencji dane są zmyślone (`75%`, `60%`, `100%` na sztywno) — u nas Goals jest poza MVP (AGENTS.md §19) i nie wolno pokazywać fake progressu, więc to budujemy dopiero z realnymi danymi.

**Exercise progress (`/exercise/$exerciseId`)** — dokładnie nasza strona `/workouts/[planId]/exercises/[exerciseId]/progress`! Referencja: eyebrow „Exercise progress", title = nazwa ćwiczenia, opis „Your strength story will appear here after completed sessions.", action = przycisk-ikona strzałka wstecz (ArrowLeft) do `/workouts`. Treść: wyśrodkowany pusty stan — okrągła ikonka `bg-secondary text-primary` z BarChart3, H2 „No workout data yet", opis „Complete your first workout to start tracking weight, completed sets and personal bests.", przycisk „Back to workout plan”. **To warto dociągnąć teraz** — strona już istnieje u nas z innym (uboższym) pustym stanem, łatwo dopasować 1:1.

**Wspólny wzorzec wszystkich stron**: `Page` (eyebrow opcjonalny → H1 → opis) + treść w sekcjach oddzielonych `border-b border-line`, ikona z lucide-react obok każdego H2 sekcji (np. `<TrendingUp className="size-4 text-primary" />` przed „Body measurements"). Warto to powtarzać przy każdej nowej stronie/sekcji dla spójności.

Brakuje jeszcze: `Goals` (nie wklejona), `lib/fitness-data.ts` (kształt mock danych — `measurements`, `weekPlan`), `exercise-card.tsx` (karta ćwiczenia użyta w kalendarzu treningów). Dociągnąć gdy będą potrzebne.

## Ćwiczenie — widok i edycja

- Domyślnie **widok tylko do odczytu** (nazwa, serie×powtórzenia, ciężar, RPE) — nie formularz edycji od razu.
- Klik "Edytuj" pokazuje pola do zmiany.
- Przy każdym ćwiczeniu przycisk **"Progress"** → strona z wykresem ciężaru w czasie + historią zmian. Na razie pusty stan ("brak jeszcze danych"), bo nie ma jeszcze funkcji Workout Sessions, która generowałaby realne dane. Ma się pokazać dopiero z prawdziwymi treningami.

## Jak dalej pracujemy nad wyglądem

Paula wybrała: **wysyła referencje** (screeny appek/stron, których vibe jej się podoba) zamiast długich opisów słownych — łatwiej trafić w konkret.

Inne opcje, które były na stole (do wykorzystania w każdej chwili):
- Paula może sama edytować kod front-endu (pliki od kolorów/layoutu w projekcie), a ja pomagam jak utknie.
- Szkice odręczne — zadziałały dobrze przy projektowaniu dni tygodnia, można kontynuować.

## Pliki, które odpowiadają za wygląd (dla orientacji)

- `src/app/globals.css` — kolory tła/tekstu, tryb jasny/ciemny
- `src/lib/days.ts` — nazwy dni tygodnia, kolory przycisków dni
- `src/components/workouts/DayScheduler.tsx` — układ zakładek dni + zawartość dnia
- `src/components/workouts/ExerciseRow.tsx` — karta ćwiczenia (widok/edycja)
- `src/app/(app)/workouts/[planId]/edit/page.tsx` — cała strona edycji planu, w tym halo wokół karty

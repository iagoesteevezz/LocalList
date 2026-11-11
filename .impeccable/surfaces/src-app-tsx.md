---
version: 1
slug: "src-app-tsx"
primary_target: "src/App.tsx"
related_targets: []
---

# Surface: LocaLisT app shell (Lista, Comprar, Familia)

Mode: Operate. Code-led (no image generation available).

Audience and job: a non-technical mother on an iPhone, standing in a supermarket aisle under fluorescent light, one hand free, reading glasses; family members adding items from home. Jobs: add an item in seconds; in the store, see what is left aisle by aisle and tick things off; finish the trip.

Constraints: one-hand reach (primary actions in the bottom third), text large by default and resilient to iOS text size, contrast AA minimum (AAA for list text), no destructive action without undo, works offline, realtime edits by others never move what she is touching.

## Direction contract

THESIS: The list is the chalkboard of a stall in the Mercado de Vegueta: one green board, chalk-white words, struck through by hand when bought. Refuses the category default of a white list with a green accent and grey checkmarks.

OWN-WORLD: Slate-green board (#16261E dark ground, #1F3A2D shell in light) with chalk-white text (#F3F1E7) and one chalk-yellow (#F2D45C) for "pending / here now"; light theme puts chalk-ink rows (#13201A on #FFFFFF) on a cool chalk-dust ground (#E9EEE9) under the green board shell. One rounded system face (SF Pro Rounded on iPhone) for everything; authored 2px-stroke SVG icons; marks, not colours, carry state: empty ring = pending, chalk strike + tick = in the cart, dashed ring = no aisle. Raise (split-flap board): rows hold their place while others edit; only her own tick moves a row. Raise (centre-rail reference page): every state has its own printed mark. Raise (design annual): one face throughout, hierarchy by size and weight only. Raise (convention catalog): the chosen items are circled and the route between them is drawn.

STORY: She opens the app and sees, on the board, what is still missing. At the store she picks the supermarket, the board reorders into aisles, a numbered route across the top shows where she is going next, and each tick is a chalk stroke. At the till she taps "Terminar compra", with undo.

FIRST VIEWPORT: Board-green header with the family list name and a pending count; below, category (home) or aisle (store) groups of 56px rows with chalk text at 1.125rem+; the add field pinned at the bottom above a three-tab bar (Lista, Comprar, Familia). In the store, the header carries the aisle route: numbered chalk circles joined by a line, current aisle ringed in chalk yellow, done aisles ticked.

FORM: Grounded candidate 5 of 7 (Mercado de Vegueta chalkboard), seed:3878c7c4ee19aeb7. Signature move: the chalk strike, a hand-drawn SVG stroke drawn across the item name when ticked, after which the row settles at the bottom of its group.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Unresolved

- Store selector and aisle editor (Phase 5) and shop mode route strip (Phase 6) are designed in this world but built later.

# Haeven Game Documentation

## Identity
Cozy world built around villages just trying to survive a magical land of mayhem. As a fledgling adventurer you have skills consisting of combat, gathering, processing, and field. The tile-based world provides ways to train these skills and help the surrounding villagers. The game will have AFK skills, active combat, and allow for vertical and horizontal progression. The game is played in a 2D tile-based environment. Haeven balances rustic village life with lighthearted fantasy—a world where simple trades coexist with quiet magic.

## Display
- **Resolution:** 2560x1440 (16:9) internally rendered
- **Frame Rate:** 144 FPS target using requestAnimationFrame
- **Scaling:** Automatic viewport scaling to fit any screen size
- **Rendering:** Smoothly interpolates movement between game ticks (~86 frames per tick)

## Game Ticks - Order of Operations

Each game tick (600ms) follows this precise sequence:

### Pre-Tick Phase
1. Player prayers are processed (drain, effects)
2. Input actions from queue are executed
3. Tile cache is purged

### Movement Phase
1. **NPC Movement** (if not in "Get Ready" state)
   - Timer steps (cooldowns, special mechanics)
   - Movement calculations (pathfinding toward targets)
   - Attack steps (combat actions)
2. **Delayed NPC Actions** execute
3. **Projectile Updates** (travel and impact)
4. **Player Movement**
   - Timer steps
   - Movement execution (1-2 tiles based on run/walk)
   - Attack steps (combat, eating, regen)

### Post-Tick Phase
1. Mid-tick region updates
2. Delayed actions execute
3. XP drops are sent to UI
4. Dead entities are removed from world

### Client Rendering
- Targets 144 FPS using requestAnimationFrame
- Smoothly interpolates player movement between game ticks
- Each game tick (600ms) allows ~86 frames of smooth animation
- Movement animations blend naturally across tile transitions

## Tiles
The world map consists of tiles. A tile's properties are:
- **(x,y)** grid coordinates
- **Walkable** or not
- **Color** for visual representation

## Movement

### Player Movement
- **Walking:** 1 tile per tick (600ms)
- **Running:** 2 tiles per tick (consumes run energy)
- Uses **Dijkstra's pathfinding** to find optimal routes
- Automatically paths around obstacles
- If clicking an unwalkable tile, finds nearest walkable tile
- Movement is queued and processed at tick boundaries
- Animation interpolates smoothly between tiles

### Mob Movement
- Move 1 tile per tick toward their target
- Use simple directional movement (not full pathfinding)
- Cannot move diagonally through corners
- Will attempt to move around other mobs
- Stop moving when in attack range (Line of Sight established)
- Random movement when player is underneath them

### Run Energy
- Maximum: 10,000 (displays as 100%)
- Depletion rate varies by weight carried (67-134 per tile while running)
- Vigour potions reduce consumption to 30%
- Regenerates 8 + (Vigour/6) per tick while walking

## Input

- **Click tile:** Move to tile
- **Click Enemy:** Attack enemy
- **Shift+Click:** Force move to tile, ignores enemies under mouse
- **S:** Cancel movement
- **P:** Pause/Resume
- **Shift+R:** Reset player position
- **Shift+D:** Toggle debug mode
- **Q:** Bag Panel
- **W:** Equipment Panel
- **E:** Focus Panel
- **R:** Magic Panel
- **A:** Training Styles Panel

## Skills

Four categories of skills: Combat, Gathering, Processing, and Field. All skills can reach level 100.

### Combat Skills
- **Life** - Maximum Health Pool - Trained by any combat
- **Spirit** - Maximum Focus Pool - Trained by defeating enemies
- **Strike** - Melee accuracy roll - Trained by melee combat
- **Cleave** - Melee strength roll - Trained by melee combat
- **Mark** - Bow accuracy roll - Trained by bow combat
- **Loose** - Bow strength roll - Trained by bow combat
- **Weave** - Magic accuracy roll - Trained by magic combat
- **Channel** - Magic strength roll - Trained by magic combat

### Gathering Skills
- **Fish** (Partner skill to Cook) - Trained by catching fish from water sources
- **Mine** (Partner skill to Smith) - Trained by mining ore from rock sources
- **Forage** (Partner skill to Craft) - Trained by chopping logs from tree sources
- **Divine** (Partner skill to Attune) - Trained by gathering materials from magical sources

### Processing Skills
- **Cook** (Partner skill to Fish) - Trained by consuming fish at the Kitchen
- **Smith** (Partner skill to Mine) - Trained by consuming ore at the Smithy
- **Craft** (Partner skill to Forage) - Trained by crafting items at the Fletchery
- **Attune** (Partner skill to Divine) - Trained by consuming magical materials at the Apothecary

### Field Skills
- **Vigour** - Affects run energy regeneration
- **Hunt** - Field skill
- **Renown** - Quests completed increase renown
- **Glory** - Combat achievements completed increase glory

### Skills UI Layout:
```
Combat 1    Life        Strike      Mark        Weave
Combat 2    Spirit      Cleave      Loose       Channel
Gathering   Fish        Mine        Forage      Divine
Processing  Cook        Smith       Craft       Attune
Field       Vigour      Hunt        Renown      Glory
```

## Experience System

### Experience Breakpoints
- Level 100 = 100,000,000 XP (max level)
- Level 99 = 90,000,000 XP
- Level 95 = 70,000,000 XP
- Level 90 = 50,000,000 XP (halfway to max level)
- Level 85 = 35,000,000 XP
- Level 80 = 25,000,000 XP
- Level 75 = 17,500,000 XP
- Level 70 = 12,500,000 XP
- Level 65 = 8,750,000 XP
- Level 60 = 6,250,000 XP
- Level 50 = 3,125,000 XP
- Level 40 = 1,562,500 XP
- Level 30 = 781,250 XP
- Level 20 = 390,625 XP
- Level 10 = 195,312 XP
- Level 1 = 0 XP

**Experience Cap:** 500,000,000 XP per skill (continues tracking after level 100)

## Training Styles

### Combat Training
Each weapon type has three training options:
- **Focused:** 100% XP to primary skill (Strike for melee, Mark for ranged, Weave for magic)
- **Balanced:** 50/50 split between accuracy and power skills
- **Aggressive:** 100% XP to power skill (Cleave for melee, Loose for ranged, Channel for magic)

### Gathering Training
- **Harvest:** 10% XP, 2x resources (profit mode)
- **Balanced:** 100% XP, normal resources
- **Intensive:** 200% XP, no resources (training mode)

## UI Panels

The UI panels appear in the bottom right of the screen. Players control game aspects by clicking panel icons at the top. The active panel displays below these icons, with a vertical HP bar on the left showing current/maximum HP and a vertical Focus bar on the right showing current/maximum Focus.

```
[Training Style Icon] [Skills Icon] [Quests Icon] [Bag Icon] [Equipment Icon] [Focus Icon] [Magic Icon]
[HP Bar (vertical)] [Active Panel Content] [Focus Bar (vertical)]
```

### Training Style Panel
Shows three training options for the current skill or equipped weapon's combat style.

**Melee Combat Options:**
- **Controlled** (all combat XP to Strike)
- **Balanced** (50% to Strike, 50% to Cleave)
- **Aggressive** (all combat XP to Cleave)

**Non-Combat Skill Options:**
- **Harvest** (10% XP, double resources)
- **Balanced** (100% XP, normal resources)
- **Intensive** (200% XP, no resources)

### Skills Panel
Displays all skills with:
- Skill icon (left)
- Skill level (right)
- XP progress bar (bottom)

**Hover Tooltip:**
```
Mine XP:        ###,###
Next Level:     ###,###
Remaining:      ###,###
```

### Quests Panel
Lists all quests alphabetically with completion count:
```
Farming Fred's Chickens             10
Melinda's Bake Sale                  3
Zachary's Zombie Problem            57
```

### Bag Panel
- Shows current items in a 4x8 grid (max 32 items)
- Click weapon/equipment to equip (swaps with currently equipped)
- Click food to eat (restores health)
- Changes occur on the next game tick

### Equipment Panel
- Displays currently equipped items
- Configure attack style loadouts (melee, ranged, magic)
- Equipping a weapon automatically equips its corresponding loadout

### Focus Panel
- Shows unlocked focuses (3 defensive, 3 offensive)
- One defensive and one offensive focus can be active simultaneously
- Clicking an active focus deactivates it
- Changes apply on the next game tick

### Magic Panel
- Displays available magic spells
- Level requirements for each spell
- Includes teleports, healing conversions, and utility spells

## Gathering & Processing Resources

### Resource Structure
Each gathering skill follows the same progression:
- **Primary Resource:** New tier every 10 levels (1, 10, 20, 30, etc.)
- **Secondary Resource:** New tier every 20 levels (1-20, 21-40, 41-60, etc.)
- **Processing:** Secondary resources are refined using the partner processing skill
- **Potions:** Refined secondary resources create boost potions

### Fish → Cook
**Primary Resources:**
- Level 1-9: Raw Minnow → Minnow (3 HP, 3-tick delay)
- Level 10-19: Raw Brookfin → Brookfin (6 HP, 3-tick delay)
- Level 20-29: Raw Inkblot Squid → Inkblot Squid (5 HP, 1-tick delay)
- Level 30-39: Raw Koi → Koi (9 HP, 3-tick delay)
- Level 40-49: Raw Pikelet → Pikelet (12 HP, 3-tick delay)
- Level 50-59: Raw Glowcap Squid → Glowcap Squid (10 HP, 1-tick delay)
- Level 60-69: Raw Carp → Carp (15 HP, 3-tick delay)
- Level 70-79: Raw Eel → Eel (18 HP, 3-tick delay)
- Level 80-89: Raw Starlace Squid → Starlace Squid (15 HP, 1-tick delay)
- Level 90-99: Raw Moonshark → Moonshark (21 HP, 3-tick delay)
- Level 100: Raw Lilviathan → Lilviathan (24 HP, 3-tick delay)

**Secondary Resource - Seaweed:**
- Tier 1 (Levels 1-20): Flawed Seaweed → Flawed Seaweed (R)
- Tier 2 (Levels 21-40): Common Seaweed → Common Seaweed (R)
- Tier 3 (Levels 41-60): Quality Seaweed → Quality Seaweed (R)
- Tier 4 (Levels 61-80): Pure Seaweed → Pure Seaweed (R)
- Tier 5 (Levels 81-100): Perfect Seaweed → Perfect Seaweed (R)
- **Spirit Potions:** T1 (+4), T2 (+8), T3 (+12), T4 (+16), T5 (+20)

**Combo Eating:** Can consume 1 main food + 1 squid + 1 potion per tick
**Eat Delay:** 3 ticks between eating attempts

### Mine → Smith
**Primary Resources (Every 10 levels):**
- Level 1: Pebblestone Ore
- Level 10: Tinleaf Ore
- Level 20: Bronzewood Ore
- Level 30: Ironbloom Ore
- Level 40: Silverroot Ore
- Level 50: Goldveil Ore
- Level 60: Sunsteel Ore
- Level 70: Runestone Ore
- Level 80: Aetherite Ore
- Level 90: Starforged Ore
- Level 100: Primora Ore

**Secondary Resource - Flint:**
- Tier 1 (Levels 1-20): Flawed Flint → Flawed Flint (R)
- Tier 2 (Levels 21-40): Common Flint → Common Flint (R)
- Tier 3 (Levels 41-60): Quality Flint → Quality Flint (R)
- Tier 4 (Levels 61-80): Pure Flint → Pure Flint (R)
- Tier 5 (Levels 81-100): Perfect Flint → Perfect Flint (R)
- **Melee Potions:** T1 (+4), T2 (+8), T3 (+12), T4 (+16), T5 (+20) Strike/Cleave for 5 minutes

### Forage → Craft
**Primary Resources (Every 10 levels):**
- Level 1: Birch Logs
- Level 10: Oak Logs
- Level 20: Willow Logs
- Level 30: Maple Logs
- Level 40: Ashen Logs
- Level 50: Yew Logs
- Level 60: Redwood Logs
- Level 70: Ancient Logs
- Level 80: Elder Logs
- Level 90: Sacred Logs
- Level 100: World Logs

**Secondary Resource - Resin:**
- Tier 1 (Levels 1-20): Flawed Resin → Flawed Resin (R)
- Tier 2 (Levels 21-40): Common Resin → Common Resin (R)
- Tier 3 (Levels 41-60): Quality Resin → Quality Resin (R)
- Tier 4 (Levels 61-80): Pure Resin → Pure Resin (R)
- Tier 5 (Levels 81-100): Perfect Resin → Perfect Resin (R)
- **Ranged Potions:** T1 (+4), T2 (+8), T3 (+12), T4 (+16), T5 (+20) Mark/Loose for 5 minutes

### Divine → Attune
**Primary Resources (Every 10 levels):**
- Level 1: Faint Essence
- Level 10: Glimmer Essence
- Level 20: Kindle Essence
- Level 30: Bright Essence
- Level 40: Shimmer Essence
- Level 50: Radiant Essence
- Level 60: Auric Essence
- Level 70: Starlit Essence
- Level 80: Aether Essence
- Level 90: Celestial Essence
- Level 100: Divine Essence

**Secondary Resource - Dust:**
- Tier 1 (Levels 1-20): Flawed Dust → Flawed Dust (R)
- Tier 2 (Levels 21-40): Common Dust → Common Dust (R)
- Tier 3 (Levels 41-60): Quality Dust → Quality Dust (R)
- Tier 4 (Levels 61-80): Pure Dust → Pure Dust (R)
- Tier 5 (Levels 81-100): Perfect Dust → Perfect Dust (R)
- **Magic Potions:** T1 (+4), T2 (+8), T3 (+12), T4 (+16), T5 (+20) Weave/Channel for 5 minutes

## Processing Locations
- **Cook:** Kitchen
- **Smith:** Smithy
- **Craft:** Fletchery
- **Attune:** Sanctum
- **Potion Creation:** Apothecary (converts refined secondary resources into potions)

## Weapon Degradation System
- **Uncharged equipment:** Functions at 75% effectiveness
- **Charging requirements:**
  - Melee weapons: Require ore from Mining/Smithing
  - Ranged weapons: Require logs from Foraging/Crafting
  - Magic weapons: Require essence from Divining/Attuning
- Degradation encourages engagement with all gathering/processing skills

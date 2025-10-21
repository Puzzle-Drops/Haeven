**Haeven Game Documentation**



**Identity:** Cozy world built around villages just trying to survive a magical land of mayhem. As a fledgling adventurer you have skills consisting of combat, gathering, processing, and field. The tile based world provides ways to train these skills and help the surrounding villagers. The game will have afk skills, active combat, and allow for vertical and horizontal progression. The game is played in a 2D tile based environment.



**Tiles:** The world map consists of tiles. A tile properties are (x,y) grid coordinates, walkable or not, and a color.



**Movement:** Movement is based on Dijkstra's algorithm as well as targets a nearby walkable tile if an unwalkable tile is clicked. 1-2 tiles per game tick, with the player animating to each tile separately.



**Display:** 144 fps, 2560x1440 (16:9) resolution internally rendered, scaled wrapper that fits any viewport.



**Input:**

&nbsp;	Click tile: Move to tile

&nbsp;	Click Enemy: Attacks enemy

&nbsp;	Shift Click: Forces move to tile, ignores enemies under mouse

&nbsp;	S: Cancel Movement

&nbsp;	P: Pause/Resume

&nbsp;	R: Reset player position

&nbsp;	Shift+D: Toggle debug mode

&nbsp;	Q: Bag Panel

&nbsp;	W: Equipment Panel

&nbsp;	E: Focus Panel

&nbsp;	R: Magic Panel

&nbsp;	A: Training Styles Panel



**Skills:**

Four categories of skills. Combat, Gathering, Processing, and Field. Combat skills gain experience through active combat. One damage gets you 4 experience in your active combat skill, 1 experience in Hitpoints, and defeating monsters grants you a variable amount of experience in Focus. Gathering skills are all about obtaining resources, you gain experience per resource obtained successfully. Processing skills are all about using your obtained resources, and turning them into something beneficial. You turn ore into weapons/armor, you turn fish into cooked dishes, you turn logs into planks for your player house, you turn foraged materials into ranged armor/ammo.



**Combat Skills**

Life - Maximum Health Pool - Trained by any combat

Focus - Maximum Focus Pool - Trained by defeating enemies in combat

Melee Attack - Melee accuracy roll - Trained by melee combat

Melee Strength - Melee strength roll - Trained by melee combat

Bow Attack - Bow accuracy roll - Trained by bow combat

Bow Strength - Bow strength roll - Trained by bow combat

Magic Attack - Magic accuracy roll - Trained by magic combat

Magic Strength - Magic strength roll - Trained by magic combat



**Gathering Skills**

Fish (Partner skill to Cook) - Trained by catching fish from water sources

Mine (Partner skill to Smith) - Trained by mining ore from rock sources

Forage (Partner skill to Craft) - Trained by chopping logs from tree sources

Attune (Partner skill to Divine) - Trained by gathering materials from magical sources



**Processing Skills**

Cook (Partner skill to Fish) - Trained by consuming fish at the Kitchen

Smith (Partner skill to Mine) - Trained by consuming ore at the Smithy

Craft (Partner skill to Forage) - Trained by crafting items from gathered materials at the Fletchery

Divine (Partner skill to Attune) - Trained by consuming magical materials at the Apothecary




**Field Skills**

Athletics - Field skill, 

Influence - Quests completed increase influence

Feats - Combat achievements completed increase feats



**Shown in ui:**
Combat row 1	Life    	  Melee Attack	    Bow Attack	  Magic Attack

Combat row 2	Focus		    Melee Strength	  Bow Strength	Magic Strength

Gathering	    Fish		    Mine		          Forage		    Attune

Processing	  Cook		    Smith		          Craft	        Divine

Field		Athletics	Influence	Feats		???





**UI Panels:**



The UI Panels will be shown bottom right of the screen and allow you to control aspects of the game. The game ui will be represented via panels that can be toggled through by clicking an icon for that panel at the top of the ui panel. The panel is just below these icon options, and on the left side of the panel is a vertical hitpoints bar showing current HP out of maximum HP, and on the right side of the panel is a vertical focus bar showing current Focus our of maximum Focus.

\[Training Style Icon] \[Skills Icon] \[Quests Icon] \[Bag Icon] \[Equipment Icon] \[Focus Icon] \[Magic Icon]

\[Hitpoints Bar vertical] \[Active Panel] \[Focus Bar vertical]


**Training Style Panel:**

Shows three training options for each skill (shows currently for the skill being trained, and if not currently training a skill than for the combat style of the weapon equipped, if no skill trained and no weapon equipped show for melee).

Options if in combat with melee weapon equipped:
Controlled (all combat exp to Melee Attack)

Balanced (50% combat exp to Melee Attack and 50% to Melee Strength)

Aggressive (all combat exp to Melee Strength)



If you are training a non combat skill the options would be:

Gather (10% exp and double resources gathered)

Balanced (100% exp at 100% speed gathering resources)

Learn (200% exp and no resources gathered)



**Skills Panel:**

Hovering a skill will show you a tooltip:

Mine XP: 	###,###
Next Level:	###,###

Remaining: 	###,###



The skills panel shows all skills in the following order and rows. It shows this via the skill icon on the left, the skill level on the right, and a small xp bar below this showing the progress to the next level like this.

\[Skill icon]   90

\[--------       ]



Combat 1	Hitpoints	Melee Attack	Bow Attack	Magic Attack

Combat 2	Focus		Melee Strength	Bow Strength	Magic Strength

Gathering	Mine		Fish		Woodcut		Forage

Processing	Smith		Cook		Construct	Craft

Field		Athletics	Influence	Feats		???



**Quests Panel:**

This shows each quest in the game in alphabetical order with the number of completions to the right side.



Farming Fred's Chickens			10

Melinda's Bake Sale			 3

Zachary's Zombie Problem		57



**Bag Panel:**

The bag panel shows all your current items. You can have up to 20 items at a time. They will be shown in a grid that is 5 vertical and 8 horizontal. Clicking a weapon or equipment item in the bag will equip that item and if there was already an item in that equipment slot it will now be where the newly equipped item was. Clicking a food item will eat it, restoring health. Changes like this will occur on the next game tick. So equipping a bow will equip that bow and your range loadout on the next tick. Eating a food item will eat it on the next tick.



**Equipment Panel:**

The equipment panel shows your currently equipped items and allows you to setup attack style loadouts. You can have one loadout per attack style (melee, ranged, and magic). Equipping a melee weapon will automatically equip your melee loadout. Equipping a ranged weapon will automatically equip your ranged loadout, etc.



**Focus Panel:**

This panel will show the focuses that you have unlocked. There are 3 defensive focuses and 3 offensive focuses, one per attack style. A melee, ranged, and magic defensive as well as a melee, ranged, and magic offensive. You can only have one defensive or offensive focus on at a time. So you can have melee defensive focus on, and ranged offensive focus on as well. But if you click magic defensive focus with melee defensive focus on already, it will swap to the magic defensive focus. This will occur on the next game tick. Clicking an already on focus will turn it off on the next game tick.



**Magic Panel:**

This panel will show the different magic spells that you are able to cast. These will have level requirements but will have things like teleport to locations, or convert focus to health, things like this.






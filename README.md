# Heroes Changelog

This module parses Heroes of the Storm patch notes and categories changes by Hero. 

This module relies entirely on the fantastic [heroes-talents](https://github.com/heroespatchnotes/heroes-talents) and [heroes-patch-data](https://github.com/heroespatchnotes/heroes-patch-data) repos. If these repos are not up to date this module will not parse patch notes for new patches or heroes.

## Usage

```javascript

const heroeschangelog = require('heroeschangelog');

const { patches, heroes } = await heroeschangelog();

console.log(patches);


 [{ 
      "internalId":"patch-notes-february-14-2017",
      "patchName":"Lucio Patch",
      "officialLink":"http://us.battle.net/heroes/en/blog/20554028",
      "patchType":"Patch Notes",
      "gameVersion":"23.3",
      "fullVersion":"1.23.3.50441",
      "ptrOfficialLink":"http://us.battle.net/heroes/en/blog/20529510",
      "ptrDate":"2017-02-06",
      "ptrBuild":"50424",
      "liveDate":"2017-02-14",
      "liveBuild":"50441",
      "fullNotesMarkdown":"(...full patch notes converted to markdown)",
      "changedHeroes": ['Abathur','Varian','Jaina','Zarya']
}...]


console.log(heroes.Artanis.changes)

[{
    "2.28.3.58623": { 
        patch: { ...patch object },
        changes: "* Health reduced from 2335 (+4% per level) to 2245 (+4% per level).
    * Health Regeneration reduced from approximately 4.86 (+4% per level) to 4.67 (+4% per level).
        * Twin Blades (W)
            * Artanis’ next Basic Attack now also causes him to charge forward a short distance, equal to approximately half the distance provided by the previous iteration of the Zealot Charge Talent.
            * Zealot Charge (Talent)
                * Now increases charge distance by 100%.
            
Developer Comments: Artanis’ survivability directly scales with how much uptime he has, which made a Talent like Zealot Charge incredibly powerful. The effect brought his entire kit together so well, that we’ve decided to provide part of its former benefit into baseline Twin Blades. Whereas sometimes we feel the need to cut Talents to fill a hole in a Hero’s kit, in this case we think that this is a hole that Artanis’ should be able to partially circumvent from the start. Since this is a substantial increase in his power at the start of the game, we’ve decided to revert the Health increase that Artanis received recently."
    }
}]

```

### Caveats

* Only items under the specific hero header and the "bug fixes" header are categorized as a change for a hero. If there is a change to a hero mentioned elsewhere in the patch notes, the change will not get parsed. 
* Certain patch notes are not parsed because they are not formatted uniformly (mostly older patches that have no revelant changes)
* Patch notes released on the HotS forums are not parsed. These changes are usually game breaking bug hotfixes and usually don't have hero changes.
* The object graph of these generated objects is very large. Be warned if you intend on serving these across an HTTP connection or saving them out. 

// src/config/enemySprites.ts

export const ENEMY_SPRITES: Record<string, string> = {
    "Grimjaw": "Skeleton_Captain.png",
    "Skeleton Captain": "Skeleton_Captain.png",
    "Grumthar": "Orc_Warden.png",
    "Orc Warden": "Orc_Warden.png",
    "Asterion": "Golem_Asterion.png",
    "Crystal Golem": "Golem_Crystal.png",
    "Boneguard": "Skeleton_Boneguard.png",
    "Acid Slime": "Slime_Acid.png",
    "Goblin Cutthroat": "Goblin_Cutthroat.png",
    "Plague Zombie": "Zombie_Plague.png",
    "Cave Bat Matriarch": "Bat_Matriarch.png",
    "Orc Shieldbreaker": "Orc_Shieldbreaker.png",
    "Void Sorcerer": "Sorcerer_Void.png",
    "Bat": "Bat.png",
    "Dragon": "Dragon.png",
    "Goblin": "Goblin.png",
    "Golem": "Golem.png",
    "Orc": "Orc.png",
    "Rat": "Rat.png",
    "Skeleton": "Skeleton.png",
    "Slime": "Slime.png",
    "Sorcerer": "Sorcerer.png",
    "Zombie": "Zombie.png",
    "Unknown Horrific Foe": "Slime.png"
};

/**
 * Helper utility to dynamically resolve images inside src/assets/
 * by performing a case-insensitive keyword search against the enemy name
 */
export const getEnemySprite = (enemyName: string): string => {
    // 1. Find a key in our map that appears inside the enemy's full name string
    const matchedKey = Object.keys(ENEMY_SPRITES).find(key =>
        enemyName.toLowerCase().includes(key.toLowerCase())
    );

    const fileName = matchedKey
        ? ENEMY_SPRITES[matchedKey]
        : ENEMY_SPRITES["Unknown Horrific Foe"];

        return new URL(`../assets/${fileName}`, import.meta.url).href;
};

// temp img
export const getPlayerSprite = (): string => {
  return new URL('../assets/hero.png', import.meta.url).href;
};

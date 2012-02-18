Werld.Creatures = {
  CHARACTER: {
    MOVEMENT_SPEED: 2,
    BOUNDARIES: {
      MAX_CRITICAL_HIT_CHANCE: 20,
      MAX_DEXTERITY: 125,
      MAX_STRENGHT: 125,
      MAX_INTELLIGENCE: 125
    },
    SPRITE: {
      SRC: '../images/sprite_sheets/characters/mage.png',
      DIMENSIONS: [40, 40],
      FRAME_CHANGE_SPEED: 0.25
    }
  },
  SILVER_BAT: {
    name: 'a silver bat',
    MOVEMENT_SPEED: 1,
    stats: {
      strength: 15,
      dexterity: 15,
      intelligence: 10
    },
    BOUNDARIES: {
      MAX_CRITICAL_HIT_CHANCE: 20,
      MAX_DEXTERITY: 125,
      MAX_STRENGHT: 125,
      MAX_INTELLIGENCE: 125
    },
    SPRITE: {
      SRC: '../images/sprite_sheets/creatures/silver_bat.png',
      DIMENSIONS: [40, 40],
      FRAMES: 4,
      FRAME_CHANGE_SPEED: 0.25
    }
  },
  WHITE_WOLF: {
    name: 'a white wolf',
    MOVEMENT_SPEED: 1,
    stats: {
      strength: 30,
      dexterity: 30,
      intelligence: 10
    },
    BOUNDARIES: {
      MAX_CRITICAL_HIT_CHANCE: 20,
      MAX_DEXTERITY: 125,
      MAX_STRENGHT: 125,
      MAX_INTELLIGENCE: 125
    },
    SPRITE: {
      SRC: '../images/sprite_sheets/creatures/white_wolf.png',
      DIMENSIONS: [48, 48],
      FRAMES: 4,
      FRAME_CHANGE_SPEED: 0.25
    }
  }
};

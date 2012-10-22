var Werld = {
  Views: { Base: {} },
  Models: { Base: {} },
  Collections: {},
  containers: {},
  layers: {},
  CONTAINER_NAMES: [
    'terrain',
    'objects',
    'creatures',
    'character',
    'gumps',
    'itemTransfer',
    'gameMessages',
    'damage'
  ],
  TEXT: {
    CREATURE_NAME: {
      FONT: '16px "PowellAntique" serif',
      COLOR: '#cccccc',
      SHADOW: new CreateJS.Shadow('black', 1, 1, 1),
      TEXT_BASELINE: 'top',
      TEXT_ALIGN: 'center'
    },
    CHARACTER_NAME: {
      FONT: '18px "PowellAntique" serif',
      COLOR: '#6495ed',
      SHADOW: new CreateJS.Shadow('black', 1, 1, 1),
      TEXT_BASELINE: 'top',
      TEXT_ALIGN: 'center'
    },
    CREATURE_HIT_RECEIVED: {
      FONT: '14px "PowellAntique" serif',
      COLOR: '#ff3300',
      TEXT_ALIGN: 'center',
      SHADOW: new CreateJS.Shadow('black', 1, 1, 1)
    },
    CREATURE_CRITICAL_HIT: {
      TEXT: 'critical!',
      FONT: '14px "PowellAntique" serif',
      COLOR: '#cccccc',
      TEXT_ALIGN: 'center',
      SHADOW: new CreateJS.Shadow('black', 1, 1, 1)
    },
    CREATURE_HIT_MISSED: {
      TEXT: 'miss',
      FONT: '14px "PowellAntique" serif',
      COLOR: '#cccccc',
      TEXT_ALIGN: 'center',
      SHADOW: new CreateJS.Shadow('black', 1, 1, 1)
    },
    CHARACTER_HIT_RECEIVED: {
      FONT: '14px "PowellAntique" serif',
      COLOR: 'yellow',
      TEXT_ALIGN: 'center',
      SHADOW: new CreateJS.Shadow('black', 1, 1, 1)
    },
    STAT_INCREASE: {
      FONT: '18px "PowellAntique" serif',
      COLOR: '#66cc00',
      TEXT_ALIGN: 'left',
      SHADOW: new CreateJS.Shadow('black', 1, 1, 0)
    },
    STAT_DECREASE: {
      FONT: '18px "PowellAntique" serif',
      COLOR: '#66cc00',
      TEXT_ALIGN: 'left',
      SHADOW: new CreateJS.Shadow('black', 1, 1, 0)
    },
    SKILL_INCREASE: {
      FONT: '18px "PowellAntique" serif',
      COLOR: '#05b8cc',
      TEXT_ALIGN: 'left',
      SHADOW: new CreateJS.Shadow('black', 1, 1, 0)
    },
    SKILL_DECREASE: {
      FONT: '18px "PowellAntique" serif',
      COLOR: '#05b8cc',
      TEXT_ALIGN: 'left',
      SHADOW: new CreateJS.Shadow('black', 1, 1, 0)
    },
  },
  STATES: {
    INIT: 1,
    SPLASH_SCREEN: 2,
    CHOOSING_NAME: 3,
    GAME_STARTED: 4
  },
  SKILLS: {
    WRESTLING: {
      NAME: 'wrestling'
    },
    SWORDSMANSHIP: {
      NAME: 'swordsmanship'
    }
  },
  OBJECTS: {
    ALTAR: {
      IMAGE: {
        SRC: 'images/objects/altar.png'
      }
    }
  },
  Config: {
    AGGRESSIVENESS_HANDLER_RATE: 2000,
    AGGRESSIVENESS_RADIUS: 6,
    CORPSE_DECAY_TIME: 80 * 1000,
    FRAMES_PER_SECOND: 30,
    HIGHLIGHT_TILES_WHEN_CREATURES_MOVE: true,
    MAXIMUM_ATTACK_SPEED: 1.25,
    MAXIMUM_DAMAGE_BONUS_PERCENTAGE: 100,
    MAXIMUM_HIT_CHANCE_PERCENTAGE: 100,
    MESSAGE_LIFE_CYCLE: 5000,
    MESSAGE_SWEEPER_POLLING_INTERVAL: 1000,
    PIXELS_PER_TILE: 40,
    PROVOCABILITY: 0.3,
    REGENERATION_RATE: 1000,
    RESPAWN_TIME: 60 * 1000,
    SCREEN_DIMENSIONS: [16, 12],
    STOP_ATTACKING_HANDLER_RATE: 500,
    WORLD_MAP_DIMENSIONS: [50, 50]
  },
  frameRate: function() {
    return(Math.floor(1000 / Werld.Config.FRAMES_PER_SECOND));
  },
  switchState: function(state, params) {
    params || (params = {});

    if (Werld.state === Werld.STATES.INIT) {
      if (state === Werld.STATES.SPLASH_SCREEN) {
        Werld.state = Werld.STATES.SPLASH_SCREEN;
      }
    } else if (Werld.state === Werld.STATES.SPLASH_SCREEN) {
      if (state === Werld.STATES.CHOOSING_NAME) {
        var characterNameInputForm = new Werld.Views.CharacterNameInputForm();
        characterNameInputForm.render();
        Werld.state = Werld.STATES.CHOOSING_NAME;
      }
    } else if (Werld.state === Werld.STATES.CHOOSING_NAME) {
      if (state === Werld.STATES.GAME_STARTED) {
        Werld.stage.removeAllChildren();

        _(Werld.CONTAINER_NAMES).each(function(name) {
          Werld.containers[name] = new CreateJS.Container();
        });

        var shortSword = new Werld.Models.Item(Werld.ITEMS.SHORT_SWORD);

        Werld.character = new Werld.Models.Character(_({
          id: 1,
          name: params.data.character.name,
          strength: 20,
          dexterity: 20,
          intelligence: 10,
          swordsmanship: 50,
          items: new Werld.Collections.Items([shortSword]),
          coordinates: [340, 220]
        }).extend(Werld.CREATURES.CHARACTER));

        Werld.character.equip(shortSword);

        Werld.game = new Werld.Models.Game({
          map: new Werld.Models.Map(),
          characters: new Werld.Collections.Characters([Werld.character])
        });

        Werld.path = new Werld.Path({
          tiles: Werld.game.get('map').get('tiles')
        });

        Werld.screen = new Werld.Models.Screen({
          map: Werld.game.get('map'),
          character: Werld.character,
          dimensions: Werld.Config.SCREEN_DIMENSIONS,
          coordinates: [0, 0]
        });

        Werld.canvas.screenView = new Werld.Views.Screen({
          model: Werld.screen
        });

        Werld.canvas.characterView = new Werld.Views.Character({
          model: Werld.character,
          image: Werld.IMAGES.MAGE
        });

        Werld.canvas.statusBarView = new Werld.Views.StatusBar({
          model: Werld.character
        });

        Werld.canvas.backpackView = new Werld.Views.Backpack({
          model: Werld.character.backpack
        });

        var silverBatSpawner = new Werld.Models.CreatureSpawner({
          creature: Werld.CREATURES.SILVER_BAT,
          tileCoordinates: [4, 4],
          tileRadius: 3,
          numberOfCreatures: 0
        });

        var whiteWolfSpawner = new Werld.Models.CreatureSpawner({
          creature: Werld.CREATURES.WHITE_WOLF,
          tileCoordinates: [15, 10],
          tileRadius: 4,
          numberOfCreatures: 10
        });

        var fireWolfSpawner = new Werld.Models.CreatureSpawner({
          creature: Werld.CREATURES.FIRE_WOLF,
          tileCoordinates: [15, 15],
          tileRadius: 4,
          numberOfCreatures: 10
        });

        var leviathanSpawner = new Werld.Models.CreatureSpawner({
          creature: Werld.CREATURES.LEVIATHAN,
          tileCoordinates: [4, 15],
          tileRadius: 4,
          numberOfCreatures: 0
        });

        var blueDragonSpawner = new Werld.Models.CreatureSpawner({
          creature: Werld.CREATURES.BLUE_DRAGON,
          tileCoordinates: [4, 10],
          tileRadius: 4,
          numberOfCreatures: 0
        });

        Werld.creatureSpawners = new Werld.Collections.CreatureSpawners([
          silverBatSpawner,
          whiteWolfSpawner,
          fireWolfSpawner,
          leviathanSpawner,
          blueDragonSpawner
        ]);

        Werld.layers.battle = new Werld.Views.Layer({
          model: Werld.containers.damage,
          character: Werld.character
        });

        Werld.altar = new Werld.Models.Altar(_({
          coordinates: Werld.Utils.Geometry.tilePointToPixelPoint([9, 5]),
          characters: Werld.game.get('characters')
        }).extend(Werld.OBJECTS.ALTAR));

        Werld.canvas.altarView = new Werld.Views.Altar({
          model: Werld.altar
        });

        new Werld.Views.MessageInputFormHandler();

        new Werld.Views.GameMessages({
          model: Werld.character,
          collection: new Werld.Collections.EphemeralMessages(null, {
            lifetime: 7000
          }),
          container: Werld.containers.gameMessages
        });

        Werld.containers.terrain.addChild(Werld.canvas.screenView.container);
        Werld.containers.objects.addChild(Werld.canvas.altarView.container);
        Werld.containers.character.addChild(Werld.canvas.characterView.container);

        Werld.creatureSpawners.activateAll();

        Werld.containers.gumps.addChild(Werld.canvas.statusBarView.container);
        Werld.containers.gumps.addChild(Werld.canvas.backpackView.container);
        Werld.containers.gumps.screen = Werld.screen;

        _.chain(Werld.containers).values().each(function(container) {
          Werld.stage.addChild(container);
        });

        Werld.state = Werld.STATES.GAME_STARTED;
      }
    } else {
      if (state === Werld.STATES.INIT) {
        Werld.state = Werld.STATES.INIT;
      }
    }

    Werld.Utils.Callback.run(params.callback);
  },
  init: function() {
    Werld.switchState(Werld.STATES.INIT);

    Werld.canvas = new Werld.Canvas();
    Werld.stage = new CreateJS.Stage(Werld.canvas.el);
    Werld.stage.enableMouseOver();
    CreateJS.Ticker.useRAF = true;
    CreateJS.Ticker.setFPS(Werld.Config.FRAMES_PER_SECOND);

    var stats = new Stats();
    stats.setMode(0);

    stats.domElement.style.position = 'fixed';
    stats.domElement.style.left = '0px';
    stats.domElement.style.top = '0px';

    document.body.appendChild(stats.domElement);

    CreateJS.Ticker.addListener({
      tick: function() {
        stats.begin();
        Werld.stage.tick();
        stats.end();
      }
    });

    var splashScreenView = new Werld.Views.SplashScreen();
    Werld.stage.addChild(splashScreenView.container);

    Werld.switchState(Werld.STATES.SPLASH_SCREEN);
  }
};

$(Werld.init);

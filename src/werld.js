var Werld = {
  Views: {
    Base: {}
  },
  Models: {
    Base: {}
  },
  Collections: {},
  Util: {},
  States: {
    INIT: 1,
    SPLASH_SCREEN: 2,
    CHOOSING_NAME: 3,
    GAME_STARTED: 4
  },
  Creatures: {
    CHARACTER: {
      MOVEMENT_SPEED: 2,
      BOUNDARIES: {
        MAX_CRITICAL_HIT_CHANCE: 20,
        MAX_DEXTERITY: 125,
        MAX_STRENGHT: 125,
        MAX_INTELLIGENCE: 125
      },
      SPRITE: {
        SRC: '../images/sprite_sheets/character.png',
        FRAME_CHANGE_SPEED: 0.25
      }
    },
    SILVER_BAT: {
      name: 'a silver bat',
      MOVEMENT_SPEED: 1,
      stats: {
        strength: 15,
        dexterity: 10,
        intelligence: 10
      },
      BOUNDARIES: {
        MAX_CRITICAL_HIT_CHANCE: 20,
        MAX_DEXTERITY: 125,
        MAX_STRENGHT: 125,
        MAX_INTELLIGENCE: 125
      },
      SPRITE: {
        SRC: '../images/sprite_sheets/silver_bat.png',
        FRAMES: 4,
        FRAME_CHANGE_SPEED: 0.25
      }
    }
  },
  Objects: {
    ALTAR: {
      IMAGE: {
        SRC: '../images/objects/altar.png'
      }
    }
  },
  Config: {
    FRAMES_PER_SECOND: 30,
    FRAME_RATE: function() {
      return(Math.floor(1000 / Werld.Config.FRAMES_PER_SECOND));
    },
    MESSAGE_LIFE_CYCLE: 5000,
    MESSAGE_SWEEPER_POLLING_INTERVAL: 1000,
    PIXELS_PER_TILE: 40,
    REGENERATION_RATE: 1000,
    SCREEN_DIMENSIONS: [16, 12],
    WORLD_MAP_DIMENSIONS: [50, 50]
  },
  account: {
    provider: {}
  },
  sounds: {
    music: {
      ogg: '../sounds/music.ogg',
      mp3: '../sounds/music.mp3',
      wav: '../sounds/music.wav'
    }
  },
  setAccount: function(providerName, apiResponse) {
    this.account.name = apiResponse.name;
    this.account.email = apiResponse.email;
    this.account.provider.id = apiResponse.id;
    this.account.provider.name = providerName;
  },
  loadSounds: function() {
    var music = document.createElement('audio');
    var supportedType;

    if (music.canPlayType('audio/mp3')) {
      supportedType = 'mp3';
    } else if (music.canPlayType('audio/wav')) {
      supportedType = 'wav';
    } else if (music.canPlayType('audio/ogg')) {
      supportedType = 'ogg';
    }

    if (supportedType) {
      document.body.appendChild(music);
      music.setAttribute('src', this.sounds.music[supportedType]);
      //music.addEventListener('canplay', music.play, false);
    }
  },
  messageInputForm: function() {
    if (!this.messageInputView) {
     this.messageInputView = new Werld.Views.MessageInputForm();
    }
    return(this.messageInputView);
  },
  switchState: function(state, params) {
    if (Werld.state === Werld.States.INIT) {
      if (state === Werld.States.SPLASH_SCREEN) {
        Werld.state = Werld.States.SPLASH_SCREEN;
      }
    } else if (Werld.state === Werld.States.SPLASH_SCREEN) {
      if (state === Werld.States.CHOOSING_NAME) {
        var characterNameInputForm = new Werld.Views.CharacterNameInputForm();
        characterNameInputForm.render();
        Werld.state = Werld.States.CHOOSING_NAME;
      }
    } else if (Werld.state === Werld.States.CHOOSING_NAME) {
      if (state === Werld.States.GAME_STARTED) {
        Werld.canvas.stage.removeAllChildren();

        Werld.character = new Werld.Models.Character(
          _.extend(Werld.Creatures.CHARACTER, {
            fixed: true,
            name: params.data.character.name,
            stats: {
              strength: 20,
              dexterity: 20,
              intelligence: 10
            },
            coordinates: _([
              Math.floor(Werld.Config.SCREEN_DIMENSIONS[0] / 2),
              Math.floor(Werld.Config.SCREEN_DIMENSIONS[1] / 2)
            ]).map(function(coordinate) {
              return(coordinate * Werld.Config.PIXELS_PER_TILE);
            })
          })
        );

        Werld.canvas.characterView = new Werld.Views.Character({
          model: Werld.character
        });

        Werld.altar = new Werld.Models.Altar(
          _.extend(Werld.Objects.ALTAR, {
            coordinates: _([7, 8]).map(function(coordinate) {
              return(coordinate * Werld.Config.PIXELS_PER_TILE);
            })
          })
        );

        Werld.canvas.altarView = new Werld.Views.Altar({
          model: Werld.altar
        });

        Werld.canvas.statusBarView = new Werld.Views.StatusBar({
          model: Werld.character
        });

        var silverBatSpawner = new Werld.Models.CreatureSpawner({
          creature: Werld.Creatures.SILVER_BAT,
          coordinates: [4, 4],
          radius: 3,
          numberOfCreatures: 3
        });

        Werld.creatureSpawners = new Werld.Collections.CreatureSpawners([
          silverBatSpawner
        ]);

        var mapTiles = [];
        for (var i = 0; i < Werld.Config.WORLD_MAP_DIMENSIONS[0]; i++) {
          mapTiles[i] = [];
          for (var j = 0; j < Werld.Config.WORLD_MAP_DIMENSIONS[1]; j++) {
            mapTiles[i][j] = new Werld.Models.Tile({
              type: (Math.random() > 0.75 ? 'dirt' : 'grass'), coordinates: [i, j]
            });
          }
        }

        Werld.map = new Werld.Models.Map({ tiles: mapTiles });

        Werld.screen = new Werld.Models.Screen({
          map: Werld.map,
          character: Werld.character,
          dimensions: Werld.Config.SCREEN_DIMENSIONS,
          coordinates: [0, 0]
        });

        Werld.canvas.screenView = new Werld.Views.Screen({
          model: Werld.screen
        });

        window.addEventListener(
          'keydown', _.bind(Werld.canvas.keyboardHandler, Werld.canvas), false
        );

        Werld.canvas.stage.addChild(Werld.canvas.screenView.container);
        Werld.canvas.stage.addChild(Werld.canvas.characterView.container);
        Werld.canvas.stage.addChild(Werld.canvas.altarView.container);
        Werld.canvas.stage.addChild(Werld.canvas.statusBarView.container);
        _(Werld.creatureSpawners.models).each(function(creatureSpawner) {
          creatureSpawner.get('creatures').each(function(creature) {
            var creatureView = new Werld.Views.Creature({
              model: creature
            });

            Werld.canvas.stage.addChild(creatureView.container);
          });
        });

        Werld.state = Werld.States.GAME_STARTED;
      }
    } else {
      if (state === Werld.States.INIT) {
        Werld.state = Werld.States.INIT;
      }
    }
    params && params.callback && params.callback();
  },
  init: function() {
    $(window).contextmenu(function() {
      return(false);
    });

    this.switchState(Werld.States.INIT);
    this.loadSounds();
    this.canvas.init();
  }
};

$(function() {
  Werld.init();
});

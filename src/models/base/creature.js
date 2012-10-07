Werld.Models.Base.Creature = Backbone.Model.extend({
  defaults: function() {
    var defaultSkills = _(Werld.SKILLS).reduce(function(memo, value, key) {
      memo[value.NAME] = 0;
      return(memo);
    }, {});

    return(_({
      lastHitAttemptedAt: Number.NEGATIVE_INFINITY,
      hitPointRenegerationRate: Werld.Config.REGENERATION_RATE,
      manaRenegerationRate: Werld.Config.REGENERATION_RATE,
      staminaRenegerationRate: Werld.Config.REGENERATION_RATE
    }).extend(defaultSkills));
  },
  initialize: function() {
    this.items = (this.get('items') || new Werld.Collections.Items());

    if (!this.has('threateners')) {
      this.set('threateners', new Werld.Collections.Threateners(null, {
        sortBy: this.threatenersSortBy
      }));
    }

    this.set({
      hitPoints: this.get('strength'),
      mana: this.get('intelligence'),
      stamina: this.get('dexterity'),
      destination: _.clone(this.get('coordinates')),
      tile: Werld.Utils.Geometry.pixelPointToTilePoint(this.get('coordinates')),
      messages: [],
      path: []
    });

    this.lootContainer = new Werld.Models.LootContainer(_({
      owner: this
    }).extend(Werld.GUMPS.LOOT_CONTAINER));

    this.installIntervalFunctions();

    this.updateTileCreatures(this, this.get('coordinates'));

    this.on('change:path', this.setDestinationWithThePathsHead);
    this.on(
      'change:coordinates change:destination',
      this.setPathToItsTailIfOnIntermediateDestination
    );
    this.on(
      'change:coordinates change:destination',
      this.setIsMovingToTrueIfNotOnDestination
    );
    this.on('change:coordinates', this.updateTileCreatures);
    this.on('change:coordinates', this.updateTile);
    this.on('change:path', this.setIsMovingToFalseIfOnDestinationAndNoPath);
    this.on('change:destination', this.onDestinationChange);
    this.on('change:hitPoints', this.resurrectIfHitPointsGreaterThanZero);
    this.on('change:hitPoints', this.dieIfHitPointsLowerThanZero);
    this.on('resurrection', this.installLifeIntervalFunctions);
    this.on('death', this.uninstallLifeIntervalFunctions);
    this.on('destroy', this.uninstallIntervalFunctions);
  },
  isSteppingOnTile: function(tile) {
    var creatureTilePoint =
      Werld.Utils.Geometry.pixelPointToTilePoint(this.get('coordinates'));
    var tileTilePoint =
      Werld.Utils.Geometry.pixelPointToTilePoint(tile.get('coordinates'));

    return(_(creatureTilePoint).isEqual(tileTilePoint));
  },
  updateTileCreatures: function(creature, value, options) {
    if (!Werld.map) { return; }

    var tile = Werld.map.getTileByCoordinatePoint(this.get('coordinates'));

    if (!tile) { return; }

    tile.get('creatures').add(this);
  },
  updateTile: function(creature, value, options) {
    var tile =
      Werld.Utils.Geometry.pixelPointToTilePoint(this.get('coordinates'));

    this.set('tile', tile);
  },
  maxHitPoints: function() {
    return(this.get('strength'));
  },
  maxMana: function() {
    return(this.get('intelligence'));
  },
  maxStamina: function() {
    return(this.get('dexterity'));
  },
  threatenersSortBy: function(creature) {
    return(creature.tileDistance(this));
  },
  intervalFunctionNamesWithIntervals: function() {
    return({
      messageSweeper: Werld.Config.MESSAGE_SWEEPER_POLLING_INTERVAL
    });
  },
  lifeIntervalFunctionNamesWithIntervals: function() {
    return({
      hitPointRegenerator: this.get('hitPointRenegerationRate'),
      manaRegenerator: this.get('manaRenegerationRate'),
      staminaRegenerator: this.get('staminaRenegerationRate'),
      battleHandler: Werld.Config.MAXIMUM_ATTACK_SPEED * 1000
    });
  },
  say: function(message) {
    var messages = _.clone(this.get('messages'));

    messages.unshift({
      type: 'speech', content: message, created_at: Date.now()
    });

    this.set('messages', messages);
  },
  tileCoordinates: function() {
    return(Werld.Utils.Geometry.pixelPointToTilePoint(this.get('coordinates')));
  },
  isMoving: function() {
    return(this.get('isMoving'));
  },
  setPathToItsTailIfOnIntermediateDestination: function(creature, value, options) {
    if (_(this.get('coordinates')).isEqual(this.get('destination'))) {
      this.set('path', _.tail(this.get('path')));
    }
  },
  setIsMovingToTrueIfNotOnDestination: function(creature, value, options) {
    if (!_(this.get('coordinates')).isEqual(this.get('destination'))) {
      this.set('isMoving', true);
    }
  },
  setIsMovingToFalseIfOnDestinationAndNoPath: function(creature, value, options) {
    if (_(this.get('coordinates')).isEqual(this.get('destination'))) {
      if (_.isEmpty(this.get('path'))) {
        this.set('isMoving', false);
      }
    }
  },
  onDestinationChange: function(creature, value, options) {
    if (this.has('attackee')) {
      if (this.tileDistance(this.get('attackee')) > this.get('attackee').get('aggressivenessRadius')) {
        this.stopAttacking(this.get('attackee'));
      }
    }

    if (Werld.Utils.Interval.isInstalled('movementHandler', this)) {
      Werld.Utils.Interval.uninstall('movementHandler', this);
    }

    Werld.Utils.Interval.install({ movementHandler: Werld.frameRate() }, this);
  },
  onFolloweeCoordinatesChange: function(followee, coordinates, options) {
    this.moveToCreature(this.get('followee'));
  },
  movementHandler: function() {
    var coordinates = _.clone(this.get('coordinates'));

    if (this.get('coordinates')[0] > this.get('destination')[0]) {
      coordinates[0] -= this.get('MOVEMENT_SPEED');
    } else if (this.get('coordinates')[0] < this.get('destination')[0]) {
      coordinates[0] += this.get('MOVEMENT_SPEED');
    }

    if (this.get('coordinates')[1] > this.get('destination')[1]) {
      coordinates[1] -= this.get('MOVEMENT_SPEED');
    } else if (this.get('coordinates')[1] < this.get('destination')[1]) {
      coordinates[1] += this.get('MOVEMENT_SPEED');
    }

    this.set('coordinates', coordinates);
  },
  setDestinationWithThePathsHead: function(creature, value, options) {
    if (_.isEmpty(this.get('path'))) { return; }

    this.set('destination', _(Werld.Utils.Geometry.tilePointToPixelPoint([
      _.head(this.get('path')).x,
      _.head(this.get('path')).y
    ])).map(function(pixels) {
      return(pixels + Werld.Config.PIXELS_PER_TILE / 2);
    }));
  },
  follow: function(creature) {
    this.set('followee', creature);
    this.moveToCreature(creature);
    creature.on('change:coordinates', this.onFolloweeCoordinatesChange, this);
  },
  pathfind: function(thing) {
    var self = this;

    this._pathfind || (this._pathfind = _.throttle(function(thing) {
      var path = Werld.path.search(self, thing);
      Werld.path.highlight(path, { duration: 1000 });
      self.set('path', path);
    }, 100));

    this._pathfind(thing);
  },
  moveToTilePoint: function(tilePoint, options) {
    if (options && options.stopFollowing) {
      if (this.has('followee')) {
        this.stopFollowing(this.get('followee'));
      }
    }

    this.pathfind(tilePoint);
  },
  moveToCoordinatePoint: function(coordinatePoint, options) {
    this.moveToTilePoint(
      Werld.Utils.Geometry.pixelPointToTilePoint(coordinatePoint), options
    );
  },
  moveToCreature: function(creature, options) {
    if (this.tileDistance(creature) <= 1) { return; }

    var creatureNearestWalkableAdjacentTileCoordinatePoint =
      this.nearestWalkableAdjacentTileCoordinatePoint(creature);

    if (!creatureNearestWalkableAdjacentTileCoordinatePoint) { return; }

    this.moveToCoordinatePoint(
      creatureNearestWalkableAdjacentTileCoordinatePoint, options
    );
  },
  states: {
    attacking: 'attacking',
    beingAttacked: 'beingAttacked',
    following: 'following',
    idle: 'idle'
  },
  state: function() {
    if (this.has('attackee')) {
      return(this.states.attacking);
    } else if (this.has('attacker')) {
      return(this.states.beingAttacked);
    } else if (this.has('followee')) {
      return(this.states.following);
    } else {
      return(this.states.idle);
    }
  },
  isFollowing: function(creature) {
    return(this.get('followee') === creature);
  },
  stopFollowing: function(creature) {
    this.unset('followee');
    creature.off('change:coordinates', this.onFolloweeCoordinatesChange, this);
  },
  attackSpeed: function() {
    var baseAttackSpeed = this.has('weapon') ?
                            this.get('weapon').get('speed') :
                            this.get('baseAttackSpeed');

    return(_.max([
      Math.floor(baseAttackSpeed - (this.get('stamina') / 30)),
      Werld.Config.MAXIMUM_ATTACK_SPEED
    ]) * 1000);
  },
  attacking: function(creature) {
    return(this.get('attackee') === creature);
  },
  attack: function(creature) {
    this.follow(creature);
    this.set('attackee', creature);
    creature.acknowledgeAttack(this);
  },
  battleHandler: function() {
    if (!this.has('attackee')) {
      return;
    }

    if (this.get('attackee').alive()) {
      if (this.tileDistance(this.get('attackee')) <= 1) {
        if ((Date.now() - this.get('lastHitAttemptedAt')) >= this.attackSpeed()) {
          this.attemptHit(this.get('attackee'));
        }
      }
    } else {
      this.stopAttacking(this.get('attackee'));
    }
  },
  acknowledgeAttack: function(attacker) {
    this.set('attacker', attacker);
  },
  stopMoving: function() {
    this.set('destination', this.get('coordinates'));
  },
  stopAttacking: function(creature) {
    this.unset('attackee');
    this.stopFollowing(creature);
    creature.acknowledgeAttackStop(this);
  },
  acknowledgeAttackStop: function(attacker) {
    this.unset('attacker');
  },
  currentCombatSkillName: function() {
    return(this.has('weapon') ?
             this.get('weapon').get('skill') :
             Werld.SKILLS.WRESTLING.NAME);
  },
  hitChance: function(creature) {
    var x = this.get('dexterity');
    var y = creature.get('dexterity');
    var z = this.get(this.currentCombatSkillName());
    var w = creature.get(creature.currentCombatSkillName());

    return(_.min([
      100 * (z + x / 5) / ((w + y / 5) * 2),
      Werld.Config.MAXIMUM_HIT_CHANCE_PERCENTAGE
    ]));
  },
  equip: function(item) {
    if (!item.get('equipable')) { return(false); }

    if (this.has(item.get('type'))) {
      return(false);
    } else {
      this.set(item.get('type'), item);
      return(true);
    }
  },
  unequip: function(item) {
    if (!item.get('equipable')) { return(false); }

    if (this.get(item.get('type')) === item) {
      this.unset(item.get('type'));
    }
  },
  damageRange: function() {
    var damageBonusPercentage = 0.35 * this.get('strength') +
                                  0.15 * this.get('dexterity') +
                                  0.6 * this.get(this.currentCombatSkillName());

    var normalizedDamageBonusPercentage =
      _.min([damageBonusPercentage, Werld.Config.MAXIMUM_DAMAGE_BONUS_PERCENTAGE]);

    var baseDamageRange = this.has('weapon') ?
                            this.get('weapon').get('baseDamageRange') :
                            this.get('baseDamageRange');

    return(_(baseDamageRange).map(function(baseDamage) {
      return(Math.floor(baseDamage * (1 + normalizedDamageBonusPercentage / 100)));
    }));
  },
  blow: function() {
    var boundaries = this.get('BOUNDARIES');
    var criticalHitChance = (this.get('dexterity') *
                               boundaries.MAX_CRITICAL_HIT_CHANCE /
                               boundaries.MAX_DEXTERITY) / 100;
    var critical = Math.random() < criticalHitChance;
    var damage = Werld.Utils.Math.randomIntegerBetween(this.damageRange());

    return({ damage: critical ? damage * 2 : damage, critical: critical });
  },
  attemptHit: function(creature) {
    this.set('lastHitAttemptedAt', Date.now());
    this.trigger('hitAttempted', this, creature);

    if (this.hitChance(creature) / 100 > Math.random()) {
      this.hit(creature);
    } else {
      this.miss(creature);
    }
  },
  hit: function(creature) {
    var blow = this.blow();

    creature.receiveHit(this, blow.damage);
    this.trigger('hitDelivered', this, creature, blow.damage);

    if (blow.critical) {
      this.trigger('hitDelivered:critical', this, creature, blow.damage);
    }
  },
  miss: function(creature) {
    this.trigger('hitMissed', this, creature);
  },
  receiveHit: function(creature, damage) {
    this.trigger('hitReceived', this, creature, damage);
    this.decrease('hitPoints', damage);
  },
  alive: function() {
    return(this.get('hitPoints') > 0);
  },
  dead: function() {
    return(!this.alive());
  },
  die: function() {
    if (this.has('attackee')) {
      this.stopAttacking(this.get('attackee'));
    }

    this.set({
      hitPoints: 0,
      mana: 0,
      stamina: 0,
      messages: []
    });

    this.trigger('death', this);
  },
  resurrect: function() {
    var object = {};
    var creature = this;

    _(['hitPoints', 'mana', 'stamina']).each(function(attributeName) {
      if (creature.get(attributeName) <= 0) {
        object[attributeName] = 1;
      }
    });

    this.set(object);
    this.trigger('resurrection', this);
  },
  installLifeIntervalFunctions: function(creature) {
    Werld.Utils.Interval.install(
      this.lifeIntervalFunctionNamesWithIntervals(), this
    );
  },
  uninstallLifeIntervalFunctions: function(creature) {
    Werld.Utils.Interval.uninstall(
      _.keys(this.lifeIntervalFunctionNamesWithIntervals()), this
    );
  },
  coordinates: function() {
    return(this.get('coordinates'));
  },
  pixelDistance: function(thing) {
    if (!this.coordinates || !thing.coordinates) {
      throw new Error('Both objects must implement a "coordinates" function');
    }

    return(Werld.Utils.Geometry.pixelDistance(this.coordinates(), thing.coordinates()));
  },
  tileDistance: function(thing) {
    return(Werld.Utils.Geometry.pixelsToTiles(this.pixelDistance(thing)));
  },
  resurrectIfHitPointsGreaterThanZero: function(creature, hitPoints, options) {
    if (this.previous('hitPoints') <= 0 && this.get('hitPoints') > 0) {
      this.resurrect();
    }
  },
  dieIfHitPointsLowerThanZero: function(creature, hitPoints, options) {
    if (this.previous('hitPoints') > 0 && this.get('hitPoints') <= 0) {
      this.die();
    }
  },
  normalizedSet: function(attributeName, value, options) {
    options || (options = {});

    var object = {};

    if (_.isNumber(options.min) && value < options.min) {
      object[attributeName] = options.min;
    } else if (_.isNumber(options.max) && value > options.max) {
      object[attributeName] = options.max;
    } else {
      object[attributeName] = Werld.Utils.Math.toDecimal(value, 1);
    }

    this.set(object);
  },
  decrease: function(attributeName, quantity) {
    this.normalizedSet(attributeName, this.get(attributeName) - quantity, {
      min: 0
    });
  },
  increase: function(attributeName, quantity) {
    this.normalizedSet(attributeName, this.get(attributeName) + quantity, {
      max: this['max' + _.capitalize(attributeName)]()
    });
  },
  hitPointRegenerator: function() {
    var hitPointsPerSecondRegeneration = this.get('strength') / 100;
    this.increase('hitPoints', hitPointsPerSecondRegeneration);
  },
  manaRegenerator: function() {
    var manaPerSecondRegeneration = this.get('intelligence') / 100;
    this.increase('mana', manaPerSecondRegeneration);
  },
  staminaRegenerator: function() {
    var staminaPerSecondRegeneration = this.get('dexterity') / 100;
    this.increase('stamina', staminaPerSecondRegeneration);
  },
  messageSweeper: function() {
    var messages = _.clone(this.get('messages'));
    var lastMessage = messages[messages.length - 1];

    if (lastMessage) {
      if ((Date.now() - lastMessage.created_at) > Werld.Config.MESSAGE_LIFE_CYCLE) {
        messages.pop();
        this.set('messages', messages);
      }
    }
  },
  destroy: function() {
    this.trigger('destroy', this);
  },
  getItem: function(item) {
    var creatureItem = this.items.find(function(collectionItem) {
      return(collectionItem.stackable() && collectionItem.same(item));
    });

    if (creatureItem) {
      creatureItem.merge(item);
      item.destroy();
      return(false);
    } else {
      this.items.add(item);
      return(true);
    }
  },
  adjacentTilePoints: function() {
    var tilePoint =
      Werld.Utils.Geometry.pixelPointToTilePoint(this.get('coordinates'));

    return(_([
      [-1, -1], [-1, 0], [-1, 1],
      [0, -1], [0, 1],
      [1, -1], [1, 0], [1, 1]
    ]).reduce(function(memo, adjacentTileOffset) {
      return(memo.concat([[
        tilePoint[0] + adjacentTileOffset[0],
        tilePoint[1] + adjacentTileOffset[1]
      ]]));
    }, []));
  },
  adjacentTileCoordinatePoints: function() {
    return(
      _(this.adjacentTilePoints()).map(Werld.Utils.Geometry.tilePointToPixelPoint)
    );
  },
  walkableAdjacentTilePoints: function() {
    return(_(this.adjacentTilePoints()).filter(function(tilePoint) {
      var tile = Werld.map.getTileByTilePoint(tilePoint);

      return(tile.isCurrentlyWalkable());
    }));
  },
  walkableAdjacentTileCoordinatePoints: function() {
    return(
      _(this.walkableAdjacentTilePoints())
        .map(Werld.Utils.Geometry.tilePointToPixelPoint)
    );
  },
  nearestAdjacentTileCoordinatePoint: function(creature) {
    return(
      _.chain(creature.adjacentTileCoordinatePoints())
        .sortBy(_(function(coordinates) {
          return(Werld.Utils.Geometry.pixelDistance(
            this.get('coordinates'), coordinates
          ));
        }).bind(this)).value()[0]
    );
  },
  nearestWalkableAdjacentTileCoordinatePoint: function(creature) {
    return(
      _.chain(creature.walkableAdjacentTileCoordinatePoints())
        .sortBy(_(function(coordinates) {
          return(Werld.Utils.Geometry.pixelDistance(
            this.get('coordinates'), coordinates
          ));
        }).bind(this)).value()[0]
    );
  },
  installIntervalFunctions: function(creature) {
    Werld.Utils.Interval.install(_({}).extend(
      this.intervalFunctionNamesWithIntervals(),
      this.lifeIntervalFunctionNamesWithIntervals()
    ), this);
  },
  uninstallIntervalFunctions: function(creature) {
    Werld.Utils.Interval.uninstall(_({}).extend(
      _.keys(this.intervalFunctionNamesWithIntervals()),
      _.keys(this.lifeIntervalFunctionNamesWithIntervals())
    ), this);
  }
});

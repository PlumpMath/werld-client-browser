Werld.Views.Creature = Werld.Views.Base.Creature.extend({
  initialize: function() {
    Werld.Views.Creature.__super__.initialize.call(this);

    this.model.bind('change:status', this.onModelStatusChange);
    this.model.bind('change:hitPoints', this.updateHitPointsBar);

    this.hitPointsBarRectangleWidth = 50;
    this.hitPointsBarRectangle = new Rectangle(
      this.container.x -
        ((this.hitPointsBarRectangleWidth - Werld.Config.PIXELS_PER_TILE) / 2),
      -0.21 * Math.pow(this.model.get('SPRITE').DIMENSIONS[1], 5 / 4),
      this.hitPointsBarRectangleWidth,
      6
    );
    this.hitPointsBarGraphics = new Graphics();
    this.hitPointsBar = new Shape(this.hitPointsBarGraphics);
    this.hitPointsBar.alpha = 0.7;

    this.container.addChild(this.hitPointsBar);

    this.updateHitPointsBar(this.model);
  },
  characterNameTextTick: function() {
    Werld.Views.Character.__super__.characterNameTextTick.call(this);
    this.characterNameText.color = '#cccccc';
    this.characterNameText.font = '16px "PowellAntique" serif';
  },
  _characterNameText: function() {
    if (this.model.alive()) {
      return(this.model.get('name'));
    } else {
      return(this.model.get('name') + ' corpse');
    }
  },
  updateHitPointsBar: function(model) {
    var hitPointsPercentage =
      this.model.get('hitPoints') / this.model.get('maxHitPoints');
    this.hitPointsBarRectangle.width =
      hitPointsPercentage * this.hitPointsBarRectangleWidth;
    this.hitPointsBarGraphics.clear();

    if (this.hitPointsBarRectangle.width > 0) {
      this.hitPointsBarGraphics.
        beginFill('red').
        beginStroke('black').
        drawRoundRect(
          this.hitPointsBarRectangle.x,
          this.hitPointsBarRectangle.y,
          this.hitPointsBarRectangle.width,
          this.hitPointsBarRectangle.height,
          1
        ).
        endStroke().
        endFill();
    }
  },
  onModelStatusChange: function() {
    if (this.model.dead()) {
      if (this.model.tileDistance(Werld.character) <= 1) {
        this.showLoot();
      }
    }
  }
});

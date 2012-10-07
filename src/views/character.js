Werld.Views.Character = Werld.Views.Base.Creature.extend({
  initialize: function() {
    this.constructor.__super__.initialize.apply(this, arguments);

    this.nameText = new Werld.Text(_({
      TEXT: this.model.get('name')
    }).extend(Werld.TEXT.CHARACTER_NAME));

    this.nameText.y = - (this.spriteSheet._frameHeight -
                           0.2 * this.spriteSheet._regY +
                           this.nameText.getMeasuredLineHeight());

    this.container.addChild(this.nameText);
  },
  showHitReceivedMessage: function(attackee, attacker, damage) {
    var damageText = new Werld.Text(_({
      TEXT: Math.abs(damage)
    }).extend(Werld.TEXT.CHARACTER_HIT_RECEIVED));

    Werld.layers.battle.show(damageText, { above: this.model });
  }
});

Werld.Views.Altar = Backbone.View.extend({
  initialize: function() {
    this.container = new Container();
    var bitmap = new Bitmap(this.model.get('IMAGE').SRC);
    this.container.addChild(bitmap);
    this.container.tick = _.bind(this.tick, this);
  },
  tick: function() {
    var modelCoordinates = this.model.get('coordinates');
    var screenCoordinates = Werld.screen.get('coordinates');
    var objectScreenCoordinates = [
      modelCoordinates[0] - screenCoordinates[0],
      modelCoordinates[1] - screenCoordinates[1]
    ];
    this.container.x = objectScreenCoordinates[0];
    this.container.y = objectScreenCoordinates[1];
  }
});

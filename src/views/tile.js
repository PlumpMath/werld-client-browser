Werld.Views.Tile = Werld.Views.Base.Container.extend({
  initialize: function() {
    Werld.Views.Tile.__super__.initialize.call(this);

    _.bindAll(this)

    this.model.bind('change', this.onModelChange);

    this.bitmap =
      new Bitmap(Werld.canvas.textures.tiles[this.model.get('type')]);
    this.bitmap.onPress = this.onBitmapPress;
    this.container.addChild(this.bitmap);
  },
  onBitmapPress: function(event) {
    Werld.character.move(_(this.model.get('coordinates')).map(Werld.util.pixelToTile));
  },
  onModelChange: function(event) {
    this.container.x = this.model.get('onScreenCoordinates')[0];
    this.container.y = this.model.get('onScreenCoordinates')[1];
  },
  hide: function() {
    this.container.visible = false;
  },
  unhide: function() {
    this.container.visible = true;
  },
  handleItemDrop: function(item) {
    if (Werld.character.tileDistance(this.model) <= 2) {
      item.collection.remove(item);
      this.model.items.add(item);
      return(true);
    } else {
      return(false);
    }
  }
});

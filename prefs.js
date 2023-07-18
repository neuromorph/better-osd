const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;

const Gettext = imports.gettext.domain("custom-osd");
const _ = Gettext.gettext;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

//-----------------------------------------------

function init() {
  ExtensionUtils.initTranslations();
}

//-----------------------------------------------

const CustomOSDSettingsWidget = new GObject.registerClass(
  {
    GTypeName: "OSDPrefsWidget",
  },
  class CustomOSDSettingsWidget extends Gtk.Grid {
    _init(params) {
      super._init(params);
      this.margin = 30;
      this.spacing = 25;
      this.fill = true;
      this.orientation = Gtk.Orientation.VERTICAL;

      this._settings = ExtensionUtils.getSettings(
        "org.gnome.shell.extensions.custom-osd"
      );

      let rowNo = 1;

      this.title_label = new Gtk.Label({
        use_markup: true,
        label: '<span size="large" weight="heavy">'
      +_('Custom OSD')+'</span>',
        hexpand: true,
        halign: Gtk.Align.CENTER
      });
      this.attach(this.title_label, 1, rowNo, 2, 1);

      rowNo += 2
      this.version_label = new Gtk.Label({
        use_markup: true,
        label: '<span size="small">'+_('Version:')
      + ' ' + Me.metadata.version + '</span>',
        hexpand: true,
        halign: Gtk.Align.CENTER,
      });
      this.attach(this.version_label, 1, rowNo, 2, 1);

      rowNo += 1
      this.link_label = new Gtk.Label({
        use_markup: true,
        label: '<span size="small"><a href="'+Me.metadata.url+'">'
      + Me.metadata.url + '</a></span>',
        hexpand: true,
        halign: Gtk.Align.CENTER,
        margin_bottom: this.margin_bottom
      });
      this.attach(this.link_label, 1, rowNo, 2, 1);

      
      rowNo += 4
      this.insert_row(rowNo);
      let labelHorizontalPercentage = _("Horizontal Shift (%) :");

      this.horizontalPercentage = new Gtk.SpinButton({halign: Gtk.Align.END});
      this.horizontalPercentage.set_sensitive(true);
      this.horizontalPercentage.set_range(-60, 60);
      this.horizontalPercentage.set_value(0);
      this.horizontalPercentage.set_value(this._settings.get_int("horizontal"));
      this.horizontalPercentage.set_increments(1, 2);

      this.horizontalPercentage.connect(
        "value-changed",
        function (w) {
          var value = w.get_value_as_int();
          this._settings.set_int("horizontal", value);
        }.bind(this)
      );

      this.horizontalLabel = new Gtk.Label({
        label: labelHorizontalPercentage,
        use_markup: true,
        halign: Gtk.Align.START,
      });

      this.attach(this.horizontalLabel,   1, rowNo, 1, 1);
	    this.attach(this.horizontalPercentage, 2, rowNo, 1, 1);

      //-------------------------------------------------------

      rowNo += 2
      let labelVerticalPercentage = _("Vertical Shift (%) :");

      this.verticalPercentage = new Gtk.SpinButton({halign: Gtk.Align.END});
      this.verticalPercentage.set_sensitive(true);
      this.verticalPercentage.set_range(-110, 110);
      this.verticalPercentage.set_value(70);
      this.verticalPercentage.set_value(this._settings.get_int("vertical"));
      this.verticalPercentage.set_increments(1, 2);

      this.verticalPercentage.connect(
        "value-changed",
        function (w) {
          var value = w.get_value_as_int();
          this._settings.set_int("vertical", value);
        }.bind(this)
      );

      this.verticalLabel = new Gtk.Label({
        label: labelVerticalPercentage,
        use_markup: true,
        halign: Gtk.Align.START,
      });

      this.attach(this.verticalLabel,   1, rowNo, 1, 1);
	    this.attach(this.verticalPercentage, 2, rowNo, 1, 1);

      //-------------------------------------------------------

      rowNo += 2
      let labelSizePercentage = _("Size (%) :");

      this.sizePercentage = new Gtk.SpinButton({halign: Gtk.Align.END});
      this.sizePercentage.set_sensitive(true);
      this.sizePercentage.set_range(0, 100);
      this.sizePercentage.set_value(10);
      this.sizePercentage.set_value(this._settings.get_int("size"));
      this.sizePercentage.set_increments(1, 2);

      this.sizePercentage.connect(
        "value-changed",
        function (w) {
          var value = w.get_value_as_int();
          this._settings.set_int("size", value);
        }.bind(this)
      );

      this.sizeLabel = new Gtk.Label({
        label: labelSizePercentage,
        use_markup: true,
        halign: Gtk.Align.START,
      });

      this.attach(this.sizeLabel,   1, rowNo, 1, 1);
	    this.attach(this.sizePercentage, 2, rowNo, 1, 1);


      //-------------------------------------------------------

      rowNo += 2
      let labelDelay = _("Hide Delay (ms) :");

      this.hideDelay = new Gtk.SpinButton({halign: Gtk.Align.END});
      this.hideDelay.set_sensitive(true);
      this.hideDelay.set_range(0, 5000);
      this.hideDelay.set_value(1500);
      this.hideDelay.set_value(this._settings.get_int("delay"));
      this.hideDelay.set_increments(1, 2);

      this.hideDelay.connect(
        "value-changed",
        function (w) {
          var value = w.get_value_as_int();
          this._settings.set_int("delay", value);
        }.bind(this)
      );

      this.hideLabel = new Gtk.Label({
        label: labelDelay,
        use_markup: true,
        halign: Gtk.Align.START,
      });

      this.attach(this.hideLabel,   1, rowNo, 1, 1);
	    this.attach(this.hideDelay, 2, rowNo, 1, 1);

      //-------------------------------------------------------

      rowNo += 2
      let labelTransparency = _("Transparency:");

      this.switchTransparency = new Gtk.Switch({halign: Gtk.Align.END});
      this.switchTransparency.set_active(this._settings.get_boolean("transparency"));

      this.switchTransparency.connect(
        "state-set",
        function (w) {
          var value = w.get_active();
          this._settings.set_boolean("transparency", value);
        }.bind(this)
      );

      this.transpLabel = new Gtk.Label({
        label: labelTransparency,
        use_markup: true,
        halign: Gtk.Align.START,
      });

      this.attach(this.transpLabel,   1, rowNo, 1, 1);
	    this.attach(this.switchTransparency, 2, rowNo, 1, 1);


      rowNo += 3
      const noteImage = new Gtk.Picture({
        vexpand: true,
        hexpand: true,
        halign: Gtk.Align.FILL,
        valign: Gtk.Align.FILL
      });
      noteImage.set_filename(Me.path + "/media/customOSD_note.png");
      this.attach(noteImage, 1, rowNo, 2, 10);

    }
  }
);


function buildPrefsWidget() {
  return new CustomOSDSettingsWidget();
}


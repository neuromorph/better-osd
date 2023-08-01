const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Gdk = imports.gi.Gdk;

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
      this.margin_top = 12;
      this.margin_bottom = this.margin_top;
      this.margin_start = 25;
      this.margin_end = this.margin_start;
      this.row_spacing = 6;
      this.column_spacing = 20;
      this.orientation = Gtk.Orientation.VERTICAL;

      this._settings = ExtensionUtils.getSettings(
        "org.gnome.shell.extensions.custom-osd"
      );

      let rowNo = 1;

      this.title_label = new Gtk.Label({
        use_markup: true,
        label: `<span size="large" weight="heavy" color="#07D8E3">Custom OSD</span>`,
        hexpand: true,
        halign: Gtk.Align.CENTER
      });
      this.attach(this.title_label, 1, rowNo, 5, 1);

      rowNo += 2
      this.version_label = new Gtk.Label({
        use_markup: true,
        label: `<span size="small">${_('Version:')} ${Me.metadata.version}  |  © neuromorph</span>`,
        hexpand: true,
        halign: Gtk.Align.CENTER,
      });
      this.attach(this.version_label, 1, rowNo, 5, 1);

      rowNo += 1
      this.link_label = new Gtk.Label({
        use_markup: true,
        label: `<span size="small"><a href="${Me.metadata.url}">${Me.metadata.url}</a></span>`,
        hexpand: true,
        halign: Gtk.Align.CENTER,
        margin_bottom: this.margin_bottom*2
      });
      this.attach(this.link_label, 1, rowNo, 5, 1);

      //-------------------------------------------------------
      
      rowNo += 2
      this.separator = new Gtk.Separator({
        orientation: Gtk.Orientation.HORIZONTAL,
        hexpand: true,
        margin_bottom: this.margin_top/2,
      });
      this.attach(this.separator, 1, rowNo, 5, 1);

      //-------------------------------------------------------

      rowNo += 2;
    
      this.icon = new Gtk.CheckButton({label: "Icon", halign: Gtk.Align.CENTER});
      this.icon.set_active(this._settings.get_boolean("icon"));
      this.icon.connect(
        "toggled",
        function (w) {
          var value = w.get_active();
          this._settings.set_boolean("icon", value);
        }.bind(this)
      );
	    this.attach(this.icon, 1, rowNo, 1, 1);

      this.label = new Gtk.CheckButton({label: "Label", halign: Gtk.Align.CENTER});
      this.label.set_active(this._settings.get_boolean("label"));
      this.label.connect(
        "toggled",
        function (w) {
          var value = w.get_active();
          this._settings.set_boolean("label", value);
        }.bind(this)
      );
	    this.attach(this.label, 2, rowNo, 1, 1);

      this.level = new Gtk.CheckButton({label: "Level Bar", halign: Gtk.Align.CENTER});
      this.level.set_active(this._settings.get_boolean("level"));
      this.level.connect(
        "toggled",
        function (w) {
          var value = w.get_active();
          this._settings.set_boolean("level", value);
        }.bind(this)
      );
	    this.attach(this.level, 4, rowNo, 1, 1);

      this.numeric = new Gtk.CheckButton({label: "Numeric %", halign: Gtk.Align.START});
      this.numeric.set_active(this._settings.get_boolean("numeric"));
      this.numeric.connect(
        "toggled",
        function (w) {
          var value = w.get_active();
          this._settings.set_boolean("numeric", value);
        }.bind(this)
      );
	    this.attach(this.numeric, 5, rowNo, 1, 1);

      //-------------------------------------------------------

      rowNo += 2
      let rowTop = rowNo-1;

      this.separator = new Gtk.Separator({
        orientation: Gtk.Orientation.HORIZONTAL,
        hexpand: true,
        margin_bottom: this.margin_top/2,
      });
      this.attach(this.separator, 1, rowNo, 5, 1);

      //-------------------------------------------------------

      let rowReset = rowNo;
      rowNo += 2
      this.insert_row(rowNo);

      this.horizontalPercentage = new Gtk.SpinButton({halign: Gtk.Align.END});
      this.horizontalPercentage.set_sensitive(true);
      this.horizontalPercentage.set_range(-50.0, 50.0);
      this.horizontalPercentage.set_value(0.0);
      this.horizontalPercentage.set_digits(1);
      this.horizontalPercentage.width_chars = 4;
      this.horizontalPercentage.set_value(this._settings.get_double("horizontal"));
      this.horizontalPercentage.set_increments(0.2, 1);
      this.horizontalPercentage.set_tooltip_text("Left Edge: -50 ↞↠ +50 :Right Edge");

      this.horizontalPercentage.connect(
        "value-changed",
        function (w) {
          var value = w.get_value();
          this._settings.set_double("horizontal", value);
        }.bind(this)
      );

      this.horizontalLabel = new Gtk.Label({
        use_markup: true,
        label: `Horizontal Position (%) :`,
        hexpand: true,
        halign: Gtk.Align.START,
      });

      this.attach(this.horizontalLabel,   1, rowNo, 1, 1);
	    this.attach(this.horizontalPercentage, 2, rowNo, 1, 1);

      //-------------------------------------------------------

      rowNo += 2

      this.verticalPercentage = new Gtk.SpinButton({halign: Gtk.Align.END});
      this.verticalPercentage.set_sensitive(true);
      this.verticalPercentage.set_range(-50.0, 50.0);
      this.verticalPercentage.set_value(0.0);
      this.verticalPercentage.set_digits(1);
      this.verticalPercentage.width_chars = 4;
      this.verticalPercentage.set_value(this._settings.get_double("vertical"));
      this.verticalPercentage.set_increments(0.2, 1);
      this.verticalPercentage.set_tooltip_text("Top Edge: -50 ↞↠ +50 :Bottom Edge");

      this.verticalPercentage.connect(
        "value-changed",
        function (w) {
          var value = w.get_value();
          this._settings.set_double("vertical", value);
        }.bind(this)
      );

      this.verticalLabel = new Gtk.Label({
        use_markup: true,
        label: `Vertical Position (%) :`,
        hexpand: true,
        halign: Gtk.Align.START,
      });

      this.attach(this.verticalLabel,   1, rowNo, 1, 1);
	    this.attach(this.verticalPercentage, 2, rowNo, 1, 1);

      //-------------------------------------------------------

      rowNo += 2
      let labelSizePercentage = _("Size (%) :");

      this.sizePercentage = new Gtk.SpinButton({halign: Gtk.Align.END});
      this.sizePercentage.set_sensitive(true);
      this.sizePercentage.set_range(1, 100);
      this.sizePercentage.set_value(15);
      this.sizePercentage.width_chars = 4;
      this.sizePercentage.set_value(this._settings.get_int("size"));
      this.sizePercentage.set_increments(1, 5);

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
    
      this.rotate = new Gtk.Switch({halign: Gtk.Align.END});
      this.rotate.set_active(this._settings.get_boolean("rotate"));

      this.rotate.connect(
        "state-set",
        function (w) {
          var value = w.get_active();
          this._settings.set_boolean("rotate", value);
        }.bind(this)
      );

      this.rotateLabel = new Gtk.Label({
        label: "Vertical Orientation :",
        use_markup: true,
        halign: Gtk.Align.START,
      });

      this.attach(this.rotateLabel, 1, rowNo, 1, 1);
	    this.attach(this.rotate, 2, rowNo, 1, 1);


      //-------------------------------------------------------

      rowNo += 2

      this.hideDelay = new Gtk.SpinButton({halign: Gtk.Align.END});
      this.hideDelay.set_sensitive(true);
      this.hideDelay.set_range(0, 5000);
      this.hideDelay.set_value(1000);
      this.hideDelay.width_chars = 4;
      this.hideDelay.set_value(this._settings.get_int("delay"));
      this.hideDelay.set_increments(10, 50);

      this.hideDelay.connect(
        "value-changed",
        function (w) {
          var value = w.get_value_as_int();
          this._settings.set_int("delay", value);
        }.bind(this)
      );

      this.delayLabel = new Gtk.Label({
        label: "Hide Delay (ms) :",
        use_markup: true,
        halign: Gtk.Align.START,
      });

      this.attach(this.delayLabel,   1, rowNo, 1, 1);
	    this.attach(this.hideDelay, 2, rowNo, 1, 1);
      
      //-------------------------------------------------------

      rowNo += 2

      this.monitors = new Gtk.ComboBoxText({halign: Gtk.Align.END});
      this.monitors.set_tooltip_text("Choose monitor to show OSD on");
      this.monitors.append("all", _("All"));
      this.monitors.append("primary", _("Primary"));
      this.monitors.append("external", _("External"));
      this.monitors.set_active_id(this._settings.get_string("monitors"));

      this.monitors.connect(
        "changed",
        function (w) {
          var value = w.get_active_id();
          this._settings.set_string("monitors", value);
        }.bind(this)
      );

      this.monitorsLabel = new Gtk.Label({
        label: "Monitor(s) :",
        use_markup: true,
        halign: Gtk.Align.START,
      });

      this.attach(this.monitorsLabel,   1, rowNo, 1, 1);
      this.attach(this.monitors, 2, rowNo, 1, 1);

      //-------------------------------------------------------

      rowNo = rowReset;
      rowNo += 2
      let labelColor = _("Color :");

      this.colorBtn = new Gtk.ColorButton({halign: Gtk.Align.END});
      let colorArray = this._settings.get_strv('color');
  		let rgba = new Gdk.RGBA();
      rgba.red = parseFloat(colorArray[0]);
      rgba.green = parseFloat(colorArray[1]);
      rgba.blue = parseFloat(colorArray[2]);
      rgba.alpha = 1.0;
      this.colorBtn.set_rgba(rgba);

      this.colorBtn.connect('color-set', (widget) => {
        rgba = widget.get_rgba();
        this._settings.set_strv('color', [
          rgba.red.toString(),
          rgba.green.toString(),
          rgba.blue.toString()
        ]);
      });

      this.colorLabel = new Gtk.Label({
        label: labelColor,
        use_markup: true,
        halign: Gtk.Align.START,
      });

      this.attach(this.colorLabel, 4, rowNo, 1, 1);
      this.attach(this.colorBtn, 5, rowNo, 1, 1);

      //-------------------------------------------------------

      rowNo += 2

      this.bgcolorBtn = new Gtk.ColorButton({halign: Gtk.Align.END});
      let bgcolorArray = this._settings.get_strv('bgcolor');
  		let bgrgba = new Gdk.RGBA();
      bgrgba.red = parseFloat(bgcolorArray[0]);
      bgrgba.green = parseFloat(bgcolorArray[1]);
      bgrgba.blue = parseFloat(bgcolorArray[2]);
      bgrgba.alpha = 1.0;
      this.bgcolorBtn.set_rgba(bgrgba);

      this.bgcolorBtn.connect('color-set', (widget) => {
        bgrgba = widget.get_rgba();
        this._settings.set_strv('bgcolor', [
          bgrgba.red.toString(),
          bgrgba.green.toString(),
          bgrgba.blue.toString()
        ]);
      });

      this.bgcolorLabel = new Gtk.Label({
        label: "Background Color :",
        use_markup: true,
        halign: Gtk.Align.START,
      });

      this.attach(this.bgcolorLabel, 4, rowNo, 1, 1);
      this.attach(this.bgcolorBtn, 5, rowNo, 1, 1);

      //-------------------------------------------------------

      rowNo += 2
      let labelAlpha = _("Transparency (Opacity %) :");

      this.alpha = new Gtk.SpinButton({halign: Gtk.Align.END});
      this.alpha.set_sensitive(true);
      this.alpha.set_range(0, 100);
      this.alpha.set_value(75);
      this.alpha.width_chars = 4;
      this.alpha.set_value(this._settings.get_int("alpha"));
      this.alpha.set_increments(5, 10);
      this.alpha.set_tooltip_text("Transparent: 0 ↞↠ 100 :Opaque");

      this.alpha.connect(
        "value-changed",
        function (w) {
          var value = w.get_value_as_int();
          this._settings.set_int("alpha", value);
        }.bind(this)
      );

      this.alphaLabel = new Gtk.Label({
        label: labelAlpha,
        use_markup: true,
        halign: Gtk.Align.START,
      });

      this.attach(this.alphaLabel, 4, rowNo, 1, 1);
	    this.attach(this.alpha, 5, rowNo, 1, 1);

      //-------------------------------------------------------

      rowNo += 2
      let labelShadow = _("Box Shadow :");

      this.shadow = new Gtk.Switch({halign: Gtk.Align.END});
      this.shadow.set_active(this._settings.get_boolean("shadow"));
      this.shadow.set_tooltip_text("Turn Off for flat look");

      this.shadow.connect(
        "state-set",
        function (w) {
          var value = w.get_active();
          this._settings.set_boolean("shadow", value);
        }.bind(this)
      );

      this.shadowLabel = new Gtk.Label({
        label: labelShadow,
        use_markup: true,
        halign: Gtk.Align.START,
      });

      this.attach(this.shadowLabel, 4, rowNo, 1, 1);
	    this.attach(this.shadow, 5, rowNo, 1, 1);

      //-------------------------------------------------------

      rowNo += 2

      this.border = new Gtk.Switch({halign: Gtk.Align.END, valign: Gtk.Align.CENTER});
      this.border.set_active(this._settings.get_boolean("border"));

      this.border.connect(
        "state-set",
        function (w) {
          var value = w.get_active();
          this._settings.set_boolean("border", value);
        }.bind(this)
      );

      this.borderLabel = new Gtk.Label({
        label: "Box Border :",
        use_markup: true,
        halign: Gtk.Align.START,
      });

      this.attach(this.borderLabel, 4, rowNo, 1, 1);
	    this.attach(this.border, 5, rowNo, 1, 1);

      //-------------------------------------------------------

      rowNo += 2

      this.bradius = new Gtk.SpinButton({halign: Gtk.Align.END});
      this.bradius.set_sensitive(true);
      this.bradius.set_range(0, 100);
      this.bradius.set_value(75);
      this.bradius.width_chars = 4;
      this.bradius.set_value(this._settings.get_int("bradius"));
      this.bradius.set_increments(5, 10);
      this.bradius.set_tooltip_text("Rectangle: 0 ↞↠ 100 :Pill");

      this.bradius.connect(
        "value-changed",
        function (w) {
          var value = w.get_value_as_int();
          this._settings.set_int("bradius", value);
        }.bind(this)
      );
      this.bradiusLabel = new Gtk.Label({
        use_markup: true,
        label: `Pill Shape (%) :`,
        hexpand: true,
        halign: Gtk.Align.START,
      });

      this.attach(this.bradiusLabel, 4, rowNo, 1, 1);
	    this.attach(this.bradius, 5, rowNo, 1, 1);


      //-------------------------------------------------------

      rowNo += 2
      this.separator = new Gtk.Separator({
        orientation: Gtk.Orientation.HORIZONTAL,
        hexpand: true,
        margin_top: this.margin_top/2,
        margin_bottom: this.margin_top/2,
      });
      this.attach(this.separator, 1, rowNo, 5, 1);

      //-------------------------------------------------------

      
      this.separatorV = new Gtk.Separator({
        orientation: Gtk.Orientation.VERTICAL,
        margin_top: this.margin_top*2,
        margin_bottom: this.margin_top*2,
      });
      this.attach(this.separatorV, 3, rowTop, 1, 16);

      //-------------------------------------------------------


      rowNo+=3
      this.noteImage = new Gtk.Picture({
        vexpand: true,
        hexpand: true,
        halign: Gtk.Align.FILL,
        valign: Gtk.Align.START,
        margin_top: this.margin_top,
      });
      this.noteImage.set_filename(Me.path + "/media/Position.png");
      this.attach(this.noteImage, 1, rowNo, 1, 5);


      this.noteLabel = new Gtk.Label({
        label: `<span size="small" underline="none">
        • Type/edit the values and hit tab/enter key to update. 
        • OR simply click the - + buttons or PgUp / PgDn keyboard keys.
        • Position is (0,0) at screen-center. Range is -50 to +50. See pic.

        
                    Visit for more details: <a href="${Me.metadata.url}"><b>Custom OSD</b></a></span>`,
        use_markup: true,
        halign: Gtk.Align.START,
        width_chars: 35,
      });

      this.attach(this.noteLabel, 2, rowNo, 4, 1);

      //-------------------------------------------------------

    }
  }
);


function buildPrefsWidget() {

  let prefWidget =  new CustomOSDSettingsWidget();
  prefWidget.connect("realize", ()=>{
    const window = prefWidget.get_root();
    window.set_title(_("Custom OSD (On-Screen-Display)"));
    window.default_height = 725;
    window.default_width = 675;
  });

  return prefWidget;
}


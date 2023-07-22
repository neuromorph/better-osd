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
      this.margin_top = 15;
      this.margin_bottom = this.margin_top;
      this.margin_start = 48;
      this.margin_end = this.margin_start;
      this.row_spacing = 6;
      this.column_spacing = this.row_spacing;
      this.orientation = Gtk.Orientation.VERTICAL;

      this._settings = ExtensionUtils.getSettings(
        "org.gnome.shell.extensions.custom-osd"
      );

      let rowNo = 1;

      this.title_label = new Gtk.Label({
        use_markup: true,
        label: `<span size="large" weight="heavy" color="#08D8D8">Custom OSD</span>`,
        hexpand: true,
        halign: Gtk.Align.CENTER
      });
      this.attach(this.title_label, 1, rowNo, 2, 1);

      rowNo += 2
      this.version_label = new Gtk.Label({
        use_markup: true,
        label: `<span size="small">${_('Version:')} ${Me.metadata.version}  |  © neuromorph</span>`,
        hexpand: true,
        halign: Gtk.Align.CENTER,
      });
      this.attach(this.version_label, 1, rowNo, 2, 1);

      rowNo += 1
      this.link_label = new Gtk.Label({
        use_markup: true,
        label: `<span size="small"><a href="${Me.metadata.url}">${Me.metadata.url}</a></span>`,
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
      this.horizontalPercentage.set_range(-150, 150);
      this.horizontalPercentage.set_value(0);
      this.horizontalPercentage.width_chars = 4;
      this.horizontalPercentage.set_value(this._settings.get_int("horizontal"));
      this.horizontalPercentage.set_increments(1, 5);

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
      this.verticalPercentage.set_range(-200, 50);
      this.verticalPercentage.set_value(70);
      this.verticalPercentage.width_chars = 4;
      this.verticalPercentage.set_value(this._settings.get_int("vertical"));
      this.verticalPercentage.set_increments(1, 5);

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
      let labelDelay = _("Hide Delay (ms) :");

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

      this.hideLabel = new Gtk.Label({
        label: labelDelay,
        use_markup: true,
        halign: Gtk.Align.START,
      });

      this.attach(this.hideLabel,   1, rowNo, 1, 1);
	    this.attach(this.hideDelay, 2, rowNo, 1, 1);

      //-------------------------------------------------------

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


      this.attach(this.colorLabel, 1, rowNo, 1, 1);
      this.attach(this.colorBtn, 2, rowNo, 1, 1);

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


      this.attach(this.bgcolorLabel, 1, rowNo, 1, 1);
      this.attach(this.bgcolorBtn, 2, rowNo, 1, 1);

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

      this.attach(this.alphaLabel, 1, rowNo, 1, 1);
	    this.attach(this.alpha, 2, rowNo, 1, 1);

      //-------------------------------------------------------

      rowNo += 2
      let labelShadow = _("Box Shadow :");

      this.shadow = new Gtk.Switch({halign: Gtk.Align.END});
      this.shadow.set_active(this._settings.get_boolean("shadow"));

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

      this.attach(this.shadowLabel, 1, rowNo, 1, 1);
	    this.attach(this.shadow, 2, rowNo, 1, 1);

      //-------------------------------------------------------

      rowNo += 2

      this.border = new Gtk.Switch({halign: Gtk.Align.END});
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

      this.attach(this.borderLabel, 1, rowNo, 1, 1);
	    this.attach(this.border, 2, rowNo, 1, 1);

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
    
      this.level = new Gtk.Switch({halign: Gtk.Align.END});
      this.level.set_active(this._settings.get_boolean("label"));

      this.level.connect(
        "state-set",
        function (w) {
          var value = w.get_active();
          this._settings.set_boolean("label", value);
        }.bind(this)
      );

      this.levelLabel = new Gtk.Label({
        label: "Numeric Level (%):",
        use_markup: true,
        halign: Gtk.Align.START,
      });

      this.attach(this.levelLabel, 1, rowNo, 1, 1);
	    this.attach(this.level, 2, rowNo, 1, 1);

      //-------------------------------------------------------

      rowNo += 2

      this.monitors = new Gtk.ComboBoxText({halign: Gtk.Align.END});
      this.monitors.set_tooltip_text("Choose monitor to show OSD on.");
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

      rowNo+=2
      this.noteLabel = new Gtk.Label({
        label: `<span allow_breaks="true" size="small" underline="none"><b>Note:</b>
        • Type/edit the values and hit tab key to update. 
        • OR simply click the - + buttons.
        • PgUp/PgDn keyboard keys will move values faster.
        • Visit  <a href="${Me.metadata.url}">Custom OSD</a>  page for more options. </span>`,
        use_markup: true,
        hexpand: true,
        halign: Gtk.Align.START,
        wrap: true,
        width_chars: 40,
        margin_top: 20,
      });

      this.attach(this.noteLabel, 1, rowNo, 2, 10);

    }
  }
);


function buildPrefsWidget() {
  let prefWidget =  new CustomOSDSettingsWidget();
  prefWidget.connect("realize", ()=>{
    const window = prefWidget.get_root();
    window.set_title(_("Custom On-Screen-Display (OSD)"));
    window.default_height = 800;
    window.default_width = 550;
  });
  return prefWidget;
}


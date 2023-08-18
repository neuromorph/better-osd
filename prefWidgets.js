const Gtk = imports.gi.Gtk;
const Adw = imports.gi.Adw;

const Gettext = imports.gettext.domain("custom-osd");
const _ = Gettext.gettext;

function _createClockRow(window, buttonKey){
    let settingsActivables = window._activableWidgets['settings'];
  
    const clockRow = new Adw.ActionRow({
      title: _('Clock OSD (hotkey)'),
    });
    // const clockEntry = new Adw.EntryRow({
    //   tooltip_text: "<Alt> <Ctrl> <Super> A B C ... 0 1 2 ...",
    // });
    let clockkey = window._settings.get_strv('clock-osd');
    const clockEntry = new Gtk.Entry({
      text: clockkey[0],
      width_chars: 10,
      tooltip_text: _("Click icon or Press Enter to update. Keys: <Alt> <Ctrl> <Super> A B C ... 0 1 2 ..."),
      valign: Gtk.Align.CENTER,
    })
    clockEntry.set_icon_from_icon_name(Gtk.EntryIconPosition.SECONDARY, 'preferences-system-time-symbolic');
    clockEntry.set_icon_activatable(Gtk.EntryIconPosition.SECONDARY, true);
    clockEntry.set_icon_sensitive(Gtk.EntryIconPosition.SECONDARY, true);
    ['activate', 'icon-press'].forEach(signal => {
      clockEntry.connect(signal, (w) => {
        let key = w.get_text();
        window._settings.set_strv(buttonKey, [key]);
      });
    });
    settingsActivables.push({[buttonKey]:clockEntry});
    clockRow.add_suffix(clockEntry);
    clockRow.set_activatable_widget(clockEntry);
  
    return clockRow;
  }
  
  //-----------------------------------------------
  
  function _createMonitorsRow(window, buttonKey){
    let settingsActivables = window._activableWidgets['settings'];
  
    const monitorsRow = new Adw.ActionRow({
      title: _('Monitors'),
    });
    const monitorsCombo = new Gtk.ComboBoxText({
      tooltip_text: _("Choose monitor to show OSD on"),
      valign: Gtk.Align.CENTER,
    });
    monitorsCombo.append("all", _("All"));
    monitorsCombo.append("primary", _("Primary"));
    monitorsCombo.append("external", _("External"));
    monitorsCombo.connect(
      "changed",
      function (w) {
        var value = w.get_active_id();
        window._settings.set_string(buttonKey, value);
      }
    );
    settingsActivables.push({[buttonKey]:monitorsCombo});
    monitorsRow.add_suffix(monitorsCombo);
    monitorsRow.set_activatable_widget(monitorsCombo);
  
    return monitorsRow;
  }
  
  //-----------------------------------------------
  
  function _createFontRow(window, buttonKey){
    let settingsActivables = window._activableWidgets['settings'];
    const fontRow = new Adw.ActionRow({
      title: _('Font'),
    });
    // const fontBtn = new Gtk.FontDialogButton({
    //   use_font: true,
    //   tooltip_text: "Font for OSD text",
    //   valign: Gtk.Align.CENTER,
    // });
    const fontBtn = new Gtk.FontButton({
      use_font: true,
      tooltip_text: _("Font for OSD text"),
      valign: Gtk.Align.CENTER,
    });
    let font = window._settings.get_string('font');
    if (font == ""){
      let defaultFont = fontBtn.get_font();
      window._settings.set_string('default-font', defaultFont);
    }
    fontBtn.connect(
      "font-set",
      function (w) {
        var value = w.get_font();
        window._settings.set_string(buttonKey, value);
      }
    );
    settingsActivables.push({[buttonKey]:fontBtn});
    fontRow.add_suffix(fontBtn);
    fontRow.set_activatable_widget(fontBtn);
  
    const resetFontBtn = new Gtk.Button({
      label: '↺',
      width_request: 10,
      tooltip_text: _("Reset to default font"),
      valign: Gtk.Align.CENTER, 
      halign: Gtk.Align.END
    }); 
    resetFontBtn.get_style_context().add_class('circular');
    resetFontBtn.connect('clicked', () => {
      window._settings.reset('font');
      let fontBtn = window._activableWidgets['settings'].find(x => x['font'])['font'];
      fontBtn.set_font(window._settings.get_string('default-font'));
    });
    fontRow.add_suffix(resetFontBtn);
    
    return fontRow;
  }
  
  //-----------------------------------------------
  
  function _createToggleBtn(window, buttonKey){
    let label, tooltip_text;
    let settingsActivables = window._activableWidgets['settings'];
  
    switch (buttonKey) {
      case 'icon':
        label = _('Icon');
        tooltip_text = _("Show icon in OSD");
        break;
      case 'label':
        label = _('Label');
        tooltip_text = _("Show label in OSD when applicable");
        break;
      case 'level':
        label = _('Level');
        tooltip_text = _("Show level in OSD when applicable");
        break;
      case 'numeric':
        label = _('Numeric');
        tooltip_text = _("Show numeric value in OSD when applicable");
        break;
      default:
        break;
    }
  
    const toggleBtn = new Gtk.ToggleButton({
      label: label,
      sensitive: true,
      tooltip_text: tooltip_text,
      valign: Gtk.Align.CENTER,
    });
    toggleBtn.connect(
      "toggled",
      function (w) {
          var value = w.get_active();
          window._settings.set_boolean(buttonKey, value);
      }.bind(this)
    );
    settingsActivables.push({[buttonKey]: toggleBtn});
  
    return toggleBtn;
  }
  
  //-----------------------------------------------
  
  function _createColorRow(window, buttonKey){
    let settingsActivables = window._activableWidgets['settings'];
    let title, tooltip_text;
    
    switch (buttonKey) {
      case 'color':
        title = _('Color');
        tooltip_text = _("Foreground color of OSD");
        use_alpha = true;
        break;
      case 'bgcolor':
        title = _('Background Color');
        tooltip_text = _("Background color of OSD");
        use_alpha = false;
        break;
      default:
        break;
    }
  
    const row = new Adw.ActionRow({
      title: title,
    });
    // const colorDialog = new Gtk.ColorDialog({
    //   with_alpha: use_alpha,
    //   title: title,
    // })
    // const colorBtn = new Gtk.ColorDialogButton(colorDialog, {
    //   tooltip_text: tooltip_text,
    //   valign: Gtk.Align.CENTER,});
    const colorBtn = new Gtk.ColorButton({
      use_alpha: use_alpha,
      tooltip_text: tooltip_text,
      valign: Gtk.Align.CENTER,
    });
    colorBtn.connect(
      "color-set",
      function (w) {
        var rgba = w.get_rgba();
        window._settings.set_strv(buttonKey, [
          rgba.red.toString(),
          rgba.green.toString(),
          rgba.blue.toString(),
          rgba.alpha.toString()
        ]);
      }
    );
    settingsActivables.push({[buttonKey]: colorBtn});
    row.add_suffix(colorBtn);
    row.set_activatable_widget(colorBtn);
  
    return row;
  }
  
  //-----------------------------------------------
  
  function _createSwitchRow(window, buttonKey){
    let title, tooltip_text;
    let settingsActivables = window._activableWidgets['settings'];
    switch (buttonKey) {
      case 'rotate':
        title = _('Vertical Orientation');
        tooltip_text = _("Show OSD vertically");
        break;
      case 'shadow':
        title = _('Box Shadow');
        tooltip_text = _("Effective on lighter background. Turn Off for transparent or flat look");
        break;
      case 'border':
        title = _('Box Border');
        tooltip_text = _("Box border around OSD");
        break;
      default:
        break;
    }
  
    const row = new Adw.ActionRow({
      title: title,
    });
    const switchBtn = new Gtk.Switch({
      sensitive: true,
      tooltip_text: tooltip_text,
      valign: Gtk.Align.CENTER,
    });
    switchBtn.connect(
        "state-set",
        function (w) {
            var value = w.get_active();
            window._settings.set_boolean(buttonKey, value);
        }.bind(this)
    );
    settingsActivables.push({[buttonKey]: switchBtn});
    row.add_suffix(switchBtn);
    row.set_activatable_widget(switchBtn);
  
    return row;
  }
  
  //-----------------------------------------------
  
  function _createSpinBtnRow(window, buttonKey){
  
    let title, lower, upper, step_increment, page_increment, tooltip_text;
    let settingsActivables = window._activableWidgets['settings'];
  
    switch (buttonKey) {
      case 'horizontal':
        title = _('Horizontal Position (%)');
        lower = -50.0;
        upper = 50.0;
        step_increment = 0.2;
        page_increment = 1.0;
        tooltip_text = _("Left Edge: -50  ↞↠  +50 :Right Edge");
        break;
      case 'vertical':
        title = _('Vertical Position (%)');
        lower = -50.0;
        upper = 50.0;
        step_increment = 0.2;
        page_increment = 1.0;
        tooltip_text = _("Top Edge: -50  ↞↠  +50 :Bottom Edge");
        break;
      case 'size':
        title = _('Size (%)');
        lower = 1;
        upper = 100;
        step_increment = 1;
        page_increment = 5;
        tooltip_text = _("Size relative to monitor height");
        break;
      case 'alpha':
        title = _('Transparency (Opacity %)');
        lower = 0;
        upper = 100;
        step_increment = 5;
        page_increment = 10;
        tooltip_text = _("Transparent Backgroud: 0 ↞↠ 100 :Opaque Backgroud");
        break;
      case 'bradius':
        title = _('Shape Shift');
        lower = -100;
        upper = 200;
        step_increment = 5;
        page_increment = 10;
        tooltip_text = _("☯:-100  ↞  Rectangle:0  ↞↠  100:Pill  ↠  200:☯");
        break;
      case 'delay':
        title = _('Hide Delay (ms)');
        lower = 0;
        upper = 5000;
        step_increment = 10;
        page_increment = 50;
        tooltip_text = _("Delay before OSD disappears (ms)");
        break;
      default:
        break;
    }
  
    const row = new Adw.ActionRow({
      title: title,
    });
    const spinAdjustment = new Gtk.Adjustment({
      lower: lower,
      upper: upper,
      step_increment: step_increment,
      page_increment: page_increment,
      page_size: 0,
    });
    const spinBtn = new Gtk.SpinButton({
        adjustment: spinAdjustment,
        sensitive: true,
        digits: 1,
        width_chars: 5,
        tooltip_text: tooltip_text,
        valign: Gtk.Align.CENTER,
    });
    spinBtn.connect(
        "value-changed",
        function (w) {
            var value = w.get_value();
            window._settings.set_double(buttonKey, value);
        }.bind(this)
    );
    settingsActivables.push({[buttonKey]: spinBtn});
    row.add_suffix(spinBtn);
    row.set_activatable_widget(spinBtn);
  
    return row;
  }
  
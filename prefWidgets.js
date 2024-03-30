import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';
import GLib from 'gi://GLib';

import {gettext as _} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

export class PrefWidgets {

  createComponentsRow(window){
    const componentsExpander = new Adw.ExpanderRow({
      title: _(`OSD Components :   Icon ☀    Label 𝓪𝓫𝓬    Level ↕    Numeric %`),
      expanded: false,
      tooltip_text: _("Select components to show for each OSD-type below"),
    });

    const componentsRow1 = new Adw.ActionRow({
      title: _('OSDs with All Components'),
      tooltip_text: _("OSDs like Headphone-Volume"),
    });
    const iconBtn1 = this.createToggleBtn(window, 'icon-all', 'osd-all');
    componentsRow1.add_suffix(iconBtn1);
    const labelBtn1 = this.createToggleBtn(window, 'label-all', 'osd-all');
    componentsRow1.add_suffix(labelBtn1);
    const levelBtn1 = this.createToggleBtn(window, 'level-all', 'osd-all');
    componentsRow1.add_suffix(levelBtn1);
    const numericBtn1 = this.createToggleBtn(window, 'numeric-all', 'osd-all');
    componentsRow1.add_suffix(numericBtn1);
    componentsExpander.add_row(componentsRow1);

    const componentsRow2 = new Adw.ActionRow({
      title: _('OSDs with No Label'),
      tooltip_text: _("OSDs like Display-Brightness"),
    });
    const iconBtn2 = this.createToggleBtn(window, 'icon-nolabel', 'osd-nolabel');
    componentsRow2.add_suffix(iconBtn2);
    const levelBtn2 = this.createToggleBtn(window, 'level-nolabel', 'osd-nolabel');
    componentsRow2.add_suffix(levelBtn2);
    const numericBtn2 = this.createToggleBtn(window, 'numeric-nolabel', 'osd-nolabel');
    componentsRow2.add_suffix(numericBtn2);
    componentsExpander.add_row(componentsRow2);

    const componentsRow3 = new Adw.ActionRow({
      title: _('OSDs with No Level'),
      tooltip_text: _("OSDs like Caffeine, Lock Keys etc."),
    });
    const iconBtn3 = this.createToggleBtn(window, 'icon-nolevel', 'osd-nolevel');
    componentsRow3.add_suffix(iconBtn3);
    const labelBtn3 = this.createToggleBtn(window, 'label-nolevel', 'osd-nolevel');
    componentsRow3.add_suffix(labelBtn3);
    componentsExpander.add_row(componentsRow3);

    return componentsExpander;

  }

  //-----------------------------------------------

  createEntryRow(window, buttonKey){
    let settingsActivables = window._activableWidgets['settings'];
    let title, text, placeholder_text, tooltip_text, icon_name;
    switch (buttonKey) {
      case 'clock-osd':
        title = _('Clock OSD (hotkey)');
        text = window._settings.get_strv('clock-osd')[0];
        placeholder_text = _(`e.g. <Super>T`);
        tooltip_text = _("Clock OSD: Press Enter to update. Keys: <Alt> <Ctrl> <Super> A B C ... 0 1 2 ...");
        icon_name = 'preferences-system-time-symbolic';
        break;
      case 'background-image':
        title = _('Background Image File');
        text = window._settings.get_string('background-image');
        placeholder_text = _(`e.g. /home/user/Pictures/image.png`);
        tooltip_text = _("Enter image path and Press Return or Click Icon to update.");
        icon_name = 'checkbox-checked-symbolic';
        break;
      default:
        break;
    }

    const entryRow = new Adw.ActionRow({
      title: title,
    });
    // const entryRow = new Adw.EntryRow({
    //   tooltip_text: "<Alt> <Ctrl> <Super> A B C ... 0 1 2 ...",
    // });
    const entry = new Gtk.Entry({
      text: text,
      placeholder_text: placeholder_text,
      width_chars: 10,
      tooltip_text: tooltip_text,
      valign: Gtk.Align.CENTER,
    })
    entry.set_icon_from_icon_name(Gtk.EntryIconPosition.SECONDARY, icon_name);
    entry.set_icon_activatable(Gtk.EntryIconPosition.SECONDARY, true);
    entry.set_icon_sensitive(Gtk.EntryIconPosition.SECONDARY, true);
    ['activate', 'icon-press'].forEach(signal => {
      entry.connect(signal, (w) => {
        let key = w.get_text();
        if(buttonKey === 'clock-osd')
          window._settings.set_strv(buttonKey, [key]);
        else
          window._settings.set_string(buttonKey, key);
      });
    });
    settingsActivables.push({[buttonKey]:entry});
    entryRow.add_suffix(entry);
    entryRow.set_activatable_widget(entry);

    return entryRow;
  }
  
  //-----------------------------------------------
  
  createComboBoxRow(window, buttonKey, gradientBgColorRow=null, gradientAlphaRow=null, gradientDirectionRow=null, ringGapRow=null, ImageEntryRow=null){
    let settingsActivables = window._activableWidgets['settings'];
    let title, tooltip_text, tooltip_action=null, comboElements;

    switch (buttonKey) {
      case 'monitors':
        title = _('Monitors');
        tooltip_text = _("Choose monitor to show OSD on");
        comboElements = [["all", _("All")], ["primary", _("Primary")], ["external", _("External")]];
        break;
      case 'gradient-direction':
        title = _('Gradient Direction');
        tooltip_text = _("Direction of gradient. Horizontal is along length of OSD");
        comboElements = [["horizontal", _("Horizontal")], ["vertical", _("Vertical")], ["radial", _("Radial")]];
        break;
      case 'bg-effect':
        title = _('Special Effects ⚗️ ');
        tooltip_action = _("Special effects for OSD (experimental)");
        tooltip_text = _("Adjust border, shadow and transparency etc. to get the best effect");
        comboElements = [["none", _("None")], ["progress-ring", _("Progress Ring")], ["dynamic-blur", _("Dynamic Blur")], ["gradient", _("Gradient")], ["glass", _("Pseudo Glass")], ["wood1", _("Wood Raw")], ["wood2", _("Wood Polished")], ["background-image", _("Background Image")]];
        break;
      default:
        break;
    }

    const comboBoxRow = new Adw.ActionRow({
      title:title,
      tooltip_text: tooltip_action,
    });
    const comboBox = new Gtk.ComboBoxText({
      tooltip_text: tooltip_text,
      valign: Gtk.Align.CENTER,
    });
    comboElements.forEach(element => {
      comboBox.append(element[0], element[1]);
    });
    comboBox.connect(
      "changed",
      function (w) {
        var value = w.get_active_id();
        if (buttonKey == 'bg-effect'){
          if (value == 'gradient'){
            gradientBgColorRow.visible = true;
            gradientAlphaRow.visible = true;
            gradientDirectionRow.visible = true;
          } 
          else {
            gradientBgColorRow.visible = false;
            gradientAlphaRow.visible = false;
            gradientDirectionRow.visible = false;
          }
          if (value == 'progress-ring'){
            ringGapRow.visible = true;
          } else {
            ringGapRow.visible = false;
          }
          if (value == 'background-image'){
            ImageEntryRow.visible = true;
          } else {
            ImageEntryRow.visible = false;
          }
        }
        window._settings.set_string(buttonKey, value);
      }
    );
    settingsActivables.push({[buttonKey]:comboBox});
    comboBoxRow.add_suffix(comboBox);
    comboBoxRow.set_activatable_widget(comboBox);
    
    return comboBoxRow;

  }
  
  //-----------------------------------------------
  
  createFontRow(window, buttonKey){
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
      window._settings.set_string('font', defaultFont);
      font = defaultFont;
    }
    fontBtn.set_font(font);
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
      let defaultFont = window._settings.get_string('default-font');
      fontBtn.set_font(defaultFont);
      window._settings.set_string('font', defaultFont);
    });
    fontRow.add_suffix(resetFontBtn);
    
    return fontRow;
  }
  
  //-----------------------------------------------
  
  createToggleBtn(window, buttonKey, osdType){
    let label, tooltip_text;
    let settingsActivables = window._activableWidgets['settings'];
  
    switch (buttonKey.split('-')[0]) {
      case 'icon':
        label = '☀';
        tooltip_text = _("Icon");
        break;
      case 'label':
        label = '𝓪𝓫𝓬';
        tooltip_text = _("Label");
        break;
      case 'level':
        label = '↕';
        tooltip_text = _("Level");
        break;
      case 'numeric':
        label = '%';
        tooltip_text = _("Numeric %");
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
          let osdTypeDict = window._settings.get_value(osdType).deep_unpack();
          osdTypeDict[buttonKey] = value;
          window._settings.set_value(osdType, new GLib.Variant('a{sb}', osdTypeDict));
      }.bind(this)
    );
    settingsActivables.push({[buttonKey]: toggleBtn});
  
    return toggleBtn;
  }
  
  //-----------------------------------------------
  
  createColorRow(window, buttonKey){
    let settingsActivables = window._activableWidgets['settings'];
    let title, tooltip_text, use_alpha;
    
    switch (buttonKey) {
      case 'color':
        title = _('Foreground Color');
        tooltip_text = _("Foreground color of OSD");
        use_alpha = true;
        break;
      case 'bgcolor':
        title = _('Background Color');
        tooltip_text = _("Background color of OSD");
        use_alpha = false;
        break;
      case 'bgcolor2':
        title = _('Gradient End Color');
        tooltip_text = _("Gradient starts with Background color and ends with this color");
        use_alpha = false;
        break;
      case 'levcolor':
        title = _('Level Color');
        tooltip_text = _("Level color of OSD");
        use_alpha = false;
        break;
      case 'bcolor':
        title = _('Border Color');
        tooltip_text = _("Border color of OSD");
        use_alpha = false;
        break;
      case 'shcolor':
        title = _('Shadow Color');
        tooltip_text = _("Shadow color of OSD");
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
    // });
    // const colorBtn = new Gtk.ColorDialogButton();
    // colorBtn.dialog = colorDialog;
    // colorBtn.tooltip_text = tooltip_text;
    // colorBtn.valign = Gtk.Align.CENTER;
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
  
  createSwitchRow(window, buttonKey){
    let title, tooltip_text;
    let settingsActivables = window._activableWidgets['settings'];
    switch (buttonKey) {
      case 'rotate':
        title = _('Vertical Orientation');
        tooltip_text = _("Show OSD vertically");
        break;
      case 'shadow':
        title = _('Box Shadow');
        tooltip_text = _("Shadow: Effective on contrasting background.");
        break;
      case 'border':
        title = _('Box Border');
        tooltip_text = _("Box border around OSD");
        break;
      case 'square-circle':
        title = _('Square / Circle');
        tooltip_text = _("Show OSD in square / circle-ish shape (H=W)");
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
  
  createSpinBtnRow(window, buttonKey){
  
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
        title = _('Background Opacity %');
        lower = 0;
        upper = 100;
        step_increment = 5;
        page_increment = 10;
        tooltip_text = _("Transparent Backgroud: 0 ↞↠ 100 :Opaque Backgroud");
        break;
      case 'alpha2':
        title = _('Gradient End Opacity %');
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
      case 'levalpha':
        title = _('Level Opacity %');
        lower = 0;
        upper = 100;
        step_increment = 5;
        page_increment = 10;
        tooltip_text = _("Transparent: 0 ↞↠ 100 :Opaque");
        break;
      case 'balpha':
        title = _('Border Opacity %');
        lower = 0;
        upper = 100;
        step_increment = 5;
        page_increment = 10;
        tooltip_text = _("Transparent: 0 ↞↠ 100 :Opaque");
        break;
      case 'ring-gap':
        title = _('Ring Gap from Border (%)');
        lower = 0;
        upper = 100;
        step_increment = 1;
        page_increment = 5;
        tooltip_text = _("Gap from border: No gap: 0 ↞↠ 100 :Max gap");
        break;
      case 'levthickness':
        title = _('Level Thickness (%)');
        lower = 1;
        upper = 100;
        step_increment = 1;
        page_increment = 5;
        tooltip_text = _("Thickness of Level bar or Progress ring");
        break;
      case 'bthickness':
        title = _('Border Thickness (%)');
        lower = 1;
        upper = 100;
        step_increment = 1;
        page_increment = 5;
        tooltip_text = _("Thickness of the OSD Border");
        break;
      case 'hpadding':
        title = _('Horizontal Padding (%)');
        lower = 0;
        upper = 100;
        step_increment = 1;
        page_increment = 1;
        tooltip_text = _("Horizontal Padding of OSD");
        break;
      case 'vpadding':
        title = _('Vertical Padding (%)');
        lower = 0;
        upper = 100;
        step_increment = 1;
        page_increment = 1;
        tooltip_text = _("Vertical Padding of OSD");
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

};

const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Gdk = imports.gi.Gdk;
const Adw = imports.gi.Adw;

const Gettext = imports.gettext.domain("custom-osd");
const _ = Gettext.gettext;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();


//-----------------------------------------------

function init() {
  ExtensionUtils.initTranslations();
}

//-----------------------------------------------


function fillPreferencesWindow(window) {

  window.set_title(_("Custom OSD (On-Screen-Display)"));
  window.default_height = 850;
  window.default_width = 700;
  // window.search_enabled = true;

  window._settings = ExtensionUtils.getSettings();
  window._activableWidgets = {'settings': [], 'about': []};

  const settingsPage = new Adw.PreferencesPage({
      name: 'settings',
      title: 'Settings',
      icon_name: 'preferences-system-symbolic',
  });
  window.add(settingsPage);

  const helpPage = new Adw.PreferencesPage({
    name: 'help',
    title: 'Help',
    icon_name: 'help-symbolic',
  });
  window.add(helpPage);

  const aboutPage = new Adw.PreferencesPage({
      name: 'about',
      title: 'About',
      icon_name: 'preferences-color-symbolic',
  });
  window.add(aboutPage);

  // Settings Page
  _fillSettingsPage(window, settingsPage);

  // Help Page
  _fillHelpPage(window, helpPage);

  // About Page
  _fillAboutPage(window, aboutPage);
  
  // Set widget values from settings
  _setWidgetsValues(window);

}

//-----------------------------------------------

function _fillHelpPage(window, helpPage){

  const helpGroup = new Adw.PreferencesGroup();
  helpPage.add(helpGroup);

  const titleLabel = _getTitleLabel();
  helpGroup.add(titleLabel);

  const overviewLabel = new Gtk.Label({
    use_markup: true,
    wrap_mode: Gtk.WrapMode.WORD,
    label: `<span size="medium" underline="none" allow_breaks="true">
    <b>OSD What?</b> 
    OSDs are On-Screen-Display pop ups that show up for volume, brightness etc. 
    This extension allows you to fully customize these pop ups whether built-in 
    or those created by extensions like Caffeine, Lock Keys etc. 
    </span>`,
    width_chars: 35,
  });
  helpGroup.add(overviewLabel);

  const positionImage = new Gtk.Image({
    file: Me.path + "/media/Position.png",
    pixel_size: 200,
  });

  const notesRow = new Adw.ExpanderRow({
    title: `<span size="medium" weight="heavy">Brief Notes</span>`,
    expanded: true,
  });
  const notesLabel = new Gtk.Label({
    use_markup: true,
    label: `<span size="medium" underline="none">
    • Type/edit the values and hit enter key to update OR
    • Simply click the - + buttons or PgUp / PgDn keyboard keys.
    • Hover over the values/buttons for more info (tooltips).
    • Position is (0,0) at screen-center. Range is -50 to +50 as shown above.
    • Custom-color panel of Color button has foreground transparency slider.
    • Further styling effects are possible by editing the extension's stylesheet.
    • Visit home page for more details: <a href="${Me.metadata.url}"><b>Custom OSD</b></a>
    </span>`,
    width_chars: 35,
  });
  notesRow.add_row(notesLabel);

  const helpBox = new Gtk.Box({
    orientation: Gtk.Orientation.VERTICAL,
    spacing: 5,
    margin_top: 5,
    margin_bottom: 5,
  });
  helpBox.append(positionImage);
  helpBox.append(notesRow);
  helpGroup.add(helpBox);

}

//-----------------------------------------------

function _getTitleLabel(){
  return new Gtk.Label({
    use_markup: true,
    label: `<span size="x-large" weight="heavy" color="#07D8E3">Custom OSD</span>`,
    halign: Gtk.Align.CENTER
  });
}

//-----------------------------------------------

function _fillAboutPage(window, aboutPage){

  const infoGroup = new Adw.PreferencesGroup();
  aboutPage.add(infoGroup);

  const infoBox = new Gtk.Box({
    orientation: Gtk.Orientation.VERTICAL,
    spacing: 6,
    margin_top: 10,
  });

  const aboutImage = new Gtk.Image({
    file: Me.path + "/media/aboutIcon.png",
    vexpand: false,
    hexpand: false,
    pixel_size: 128,
    margin_bottom: 10,
  });
  infoBox.append(aboutImage);

  const titleLabel = _getTitleLabel();
  infoBox.append(titleLabel);

  const versionLabel = new Gtk.Label({
    use_markup: true,
    label: `<span size="small">${_('Version:')} ${Me.metadata.version}  |  © neuromorph</span>`,
    margin_bottom: 10,
  });
  infoBox.append(versionLabel);

  const aboutText = new Gtk.Label({
    use_markup: true,
    label: `Turn annoying OSDs into Awesome OSDs 😎 !`,
    width_chars: 35,
  });
  infoBox.append(aboutText);

  infoGroup.add(infoBox);

  const rowGroup = new Adw.PreferencesGroup();
  aboutPage.add(rowGroup);

  const homeRow = new Adw.ActionRow({
    title: 'Custom OSD Home',
  });
  const homeBtn = new Gtk.Button({icon_name: 'external-link-symbolic', valign: Gtk.Align.CENTER,});
  homeRow.add_suffix(homeBtn);
  // homeRow.set_activatable_widget(homeBtn);
  homeBtn.connect('clicked', () => {
    Gtk.show_uri(window, Me.metadata.url, Gdk.CURRENT_TIME);
  });
  homeRow.connect('activate', () => {});
  rowGroup.add(homeRow);

  const issueRow = new Adw.ActionRow({
    title: 'Report an issue',
  });
  const issuesBtn = new Gtk.Button({icon_name: 'external-link-symbolic', valign: Gtk.Align.CENTER,});
  issueRow.add_suffix(issuesBtn);
  // issueRow.set_activatable_widget(issuesBtn);
  let issueLink = "https://github.com/neuromorph/custom-osd/issues";
  issuesBtn.connect('clicked', () => {
    Gtk.show_uri(window, issueLink, Gdk.CURRENT_TIME);
  });
  issueRow.connect('activate', () => {});
  rowGroup.add(issueRow);

  const translateRow = new Adw.ActionRow({
    title: 'Contribute (translation)',
  });
  const translateBtn = new Gtk.Button({icon_name: 'external-link-symbolic', valign: Gtk.Align.CENTER,});
  translateRow.add_suffix(translateBtn);
  // translateRow.set_activatable_widget(translateBtn);
  let translateLink = "neuromorph/custom-osd";
  translateBtn.connect('clicked', () => {
    Gtk.show_uri(window, translateLink, Gdk.CURRENT_TIME);
  });
  translateRow.connect('activate', () => {});
  rowGroup.add(translateRow);

  const acknowledgeRow = new Adw.ExpanderRow({
    title: `Acknowledgements`,
    expanded: false,
  });
  const acknowledgeText = new Gtk.Label({
    use_markup: true,
    label: `<span size="medium" underline="none">
    • Inspired by and initiated from Better OSD 🙏.
    • Users: Thank you for your appreciation and valuable feedback!
    • Contributors: Translations are welcome and greatly appreciated!
    • Supporters: Highly thankful to you for choosing to support this work 🙏.
    • Image: Color scheme icons created by <a href="https://www.flaticon.com/free-icons/color-scheme" title="color scheme icons">flatart_icons - Flaticon</a>
    </span>`,
    width_chars: 35,
  });
  acknowledgeRow.add_row(acknowledgeText);
  rowGroup.add(acknowledgeRow);

  const supportGroup = new Adw.PreferencesGroup();
  aboutPage.add(supportGroup);

  const supportBox = new Gtk.Box({
    orientation: Gtk.Orientation.HORIZONTAL,
    spacing: 1,
    margin_top: 1,
    margin_bottom: 1,
    halign: Gtk.Align.CENTER,
  });

  const coffeeImage = new Gtk.Image({
    file: Me.path + "/media/bmcButton.svg",
    pixel_size: 128,
  });
  // 
  const coffeeBtn = new Gtk.LinkButton({
    child: coffeeImage,
    uri: "https://www.buymeacoffee.com/neuromorph",
    margin_end: 200,
    tooltip_text: "Buy me a coffee ☕",
    valign: Gtk.Align.CENTER, 
  });
  supportBox.prepend(coffeeBtn);

  const twitterImage = new Gtk.Image({
    file: Me.path + "/media/twitterButton.svg",
    pixel_size: 32,
  });
  const twtterBtn = new Gtk.LinkButton({
    child: twitterImage,
    uri: `https://twitter.com/intent/tweet?text=Checkout%20Gnome%20Shell%20Extension%20Custom%20OSD
          %3A%20%20https%3A%2F%2Fextensions.gnome.org%2Fextension%2F6142%2Fcustom-osd`,
    tooltip_text: "Share on Twitter",
    valign: Gtk.Align.CENTER,
  });
  supportBox.append(twtterBtn);

  const redditImage = new Gtk.Image({
    file: Me.path + "/media/redditButton.png",
    pixel_size: 32,
  });
  const redditBtn = new Gtk.LinkButton({
    child: redditImage,
    uri: `https://reddit.com/submit?url=https%3A%2F%2Fextensions.gnome.org%2Fextension%2F6142%2F
          custom-osd&title=Custom%20OSD%20Gnome%20Shell%20Extension`,
    tooltip_text: "Share on Reddit",
    valign: Gtk.Align.CENTER,
  });
  supportBox.append(redditBtn);

  supportGroup.add(supportBox);

  const gnuDisclaimerGroup = new Adw.PreferencesGroup();
  aboutPage.add(gnuDisclaimerGroup);

  const gnuLabel = new Gtk.Label({
    use_markup: true,
    label: `<span size="small" underline="none">
    This program comes with absolutely no warranty.
    See the <a href="https://gnu.org/licenses/gpl-3.0.html">GNU General Public License, version 3</a> for details.
    </span>`,
    halign: Gtk.Align.CENTER,
    justify: Gtk.Justification.CENTER,
    margin_bottom: 10,
  });
  gnuDisclaimerGroup.add(gnuLabel);

}

//-----------------------------------------------

function _resetSettingsDialog(window) {
  
  let dialog = new Gtk.MessageDialog({
    modal: true,
    text: _("Reset Settings?"),
    secondary_text: _("All settings will be reset to extension default values."),
    transient_for: window,
  });
  // add buttons to dialog as 'Reset' and 'Cancel' with 'Cancel' as default
  dialog.add_button(_("Reset"), Gtk.ResponseType.YES);
  dialog.add_button(_("Cancel"), Gtk.ResponseType.CANCEL);
  dialog.set_default_response(Gtk.ResponseType.CANCEL);
  
  // Connect the dialog to the callback function
  dialog.connect("response", (dialog, responseId) => {
    if (responseId == Gtk.ResponseType.YES) {
      let keys = window._settings.list_keys();
      keys.forEach(k => { if (k != 'default-font') window._settings.reset(k); });
      _setWidgetsValues(window);
    }
    dialog.destroy();
  });

  dialog.show();

}

//-----------------------------------------------

function _fillSettingsPage(window, settingsPage){

  let settingsActivables = window._activableWidgets['settings'];

  // Settings Page: Groups
  const titleGroup = new Adw.PreferencesGroup();
  settingsPage.add(titleGroup);
  const geometryGroup = new Adw.PreferencesGroup();
  settingsPage.add(geometryGroup);
  const styleGroup = new Adw.PreferencesGroup();
  settingsPage.add(styleGroup);
  const beyondGroup = new Adw.PreferencesGroup();
  settingsPage.add(beyondGroup);

  const titleLabel = _getTitleLabel();
  titleGroup.add(titleLabel);

  const geometryExpander = new Adw.ExpanderRow({
    title: `<span size="medium" weight="heavy">Geometry</span>`,
    expanded: false,
  });
  geometryGroup.add(geometryExpander);

  const styleExpander = new Adw.ExpanderRow({
    title: `<span size="medium" weight="heavy">Style</span>`,
    expanded: false,
  });
  styleGroup.add(styleExpander);

  const beyondExpander = new Adw.ExpanderRow({
    title: `<span size="medium" weight="heavy">Beyond</span>`,
    expanded: false,
  });
  beyondGroup.add(beyondExpander);

  // Settings Page: Geometry
  const hPositionRow = _createSpinBtnRow(window, 'horizontal');
  geometryExpander.add_row(hPositionRow);

  const vPositionRow = _createSpinBtnRow(window, 'vertical');
  geometryExpander.add_row(vPositionRow);

  const sizeRow = _createSpinBtnRow(window, 'size');
  geometryExpander.add_row(sizeRow);

  const rotateRow = _createSwitchRow(window, 'rotate');
  geometryExpander.add_row(rotateRow);

  const bradiusRow = _createSpinBtnRow(window, 'bradius');
  geometryExpander.add_row(bradiusRow);

  // Settings Page: Style
  const colorRow = _createColorRow(window, 'color');
  styleExpander.add_row(colorRow);

  const bgcolorRow = _createColorRow(window, 'bgcolor');
  styleExpander.add_row(bgcolorRow);

  const alphaRow = _createSpinBtnRow(window, 'alpha');
  styleExpander.add_row(alphaRow);

  const shadowRow = _createSwitchRow(window, 'shadow');
  styleExpander.add_row(shadowRow);

  const borderRow = _createSwitchRow(window, 'border');
  styleExpander.add_row(borderRow);

  const fontRow = _createFontRow(window, 'font');
  styleExpander.add_row(fontRow);

  // Settings Page: Beyond
  const delayRow = _createSpinBtnRow(window, 'delay');
  beyondExpander.add_row(delayRow);

  const monitorsRow = _createMonitorsRow(window, 'monitors');
  beyondExpander.add_row(monitorsRow);

  const clockRow = _createClockRow(window, 'clock-osd');
  beyondExpander.add_row(clockRow);
  
  const componentsRow = new Adw.ActionRow({
    title: 'OSD Components',
  });
  const iconBtn = _createToggleBtn(window, 'icon');
  componentsRow.add_suffix(iconBtn);
  // componentsRow.set_activatable_widget(iconBtn);
  const labelBtn = _createToggleBtn(window, 'label');
  componentsRow.add_suffix(labelBtn);
  // componentsRow.set_activatable_widget(labelBtn);
  const levelBtn = _createToggleBtn(window, 'level');
  componentsRow.add_suffix(levelBtn);
  // componentsRow.set_activatable_widget(levelBtn);
  const numericBtn = _createToggleBtn(window, 'numeric');
  componentsRow.add_suffix(numericBtn);
  // componentsRow.set_activatable_widget(numericBtn);
  beyondExpander.add_row(componentsRow);

  // Settings Page: Reset
  const resetSettingsBtn = new Gtk.Button({
    label: "Reset",
    margin_top: 25,
    tooltip_text: "Reset all settings to extension defaults",
    halign: Gtk.Align.END
  });
  resetSettingsBtn.get_style_context().add_class('destructive-action');
  resetSettingsBtn.connect('clicked', () => {
    _resetSettingsDialog(window);
  });
  beyondGroup.add(resetSettingsBtn);

}

//-----------------------------------------------

function _createClockRow(window, buttonKey){
  let settingsActivables = window._activableWidgets['settings'];

  const clockRow = new Adw.ActionRow({
    title: 'Clock OSD (hotkey)',
  });
  // const clockEntry = new Adw.EntryRow({
  //   tooltip_text: "<Alt> <Ctrl> <Super> A B C ... 0 1 2 ...",
  // });
  let clockkey = window._settings.get_strv('clock-osd');
  const clockEntry = new Gtk.Entry({
    text: clockkey[0],
    width_chars: 10,
    tooltip_text: "Click icon or Press Enter to update. Keys: <Alt> <Ctrl> <Super> A B C ... 0 1 2 ...",
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
    title: 'Monitors',
  });
  const monitorsCombo = new Gtk.ComboBoxText({
    tooltip_text: "Choose monitor to show OSD on",
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
    title: 'Font',
  });
  // const fontBtn = new Gtk.FontDialogButton({
  //   use_font: true,
  //   tooltip_text: "Font for OSD text",
  //   valign: Gtk.Align.CENTER,
  // });
  const fontBtn = new Gtk.FontButton({
    use_font: true,
    tooltip_text: "Font for OSD text",
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
    icon_name: 'reload-symbolic',
    width_request: 10,
    tooltip_text: "Reset to default font",
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
      label = 'Icon';
      tooltip_text = "Show icon in OSD";
      break;
    case 'label':
      label = 'Label';
      tooltip_text = "Show label in OSD when applicable";
      break;
    case 'level':
      label = 'Level';
      tooltip_text = "Show level in OSD when applicable";
      break;
    case 'numeric':
      label = 'Numeric';
      tooltip_text = "Show numeric value in OSD when applicable";
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
      title = 'Color';
      tooltip_text = "Foreground color of OSD";
      use_alpha = true;
      break;
    case 'bgcolor':
      title = 'Background Color';
      tooltip_text = "Background color of OSD";
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
      title = 'Vertical Orientation';
      tooltip_text = "Show OSD vertically";
      break;
    case 'shadow':
      title = 'Box Shadow';
      tooltip_text = "Effective on lighter background. Turn Off for transparent or flat look";
      break;
    case 'border':
      title = 'Box Border';
      tooltip_text = "Box border around OSD";
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
      title = 'Horizontal Position (%)';
      lower = -50.0;
      upper = 50.0;
      step_increment = 0.2;
      page_increment = 1.0;
      tooltip_text = "Left Edge: -50  ↞↠  +50 :Right Edge";
      break;
    case 'vertical':
      title = 'Vertical Position (%)';
      lower = -50.0;
      upper = 50.0;
      step_increment = 0.2;
      page_increment = 1.0;
      tooltip_text = "Top Edge: -50  ↞↠  +50 :Bottom Edge";
      break;
    case 'size':
      title = 'Size (%)';
      lower = 1;
      upper = 100;
      step_increment = 1;
      page_increment = 5;
      tooltip_text = "Size relative to monitor height";
      break;
    case 'alpha':
      title = 'Transparency (Opacity %)';
      lower = 0;
      upper = 100;
      step_increment = 5;
      page_increment = 10;
      tooltip_text = "Transparent Backgroud: 0 ↞↠ 100 :Opaque Backgroud";
      break;
    case 'bradius':
      title = 'Shape Shift';
      lower = -100;
      upper = 200;
      step_increment = 5;
      page_increment = 10;
      tooltip_text = "☯:-100  ↞  Rectangle:0  ↞↠  100:Pill  ↠  200:☯";
      break;
    case 'delay':
      title = 'Hide Delay (ms)';
      lower = 0;
      upper = 5000;
      step_increment = 10;
      page_increment = 50;
      tooltip_text = "Delay before OSD disappears (ms)";
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

//-----------------------------------------------

function _setWidgetsValues(window){
  let settingsActivables = window._activableWidgets['settings'];

  settingsActivables.forEach(activable => {
    let key = Object.keys(activable)[0];
    let widget = activable[key];

    switch (key) {
      case 'icon': case 'label': case 'level': case 'numeric': case 'rotate': case 'shadow': case 'border':
        widget.set_active(window._settings.get_boolean(key));
        break;
      case 'horizontal': case 'vertical': case 'size': case 'alpha': case 'bradius': case 'delay':
        widget.set_value(window._settings.get_double(key));
        break;
      case 'color': case 'bgcolor':
        let colorArray = window._settings.get_strv(key);
        let rgba = new Gdk.RGBA();
        rgba.red = parseFloat(colorArray[0]);
        rgba.green = parseFloat(colorArray[1]);
        rgba.blue = parseFloat(colorArray[2]);
        rgba.alpha = key == 'color'? parseFloat(colorArray[3]): 1.0;
        widget.set_rgba(rgba);
        break;
      case 'monitors':
        widget.set_active_id(window._settings.get_string(key));
        break;
      case 'font':
        let font = window._settings.get_string(key);
        if (font == ""){
          font = window._settings.get_string('default-font');
        }
        widget.set_font(font);
        break;
      case 'clock-osd':
        let clockkey = window._settings.get_strv(key);
        widget.set_text(clockkey[0]);
        break;
      default:
        break;
    }
  });
      
}
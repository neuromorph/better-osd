const Gtk = imports.gi.Gtk;
const Gdk = imports.gi.Gdk;
const Adw = imports.gi.Adw;
const GLib = imports.gi.GLib;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const {gettext: _, pgettext} = ExtensionUtils;

const Widgets = Me.imports.prefWidgets;

//-----------------------------------------------

function init() {
  ExtensionUtils.initTranslations();
}

//-----------------------------------------------

function fillPreferencesWindow(window) {

  // window.set_title(_("Custom OSD (On-Screen-Display)"));
  window.default_height = 850;
  window.default_width = 700;
  // window.search_enabled = true;

  window._settings = ExtensionUtils.getSettings();
  window._activableWidgets = {'settings': [], 'about': []};

  const settingsPage = new Adw.PreferencesPage({
      name: 'settings',
      title: _('Settings'),
      icon_name: 'preferences-system-symbolic',
  });
  window.add(settingsPage);

  const helpPage = new Adw.PreferencesPage({
    name: 'help',
    title: _('Help'),
    icon_name: 'help-symbolic',
  });
  window.add(helpPage);

  const aboutPage = new Adw.PreferencesPage({
      name: 'about',
      title: _('About'),
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

  window.connect('unrealize', () => {
    _setDefaultProfile(window);
  });

}

function _setDefaultProfile(window){
  let keys = window._settings.list_keys();
  let profile = {};
  let nonProfileKeys = ['default-font', 'profiles', 'current-profile', 'icon', 'label', 'level', 'numeric'];
  keys.forEach(k => { 
    if (!nonProfileKeys.includes(k)) {
      let value = window._settings.get_value(k);
      profile[k] = value;
    }
  });
  let profiles = window._settings.get_value('profiles').recursiveUnpack();
  profiles['Default'] = new GLib.Variant('a{sv}', profile);
  window._settings.set_value('profiles', new GLib.Variant('a{sv}', profiles));
}

//-----------------------------------------------

function _getTitleLabel(){
  return new Gtk.Label({
    use_markup: true,
    label: `<span size="x-large" weight="heavy" color="#07D8E3">` + _(`Custom OSD`) + `</span>`,
    halign: Gtk.Align.CENTER
  });
}

//-----------------------------------------------

function _fillHelpPage(window, helpPage){

  const helpGroup = new Adw.PreferencesGroup();
  helpPage.add(helpGroup);

  const titleLabel = _getTitleLabel();
  helpGroup.add(titleLabel);

  const overviewText = `<span size="medium">
  <b>${_(`OSD What?`)}</b>
  ${_(`OSDs are On-Screen-Display pop ups that show up for volume, brightness etc.`)} 
  ${_(`This extension allows you to fully customize these pop ups, whether built-in`)} 
  ${_(`or those created by extensions like Caffeine, Lock Keys etc.`)}</span>`;
  const overviewLabel = new Gtk.Label({
    use_markup: true,
    wrap_mode: Gtk.WrapMode.WORD,
    label: overviewText,
    width_chars: 35,
  });
  helpGroup.add(overviewLabel);

  const positionImage = new Gtk.Image({
    file: Me.path + "/media/Position.png",
    pixel_size: 200,
    margin_top: 5,
  });

  const notesRow = new Adw.ExpanderRow({
    title: `<span size="medium"><b>` + _(`Brief Notes`) + `</b></span>`,
    expanded: true,
  });
  const notesText = `<span size="medium" underline="none">
  • ${_(`Type/edit the values and hit enter key to update OR`)}
  • ${_(`Simply click the - + buttons or PgUp / PgDn keyboard keys.`)}
  • ${_(`Hover over the values/buttons for more info (tooltips).`)}
  • ${_(`Position is (0,0) at screen-center. Range is -50 to +50 as shown above.`)}
  • ${_(`Custom-color panel of Color button has foreground transparency slider.`)}
  • ${_(`Background effects are currently experimental.`)}
  • ${_(`Further styling effects are possible by editing the extension's stylesheet.`)}
  • ${_(`Visit home page for more details`)}: <a href="${Me.metadata.url}"><b>${_('Custom OSD')}</b></a>
  </span>`;
  const notesLabel = new Gtk.Label({
    use_markup: true,
    label: _(notesText),
    width_chars: 35,
  });
  notesRow.add_row(notesLabel);

  const helpBox = new Gtk.Box({
    orientation: Gtk.Orientation.VERTICAL,
    spacing: 5,
    margin_top: 10,
    margin_bottom: 5,
  });
  helpBox.append(positionImage);
  helpBox.append(notesRow);
  helpGroup.add(helpBox);

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
    label: `<span size="small">${_('Version')}: ${Me.metadata.version}  |  ${_('© neuromorph')}</span>`,
    margin_bottom: 10,
  });
  infoBox.append(versionLabel);

  const aboutText = new Gtk.Label({
    use_markup: true,
    label: _(`Turn annoying OSDs into Awesome OSDs 😎 !`),
    width_chars: 35,
  });
  infoBox.append(aboutText);

  infoGroup.add(infoBox);

  const rowGroup = new Adw.PreferencesGroup();
  aboutPage.add(rowGroup);

  const homeRow = new Adw.ActionRow({
    title: _('Custom OSD Home'),
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
    title: _('Report an issue'),
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
    title: _('Contribute (translation)'),
  });
  const translateBtn = new Gtk.Button({icon_name: 'external-link-symbolic', valign: Gtk.Align.CENTER,});
  translateRow.add_suffix(translateBtn);
  // translateRow.set_activatable_widget(translateBtn);
  let translateLink = "https://github.com/neuromorph/custom-osd#translations";
  translateBtn.connect('clicked', () => {
    Gtk.show_uri(window, translateLink, Gdk.CURRENT_TIME);
  });
  translateRow.connect('activate', () => {});
  rowGroup.add(translateRow);

  const acknowledgeRow = new Adw.ExpanderRow({
    title: _(`Acknowledgements`),
    expanded: false,
  });
  const acknowledgeText = `<span size="medium" underline="none">
  • ${_(`Inspired by and initiated from Better OSD 🙏.`)}
  • ${_(`Users: Thank you for your appreciation and valuable feedback!`)}
  • ${_(`Contributors: Translations are welcome and greatly appreciated!`)}
  • ${_(`Supporters: Highly thankful to you for choosing to support this work 🙏.`)}
  • ${_(`Image: Color scheme icons created by <a href="https://www.flaticon.com/free-icons/color-scheme" title="color scheme icons">flatart_icons - Flaticon</a>`)}
  </span>`;
  const acknowledgeLabel = new Gtk.Label({
    use_markup: true,
    label: acknowledgeText,
    width_chars: 35,
  });
  acknowledgeRow.add_row(acknowledgeLabel);
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
    tooltip_text: _("Buy me a coffee ☕"),
    valign: Gtk.Align.CENTER, 
  });
  supportBox.prepend(coffeeBtn);

  const twitterImage = new Gtk.Image({
    file: Me.path + "/media/twitterButton.svg",
    pixel_size: 32,
  });
  const twtterBtn = new Gtk.LinkButton({
    child: twitterImage,
    uri: `https://twitter.com/intent/tweet?text=Checkout%20Gnome%20Shell%20Extension%20Custom%20OSD%3A%20%20https%3A%2F%2Fextensions.gnome.org%2Fextension%2F6142%2Fcustom-osd`,
    tooltip_text: _("Share on Twitter"),
    valign: Gtk.Align.CENTER,
  });
  supportBox.append(twtterBtn);

  const redditImage = new Gtk.Image({
    file: Me.path + "/media/redditButton.png",
    pixel_size: 32,
  });
  const redditBtn = new Gtk.LinkButton({
    child: redditImage,
    uri: `https://reddit.com/submit?url=https%3A%2F%2Fextensions.gnome.org%2Fextension%2F6142%2Fcustom-osd&title=Custom%20OSD%20Gnome%20Shell%20Extension`,
    tooltip_text: _("Share on Reddit"),
    valign: Gtk.Align.CENTER,
  });
  supportBox.append(redditBtn);

  supportGroup.add(supportBox);

  const gnuDisclaimerGroup = new Adw.PreferencesGroup();
  aboutPage.add(gnuDisclaimerGroup);

  const gnuLabel = new Gtk.Label({
    use_markup: true,
    label: `<span size="small" underline="none">
    ${_(`This program comes with absolutely no warranty.`)}
    ${_(`See the <a href="https://gnu.org/licenses/gpl-3.0.html">GNU General Public License, version 3</a> for details.`)}
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
    title: `<span size="medium" weight="heavy">` + _(`Geometry`) + `</span>`,
    expanded: false,
  });
  geometryGroup.add(geometryExpander);

  const styleExpander = new Adw.ExpanderRow({
    title: `<span size="medium" weight="heavy">` + _(`Style`) + `</span>`,
    expanded: false,
  });
  styleGroup.add(styleExpander);

  const beyondExpander = new Adw.ExpanderRow({
    title: `<span size="medium" weight="heavy">` + _(`Beyond`) + `</span>`,
    expanded: false,
  });
  beyondGroup.add(beyondExpander);

  // Settings Page: Geometry
  const hPositionRow = Widgets._createSpinBtnRow(window, 'horizontal');
  geometryExpander.add_row(hPositionRow);

  const vPositionRow = Widgets._createSpinBtnRow(window, 'vertical');
  geometryExpander.add_row(vPositionRow);

  const sizeRow = Widgets._createSpinBtnRow(window, 'size');
  geometryExpander.add_row(sizeRow);

  const rotateRow = Widgets._createSwitchRow(window, 'rotate');
  geometryExpander.add_row(rotateRow);

  const bradiusRow = Widgets._createSpinBtnRow(window, 'bradius');
  geometryExpander.add_row(bradiusRow);

  // Settings Page: Style
  const colorRow = Widgets._createColorRow(window, 'color');
  styleExpander.add_row(colorRow);

  const bgcolorRow = Widgets._createColorRow(window, 'bgcolor');
  styleExpander.add_row(bgcolorRow);

  const gradientBgColorRow = Widgets._createColorRow(window, 'bgcolor2');
  const gradientDirectionRow = Widgets._createComboBoxRow(window, 'gradient-direction');
  const bgEffectRow = Widgets._createComboBoxRow(window, 'bg-effect', gradientBgColorRow, gradientDirectionRow);
  styleExpander.add_row(bgEffectRow);
  styleExpander.add_row(gradientBgColorRow);
  styleExpander.add_row(gradientDirectionRow);

  const alphaRow = Widgets._createSpinBtnRow(window, 'alpha');
  styleExpander.add_row(alphaRow);

  const shadowRow = Widgets._createSwitchRow(window, 'shadow');
  styleExpander.add_row(shadowRow);

  const borderRow = Widgets._createSwitchRow(window, 'border');
  styleExpander.add_row(borderRow);

  const fontRow = Widgets._createFontRow(window, 'font');
  styleExpander.add_row(fontRow);

  // Settings Page: Beyond
  const delayRow = Widgets._createSpinBtnRow(window, 'delay');
  beyondExpander.add_row(delayRow);

  const monitorsRow = Widgets._createComboBoxRow(window, 'monitors');
  beyondExpander.add_row(monitorsRow);

  const clockRow = Widgets._createClockRow(window, 'clock-osd');
  beyondExpander.add_row(clockRow);
  
  const componentsRow = Widgets._createComponentsRow(window);
  beyondExpander.add_row(componentsRow);

  // Settings Page: Reset
  const resetSettingsBtn = new Gtk.Button({
    label: _("Reset"),
    margin_top: 25,
    tooltip_text: _("Reset all settings to extension defaults"),
    halign: Gtk.Align.END
  });
  resetSettingsBtn.get_style_context().add_class('destructive-action');
  resetSettingsBtn.connect('clicked', () => {
    _resetSettingsDialog(window);
  });
  beyondGroup.add(resetSettingsBtn);

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
      case 'color': case 'bgcolor': case 'bgcolor2':
        let colorArray = window._settings.get_strv(key);
        let rgba = new Gdk.RGBA();
        rgba.red = parseFloat(colorArray[0]);
        rgba.green = parseFloat(colorArray[1]);
        rgba.blue = parseFloat(colorArray[2]);
        rgba.alpha = key == 'color'? parseFloat(colorArray[3]): 1.0;
        widget.set_rgba(rgba);
        break;
      case 'monitors': case 'bg-effect': case 'gradient-direction':
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
      case 'icon-all': case 'label-all': case 'level-all': case 'numeric-all':
        let osdAllDict = window._settings.get_value('osd-all').deep_unpack();
        widget.set_active(osdAllDict[key]);
        break;
      case 'icon-nolabel': case 'level-nolabel': case 'numeric-nolabel':
        let osdNoLabelDict = window._settings.get_value('osd-nolabel').deep_unpack();
        widget.set_active(osdNoLabelDict[key]);
        break;
      case 'icon-nolevel': case 'label-nolevel':
        let osdNoLevelDict = window._settings.get_value('osd-nolevel').deep_unpack();
        widget.set_active(osdNoLevelDict[key]);
        break;
      default:
        break;
    }
  });
      
}
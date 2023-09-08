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
  window.default_width = 675;
  // window.search_enabled = true;

  window._settings = ExtensionUtils.getSettings();
  window._activableWidgets = {'settings': [], 'profiles': []};

  const profilesPage = new Adw.PreferencesPage({
    name: 'profiles',
    title: _('Profiles'),
    icon_name: 'user-identity-symbolic',
  });
  window.add(profilesPage);

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

  // Profiles Page
  _fillProfilesPage(window, profilesPage);

  // Settings Page
  _fillSettingsPage(window, settingsPage);

  // Help Page
  _fillHelpPage(window, helpPage);

  // About Page
  _fillAboutPage(window, aboutPage);
  
  // Set widget values from settings
  _setWidgetsValues(window);

  window.connect('unrealize', () => {
    _setSettingsForActiveProfile(window, false);
  });

}

function _saveActiveProfile(window){
  let keys = window._settings.list_keys();
  let nonProfileKeys = ['default-font', 'profiles', 'active-profile', 'icon', 'label', 'level', 'numeric'];
  let profile = {};
  keys.forEach(k => { 
    if (!nonProfileKeys.includes(k)) {
      let value = window._settings.get_value(k);
      profile[k] = value;
    }
  });
  let activeProfile = window._settings.get_string('active-profile');
  let profiles = window._settings.get_value('profiles').deep_unpack();
  profiles[activeProfile] = new GLib.Variant('a{sv}', profile);
  window._settings.set_value('profiles', new GLib.Variant('a{sv}', profiles));
}

function _saveAsProfile(window, profileName){
  let keys = window._settings.list_keys();
  let nonProfileKeys = ['default-font', 'profiles', 'active-profile', 'icon', 'label', 'level', 'numeric'];
  let profile = {};
  keys.forEach(k => { 
    if (!nonProfileKeys.includes(k)) {
      let value = window._settings.get_value(k);
      profile[k] = value;
    }
  });
  let profiles = window._settings.get_value('profiles').deep_unpack();
  profiles[profileName] = new GLib.Variant('a{sv}', profile);
  window._settings.set_value('profiles', new GLib.Variant('a{sv}', profiles));
}

//-----------------------------------------------

function _fillProfilesPage(window, profilesPage){

  let profilesDict = window._settings.get_value('profiles').deep_unpack();
  let profiles = Object.keys(profilesDict);
  let profilesActivables = window._activableWidgets['profiles'];

  log('profile keys '+profiles);

  const titleGroup = new Adw.PreferencesGroup();
  profilesPage.add(titleGroup);

  const titleLabel = _getTitleLabel();
  titleGroup.add(titleLabel);
  // const profTxtLabel = 
  const profileText = new Gtk.Label({
    use_markup: true,
    label: `<span>
    ${_("You can create and save multiple profiles for OSD settings.")}
    ${_("You can then choose one to apply e.g. Light vs Dark variant.")}
    </span> `,
    width_chars: 35,
    halign: Gtk.Align.CENTER,
    // margin_top: 10,
    // margin_bottom: 10,
  });
  titleGroup.add(profileText);

  const activeProfileGroup = new Adw.PreferencesGroup();
  profilesPage.add(activeProfileGroup);

  const activeProfileRow = new Adw.ActionRow({
    title: `<b>${_('Active Profile')}</b>`,
    subtitle: `<span allow_breaks="true">${_("This profile is applied to all OSDs. Go to Settings tab to view / edit settings for active profile.")}</span>`,
  });
  const activeProfileCombo = new Gtk.ComboBoxText({
    valign: Gtk.Align.CENTER,
    tooltip_text: _("Select profile to apply to all OSDs"),
  });
  profiles.forEach(p => {
    activeProfileCombo.append(p, p);
  });
  activeProfileCombo.connect('changed', (combo) => {
    let profileName = combo.get_active_id();
    log('active profile changed '+profileName);
    if(profileName != null){
      window._settings.set_string('active-profile', profileName);
      _setSettingsForActiveProfile(window, true);
    }
      
  });
  activeProfileCombo.set_active_id(window._settings.get_string('active-profile'));

log('active profile setting'+window._settings.get_string('active-profile'));
log('active profile combo '+activeProfileCombo.get_active_id());

  profilesActivables.push({'active-profile': activeProfileCombo});
  activeProfileRow.add_suffix(activeProfileCombo);
  activeProfileGroup.add(activeProfileRow);

  const manageProfilesGroup = new Adw.PreferencesGroup();
  profilesPage.add(manageProfilesGroup);

  const manageProfLabelRow = new Adw.ActionRow({
    title: `<b>${_('Manage Profiles')}</b>`,
    subtitle: `<span allow_breaks="true">${_("Create or Delete profiles. Default profile can be edited but not deleted.")}</span>`,
  });
  manageProfilesGroup.add(manageProfLabelRow);

  const createProfileRow = new Adw.ActionRow({
    title: _('Create Profile'),
  });
  const createProfEntry = new Gtk.Entry({
    placeholder_text: _("Enter profile name"),
    valign: Gtk.Align.CENTER,
  });
  const createProfLabel = new Gtk.Label({
    use_markup: true,
    label: `<span size="large" color="#07c8d3">+</span>`,
  });
  const createProfBtn = new Gtk.Button({child: createProfLabel, valign: Gtk.Align.CENTER,});
  createProfBtn.connect('clicked', () => {
    let profileName = createProfEntry.get_text();
    if (profileName != "") {
      _createProfile(window, profileName);
      createProfEntry.set_text("");
    }
  });
  // createProfBtn.get_style_context().add_class('suggested-action');
  createProfileRow.add_suffix(createProfEntry);
  createProfileRow.add_suffix(createProfBtn);
  manageProfilesGroup.add(createProfileRow);

  const deleteProfileRow = new Adw.ActionRow({
    title: _('Delete Profile'),
  });
  const deleteProfCombo = new Gtk.ComboBoxText({
    valign: Gtk.Align.CENTER,
    tooltip_text: _("Delete profile other than 'Default'"),
  });
  // deleteProfCombo.set_entry_text_column(0);
  deleteProfCombo.append_text(_("Select profile to delete"));
  profiles.forEach(p => {
    if (p != 'Default') deleteProfCombo.append_text(p);
  });
  deleteProfCombo.set_active(0);
  profilesActivables.push({'delete-profile': deleteProfCombo});
  const deleteProfLabel = new Gtk.Label({
    use_markup: true,
    label: `<span size="large" color="#f44336">-</span>`,
  });
  const deleteProfBtn = new Gtk.Button({child: deleteProfLabel, valign: Gtk.Align.CENTER,});
  // deleteProfBtn.get_style_context().add_class('destructive-action');
  deleteProfBtn.connect('clicked', () => {
    let profileName = deleteProfCombo.get_active_text();
    if (profileName != _("Select profile to delete")) {
      // show a message dialog asking for confirmation before deleting
      _deleteProfileDialog(window, profileName);
    }
  });
  deleteProfileRow.add_suffix(deleteProfCombo);
  deleteProfileRow.add_suffix(deleteProfBtn);
  manageProfilesGroup.add(deleteProfileRow);


}

function _deleteProfileDialog(window, profileName){
  let dialog = new Gtk.MessageDialog({
    modal: true,
    text: _("Delete Profile?"),
    secondary_text: _("This will delete the settings profile: ")+profileName,
    transient_for: window,
  });
  // add buttons to dialog as 'Delete' and 'Cancel' with 'Cancel' as default
  dialog.add_button(_("Delete"), Gtk.ResponseType.YES);
  dialog.add_button(_("Cancel"), Gtk.ResponseType.CANCEL);
  dialog.set_default_response(Gtk.ResponseType.CANCEL);

  dialog.connect("response", (dialog, responseId) => {
    if (responseId == Gtk.ResponseType.YES) {
      _deleteProfile(window, profileName);
    }
    dialog.destroy();
  });

  dialog.show();
}

function _setSettingsForActiveProfile(window, setWidgets){
  let profilesDict = window._settings.get_value('profiles').recursiveUnpack();
  let activeProfile = window._settings.get_string('active-profile');
  let activeProfDict = profilesDict[activeProfile];
  let keys = window._settings.list_keys();
  // let profile = {};
  let nonProfileKeys = ['default-font', 'profiles', 'active-profile', 'icon', 'label', 'level', 'numeric'];
  keys.forEach(key => { 
    if (!nonProfileKeys.includes(key)) {

      switch (key) {
        case 'rotate': case 'shadow': case 'border': 
          window._settings.set_boolean(key, activeProfDict[key]);
          break;
        case 'horizontal': case 'vertical': case 'size': case 'alpha': case 'bradius': case 'delay':
          window._settings.set_double(key, activeProfDict[key]);
          break;
        case 'color': case 'bgcolor': case 'bgcolor2':
          window._settings.set_strv(key, activeProfDict[key]);
          break;
        case 'monitors': case 'bg-effect': case 'gradient-direction': 
          window._settings.set_string(key, activeProfDict[key]);
          break;
        case 'font':
          window._settings.set_string(key, activeProfDict[key]);
          break;
        case 'clock-osd':
          window._settings.set_strv(key, activeProfDict[key]);
          break;
        case 'osd-all': case 'osd-nolabel': case 'osd-nolevel':
          window._settings.set_value(key, new GLib.Variant('a{sb}', activeProfDict[key]));
          break;
        default:
          break;
      }
    }
  });

  if(setWidgets)
    _setWidgetsValues(window);
}



function _createProfile(window, profileName){
  let profilesDict = window._settings.get_value('profiles').deep_unpack();
  let profiles = Object.keys(profilesDict);
  if (!profiles.includes(profileName)) {
    profilesDict[profileName] = profilesDict['Default'];
    window._settings.set_value('profiles', new GLib.Variant('a{sv}', profilesDict));
    _updateProfileCombo(window);
  }
  else {
    let dialog = new Gtk.MessageDialog({
      modal: true,
      text: _("Profile already exists!"),
      secondary_text: _("Please choose a different name."),
      transient_for: window,
    });
    dialog.add_button(_("OK"), Gtk.ResponseType.OK);
    dialog.set_default_response(Gtk.ResponseType.OK);
    dialog.connect("response", (dialog, responseId) => {
      dialog.destroy();
    });
    dialog.show();
  }
}

function _deleteProfile(window, profileName){
  let profilesDict = window._settings.get_value('profiles').deep_unpack();
  let profiles = Object.keys(profilesDict);
  if (profiles.includes(profileName)) {
    delete profilesDict[profileName];
    window._settings.set_value('profiles', new GLib.Variant('a{sv}', profilesDict));
    if (window._settings.get_string('active-profile') == profileName) {
      window._settings.set_string('active-profile', 'Default');
    }
    _updateProfileCombo(window);
  }
}

function _updateProfileCombo(window){
  let profilesDict = window._settings.get_value('profiles').deep_unpack();
  let profiles = Object.keys(profilesDict);
  let activeProfileCombo = window._activableWidgets['profiles'].find(x => Object.keys(x)[0] == 'active-profile')['active-profile'];
  activeProfileCombo.remove_all();
  profiles.forEach(p => {
    activeProfileCombo.append(p, p);
  });
  activeProfileCombo.set_active_id(window._settings.get_string('active-profile'));

  let deleteProfCombo = window._activableWidgets['profiles'].find(x => Object.keys(x)[0] == 'delete-profile')['delete-profile'];
  deleteProfCombo.remove_all();
  deleteProfCombo.append_text(_("Select profile to delete"));
  profiles.forEach(p => {
    if (p != 'Default') deleteProfCombo.append_text(p);
  });
  deleteProfCombo.set_active(0);
}

//-----------------------------------------------

function _getTitleLabel(){
  return new Gtk.Label({
    use_markup: true,
    label: `<span size="x-large" weight="heavy" color="#07D8E3">${_("Custom OSD")}</span>`,
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
    file: Me.path + "/media/aboutIcon.svg",
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
    label: _(`Turn annoying OSDs into Awesome OSDs!`),
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
  homeBtn.connect('clicked', () => {
    Gtk.show_uri(window, Me.metadata.url, Gdk.CURRENT_TIME);
  });
  // homeRow.connect('activate', () => {});
  rowGroup.add(homeRow);

  const issueRow = new Adw.ActionRow({
    title: _('Report an issue'),
  });
  const issuesBtn = new Gtk.Button({icon_name: 'external-link-symbolic', valign: Gtk.Align.CENTER,});
  issueRow.add_suffix(issuesBtn);
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
    margin_top: 10,
    margin_bottom: 1,
    halign: Gtk.Align.CENTER,
  });

  const coffeeImage = new Gtk.Picture({
    vexpand: false,
    hexpand: false,
  });
  coffeeImage.set_filename(Me.path + "/media/bmcButton.svg");
  // 
  const coffeeBtn = new Gtk.LinkButton({
    child: coffeeImage,
    uri: "https://www.buymeacoffee.com/neuromorph",
    margin_end: 200,
    tooltip_text: _("If you'd like to support, you can buy me a coffee ☕"),
    height_request: 50,
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
    margin_top: 1,
    margin_bottom: 10,
  });
  gnuDisclaimerGroup.add(gnuLabel);

}

//-----------------------------------------------

function _resetSettingsDialog(window) {
  
  let dialog = new Gtk.MessageDialog({
    modal: true,
    text: _("Reset Changes?"),
    secondary_text: _("Current changes to active profile settings will be reset."),
    transient_for: window,
  });
  // add buttons to dialog as 'Reset' and 'Cancel' with 'Cancel' as default
  dialog.add_button(_("Reset"), Gtk.ResponseType.YES);
  dialog.add_button(_("Cancel"), Gtk.ResponseType.CANCEL);
  dialog.set_default_response(Gtk.ResponseType.CANCEL);
  
  // Connect the dialog to the callback function
  dialog.connect("response", (dialog, responseId) => {
    if (responseId == Gtk.ResponseType.YES) {
      _setSettingsForActiveProfile(window, true);
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
  const activeProfileGroup = new Adw.PreferencesGroup();
  settingsPage.add(activeProfileGroup);
  const geometryGroup = new Adw.PreferencesGroup();
  settingsPage.add(geometryGroup);
  const styleGroup = new Adw.PreferencesGroup();
  settingsPage.add(styleGroup);
  const beyondGroup = new Adw.PreferencesGroup();
  settingsPage.add(beyondGroup);

  const titleLabel = _getTitleLabel();
  titleGroup.add(titleLabel);

  const activeProfileRow = new Adw.ActionRow({
    title: `<b>${_('Active Profile')}</b>`,
    subtitle: _("Edit settings for active profile and hit 'Save' to save them."),
  });
  const activeProfileLabel = new Gtk.Label({
    use_markup: true,
    label: `<b>${window._settings.get_string('active-profile')}</b>`,
    valign: Gtk.Align.CENTER,
  });
  settingsActivables.push({'active-profile': activeProfileLabel});
  activeProfileRow.add_suffix(activeProfileLabel);
  activeProfileGroup.add(activeProfileRow);

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

  // Settings Page: Save
  const saveLabel = new Gtk.Label({
    use_markup: true,
    label: `<span color="#07c8d3">✓ ${_("Save")}</span>`
  });
  const saveSettingsBtn = new Gtk.Button({
    child: saveLabel,
    margin_top: 25,
    tooltip_text: _("Save the settings for active profile"),
    halign: Gtk.Align.END,
  });
  // saveSettingsBtn.get_style_context().add_class('suggested-action');
  saveSettingsBtn.connect('clicked', () => {
    _saveActiveProfile(window);
  });
  // beyondGroup.add(saveSettingsBtn);

  // Settings Page: Save As
  const saveAsLabel = new Gtk.Label({
    use_markup: true,
    label: `<span color="#555555">${_("Save As")}</span>`,
  });
  const saveAsSettingsBtn = new Gtk.Button({
    child: saveAsLabel,
    margin_top: 25,
    // margin_start: 10,
    tooltip_text: _("Save the settings as a new profile"),
    halign: Gtk.Align.START,
  });
  // saveAsSettingsBtn.get_style_context().add_class('suggested-action');
  saveAsSettingsBtn.connect('clicked', () => {
    _saveAsNewProfile(window);
  });
  
  // Settings Page: Reset
  const resetLabel = new Gtk.Label({
    use_markup: true,
    label: `<span color="#f44336">↺ ${_("Reset")}</span>`,
  });
  const resetSettingsBtn = new Gtk.Button({
    child: resetLabel,
    margin_top: 25,
    margin_end: 220,
    tooltip_text: _("Reset the changes for active profile"),
    halign: Gtk.Align.START,
  });
  // resetSettingsBtn.get_style_context().add_class('destructive-action');
  resetSettingsBtn.connect('clicked', () => {
    _resetSettingsDialog(window);
  });
  // beyondGroup.add(resetSettingsBtn);

  const saveResetBox = new Gtk.Box({
    orientation: Gtk.Orientation.HORIZONTAL,
    spacing: 10,
    margin_top: 25,
    margin_bottom: 10,
    halign: Gtk.Align.CENTER,
  });
  saveResetBox.prepend(resetSettingsBtn);
  saveResetBox.append(saveSettingsBtn);
  saveResetBox.append(saveAsSettingsBtn);
  beyondGroup.add(saveResetBox);

}

//-----------------------------------------------

function _saveAsNewProfile(window){

  let dialog = new Gtk.MessageDialog({
    modal: true,
    text: _("Save Profile As"),
    secondary_text: _("Save current settings as specified profile."),
    transient_for: window,
  });
  dialog.add_button(_("Save"), Gtk.ResponseType.YES);
  dialog.add_button(_("Cancel"), Gtk.ResponseType.CANCEL);
  dialog.set_default_response(Gtk.ResponseType.YES);

  let messageArea = dialog.get_message_area();
  let entry = new Gtk.Entry({
    placeholder_text: _("Enter profile name"),
    margin_top: 10,
    margin_bottom: 10,
  });
  messageArea.append(entry);

  dialog.connect("response", (dialog, responseId) => {
    if (responseId == Gtk.ResponseType.YES) {
      let profileName = entry.get_text();
      if (profileName != "") {
        _saveAsProfile(window, profileName);
        _updateProfileCombo(window);
      }
    }
    dialog.destroy();
  });

  dialog.show();
}

function _setWidgetsValues(window){
  let settingsActivables = window._activableWidgets['settings'];
  // let profilesActivables = window._activableWidgets['profiles'];

  settingsActivables.forEach(activable => {
    let key = Object.keys(activable)[0];
    let widget = activable[key];

    switch (key) {
      case 'rotate': case 'shadow': case 'border': 
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
        let osdNoLevelDict = window._settings.get_value('osd-nolevel').deep_unpack(`<b>${window._settings.get_string('active-profile')}</b>`);
        widget.set_active(osdNoLevelDict[key]);
        break;
      case 'active-profile':
        widget.set_markup(`<b>${window._settings.get_string('active-profile')}</b>`);
        break;
      default:
        break;
    }
  });

  // profilesActivables.forEach(activable => {
  //   let key = Object.keys(activable)[0];
  //   let widget = activable[key];

  //   switch (key) {
  //     case 'active-profile':
  //       widget.set_active(window._settings.get_string(key));
  //       break;
  //     default:
  //       break;
  //   }
  // });
  
}
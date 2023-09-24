const Gtk = imports.gi.Gtk;
const Gdk = imports.gi.Gdk;
const Adw = imports.gi.Adw;
const GLib = imports.gi.GLib;
const Gio = imports.gi.Gio;
const Json = imports.gi.Json;

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
  window._resettingCombo = false;

  const profilesPage = new Adw.PreferencesPage({
    name: 'profiles',
    title: _('Profiles'),
    icon_name: 'system-users-symbolic',
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
  let profiles = Object.keys(profilesDict).sort();
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
    ${_("Create and save multiple profiles for the OSD settings,")}
    ${_("and/or import Profile Presets. Then, choose one to apply.")}
    </span> `,
    width_chars: 35,
    halign: Gtk.Align.CENTER,
    // margin_top: 10,
    // margin_bottom: 10,
  });
  titleGroup.add(profileText);

  const activeProfileGroup = new Adw.PreferencesGroup();
  profilesPage.add(activeProfileGroup);

  // const activeProfileRow = new Adw.ActionRow({
  //   title: `<b>${_('Active Profile')}</b>`,
  //   subtitle: `<span allow_breaks="true">${_("This profile is applied to all OSDs. Go to Settings tab to view / edit settings for active profile.")}</span>`,
  // });
  // const activeProfileCombo = new Gtk.ComboBoxText({
  //   valign: Gtk.Align.CENTER,
  //   tooltip_text: _("Select profile to apply to all OSDs"),
  // });
  // profiles.forEach(p => {
  //   activeProfileCombo.append(p, p);
  // });
  // activeProfileCombo.connect('changed', (combo) => {
  //   let profileName = combo.get_active_id();
  //   log('active profile changed '+profileName);
  //   if(profileName != null){
  //     window._settings.set_string('active-profile', profileName);
  //     _setSettingsForActiveProfile(window, true);
  //   }
      
  // });
  // activeProfileCombo.set_active_id(window._settings.get_string('active-profile'));

  const activeProfileRow = new Adw.ComboRow({
      title: `<b>${_('Active Profile')}</b>`,
      subtitle: `<span allow_breaks="true">${_("This profile is applied to all OSDs. Go to Settings tab to view / edit settings for active profile.")}</span>`,
  });

  const activeProfileCombo = new Gtk.StringList();
  activeProfileCombo.splice(0,0,profiles);
  // activeProfileCombo.strings = profiles;
  activeProfileRow.model = activeProfileCombo;

  activeProfileRow.connect('notify::selected-item', (combo) => {
      if (window._resettingCombo) {
        window._resettingCombo = false;
        return;
      }

      let profileName = combo.selected_item.string;
      log('active profile changed '+profileName);
      if(profileName != null){
        window._settings.set_string('active-profile', profileName);
        _setSettingsForActiveProfile(window, true);
      }
  });
  activeProfileRow.selected = profiles.indexOf(window._settings.get_string('active-profile'));

log('active profile setting '+window._settings.get_string('active-profile'));
log('active profile combo '+activeProfileRow.selected_item.string);

  profilesActivables.push({'active-profile': activeProfileRow});
  // activeProfileRow.add_suffix(activeProfileCombo);
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

  // const deleteProfileRow = new Adw.ActionRow({
  //   title: _('Delete Profile'),
  // });
  // const deleteProfCombo = new Gtk.ComboBoxText({
  //   valign: Gtk.Align.CENTER,
  //   tooltip_text: _("Delete profile other than 'Default'"),
  // });
  // // deleteProfCombo.set_entry_text_column(0);
  // deleteProfCombo.append_text(_("Select profile to delete"));
  // profiles.forEach(p => {
  //   if (p != 'Default') deleteProfCombo.append_text(p);
  // });
  // deleteProfCombo.set_active(0);
  // profilesActivables.push({'delete-profile': deleteProfCombo});

  const deleteProfileRow = new Adw.ComboRow({
      title: _('Delete Profile'),
  });
  const deleteProfCombo = new Gtk.StringList();
  deleteProfCombo.append(_("Select profile to delete"));
  deleteProfCombo.splice(1,0,profiles);
  deleteProfCombo.splice(profiles.indexOf('Default')+1, 1, null);
  // deleteProfCombo.strings = profiles;
  deleteProfileRow.model = deleteProfCombo;
  deleteProfileRow.selected = 0;

  const deleteProfLabel = new Gtk.Label({
    use_markup: true,
    label: `<span size="large" color="#f44336">-</span>`,
  });
  const deleteProfBtn = new Gtk.Button({child: deleteProfLabel, valign: Gtk.Align.CENTER,});
  // deleteProfBtn.get_style_context().add_class('destructive-action');
  deleteProfBtn.connect('clicked', () => {
    let profileName = deleteProfileRow.selected_item.string;
    if (profileName != _("Select profile to delete")) {
      // show a message dialog asking for confirmation before deleting
      _deleteProfileDialog(window, profileName);
    }
  });
  
  deleteProfileRow.add_suffix(deleteProfBtn);
  profilesActivables.push({'delete-profile': deleteProfileRow});
  // deleteProfileRow.add_suffix(deleteProfCombo);
  manageProfilesGroup.add(deleteProfileRow);

  const importExportProfsGroup = new Adw.PreferencesGroup();
  profilesPage.add(importExportProfsGroup);

  const importExportProfLabelRow = new Adw.ActionRow({
    title: `<b>${_('Import/Export Profiles')}</b>`,
    subtitle: `<span allow_breaks="true">${_("Import or Export settings profiles to a file. Imported profiles will be added to existing ones. Profiles with same name will be overwriten.")}</span>`,
  });
  importExportProfsGroup.add(importExportProfLabelRow);

  const importExportProfRow = new Adw.ActionRow({
    // title: _('Profile'),
  });
  const importProfLabel = new Gtk.Label({
    use_markup: true,
    label: `<span color="#05c6d1">Import Profiles</span>`,
  });
  const importProfBtn = new Gtk.Button({child: importProfLabel, valign: Gtk.Align.CENTER,});
  importProfBtn.connect('clicked', () => {
    _importProfiles(window);
  });

  const exportProfLabel = new Gtk.Label({
    use_markup: true,
    label: `<span color="#05c6d1">Export Profiles</span>`,
  });
  const exportProfBtn = new Gtk.Button({child: exportProfLabel, valign: Gtk.Align.CENTER,});
  exportProfBtn.connect('clicked', () => {
    _exportProfiles(window);
  });

  importExportProfRow.add_prefix(importProfBtn);
  importExportProfRow.add_suffix(exportProfBtn);
  importExportProfsGroup.add(importExportProfRow);

  const presetProfsGroup = new Adw.PreferencesGroup();
  profilesPage.add(presetProfsGroup);

  const presetProfLabelRow = new Adw.ActionRow({
    title: `<b>${_('Profile Presets')}</b>`,
    subtitle: `<span allow_breaks="true">${_("You can find profile presets in github that you can download and import and tweak further to your liking. If you'd like to share your cool settings profiles, please export them to a file and raise a PR or issue in github.")}</span>`,
  });
  presetProfsGroup.add(presetProfLabelRow);

  const presetProfRow = new Adw.ActionRow({
    title: _('Profile Presets'),
  })
  const presetGithubBtn = new Gtk.LinkButton({
    label: _("Github"),
    uri: "https://github.com/neuromorph/custom-osd/tree/main/presets",
  });
  presetProfRow.add_suffix(presetGithubBtn);
  presetProfsGroup.add(presetProfRow);
}

// Export profiles to a JSON file
function _exportProfiles(window) {
  let fileChooser = new Gtk.FileChooserDialog({
      title: "Export Settings Profiles",
      action: Gtk.FileChooserAction.SAVE,
      transient_for: window,
  });
  fileChooser.add_button("Cancel", Gtk.ResponseType.CANCEL);
  fileChooser.add_button("Save", Gtk.ResponseType.ACCEPT);

  let filter = new Gtk.FileFilter();
  filter.add_pattern("*.json");
  filter.set_name("JSON files");
  fileChooser.add_filter(filter);

  fileChooser.connect('response', (self, response) => {
    if (response == Gtk.ResponseType.ACCEPT) {
      let filePath = fileChooser.get_file().get_path();
      let file = Gio.File.new_for_path(filePath);
      let profilesDict = window._settings.get_value('profiles'); 
      let [contents, len] = Json.gvariant_serialize_data(profilesDict); 
      // log('profs ' + contents + ' ' + len);

      if (len) {
          let output = file.replace(null, false, Gio.FileCreateFlags.NONE, null);
          let outputStream = Gio.BufferedOutputStream.new_sized(output, 4096);
          outputStream.write_all(contents, null);
          outputStream.close(null);
      }
      else {
        log("Failed to export profiles to file: " + filePath);
      }
    }
    fileChooser.destroy();
  });

  fileChooser.show();
  
}

// Import profiles from a JSON file
function _importProfiles(window) {
  let fileChooser = new Gtk.FileChooserDialog({
      title: "Import Settings Profiles",
      action: Gtk.FileChooserAction.OPEN,
      transient_for: window,
  });
  fileChooser.add_button("Cancel", Gtk.ResponseType.CANCEL);
  fileChooser.add_button("Open", Gtk.ResponseType.ACCEPT);

  let filter = new Gtk.FileFilter();
  filter.add_pattern("*.json");
  filter.set_name("JSON files");
  fileChooser.add_filter(filter);

  fileChooser.connect('response', (self, response) => {   
    if (response == Gtk.ResponseType.ACCEPT) {
      let filePath = fileChooser.get_file().get_path();
      if (filePath && GLib.file_test(filePath, GLib.FileTest.EXISTS)) {
        let file = Gio.File.new_for_path(filePath);
        let [ok, contents] = file.load_contents(null);

        if (ok) {
            contents = new TextDecoder().decode(contents);
            let importedProfs = Json.gvariant_deserialize_data(contents, -1, "a{sv}");  
            importedProfs = importedProfs.deep_unpack();
            let profilesDict = window._settings.get_value('profiles').deep_unpack();
            let profiles = Object.keys(importedProfs);
            profiles.forEach(profile => {
              profilesDict[profile] = importedProfs[profile]; 
            });
            window._settings.set_value('profiles', new GLib.Variant('a{sv}', profilesDict));
            _updateProfileCombo(window);
            // log('Profiles saved');
        } else {
            log("Failed to load profiles from file: " + filePath);
        }
      }
    }
    fileChooser.destroy();
  });

  fileChooser.show();
}

function _deleteProfileDialog(window, profileName){
  let dialog = new Gtk.MessageDialog({
    modal: true,
    text: _("Delete Profile?"),
    secondary_text: _("This will delete the settings profile: ")+profileName,
    transient_for: window,
  });
  // add buttons to dialog as 'Delete' and 'Cancel' with 'Cancel' as default
  dialog.add_button(_("Cancel"), Gtk.ResponseType.CANCEL);
  dialog.add_button(_("Delete"), Gtk.ResponseType.YES);
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
    log('profile name deleted: '+ profileName + ' active now: ' + window._settings.get_string('active-profile'));
    if (window._settings.get_string('active-profile') == profileName) { log('setting default as active');
      window._settings.set_string('active-profile', 'Default');
    }
    _updateProfileCombo(window);
  }
}

function _updateProfileCombo(window){
  let profilesDict = window._settings.get_value('profiles').deep_unpack();
  let profiles = Object.keys(profilesDict).sort();
  let activeProfileRow = window._activableWidgets['profiles'].find(x => Object.keys(x)[0] == 'active-profile')['active-profile'];
  let activeProfileCombo = activeProfileRow.model;
  // activeProfileCombo.remove_all();
  // profiles.forEach(p => {
  //   activeProfileCombo.append(p, p);
  // });
  // activeProfileCombo.set_active_id(window._settings.get_string('active-profile'));
  let numProfs = activeProfileCombo.get_n_items();
  window._resettingCombo = true;
  activeProfileCombo.splice(0, numProfs, profiles); log('idx of active prof ' + profiles.indexOf(window._settings.get_string('active-profile')));
  activeProfileRow.selected = profiles.indexOf(window._settings.get_string('active-profile')); log('selected '+activeProfileRow.selected);

  let deleteProfileRow = window._activableWidgets['profiles'].find(x => Object.keys(x)[0] == 'delete-profile')['delete-profile'];
  let deleteProfCombo = deleteProfileRow.model;
  // deleteProfCombo.remove_all();
  numProfs = deleteProfCombo.get_n_items();
  deleteProfCombo.splice(1, numProfs-1, profiles);
  deleteProfCombo.splice(profiles.indexOf('Default')+1, 1, null);
  // deleteProfCombo.append(_("Select profile to delete"));

  // profiles.forEach(p => {
  //   if (p != 'Default') deleteProfCombo.append_text(p);
  // });
  deleteProfileRow.selected = 0;
}

//-----------------------------------------------

function _getTitleLabel(){
  return new Gtk.Label({
    use_markup: true,
    label: `<span size="x-large" weight="heavy" color="#05c6d1">${_("Custom OSD")}</span>`,
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
  • ${_(`In Profiles tab, create new profiles with default settings.`)}
  • ${_(`Select a profile as Active and edit its settings in Settings tab.`)}
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
    title: _('Contribute'),
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
  dialog.add_button(_("Cancel"), Gtk.ResponseType.CANCEL);
  dialog.add_button(_("Reset"), Gtk.ResponseType.YES);
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
    subtitle: _("Edit settings for active profile and hit [ ✔ Save ] to save them."),
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
    label: `<span color="#05c6d1">✓ ${_("Save")}</span>`, // color="#07c8d3"
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
    label: `<span >${_("Save As")}</span>`, //color="#8f8f14"
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
  dialog.add_button(_("Cancel"), Gtk.ResponseType.CANCEL);
  dialog.add_button(_("Save"), Gtk.ResponseType.YES);
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
        window._settings.set_string('active-profile', profileName);
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
  
}
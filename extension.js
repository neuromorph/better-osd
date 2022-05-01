const Main = imports.ui.main;
const OsdWindow = imports.ui.osdWindow;
const OsdWindowManager = Main.osdWindowManager;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

//------------------------------------------------

function init() {
  ExtensionUtils.initTranslations();
}

//------------------------------------------------

function style() {
  for (
    let monitorIndex = 0;
    monitorIndex < OsdWindowManager._osdWindows.length;
    monitorIndex++
  ) {
    OsdWindowManager._osdWindows[monitorIndex]._hbox.add_style_class_name(
      "osd-transparency"
    );
  }
}

function unstyle() {
  for (
    let monitorIndex = 0;
    monitorIndex < OsdWindowManager._osdWindows.length;
    monitorIndex++
  ) {
    OsdWindowManager._osdWindows[monitorIndex]._hbox.remove_style_class_name(
      "osd-transparency"
    );
  }
}

//------------------------------------------------

function injectToFunction(parent, name, func) {
  let origin = parent[name];
  parent[name] = function () {
    let ret;
    ret = origin.apply(this, arguments);
    if (ret === undefined) ret = func.apply(this, arguments);
    return ret;
  };
  return origin;
}

function removeInjection(object, injection, name) {
  if (injection[name] === undefined) delete object[name];
  else object[name] = injection[name];
}

let injections = [];
let _id;

//---------------------------------------------

function enable() {
  let _settings = ExtensionUtils.getSettings(
    "org.gnome.shell.extensions.better-osd"
  );

  style();
  _id = Main.layoutManager.connect("monitors-changed", this.style.bind(this));

  injections["show"] = injectToFunction(
    OsdWindow.OsdWindow.prototype,
    "show",
    function () {
      let monitor = Main.layoutManager.monitors[this._monitorIndex];
      let h_percent = _settings.get_int("horizontal");
      let v_percent = _settings.get_int("vertical");
      let osd_size = _settings.get_int("size");
      let hide_delay = _settings.get_int("delay");
      let transparency = _settings.get_boolean("transparency");
      transparency ? style() : unstyle();

      this._hbox.translation_x = (h_percent * monitor.width) / 100;
      this._hbox.translation_y = (v_percent * monitor.height) / 100;

      this._icon.icon_size = (osd_size * monitor.height) / 100 / 2;
      this._hboxConstraint._minSize = (osd_size * monitor.height) / 100;

      imports.ui.osdWindow.HIDE_TIMEOUT = hide_delay;
    }
  );
}

function disable() {
  unstyle();
  Main.layoutManager.disconnect(_id);

  let arrayOSD = Main.osdWindowManager._osdWindows;
  for (let i = 0; i < arrayOSD.length; i++) {
    arrayOSD[i]._relayout();
    arrayOSD[i]._hbox.translation_x = 0;
    imports.ui.osdWindow.HIDE_TIMEOUT = 1500;
  }

  removeInjection(OsdWindow.OsdWindow.prototype, injections, "show");
}

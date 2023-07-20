const Main = imports.ui.main;
const OsdWindow = imports.ui.osdWindow;
const OsdWindowManager = Main.osdWindowManager;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();


function init() {
  ExtensionUtils.initTranslations();
}


function style(color, bgcolor, alpha, shadow, rotate) {

  let red = parseInt(parseFloat(color[0]) * 255);
  let green = parseInt(parseFloat(color[1]) * 255);
  let blue = parseInt(parseFloat(color[2]) * 255);
  
  let bgred = parseInt(parseFloat(bgcolor[0]) * 255);
  let bggreen = parseInt(parseFloat(bgcolor[1]) * 255);
  let bgblue = parseInt(parseFloat(bgcolor[2]) * 255);

  alpha = parseFloat(alpha/100.0);

  let sty = `background-color: rgba(${bgred},${bggreen},${bgblue},${alpha}); color: rgb(${red},${green},${blue});`; 
  if (!shadow) sty = sty + ' box-shadow: none;';
  let levelsty = `-barlevel-active-background-color: rgb(${red},${green},${blue}); background-color: rgba(${red},${green},${blue},0.1);`;

  for (
    let monitorIndex = 0;
    monitorIndex < OsdWindowManager._osdWindows.length;
    monitorIndex++
  ) {
    OsdWindowManager._osdWindows[monitorIndex]._hbox.add_style_class_name(
      "osd-style"
    );
    OsdWindowManager._osdWindows[monitorIndex]._hbox.style = sty;
    if (rotate){
      OsdWindowManager._osdWindows[monitorIndex]._hbox.rotation_angle_z = -90.0;
    }
    else {
      OsdWindowManager._osdWindows[monitorIndex]._hbox.rotation_angle_z = 0;
    }
    OsdWindowManager._osdWindows[monitorIndex]._level.style = levelsty;

  }
}

function unCustom() {
  for (
    let monitorIndex = 0;
    monitorIndex < OsdWindowManager._osdWindows.length;
    monitorIndex++
  ) {
    OsdWindowManager._osdWindows[monitorIndex]._hbox.remove_style_class_name(
      "osd-style"
    );
    OsdWindowManager._osdWindows[monitorIndex]._hbox.style = '';
    OsdWindowManager._osdWindows[monitorIndex]._hbox.rotation_angle_z = 0;
    OsdWindowManager._osdWindows[monitorIndex]._level.style = '';

    OsdWindowManager._osdWindows[monitorIndex]._hbox.translation_x = 0;
    OsdWindowManager._osdWindows[monitorIndex]._hbox.translation_y = 0;
    OsdWindowManager._osdWindows[monitorIndex]._icon.icon_size = _size;

  }
}


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
let _first_run = true;
let _size;


function enable() {

  let _settings = ExtensionUtils.getSettings(
    "org.gnome.shell.extensions.custom-osd"
  );

  injections["show"] = injectToFunction(
    OsdWindow.OsdWindow.prototype,
    "show",
    function () {

      let monitor = Main.layoutManager.monitors[this._monitorIndex];
      let h_percent = _settings.get_int("horizontal");
      let v_percent = _settings.get_int("vertical");
      let osd_size = _settings.get_int("size");
      let hide_delay = _settings.get_int("delay");
      OsdWindow.HIDE_TIMEOUT = hide_delay;
      
      let color = _settings.get_strv("color");
      let bgcolor = _settings.get_strv("bgcolor");
      let alpha = _settings.get_int("alpha");
      let shadow = _settings.get_boolean("shadow");
      let rotate = _settings.get_boolean("rotate");
      style(color, bgcolor, alpha, shadow, rotate);

      this._hbox.translation_x = (h_percent * monitor.width) / 100;
      this._hbox.translation_y = (v_percent * monitor.height) / 100;

      if (_first_run) {
        _size = this._icon.icon_size;
        _first_run = false;
      }
      this._icon.icon_size = (osd_size * monitor.height) / 100 / 2;

    }
  );

}

function disable() {

  unCustom();
  OsdWindow.HIDE_TIMEOUT = 1500;
  
  removeInjection(OsdWindow.OsdWindow.prototype, injections, "show");
  
}

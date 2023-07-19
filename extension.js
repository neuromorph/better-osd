const Main = imports.ui.main;
const OsdWindow = imports.ui.osdWindow;
const OsdWindowManager = Main.osdWindowManager;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();


function init() {
  ExtensionUtils.initTranslations();
}


function style(red, green, blue, alpha) {
  for (
    let monitorIndex = 0;
    monitorIndex < OsdWindowManager._osdWindows.length;
    monitorIndex++
  ) {
    OsdWindowManager._osdWindows[monitorIndex]._hbox.add_style_class_name(
      "osd-style"
    );
    sty = 'background-color: rgba('+red+','+green+','+blue+','+alpha+');'; 
    OsdWindowManager._osdWindows[monitorIndex]._hbox.style = sty;

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

    OsdWindowManager._osdWindows[monitorIndex]._hbox.translation_x = 0;
    OsdWindowManager._osdWindows[monitorIndex]._hbox.translation_y = 0;
    OsdWindowManager._osdWindows[monitorIndex]._icon.icon_size = _size[monitorIndex];

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
let _id;
let _size = [];


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
      let red = parseFloat(color[0]);
      red = parseInt(red*255);
      let green = parseFloat(color[1]);
      green = parseInt(green*255);
      let blue = parseFloat(color[2]);
      blue = parseInt(blue*255);
      let alpha = _settings.get_int("alpha");
      alpha = parseFloat(alpha/100.0);
      style(red, green, blue, alpha);

      this._hbox.translation_x = (h_percent * monitor.width) / 100;
      this._hbox.translation_y = (v_percent * monitor.height) / 100;

      _size.push(this._icon.icon_size);
      this._icon.icon_size = (osd_size * monitor.height) / 100 / 2;
      this._hboxConstraint._minSize = (osd_size * monitor.height) / 100

    }
  );

}

function disable() {

  unCustom();
  OsdWindow.HIDE_TIMEOUT = 1500;
  
  removeInjection(OsdWindow.OsdWindow.prototype, injections, "show");
  
}

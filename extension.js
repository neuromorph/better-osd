const Clutter = imports.gi.Clutter;
const St = imports.gi.St;
const GObject = imports.gi.GObject;
const GLib = imports.gi.GLib;
const Gio = imports.gi.Gio;
const Main = imports.ui.main;
const OsdWindow = imports.ui.osdWindow;
const OsdWindowManager = Main.osdWindowManager;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const COSD_SCHEMA = "org.gnome.shell.extensions.custom-osd";

class CustomOSDExtension {
  constructor() {
    this._schema = COSD_SCHEMA;
    this._settings = null;
    this._injections = [];
    this._custOSDIcon = null;
    this._restoreIconSize = null;
    this._restoreHideTimeout = 1500;
  }


  _injectToFunction(parent, name, func) {
    let origin = parent[name];
    parent[name] = function () {
      let ret;
      ret = origin.apply(this, arguments);
      if (ret === undefined) ret = func.apply(this, arguments);
      return ret;
    };
    return origin;
  }


  _removeInjection(object, injection, name) {
    if (injection[name] === undefined) delete object[name];
    else object[name] = injection[name];
  }


  _syncSettings(settingChanged){

    const icon = this._settings.get_boolean("icon");
    const osd_size = this._settings.get_int("size");
    const hide_delay = this._settings.get_int("delay");
    const color = this._settings.get_strv("color");
    const bgcolor = this._settings.get_strv("bgcolor");
    const salpha = this._settings.get_int("alpha");
    const shadow = this._settings.get_boolean("shadow");
    const border = this._settings.get_boolean("border");
    const rotate = this._settings.get_boolean("rotate");

    const red = parseInt(parseFloat(color[0]) * 255);
    const green = parseInt(parseFloat(color[1]) * 255);
    const blue = parseInt(parseFloat(color[2]) * 255);
    
    const bgred = parseInt(parseFloat(bgcolor[0]) * 255);
    const bggreen = parseInt(parseFloat(bgcolor[1]) * 255);
    const bgblue = parseInt(parseFloat(bgcolor[2]) * 255);
  
    const alpha = parseFloat(salpha/100.0);
  
    OsdWindow.HIDE_TIMEOUT = hide_delay;

    for (
      let monitorIndex = 0;
      monitorIndex < OsdWindowManager._osdWindows.length;
      monitorIndex++
    ) {

      let osdW = OsdWindowManager._osdWindows[monitorIndex];

      if(!osdW._levLabel){
        osdW._levLabel = new St.Label({
          name: 'levLabel',
          x_align: Clutter.ActorAlign.CENTER,
          y_align: Clutter.ActorAlign.CENTER,
        });
        osdW._level.bind_property_full(
          'value',
          osdW._levLabel,
          'text',
          GObject.BindingFlags.SYNC_CREATE,
          (__, v) => [true, (v * 100).toFixed()],
          null
        );
        osdW._hbox.insert_child_above(osdW._levLabel, osdW._vbox);
      }

      if (rotate){
        osdW._hbox.set_pivot_point(0.5,0.5);
        osdW._hbox.rotation_angle_z = -90.0;
        
        osdW._levLabel.set_pivot_point(0.5,0.5);  
        osdW._levLabel.rotation_angle_z = 90.0;
      }
      else {
        osdW._hbox.set_pivot_point(0.5,0.5);
        osdW._hbox.rotation_angle_z = 0;
    
        osdW._levLabel.set_pivot_point(0.5,0.5);
        osdW._levLabel.rotation_angle_z = 0.0;
      }

      let monitor = Main.layoutManager.monitors[monitorIndex];
      osdW._icon.icon_size = 20 + (osd_size/100 * monitor.height/10); 

      osdW._hbox.add_style_class_name(
        "osd-style"
      );

      let hboxSty = `background-color: rgba(${bgred},${bggreen},${bgblue},${alpha}); color: rgb(${red},${green},${blue}); margin: 0px;`; 
      if (!shadow) hboxSty += ' box-shadow: none;';
      if (border) hboxSty += ` border-color: rgba(${red},${green},${blue},0.6); border-width: ${parseInt(3 + osd_size*0.08)}px;`;
      
      osdW._hbox.style = hboxSty;

      osdW._label.style = ` font-size: ${14 + osd_size*0.5}px;  font-weight: normal; color: rgba(${red},${green},${blue},0.9); `; 
      osdW._level.style = ` min-width: ${40 + osdW._icon.icon_size*2.5}px; -barlevel-active-background-color: rgb(${red},${green},${blue}); -barlevel-background-color: rgba(${red},${green},${blue},0.1); `;
      osdW._levLabel.style = ` font-size: ${15 + osd_size*0.6}px; font-weight: bold; min-width: ${30 + osd_size*2.0}px; `; 

      osdW.y_align = Clutter.ActorAlign.CENTER;

      icon? osdW._icon.visible = true : osdW._icon.visible = false;      

    }

    if(settingChanged) OsdWindowManager.show(-1, this._custOSDIcon, "Custom OSD", 1.0, 1.0);

  }


  _unCustomOSD() {

    for (
      let monitorIndex = 0;
      monitorIndex < OsdWindowManager._osdWindows.length;
      monitorIndex++
    ) {

      let osdW = OsdWindowManager._osdWindows[monitorIndex];

      osdW._hbox.remove_style_class_name(
        "osd-style"
      );
      osdW._hbox.style = '';
      osdW._hbox.rotation_angle_z = 0;
      osdW._hbox.set_pivot_point(0.0,0.0);

      osdW._hbox.remove_child(osdW._levLabel);
      delete osdW._levLabel;

      osdW._hbox.translation_x = 0;
      osdW._hbox.translation_y = 0;
      osdW._hbox.visible = true;
  
      osdW._label.style = '';
      osdW._level.style = '';
      osdW._icon.icon_size = this._restoreIconSize;

      osdW.y_align = Clutter.ActorAlign.END;

    }
  }


  enable() {
    
    let custOSD = this;
    this._custOSDIcon = Gio.ThemedIcon.new_with_default_fallbacks('preferences-color-symbolic');

    this._settings = ExtensionUtils.getSettings(this._schema);
    this._settings.connect(`changed`, () => this._syncSettings(true));
    Main.layoutManager.connect('monitors-changed', () => this._syncSettings(false));
    this._syncSettings(false);

    this._restoreIconSize = OsdWindowManager._osdWindows[0]._icon.icon_size;
    this._restoreHideTimeout = OsdWindow.HIDE_TIMEOUT;
 
    this._injections["show"] = this._injectToFunction(
      OsdWindow.OsdWindow.prototype,
      "show",
      function () {
  
        let monitor = Main.layoutManager.monitors[this._monitorIndex];
        let monitors = custOSD._settings.get_string("monitors");
  
        if (monitors == "primary" && monitor != Main.layoutManager.primaryMonitor){
          this.cancel();
          return;
        }
        else if (monitors == "external" && monitor == Main.layoutManager.primaryMonitor){
          this.cancel();
          return;
        }

        const numeric = custOSD._settings.get_boolean("numeric");
        numeric? this._levLabel.visible = this._level.visible : this._levLabel.visible = false;

        const level = custOSD._settings.get_boolean("level");
        if(!level){
          this._level.visible = false;
        }
  
        const label = custOSD._settings.get_boolean("label");
        if(!label){
          this._label.visible = false;
        }

        const h_percent = custOSD._settings.get_double("horizontal");
        const v_percent = custOSD._settings.get_double("vertical");
        const bradius = custOSD._settings.get_int("bradius");
        const rotate = custOSD._settings.get_boolean("rotate");       

        let hbxH = this._hbox.height; 
        this._hbox.style += ` border-radius: ${bradius*hbxH/2/100}px;`;

        let hbxW = this._hbox.width; 

        if (rotate){ 
          let o_hbxH = hbxH;        
          hbxH = hbxW;
          hbxW = o_hbxH;
        }

        let transX = h_percent * (monitor.width - hbxW)/100.0;
        this._hbox.translation_x = transX;

        let transY = v_percent * (monitor.height - hbxH)/100.0;
        this._hbox.translation_y = transY;

      }
    );
  
  }


  disable() {

    this._unCustomOSD();
    this._settings = null;
    this._custOSDIcon = null;
    
    OsdWindow.HIDE_TIMEOUT = this._restoreHideTimeout;

    this._removeInjection(OsdWindow.OsdWindow.prototype, this._injections, "show");
    this._injections = [];
    
  }

}


function init() {
  ExtensionUtils.initTranslations();
  return new CustomOSDExtension();
}
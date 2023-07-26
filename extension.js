const Clutter = imports.gi.Clutter;
const St = imports.gi.St;
const GObject = imports.gi.GObject;
const GLib = imports.gi.GLib;
const Main = imports.ui.main;
const OsdWindow = imports.ui.osdWindow;
const OsdWindowManager = Main.osdWindowManager;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();


class CustomOSDExtension {
  constructor() {
    this._injections = [];
    this._firstRun = true;
    this._iconSize;
    this._hideTimeout = 1500;
    this._monIds = [];
  }

  customOSD(color, bgcolor, salpha, shadow, border, rotate, osd_size, bradius, monitorIndex) {

    const red = parseInt(parseFloat(color[0]) * 255);
    const green = parseInt(parseFloat(color[1]) * 255);
    const blue = parseInt(parseFloat(color[2]) * 255);
    
    const bgred = parseInt(parseFloat(bgcolor[0]) * 255);
    const bggreen = parseInt(parseFloat(bgcolor[1]) * 255);
    const bgblue = parseInt(parseFloat(bgcolor[2]) * 255);
  
    const alpha = parseFloat(salpha/100.0);
  
    let osdW = OsdWindowManager._osdWindows[monitorIndex];
    let ll = osdW._hbox.find_child_by_name('levLabel');
  
    let sty = `background-color: rgba(${bgred},${bggreen},${bgblue},${alpha}); color: rgb(${red},${green},${blue}); border-radius: ${bradius}px;`; 
    if (!shadow) sty += ' box-shadow: none;';
    if (border) sty += ` border-color: rgb(${red},${green},${blue});`;
      
    osdW._hbox.add_style_class_name(
      "osd-style"
    );
    osdW._hbox.style = sty;
  
    osdW._label.style = ` font-size: ${12 + osd_size*0.5}px;`;
    if (ll != null) ll.style = ` font-size: ${12 + osd_size*0.75}px; font-weight: bold; min-width: ${20 + osd_size}px;`;
    osdW._level.style = `-barlevel-active-background-color: rgb(${red},${green},${blue}); background-color: rgba(${red},${green},${blue},0.1);`;
  
    if (rotate){
      osdW._hbox.set_pivot_point(0.5,0.5);
      osdW._hbox.rotation_angle_z = -90.0;
      
      if (ll != null) {
        ll.set_pivot_point(0.5,0.5);  
        ll.rotation_angle_z = 90.0;
      }
    }
    else {
      osdW._hbox.set_pivot_point(0.5,0.5);
      osdW._hbox.rotation_angle_z = 0;
  
      if (ll != null) {
        ll.set_pivot_point(0.5,0.5);
        ll.rotation_angle_z = 0.0;
      }
    }
  
  }

  _unCustomOSD() {

    let osdW;
    for (
      let monitorIndex = 0;
      monitorIndex < OsdWindowManager._osdWindows.length;
      monitorIndex++
    ) {
      osdW = OsdWindowManager._osdWindows[monitorIndex];
      osdW._hbox.remove_style_class_name(
        "osd-style"
      );
      osdW._hbox.style = '';
      osdW._hbox.rotation_angle_z = 0;
      osdW._hbox.set_pivot_point(0.0,0.0);
      let ll = osdW._hbox.find_child_by_name('levLabel');
      if (ll != null) osdW._hbox.remove_child(ll);
      osdW._hbox.translation_x = 0;
      osdW._hbox.translation_y = 0;
      osdW._hbox.visible = true;
  
      osdW._label.style = '';
      osdW._level.style = '';
      osdW._icon.icon_size = this._iconSize;

      osdW.y_align = Clutter.ActorAlign.END;
      if (osdW._hideTimeoutId)
            GLib.source_remove(osdW._hideTimeoutId);
    }
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

  enable() {
    
    let custOSD = this;
    let _settings = ExtensionUtils.getSettings(
      "org.gnome.shell.extensions.custom-osd"
    );
  
    this._injections["show"] = this._injectToFunction(
      OsdWindow.OsdWindow.prototype,
      "show",
      function () {
  
        let monitor = Main.layoutManager.monitors[this._monitorIndex];
        let monitors = _settings.get_string("monitors");
  
        if (monitors == "primary" && monitor != Main.layoutManager.primaryMonitor){
          this._hbox.visible = false;
          return;
        }
        else if (monitors == "external" && monitor == Main.layoutManager.primaryMonitor){
          this._hbox.visible = false;
          return;
        }
        this._hbox.visible = true;
  
        const osd_size = _settings.get_int("size");
        const h_percent = _settings.get_double("horizontal");
        const v_percent = _settings.get_double("vertical");
        const hide_delay = _settings.get_int("delay");
        const color = _settings.get_strv("color");
        const bgcolor = _settings.get_strv("bgcolor");
        const alpha = _settings.get_int("alpha");
        const shadow = _settings.get_boolean("shadow");
        const border = _settings.get_boolean("border");
        let bradius = _settings.get_int("bradius");
        const rotate = _settings.get_boolean("rotate");
        const l_label = _settings.get_boolean("label");
  
        if (custOSD._firstRun) {
          custOSD._iconSize = this._icon.icon_size;
          custOSD._hideTimeout = OsdWindow.HIDE_TIMEOUT;
          custOSD._firstRun = false;
        } 

        if(OsdWindow.HIDE_TIMEOUT != hide_delay){
          OsdWindow.HIDE_TIMEOUT = hide_delay;
          if (this._hideTimeoutId)
            GLib.source_remove(this._hideTimeoutId);
          this._hideTimeoutId = GLib.timeout_add(
              GLib.PRIORITY_DEFAULT, OsdWindow.HIDE_TIMEOUT, this._hide.bind(this));
          GLib.Source.set_name_by_id(this._hideTimeoutId, '[gnome-shell] this._hide');
        }
  
        if (l_label) {
          if(!custOSD._monIds.includes(this._monitorIndex)){
          
            this._levLabel = new St.Label({
              name: 'levLabel',
              x_align: Clutter.ActorAlign.CENTER,
              y_align: Clutter.ActorAlign.CENTER,
            });
            this._level.bind_property_full(
              'value',
              this._levLabel,
              'text',
              GObject.BindingFlags.SYNC_CREATE,
              (__, v) => [true, (v * 100).toFixed()],
              null
            );
            this._hbox.insert_child_above(this._levLabel, this._vbox);
            custOSD._monIds.push(this._monitorIndex);
          }
          this._hbox.find_child_by_name('levLabel').visible = this._level.visible;
        }
        else {
          let ll = this._hbox.find_child_by_name('levLabel');
          if (ll != null) ll.visible = false;
        }
  
        this._icon.icon_size = 20 + (osd_size/100 * monitor.height/10) ; 

        this.y_align = Clutter.ActorAlign.CENTER;

        let hbxW = this._hbox.width;
        let hbxH = this._hbox.get_preferred_height(this._hbox.width)[0]; 
        hbxH = hbxH/2.0;
        bradius = bradius*hbxH/100.0;
        
        custOSD.customOSD(color, bgcolor, alpha, shadow, border, rotate, osd_size, bradius, this._monitorIndex);

        if (rotate){ 
          let o_hbxH = hbxH;        
          hbxH = hbxW;
          hbxW = o_hbxH;
        }

        // let mtop = this._hbox.margin_top;
        let mbot = this._hbox.margin_bottom;
        if (v_percent<0) hbxH += mbot;
        if (v_percent>0) hbxH -= mbot;

        let transX = h_percent * (monitor.width - hbxW)/100.0;
        this._hbox.translation_x = transX;

        let transY = v_percent * (monitor.height - hbxH)/100.0;
        this._hbox.translation_y = transY;

      }
    );
  

  }

  disable() {

    this._unCustomOSD();
    this._monIds = [];
    OsdWindow.HIDE_TIMEOUT = this._hideTimeout;

    this._removeInjection(OsdWindow.OsdWindow.prototype, this._injections, "show");
    
  }

}


function init() {
  ExtensionUtils.initTranslations();
  return new CustomOSDExtension();
}
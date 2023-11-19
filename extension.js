import Clutter from 'gi://Clutter';
import St from 'gi://St';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import GObject from 'gi://GObject';
import Meta from 'gi://Meta';
import Shell from 'gi://Shell';
import Pango from 'gi://Pango';
import GnomeDesktop from 'gi://GnomeDesktop';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as OsdWindow from 'resource:///org/gnome/shell/ui/osdWindow.js';

import {Extension, gettext as _, pgettext} from 'resource:///org/gnome/shell/extensions/extension.js';

const OsdWindowManager = Main.osdWindowManager;

export default class CustomOSDExtension extends Extension {
  constructor(metadata) {
    super(metadata);
    this._settings = null;
    this._injections = [];
    this._custOSDIcon = null;
    this._timeOSDIcon = null;
    this._restoreIconSize = null;
    this._resources = null;
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

  _getDateTime() {
    let date = new Date();
    let dayname = date.toLocaleString("en-us", { weekday: "short" });
    // let month = date.toLocaleString("en-us", { month: "short" });
    let day = date.getDate();
    // let year = date.getFullYear();
    let strDate = `${dayname} ${day}`;

    let hours = date.getHours();
    let minutes = date.getMinutes();
    let ampm = hours >= 12 ? pgettext('evening time',"PM") : pgettext('morning time',"AM");
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    minutes = minutes < 10 ? "0" + minutes : minutes;
    let strTime = hours + ":" + minutes + " " + ampm;
    
    return " " + strDate + "   " + strTime + " ";
  }

  _showOSD(osd) {
    if (osd == "Test OSD") OsdWindowManager.show(-1, this._custOSDIcon, _("Custom OSD"), 1.0, 1.0);
    if (osd == "Clock OSD") {
      let clock = new GnomeDesktop.WallClock();
      OsdWindowManager.show(-1, this._timeOSDIcon, clock.clock);
    }
  }
  
  _createLevLabel(osdW){
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

  _setOSDOrientation(osdW, rotate){
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
  }

  _syncSettings(settingChanged){

    const icon = this._settings.get_boolean("icon");
    const osd_size = this._settings.get_double("size");
    const color = this._settings.get_strv("color");
    const bgcolor = this._settings.get_strv("bgcolor");
    const bgcolor2 = this._settings.get_strv("bgcolor2");
    const gradientDirection = this._settings.get_string("gradient-direction");
    const bgeffect = this._settings.get_string("bg-effect");
    const alphaPct = this._settings.get_double("alpha");
    const shadow = this._settings.get_boolean("shadow");
    const border = this._settings.get_boolean("border");
    const rotate = this._settings.get_boolean("rotate");
    const font = this._settings.get_string("font");
    const bradius = this._settings.get_double("bradius");

    const red = parseInt(parseFloat(color[0]) * 255);
    const green = parseInt(parseFloat(color[1]) * 255);
    const blue = parseInt(parseFloat(color[2]) * 255);
    const falpha = parseFloat(color[3]);
    
    const bgred = parseInt(parseFloat(bgcolor[0]) * 255);
    const bggreen = parseInt(parseFloat(bgcolor[1]) * 255);
    const bgblue = parseInt(parseFloat(bgcolor[2]) * 255);

    const bgred2 = parseInt(parseFloat(bgcolor2[0]) * 255);
    const bggreen2 = parseInt(parseFloat(bgcolor2[1]) * 255);
    const bgblue2 = parseInt(parseFloat(bgcolor2[2]) * 255);    
  
    const alpha = parseFloat(alphaPct/100.0);
  
    for (
      let monitorIndex = 0;
      monitorIndex < OsdWindowManager._osdWindows.length;
      monitorIndex++
    ) {

      let osdW = OsdWindowManager._osdWindows[monitorIndex];

      if(!osdW._levLabel) this._createLevLabel(osdW);

      this._setOSDOrientation(osdW, rotate);
      
      let monitor = Main.layoutManager.monitors[monitorIndex];
      osdW._icon.icon_size = 20 + (osd_size/100 * monitor.height/10); 
      osdW._icon.y_align = Clutter.ActorAlign.CENTER;
      
      osdW._hbox.add_style_class_name(
        "osd-style"
      );

      let pad = parseInt(5 + osd_size*0.3);
      let thickness = parseInt(3 + osd_size*0.08); 
      let hboxSty = ` background-color: rgba(${bgred},${bggreen},${bgblue},${alpha}); color: rgba(${red},${green},${blue},${falpha}); 
                    padding: ${pad}px ${0.7*pad}px ${pad}px ${1.3*pad}px; margin: 0px;`;
      
      if (!shadow) hboxSty += ' box-shadow: none;';
      else if (bradius > -60 && bradius < 60) {
        if (bgeffect == "none")
          hboxSty += ` box-shadow: 0 1px 8px -4px rgba(50, 50, 50, ${0.45*alpha});`; 
        else
          hboxSty += ` box-shadow: 0 1px 8px -14px rgba(50, 50, 50, ${0.45*alpha});`; 
      }
      else {
          hboxSty += ` box-shadow: 0 1px 8px -1px rgba(50, 50, 50, ${0.45*alpha});`;
      }

      if (border) hboxSty += ` border-color: rgba(${red},${green},${blue},${0.6*falpha}); border-width: ${0.7*thickness}px;`;
      else hboxSty += ' border-width: 0px; border-color: transparent;';

      if (bgeffect == "gradient") hboxSty += ` background-gradient-start: rgba(${bgred},${bggreen},${bgblue},${alpha});  
                    background-gradient-end: rgba(${bgred2},${bggreen2},${bgblue2},${alpha}); background-gradient-direction: ${gradientDirection}; 
                    border-width: ${0.4*thickness}px; border-color: white darkgray black lightgray;`;
      else if (bgeffect == "dynamic-blur") {
        hboxSty += `box-shadow: none; background-color: transparent; border-width: ${0.4*thickness}px; border-color: white darkgray black lightgray;`;
        osdW._hbox.effect = new Shell.BlurEffect({name: 'customOSD-dynamic'});
        const effect = osdW._hbox.get_effect('customOSD-dynamic');
        if (effect) {
          effect.set({
              brightness: 0.8,
              sigma: 25,
              mode: Shell.BlurMode.BACKGROUND, 
          });
        }
      }
      else if (bgeffect != "none") {
        let resource;
        if (bgeffect == "glass") {
          hboxSty += ` border-width: ${0.4*thickness}px; border-color: white darkgray black lightgray;`; 
          resource = `${bgeffect}.png`;
        }
        else {
          hboxSty += ` border-width: ${0.4*thickness}px; border-color: white darkgray black lightgray;`;
          resource = `${bgeffect}.jpg`; 
        }
        hboxSty += ` background-image: url("resource:///org/gnome/shell/extensions/custom-osd/media/${resource}"); 
                    background-repeat: no-repeat; background-size: cover;`;
      }
      if (bgeffect != "dynamic-blur") {
        const effect = osdW._hbox.get_effect('customOSD-dynamic');
        if (effect) {
          osdW._hbox.remove_effect_by_name('customOSD-dynamic');
        }
      }

      
      // osdW._label.x_align = Clutter.ActorAlign.CENTER;
      osdW._label.style = ` font-size: ${14 + osd_size*0.4}px;  font-weight: normal; color: rgba(${red},${green},${blue},${0.95*falpha}); `; 
      osdW._level.style = ` height: ${thickness}px; -barlevel-height: ${thickness}px; min-width: ${30 + osdW._icon.icon_size*2.5}px; 
      -barlevel-active-background-color: rgba(${red},${green},${blue},${falpha}); -barlevel-background-color: rgba(${red},${green},${blue},0.12); `; 
      osdW._levLabel.style = ` font-size: ${15 + osd_size*0.6}px; font-weight: bold; min-width: ${30 + osd_size*1.65}px; `; 

      if (font != ""){
        let fontDesc = Pango.font_description_from_string(font); 
        let fontFamily = fontDesc.get_family();
        let fontSize = fontDesc.get_size() / Pango.SCALE;
        let fontWeight;
        try{
          fontWeight = fontDesc.get_weight();
        }catch(e){
          fontWeight = Math.round(fontWeight/100)*100;
        }
        hboxSty += ` font-family: ${fontFamily}; `;
        osdW._label.style += ` font-size: ${fontSize + osd_size*0.3}px; font-weight: ${fontWeight}; `; 
      }
      
      osdW._hbox.style = hboxSty;

      osdW.y_align = Clutter.ActorAlign.CENTER;  

    }

    if(settingChanged) this._showOSD('Test OSD');

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

      if (osdW._hideTimeoutId)
        GLib.source_remove(osdW._hideTimeoutId);

      const effect = osdW._hbox.get_effect('customOSD-dynamic');
      if (effect) {
        osdW._hbox.remove_effect_by_name('customOSD-dynamic');
      }

      if (osdW._blurTimeoutId) {
        Meta.remove_clutter_debug_flags(null, Clutter.DrawDebugFlag.DISABLE_CLIPPED_REDRAWS, null);
        GLib.source_remove(osdW._blurTimeoutId);
        osdW._blurTimeoutId = null;
      }

    }
  }


  enable() {
    
    let custOSD = this;

    this._resources = Gio.Resource.load(this.path + '/resources/custom-osd.gresource');
    Gio.resources_register(this._resources);

    this._custOSDIcon = Gio.ThemedIcon.new_with_default_fallbacks('preferences-color-symbolic');
    this._timeOSDIcon = Gio.ThemedIcon.new_with_default_fallbacks('preferences-system-time-symbolic');

    this._settings = this.getSettings(); 

    this._monitorsChangedId = Main.layoutManager.connect('monitors-changed', () => this._syncSettings(false));
    this._settings.connect(`changed`, () => this._syncSettings(true));
    this._syncSettings(false);

    Main.wm.addKeybinding(
      "clock-osd",
      this._settings,
      Meta.KeyBindingFlags.NONE,
      Shell.ActionMode.NORMAL,
      this._showOSD.bind(this, 'Clock OSD')
    );

    this._restoreIconSize = OsdWindowManager._osdWindows[0]._icon.icon_size;
 
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

        let hide_delay = custOSD._settings.get_double("delay");
        if (this._hideTimeoutId)
            GLib.source_remove(this._hideTimeoutId);
        this._hideTimeoutId = GLib.timeout_add(
            GLib.PRIORITY_DEFAULT, hide_delay, this._hide.bind(this));
        GLib.Source.set_name_by_id(this._hideTimeoutId, '[gnome-shell] this._hide');

        let icon, label, level, numeric;
        if (this._label.visible && this._level.visible){
          let osdTypeDict = custOSD._settings.get_value("osd-all").deep_unpack();
          icon = osdTypeDict["icon-all"];
          label = osdTypeDict["label-all"];
          level = osdTypeDict["level-all"];
          numeric = osdTypeDict["numeric-all"];
        }
        else if (!this._label.visible && this._level.visible){
          let osdTypeDict = custOSD._settings.get_value("osd-nolabel").deep_unpack();
          icon = osdTypeDict["icon-nolabel"];
          label = false;
          level = osdTypeDict["level-nolabel"];
          numeric = osdTypeDict["numeric-nolabel"];
        }
        else if (this._label.visible && !this._level.visible){
          let osdTypeDict = custOSD._settings.get_value("osd-nolevel").deep_unpack();
          icon = osdTypeDict["icon-nolevel"];
          label = osdTypeDict["label-nolevel"];
          level = false;
          numeric = false;
        }
        else {
          icon = true;
          label = false;
          level = false;
          numeric = false;
        }

        icon? this._icon.visible = true : this._icon.visible = false;  
        numeric? this._levLabel.visible = this._level.visible : this._levLabel.visible = false;
        if(!level) this._level.visible = false;
        if(!label) this._label.visible = false;

        const h_percent = custOSD._settings.get_double("horizontal");
        const v_percent = custOSD._settings.get_double("vertical");
        const bradius = custOSD._settings.get_double("bradius");
        const rotate = custOSD._settings.get_boolean("rotate");       
 
        let br1, br2;
        if(bradius < 0){
          br1 = 0;
          br2 = -bradius;
        }else if(bradius > 100){
          br1 = 100;
          br2 = 200 - bradius;
        }else{  
          br1 = bradius;
          br2 = bradius;
        }

        let hbxH = this._hbox.height;
        this._hbox.style += ` border-radius: ${br1*hbxH/1.5/100}px ${br2*hbxH/1.5/100}px;`;

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

        const effect = this._hbox.get_effect('customOSD-dynamic');
        if (effect) {
          const hide_delay = custOSD._settings.get_double("delay");
          if (!this._blurTimeoutId) {
            // GLib.source_remove(this._blurTimeoutId);
            Meta.add_clutter_debug_flags(null, Clutter.DrawDebugFlag.DISABLE_CLIPPED_REDRAWS, null);
            this._blurTimeoutId = GLib.timeout_add(
              GLib.PRIORITY_DEFAULT, hide_delay, () => { 
                Meta.remove_clutter_debug_flags(null, Clutter.DrawDebugFlag.DISABLE_CLIPPED_REDRAWS, null);
                GLib.source_remove(this._blurTimeoutId);
                this._blurTimeoutId = null;
              });
          }
        }

      }
    );
  
  }


  disable() {

    Gio.resources_unregister(this._resources);
    this._resources = null;

    Main.layoutManager.disconnect(this._monitorsChangedId);
    Main.wm.removeKeybinding("clock-osd");

    /*
    Reviewer Note: 
    This extension injects code into the 'show' method of 'osdWindow' class.
    Thus, from within show(), osdWindow properties are added/edited with 'this'.
    In disable, however, it is not accessible with 'this' and are thus removed using an osdWindow obj.
    There can be multiple osdWindow instances for multi monitors and so it is done for all in below function:
    unCustomOSD() - For each OSD Window:  
    - remove all styling
    - remove added child levLabel
    - remove translation, reset position and size
    - reset visibility
    - remove blur effect
    - remove blurTimeOut
    */
    this._unCustomOSD();
    this._settings = null;
    this._custOSDIcon = null;
    this._timeOSDIcon = null;
    
    this._removeInjection(OsdWindow.OsdWindow.prototype, this._injections, "show");
    this._injections = [];
    
  }

};


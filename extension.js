import Clutter from 'gi://Clutter';
import St from 'gi://St';
import GObject from 'gi://GObject';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
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

  _showOSD(osd) {
    if (osd == "Test OSD") 
      OsdWindowManager.show(-1, this._custOSDIcon, _("Custom OSD"), 1.0, 1.0);
    if (osd == "Clock OSD") {
      let clock = new GnomeDesktop.WallClock();
      OsdWindowManager.show(-1, this._timeOSDIcon, clock.clock);
    }
    if (osd == "Command OSD") {
      let cmdosd = this._settings.get_string('showosd');
      cmdosd = cmdosd.split(','); 
      let icon = String(cmdosd[1]);
      let label = String(cmdosd[2]);
      let level = parseFloat(cmdosd[3]);
      icon? icon = Gio.ThemedIcon.new_with_default_fallbacks(icon) : icon = this._custOSDIcon;
      if (level!=0 && !level)
        OsdWindowManager.show(-1, icon, label);
      else
        OsdWindowManager.show(-1, icon, label, level, 1.0);
    }
  }
  
  _createLevLabel(osdW, idx){
    // Create a label for the numeric %
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

    // Connect the levlabel (numeric %) to update the progress ring svg
    this.progressSVGId[idx] = osdW._levLabel.connect('notify::text', () => {
      this.setProgressRingSVG(osdW._levLabel.text, osdW._hbox.height, osdW._hbox.width);
    });
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

  setProgressRingSVG(ringVal, height, width) {
    if(!this.progressRing)
      return;

    ringVal = parseInt(ringVal); // Current level %

    // Use saved height, width if they are undefined OR
    // if Square/Circle mode is On (i.e. width == height)
    if(!height || !width || this.width == this.height) {
      width = this.width;
      height = this.height;
    }

    let radius = this.radius;
    let stroke = this.levthickness * height/2;
    let gap =  this.ringgap * (height/2 - stroke);
    // Dummystroke: to add gap between border and ring. 
    // Compute params using dummustroke and draw using stroke creating a gap
    // Drawing is along the center line of stroke/dummystroke
    let dummystroke = 2*gap + stroke; 

    radius = radius-dummystroke/2; if(radius < stroke/2) radius = stroke/2; 
    
    let svgWidth = width;
    let svgHeight = height;
    width = (width - dummystroke).toFixed(2);
    height = (height - dummystroke).toFixed(2);
    let perimeter = 2*parseFloat(height) + 2*parseFloat(width) - (1.716)*(radius); // -8*r + 2*Pi*r => -(8-2*Pi)*r = 1.717*r
    perimeter = perimeter.toFixed(4);
    let offset = (parseFloat(perimeter)*(100-ringVal)/100).toFixed(4);
    let xy = (dummystroke/2).toFixed(2);
    
    let ringSVG = 
      `<svg xmlns='http://www.w3.org/2000/svg' width='${svgWidth}' height='${svgHeight}'>
        <rect rx='${radius}' x='${xy}' y='${xy}' width='${width}' height='${height}' fill='transparent' stroke='${this.levHex+'33'}' stroke-width='${stroke}'></rect>
        <rect rx='${radius}' x='${xy}' y='${xy}' width='${width}' height='${height}' fill='transparent' stroke='${this.levHex+this.levalphaHex}' stroke-width='${stroke}' stroke-dasharray='${perimeter}' stroke-dashoffset='${offset}' ></rect>
      </svg>`;
    let svgpath = `${this.path}/media/ring.svg`; 
    let file = Gio.File.new_for_path(svgpath);
    let bytearray = new TextEncoder().encode(ringSVG);
    if (bytearray.length) {
      let output = file.replace(null, false, Gio.FileCreateFlags.NONE, null);
      let outputStream = Gio.BufferedOutputStream.new_sized(output, 1024);
      outputStream.write_all(bytearray, null);
      outputStream.close(null);
    }
    else {
      console.log("Custom OSD: Failed to write svg file: " + svgpath);
    }
  }

  _rgbToHex(r, g, b) {
    return "#" + (1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1);
  }

  _syncSettings(settingChanged, obj, signal) { 
    //console.log('Sync Setting: ', signal, settingChanged);

    const Mr = Math.round;

    let osd_size = this._settings.get_double("size");
    const hide_delay = this._settings.get_double("delay");
    const color = this._settings.get_strv("color");
    const bgcolor = this._settings.get_strv("bgcolor");
    const bgcolor2 = this._settings.get_strv("bgcolor2");
    const gradientDirection = this._settings.get_string("gradient-direction");
    const bgeffect = this._settings.get_string("bg-effect");
    const alphaPct = this._settings.get_double("alpha");
    const alphaPct2 = this._settings.get_double("alpha2");
    const shadow = this._settings.get_boolean("shadow");
    const border = this._settings.get_boolean("border");
    const rotate = this._settings.get_boolean("rotate");
    const font = this._settings.get_string("font");
    const defaultFont = this._settings.get_string("default-font");
    const bradius = this._settings.get_double("bradius");
    const levcolor = this._settings.get_strv("levcolor");
    const bcolor = this._settings.get_strv("bcolor");
    const shcolor = this._settings.get_strv("shcolor");
    const levalphaPct = this._settings.get_double("levalpha");
    const balphaPct = this._settings.get_double("balpha");
    let levthickness = this._settings.get_double("levthickness");
    let bthickness = this._settings.get_double("bthickness");
    let hpadding = this._settings.get_double("hpadding");
    let vpadding = this._settings.get_double("vpadding");
    let ringgap = this._settings.get_double("ring-gap");
    const bgImage = this._settings.get_string('background-image');

    const red = parseInt(parseFloat(color[0]) * 255);
    const green = parseInt(parseFloat(color[1]) * 255);
    const blue = parseInt(parseFloat(color[2]) * 255);
    const falpha = parseFloat(color[3]);
    this.fgHex = this._rgbToHex(red, green, blue);
    
    const bgred = parseInt(parseFloat(bgcolor[0]) * 255);
    const bggreen = parseInt(parseFloat(bgcolor[1]) * 255);
    const bgblue = parseInt(parseFloat(bgcolor[2]) * 255);

    const bgred2 = parseInt(parseFloat(bgcolor2[0]) * 255);
    const bggreen2 = parseInt(parseFloat(bgcolor2[1]) * 255);
    const bgblue2 = parseInt(parseFloat(bgcolor2[2]) * 255);  
    
    const levred = parseInt(parseFloat(levcolor[0]) * 255);
    const levgreen = parseInt(parseFloat(levcolor[1]) * 255);
    const levblue = parseInt(parseFloat(levcolor[2]) * 255);
    this.levHex = this._rgbToHex(levred, levgreen, levblue);

    const bred = parseInt(parseFloat(bcolor[0]) * 255);
    const bgreen = parseInt(parseFloat(bcolor[1]) * 255);
    const bblue = parseInt(parseFloat(bcolor[2]) * 255);

    const shred = parseInt(parseFloat(shcolor[0]) * 255);
    const shgreen = parseInt(parseFloat(shcolor[1]) * 255);
    const shblue = parseInt(parseFloat(shcolor[2]) * 255);
  
    const alpha = parseFloat(alphaPct/100.0); 
    const alpha2 = parseFloat(alphaPct2/100.0);    
    const balpha = parseFloat(balphaPct/100.0);
    const levalpha = parseFloat(levalphaPct/100.0);
    this.levalphaHex = Mr(levalpha * 255).toString(16);

    // OSD size < 10 is too small so alter range to 10-110
    osd_size = osd_size + 10;
    this.osd_size = osd_size;

    // FONT STYLE AND SIZE
    let font_size, font_weight, fontStyles;
    if (font == "")
      font == defaultFont;
    if (font != "") {
      let font_desc = Pango.font_description_from_string(font); 
      let font_family = font_desc.get_family();
      let font_style_arr = ['normal', 'oblique', 'italic'];
      let font_style = font_style_arr[font_desc.get_style()];
      let font_stretch_arr = ['ultra-condensed', 'extra-condensed', 'condensed', 'semi-condensed', 'normal', 'semi-expanded', 'expanded', 'extra-expanded', 'ultra-expanded'];
      let font_stretch = font_stretch_arr[font_desc.get_stretch()];
      font_size = font_desc.get_size() / Pango.SCALE;
      font_size = font_size*osd_size/22;
        
      try{
          font_weight = font_desc.get_weight();
      }catch(e){
          font_weight = Math.round(font_weight/100)*100;
      }
      fontStyles = 
      `   font-size: ${font_size}pt; 
          font-weight: ${font_weight};
          font-family: "${font_family}"; 
          font-style: ${font_style}; 
          font-stretch: ${font_stretch}; 
          font-variant: normal; `; 
    }
    else {
      fontStyles = "";
      font_size = 12*osd_size/22;
    }
    
    // Save level thickness and ring gap for SVG
    this.levthickness = levthickness/100;
    this.ringgap = ringgap/100;

    // Scale distances by the OSD size (10 to 110)
    bthickness = Mr(bthickness*osd_size/55); // 1 to 100
    levthickness = Mr(levthickness*osd_size/55);
    hpadding = Mr(hpadding*osd_size/55); // 0 to 100
    vpadding = Mr(vpadding*osd_size/55);    
    this.hpadding = hpadding;
    
    for (
      let monitorIndex = 0;
      monitorIndex < OsdWindowManager._osdWindows.length;
      monitorIndex++
    ) {

      let osdW = OsdWindowManager._osdWindows[monitorIndex];

      if(!osdW._levLabel) this._createLevLabel(osdW, monitorIndex);

      this._setOSDOrientation(osdW, rotate);
      
      let monitor = Main.layoutManager.monitors[monitorIndex];
      osdW._icon.icon_size = Mr(osd_size/150 * monitor.height/5); 
      osdW._icon.y_align = Clutter.ActorAlign.CENTER;

      osdW._label.x_align = Clutter.ActorAlign.CENTER;
      
      osdW._hbox.add_style_class_name(
        "osd-style"
      );
      
      // FONT, COLOR, BG COLOR, PADDING, SPACING, MARGINS
      let hboxSty = ` ${fontStyles} background-color: rgba(${bgred},${bggreen},${bgblue},${alpha}); color: rgba(${red},${green},${blue},${falpha}); 
                    padding: ${vpadding}px ${hpadding}px ${vpadding}px ${(100-osd_size)/10 + hpadding*1.25}px; margin: 0px; spacing: ${0.75*hpadding}px; `;
      
      // SHADOW 
      let thresh = 75 + 0.25*osd_size;
      if (!shadow) hboxSty += ' box-shadow: none;';
      else if (bradius > -thresh && bradius < thresh) {
        if (bgeffect == "none")
          hboxSty += ` box-shadow: 0 1px 8px rgba(${shred},${shgreen},${shblue}, ${0.05 + 0.2*alpha});`; 
        else
          hboxSty += ` box-shadow: 0 1px 6px -12px rgba(${shred},${shgreen},${shblue}, ${0.05 + 0.2*alpha});`; 
      }
      else {
          hboxSty += ` box-shadow: 0 1px 8px 2px rgba(${shred},${shgreen},${shblue}, ${0.05 + 0.2*alpha});`;
      }

      // BORDER
      if (border) hboxSty += ` border-color: rgba(${bred},${bgreen},${bblue},${balpha}); border-width: ${bthickness}px;`;
      else hboxSty += ' border-width: 0px; border-color: transparent;';   

      // GRADIENT
      if (bgeffect == "gradient") hboxSty += ` background-gradient-start: rgba(${bgred},${bggreen},${bgblue},${alpha});  
                    background-gradient-end: rgba(${bgred2},${bggreen2},${bgblue2},${alpha2}); background-gradient-direction: ${gradientDirection}; `;
      
      // DYNAMIC BLUR
      else if (bgeffect == "dynamic-blur") {
        hboxSty += `box-shadow: none; background-color: transparent; `;
        osdW._hbox.effect = new Shell.BlurEffect({name: 'customOSD-dynamic'});
        const effect = osdW._hbox.get_effect('customOSD-dynamic');
        if (effect) {
          effect.set({
              brightness: 0.8,
              sigma: 25,
              radius: 25,
              mode: Shell.BlurMode.BACKGROUND, 
          });
        }
      }

      // GLASS OR WOOD RAW OR WOOD POLISHED
      else if (bgeffect == "glass" || bgeffect == "wood1" || bgeffect == "wood2") {
        let img;
        bgeffect == "glass"? img = `${bgeffect}.png` : img = `${bgeffect}.jpg`;
        hboxSty += ` background-image: url("resource:///org/gnome/shell/extensions/custom-osd/media/${img}"); 
                    background-repeat: no-repeat; background-size: cover;`;
      }

      // CUSTOM BACKGROUND IMAGE
      else if (bgeffect == "background-image") {
        hboxSty += ` background-image: url("${bgImage}"); 
                    background-repeat: no-repeat; background-size: cover;`;
      }

      if (bgeffect != "dynamic-blur") {
        const effect = osdW._hbox.get_effect('customOSD-dynamic');
        if (effect) {
          osdW._hbox.remove_effect_by_name('customOSD-dynamic');
        }
      }      
      
      osdW._hbox.style = hboxSty;

      // ICON 
      osdW._icon.style = ` margin-right: ${0.2*osdW._icon.icon_size}px; margin-leftt: ${(110-osd_size)/10 + 0.2*osdW._icon.icon_size}px; `;
      // LABEL
      osdW._label.style = ` color: rgba(${red},${green},${blue},${0.95*falpha}); margin-right: 0px; margin-left: 0px; `; 
      // LEVEL
      osdW._level.style = ` height: ${levthickness}px; -barlevel-height: ${levthickness}px; min-width: ${Mr(3*osdW._icon.icon_size)}px; margin-right: 0px; margin-left: 0px;
      -barlevel-active-background-color: rgba(${levred},${levgreen},${levblue},${levalpha}); -barlevel-background-color: rgba(${levred},${levgreen},${levblue},0.2); `; 
      // LEV LABEL - NUMERIC %
      osdW._levLabel.style = ` font-size: ${font_size*1.2}pt; font-weight: bold; min-width: ${Mr((100-osd_size)/10 + osd_size*2.22)}px; `; //28+osd*1.58     
      
      osdW.y_align = Clutter.ActorAlign.CENTER;  

    }

    if(settingChanged) this._showOSD('Test OSD');

  }


  _unCustomOSD() {

    for ( let monitorIndex = 0;
      monitorIndex < OsdWindowManager._osdWindows.length;
      monitorIndex++ ) {

      let osdW = OsdWindowManager._osdWindows[monitorIndex];

      osdW._hbox.remove_style_class_name(
        "osd-style"
      );
      osdW._hbox.style = '';
      osdW._hbox.rotation_angle_z = 0;
      osdW._hbox.set_pivot_point(0.0,0.0);

      if(this.progressSVGId[monitorIndex]) {
        osdW._levLabel.disconnect(this.progressSVGId[monitorIndex]);
        this.progressSVGId[monitorIndex] = null;
      }
      osdW._hbox.remove_child(osdW._levLabel);
      delete osdW._levLabel;

      osdW._hbox.set_height(-1);
      osdW._hbox.translation_x = 0;
      osdW._hbox.translation_y = 0;
      osdW._hbox.visible = true;
  
      osdW._label.style = '';
      osdW._level.style = '';
      osdW._icon.style = '';
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

    this.height = 0;
    this.width = 0;
    this.radius = 0;
    this.svgname = 'ring';
    this.progressRing = false;
    this.progressSVGId = [];
    this.isClippedRedrawsSet = false;

    this._resources = Gio.Resource.load(this.path + '/resources/custom-osd.gresource');
    Gio.resources_register(this._resources);

    this._custOSDIcon = Gio.ThemedIcon.new_with_default_fallbacks('preferences-color-symbolic');
    this._timeOSDIcon = Gio.ThemedIcon.new_with_default_fallbacks('preferences-system-time-symbolic');

    this._settings = this.getSettings(); 

    this._monitorsChangedId = Main.layoutManager.connect('monitors-changed', this._syncSettings.bind(this,false));
    this._settings.connect(`changed`, this._syncSettings.bind(this,true));
    this._syncSettings(null, null, false);
    this._settings.connect(`changed::showosd`, this._showOSD.bind(this,'Command OSD'));

    Main.wm.addKeybinding(
      "clock-osd",
      this._settings,
      Meta.KeyBindingFlags.NONE,
      Shell.ActionMode.NORMAL,
      this._showOSD.bind(this, 'Clock OSD')
    );

    this._restoreIconSize = OsdWindowManager._osdWindows[0]._icon.icon_size;

    // Check if Clipped Redraws flag is set externally (e.g. by Blur My Shell)
    this.redrawFlagTimeoutId = setTimeout( () => {
      const enabledFlags = Meta.get_clutter_debug_flags(); // console.log(enabledFlags);
      if (enabledFlags.includes(Clutter.DrawDebugFlag.DISABLE_CLIPPED_REDRAWS)) {
          this.isClippedRedrawsSet = true;
      }
      else {
          this.isClippedRedrawsSet = false;
      }
    }, 2000);

 
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

        const bgeffect = custOSD._settings.get_string("bg-effect");
        icon? this._icon.visible = true : this._icon.visible = false;  
        numeric? this._levLabel.visible = this._level.visible : this._levLabel.visible = false;
        let levelOn = this._level.visible;

        let padding;
        if(this._levLabel.visible)  {
          padding = custOSD.hpadding - (100-custOSD.osd_size)/10;
          if (padding < 0) padding = 0;
        }
        else 
          padding = custOSD.hpadding*1.65 + (100-custOSD.osd_size)/10;
        this._hbox.style += ` padding-right: ${padding}px; `;
        
        if(!level || bgeffect == 'progress-ring') this._level.visible = false;
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

        const sqrCircle = custOSD._settings.get_boolean("square-circle");
        if(sqrCircle)
          this._hbox.set_height(this._hbox.width);
        else
          this._hbox.set_height(-1);

        let hbxH = this._hbox.height;

        if(bgeffect == 'progress-ring')
          br2 = br1;

        this._hbox.style += ` border-radius: ${br1*hbxH/2/100}px ${br2*hbxH/2/100}px;`;

        let hbxW = this._hbox.width; 
        
        if(bgeffect == 'progress-ring') {
          custOSD.progressRing = true;
          custOSD.height = hbxH;
          custOSD.width = hbxW;
          custOSD.radius = br1*hbxH/2/100;
          if(this._label.text == 'Custom OSD' && this._icon.icon_name == 'preferences-color-symbolic') {
            custOSD.setProgressRingSVG('100'); // Update SVG for "Test OSD"
          }

          if(levelOn)
            this._hbox.style += ` background-image: url('${custOSD.path}/media/ring.svg'); background-repeat: no-repeat; background-size: cover; `;
          else
            this._hbox.style += ` background-image: none;`;            
        }        

        if (rotate){ 
          let o_hbxH = hbxH;        
          hbxH = hbxW;
          hbxW = o_hbxH;
        }

        let transX = h_percent * (monitor.width - hbxW)/100.0;
        this._hbox.translation_x = transX;

        let transY = -v_percent * (monitor.height - hbxH)/100.0;
        this._hbox.translation_y = transY;

        const effect = this._hbox.get_effect('customOSD-dynamic');
        if (effect) {
          if (!this._blurTimeoutId && !custOSD.isClippedRedrawsSet) {
            const hide_delay = custOSD._settings.get_double("delay");
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
    REVIEWER NOTE: 
    This extension injects code into the 'show' method of 'osdWindow' class.
    Thus, from within show(), osdWindow properties are added/edited with 'this'.
    In disable, however, it is not accessible with 'this' and are thus removed using an osdWindow obj.
    There can be multiple osdWindow instances for multi monitors and so it is done for all in below function:
    unCustomOSD() {
      For each OSD Window: 
      - remove all styling
      - disconnect progressSVGId and remove added child levLabel
      - remove translation, reset position and size
      - reset visibility
      - remove blur effect
      - remove blurTimeOut
    }
    */
    this._unCustomOSD();
    this._settings = null;
    this._custOSDIcon = null;
    this._timeOSDIcon = null;

    if (this.redrawFlagTimeoutId) {
      clearTimeout(this.redrawFlagTimeoutId);
      this.redrawFlagTimeoutId = null;
    }
    
    this._removeInjection(OsdWindow.OsdWindow.prototype, this._injections, "show");
    this._injections = [];    
  }

};


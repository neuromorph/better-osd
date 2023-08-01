
# Custom OSD (GNOME 4X Extension)  


A GNOME Shell extension allowing the user to set the position, orientation, size, color, shadow, transparency and delay of the OSD pop-ups. It can also display % level value for OSDs with levels like Volume/Brightness etc. You can choose to display the OSD on Primary/ External or both the monitors and select what components to show. In summary, fully transform the OSD pop-ups to match your theme and liking!


## Installation

### Recommended

[<img alt="" height="100" src="https://raw.githubusercontent.com/andyholmes/gnome-shell-extensions-badge/master/get-it-on-ego.svg?sanitize=true">](https://extensions.gnome.org/extension/6142/custom-osd/)

It's recommended to install the extension from
[extensions website](https://extensions.gnome.org/extension/6142/custom-osd/), or from
the _Extension Manager_ app.


### How to manually install the extension (if needed)?

```
git clone https://github.com/neuromorph/custom-osd.git \
	~/.local/share/gnome-shell/extensions/custom-osd@neuromorph
```
OR download the release zip file (may not be latest) and unzip at location: ~/.local/share/gnome-shell/extensions/

You may need to restart the gnome shell environnment (for manual install):

- logout and login again (Do this if using Wayland) _or_
- `alt+f2` then type `r` and `enter` 

## Settings
Use the settings panel of the extension for most common customizations:  

![Position](media/ScreenPosition.png)
* Position on Screen 
* Vertical/Horizontal Orientation
* Size 
* Hide-Delay time
* Color and Background
* Box Shadow On/Off
* Box Border On/Off
* Transparency
* Shape Pill/Rectangle
* Numeric % for levels
* Monitor to show OSD on
* Select what to show: Icon, Text, Level Bar, Numeric %



## Optional Advanced Styling
For optional styling of advanced css options or things like Padding that is not in settings, you will need to edit "spreadsheet.css" file at -  
~/.local/share/gnome-shell/extensions/custom-osd@neuromorph/  
 This allows for some esoteric tinkering for the ones so inclined. 

Example code:
```
.osd-style {
    padding-top: 5px;
    padding-bottom: 5px;
    box-shadow: 1px 1px 5px grey;
}
```


## What's New (recent first)
- Select any combinations of OSD components to display. New test-OSD for instant feedback when changing settings. 
- Improved positioning logic to snap fit
- Improved efficiency and compatibility
- Added support for Numeric level %, Monitors to display OSD and Box Border
- Added support for Color+BG Color, Shadow and Orientation
- Settings updated for Color and Transparency
- Metadata updated for Gnome 44
- Ported for GNOME 42 + some fixes



## Screenshots

![Screenshot](media/Screenshot.png)



## Acknowledgements

This extension started from [Better OSD](https://extensions.gnome.org/extension/1345/better-osd/). That extension is obsolete and forked versions also do not support new OSD modifications in GNOME shell after GNOME 41+. Custom-OSD began with porting the old extension to new GNOME mods but soon ended up rewriting the entire code for refinements/bug-fix/refactor and many new features.

<h1 align="center">kcd2-keybindings-overruler</h1>  
<p align="center">
  <b>
    Unlock full keybinding customization for <i>Kingdom Come: Deliverance II</i>.
  </b>
</p>  

<br>  

<div align="center">

  ![Version](https://img.shields.io/github/package-json/v/cptpiepmatz/kcd2-keybindings-overruler?style=for-the-badge)
  ![License](https://img.shields.io/github/license/cptpiepmatz/kcd2-keybindings-overruler?style=for-the-badge)
  ![CI](https://img.shields.io/github/actions/workflow/status/cptpiepmatz/kcd2-keybindings-overruler/cicd.yml?style=for-the-badge&logo=github&label=CI)

</div>  

---

## About  
*kcd2-keybindings-overruler* is a web-based tool that lets you bypass the 
built-in restrictions on keybinding customization in 
*Kingdom Come: Deliverance II*.  
The game prevents certain keybindings from being changed if they conflict with 
others, but internally, it still accepts manually modified settings.  
This tool makes that process simple and user-friendly.  

## Usage  

### **A) Import Your Settings**  
- Open the file picker and navigate to: 
  📂 **`~\Saved Games\kingdomcome2\profiles\default`**  
- Select `attributes.xml`, and your current keybindings will be loaded automatically.  

### **B) Manual Copy**  
- Open `attributes.xml` manually.  
- Find the `keybinds_settings` attribute.  
- Copy the entire value and paste it into the tool.  

### **C) Start Fresh**  
- Skip importing a file and start with the **default** keybindings.  
- Modify them as needed.  

### **Modify & Export**  
- Adjust keybindings freely.  
- Select which ones to include in the final output.  
- Download the modified `attributes.xml` file or copy the updated 
  `keybinds_settings` value to paste it back in manually.  

## Language Support  
- You can select the **language** for both **action names** and **keybindings**.  
- By default, this is set to **English**, but you can change it to any 
  game-supported language.  
- ⚠️ **Note:** This does **not** change the language of the app itself.  

## Building & Running  

### **Requirements**  
- [Node.js](https://nodejs.org/) (pinned via [Volta](https://volta.sh/))  
- The game files of *Kingdom Come: Deliverance II*  

### **Setup**  
First, install dependencies:  

```sh
npm install
```

Then, extract resources from the game files:  

```sh
npm run extract-resources
```

- By default, this will look for the game in its standard install directory on `C:`.  
- If you installed it elsewhere, pass the installation directory as the first argument:  

```sh
npm run extract-resources "D:\Games\KingdomCome2"
```

Once the resources are extracted, build the project:  

```sh
npm run build
```

This will compile everything and prepare the web app for use.  

## Disclaimer  
This tool is **not affiliated** with Warhorse Studios, Deep Silver, or any 
other entity associated with *Kingdom Come: Deliverance II*.  
The code does **not** access or expose any game files directly.  
While the tool helps modify keybindings, I **do not guarantee** that the 
generated settings file will be fully correct or work flawlessly. 
**Use at your own risk.**  

## License  
This project is licensed under the [MIT License](LICENSE).  

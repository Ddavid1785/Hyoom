export function getFilePath(){

const appName = "Hyoom";
let SETTINGS_PATH:string;

if (Deno.build.os === "windows") {
  SETTINGS_PATH = `C:/Users/${Deno.env.get("USERNAME")}/AppData/Roaming/${appName}`;
} else if (Deno.build.os === "darwin") {
  SETTINGS_PATH = `${Deno.env.get("HOME")}/Library/Application Support/${appName}`;
} else {
  SETTINGS_PATH = `${Deno.env.get("HOME")}/.config/${appName}`;
}

return SETTINGS_PATH

}
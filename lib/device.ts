const KEY = "mygrocery_family_verified";


export function saveDeviceLogin() {

  localStorage.setItem(KEY, "true");

}


export function hasDeviceLogin() {

  if (typeof window === "undefined") {

    return false;

  }

  return localStorage.getItem(KEY) === "true";

}


export function clearDeviceLogin() {

  localStorage.removeItem(KEY);

}
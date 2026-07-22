const KEY = "mygrocery_auth";

export function saveDeviceLogin(
  familyCode: string,
  username: string
) {
  localStorage.setItem(
    KEY,
    JSON.stringify({
      familyCode,
      username,
    })
  );
}

export function hasDeviceLogin() {
  if (typeof window === "undefined") return false;

  return localStorage.getItem(KEY) !== null;
}

export function getDeviceLogin() {
  if (typeof window === "undefined") return null;

  const value = localStorage.getItem(KEY);

  return value ? JSON.parse(value) : null;
}

export function clearDeviceLogin() {
  localStorage.removeItem(KEY);
}
import { getDeviceLogin } from "./device";

export function getCurrentUsername() {
  const login = getDeviceLogin();

  return login?.username ?? "";
}

export function getCurrentFamilyCode() {
  const login = getDeviceLogin();

  return login?.familyCode ?? "";
}
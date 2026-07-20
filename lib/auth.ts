import { signInAnonymously } from "firebase/auth";
import { auth } from "./firebase";

export async function loginAnonymous() {

  const result = await signInAnonymously(auth);

  return result.user;

}
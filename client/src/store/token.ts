import { notifyAuthChanged } from "@/lib/auth";

export function storeTokenInLocalStorage(token: string) {
  localStorage.setItem('token', token);
  notifyAuthChanged();
}

export function getTokenFromLocalStorage() {
  return localStorage.getItem('token');
}
export function removeTokenFromLocalStorage() {
  localStorage.removeItem('token');
  notifyAuthChanged();
}

// Plain (non-"use server") module so the initial state VALUE can be imported by the
// client form. A "use server" file may only export async functions.

export interface LoginState {
  step: "phone" | "code";
  phone: string;
  devCode?: string;
  error?: string;
}

export const initialLoginState: LoginState = { step: "phone", phone: "" };

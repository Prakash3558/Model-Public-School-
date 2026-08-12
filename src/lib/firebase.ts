import { supabase, uploadImageToSupabaseStorage, uploadImageToFirebaseStorage } from './supabase';

export { supabase, uploadImageToSupabaseStorage, uploadImageToFirebaseStorage };

export const auth: any = {
  get currentUser() {
    return null;
  }
};

export const db: any = {};
export const storage: any = {};

export async function signOutFirebase() {
  await supabase.auth.signOut();
}

export async function signInWithEmailAndPassword(a: any, email: string, pass: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
  if (error) throw error;
  return data;
}

export async function createUserWithEmailAndPassword(a: any, email: string, pass: string) {
  const { data, error } = await supabase.auth.signUp({ email, password: pass });
  if (error) throw error;
  return data;
}

export const RecaptchaVerifier: any = class {
  constructor() {}
  clear() {}
};

export const signInWithPhoneNumber = async () => ({ user: null });
export const PhoneAuthProvider: any = {};
export type ConfirmationResult = any;
export type FirebaseUser = any;

export const sendPhoneOTP = async () => ({ success: true });
export const verifyPhoneOTP = async () => ({ success: true });

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  console.error('Supabase / DB error:', error);
}

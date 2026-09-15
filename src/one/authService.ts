// TunayWasi ONE — operaciones de autenticación
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth'
import { auth } from '@/shared/firebase'
import { crearUsuario, fetchUsuario } from './service'
import type { CreateUsuarioInput } from './types'

export async function registrar(
  email: string,
  password: string,
  nombre: string
): Promise<void> {
  const cred = await createUserWithEmailAndPassword(auth, email, password)
  await updateProfile(cred.user, { displayName: nombre })

  // Crear doc en one_usuarios con rol emprendedor por defecto
  const input: CreateUsuarioInput = {
    uid: cred.user.uid,
    rol: 'emprendedor',
    nombre,
    email,
    emprendedor: {
      nombreLocal: '',
      distritoLocal: '',
      etapa: 'planificando',
      pedidoIds: [],
    },
  }
  await crearUsuario(cred.user.uid, input)
}

export async function login(email: string, password: string): Promise<void> {
  await signInWithEmailAndPassword(auth, email, password)
}

export async function logout(): Promise<void> {
  await signOut(auth)
}

export async function resetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email)
}

// Verifica si el usuario ya tiene doc en one_usuarios, si no lo crea
export async function asegurarUsuarioONE(
  uid: string,
  email: string,
  nombre: string
): Promise<void> {
  try {
    await fetchUsuario(uid)
  } catch {
    // No existe — crear con datos mínimos
    await crearUsuario(uid, {
      uid,
      rol: 'emprendedor',
      nombre: nombre || email,
      email,
      emprendedor: {
        nombreLocal: '',
        distritoLocal: '',
        etapa: 'planificando',
        pedidoIds: [],
      },
    })
  }
}

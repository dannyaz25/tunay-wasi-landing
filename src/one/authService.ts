// TunayWasi ONE — operaciones de autenticación
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth'
import { auth } from '@/shared/firebase'
import { crearUsuario, fetchUsuario } from './service'
import type { CreateUsuarioInput, RolONE } from './types'

export async function loginConGoogle(): Promise<{ uid: string; esNuevo: boolean }> {
  const provider = new GoogleAuthProvider()
  const cred = await signInWithPopup(auth, provider)
  const uid = cred.user.uid

  // Verificar si ya tiene doc en one_usuarios
  try {
    await fetchUsuario(uid)
    return { uid, esNuevo: false }
  } catch {
    // Primera vez — doc no existe aún
    return { uid, esNuevo: true }
  }
}

export async function completarRegistroGoogle(
  uid: string,
  nombre: string,
  email: string,
  rol: RolONE
): Promise<void> {
  const input: CreateUsuarioInput = {
    uid,
    rol,
    nombre,
    email,
    ...(rol === 'negocio' ? {
      negocio: {
        nombreLocal: '',
        distritoLocal: '',
        etapa: 'planificando',
        pedidoIds: [],
      },
    } : {}),
    ...(rol === 'caficultor' ? {
      caficultor: {
        region: '',
        distrito: '',
        altitudMsnm: 0,
        historia: '',
        foto: '',
        activo: false,
      },
    } : {}),
  }
  await crearUsuario(uid, input)
}

export async function registrar(
  email: string,
  password: string,
  nombre: string
): Promise<void> {
  const cred = await createUserWithEmailAndPassword(auth, email, password)
  await updateProfile(cred.user, { displayName: nombre })
  const input: CreateUsuarioInput = {
    uid: cred.user.uid,
    rol: 'negocio',
    nombre,
    email,
    negocio: {
      nombreLocal: '',
      distritoLocal: '',
      etapa: 'planificando',
      pedidoIds: [],
    },
  }
  await crearUsuario(cred.user.uid, input)
}

export async function registrarCaficultor(
  email: string,
  password: string,
  nombre: string,
  datos: {
    region: string
    distrito: string
    altitudMsnm: number
    kgDisponibles: number
    variedadPrincipal: string
    telefono: string
    fotoUrl?: string
  }
): Promise<void> {
  const cred = await createUserWithEmailAndPassword(auth, email, password)
  await updateProfile(cred.user, { displayName: nombre })
  const input: CreateUsuarioInput = {
    uid: cred.user.uid,
    rol: 'caficultor',
    nombre,
    email,
    caficultor: {
      region: datos.region,
      distrito: datos.distrito,
      altitudMsnm: datos.altitudMsnm,
      historia: '',
      foto: datos.fotoUrl ?? '',
      activo: false,
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

export async function asegurarUsuarioONE(
  uid: string,
  email: string,
  nombre: string
): Promise<void> {
  try {
    await fetchUsuario(uid)
  } catch {
    await crearUsuario(uid, {
      uid,
      rol: 'negocio',
      nombre: nombre || email,
      email,
      negocio: {
        nombreLocal: '',
        distritoLocal: '',
        etapa: 'planificando',
        pedidoIds: [],
      },
    })
  }
}

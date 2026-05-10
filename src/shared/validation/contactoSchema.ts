import { z } from 'zod';

export const contactoSchema = z.object({
  nombre: z
    .string({ message: 'Tu nombre es requerido.' })
    .trim()
    .min(2, { message: 'Al menos 2 caracteres.' })
    .max(80, { message: 'Máximo 80 caracteres.' })
    .regex(/^[a-zA-ZÀ-ÿ\s']+$/, { message: 'Solo letras y espacios.' }),
  email: z
    .string({ message: 'El correo es requerido.' })
    .trim()
    .max(254, { message: 'Máximo 254 caracteres.' })
    .email({ message: 'Correo no válido.' }),
  tema: z.enum(['cafe', 'mayorista', 'caficultor', 'prensa']),
  mensaje: z
    .string({ message: 'El mensaje es requerido.' })
    .trim()
    .min(10, { message: 'Al menos 10 caracteres.' })
    .max(2000, { message: 'Máximo 2000 caracteres.' })
    .refine(
      (v) => v.replace(/\s/g, '').length > 0,
      { message: 'No puede ser solo espacios en blanco.' },
    ),
});

export type ContactoForm = z.infer<typeof contactoSchema>;
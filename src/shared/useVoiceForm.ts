/**
 * useVoiceForm — Graba audio con Web Speech API y extrae campos del formulario de lote
 * usando la Firebase Function extraerLoteDesdeVoz (Kimi K3).
 */
import { useState, useRef, useCallback } from 'react';

// Web Speech API — tipos mínimos para browsers que no los exponen en lib.dom
interface SpeechRecognitionLike extends EventTarget {
  lang: string
  continuous: boolean
  interimResults: boolean
  start(): void
  stop(): void
  onresult: ((event: SpeechRecognitionEventLike) => void) | null
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null
  onend: (() => void) | null
}
interface SpeechRecognitionEventLike extends Event {
  resultIndex: number
  results: { length: number; [index: number]: { [index: number]: { transcript: string } } }
}
interface SpeechRecognitionErrorEventLike extends Event {
  error: string
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionLike
    webkitSpeechRecognition?: new () => SpeechRecognitionLike
  }
}
import { getFunctions, httpsCallable } from 'firebase/functions';

export type LoteFormCampos = {
  nombreLote: string | null;
  variedad: string | null;
  proceso: string | null;
  altitud: string | null;
  kgDisponibles: string | null;
  precioKgPEN: string | null;
  cosecha: string | null;
};

type Estado = 'idle' | 'grabando' | 'procesando' | 'listo' | 'error';

type UseVoiceFormResult = {
  estado: Estado;
  transcripcion: string;
  error: string | null;
  iniciarGrabacion: () => void;
  detenerGrabacion: () => void;
  reset: () => void;
  campos: LoteFormCampos | null;
};

// Verifica soporte del browser
function speechRecognitionSupported(): boolean {
  return typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
}

export function useVoiceForm(): UseVoiceFormResult {
  const [estado, setEstado] = useState<Estado>('idle');
  const [transcripcion, setTranscripcion] = useState('');
  const [campos, setCampos] = useState<LoteFormCampos | null>(null);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  const iniciarGrabacion = useCallback(() => {
    if (!speechRecognitionSupported()) {
      setError('Tu navegador no soporta grabación de voz. Usa Chrome o Edge.');
      setEstado('error');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition ?? window.webkitSpeechRecognition!;

    const recognition = new SpeechRecognition();
    recognition.lang = 'es-PE';
    recognition.continuous = true;
    recognition.interimResults = false;

    let textoAcumulado = '';

    recognition.onresult = (event: SpeechRecognitionEventLike) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        textoAcumulado += event.results[i][0].transcript + ' ';
      }
      setTranscripcion(textoAcumulado.trim());
    };

    recognition.onerror = (event: SpeechRecognitionErrorEventLike) => {
      if (event.error === 'no-speech') return; // silencio normal, no es error
      setError('Error al grabar: ' + event.error);
      setEstado('error');
    };

    recognition.onend = () => {
      // Solo procesar si seguimos en estado grabando (no si el user canceló)
      if (textoAcumulado.trim().length > 0) {
        procesarTranscripcion(textoAcumulado.trim());
      } else {
        setEstado('idle');
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
    setEstado('grabando');
    setError(null);
    setTranscripcion('');
    setCampos(null);
  }, []);

  const detenerGrabacion = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
  }, []);

  async function procesarTranscripcion(texto: string) {
    setEstado('procesando');
    try {
      const functions = getFunctions();
      const extraer = httpsCallable<{ transcripcion: string }, { ok: boolean; campos: LoteFormCampos }>(
        functions,
        'extraerLoteDesdeVoz'
      );
      const result = await extraer({ transcripcion: texto });
      setCampos(result.data.campos);
      setEstado('listo');
    } catch (err) {
      setError('No se pudo extraer la información. Intenta de nuevo.');
      setEstado('error');
    }
  }

  const reset = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setEstado('idle');
    setTranscripcion('');
    setCampos(null);
    setError(null);
  }, []);

  return { estado, transcripcion, error, iniciarGrabacion, detenerGrabacion, reset, campos };
}

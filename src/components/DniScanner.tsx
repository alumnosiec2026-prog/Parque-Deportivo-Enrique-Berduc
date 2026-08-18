/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Camera, X, RefreshCw, AlertTriangle } from 'lucide-react';

interface DniScannerProps {
  onScanSuccess: (data: {
    dni: string;
    nombre: string;
    apellido: string;
    fechaNacimiento: string;
    genero?: 'Masculino' | 'Femenino' | 'Otro';
  }) => void;
  onClose: () => void;
}

export function DniScanner({ onScanSuccess, onClose }: DniScannerProps) {
  const scannerContainerId = 'dni-reader-element';
  const html5QrcodeRef = useRef<Html5Qrcode | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [cameras, setCameras] = useState<{ id: string; label: string }[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');

  useEffect(() => {
    // 1. Obtener cámaras disponibles
    Html5Qrcode.getCameras()
      .then((devices) => {
        if (devices && devices.length > 0) {
          setCameras(devices);
          // Seleccionar la cámara trasera por defecto si existe, sino la primera
          const backCam = devices.find(
            (d) =>
              d.label.toLowerCase().includes('back') ||
              d.label.toLowerCase().includes('trasera') ||
              d.label.toLowerCase().includes('rear')
          );
          setSelectedCameraId(backCam ? backCam.id : devices[0].id);
        } else {
          setErrorMsg('No se detectaron cámaras en este dispositivo.');
        }
      })
      .catch((err) => {
        console.error('Error obteniendo cámaras', err);
        setErrorMsg('Error de permisos o cámara no disponible.');
      })
      .finally(() => {
        setIsInitializing(false);
      });

    return () => {
      // Cleanup al desmontar
      stopScanner();
    };
  }, []);

  // Inicia el escáner cuando seleccionamos la cámara o cuando se carga
  useEffect(() => {
    if (selectedCameraId && !isInitializing) {
      startScanner(selectedCameraId);
    }
  }, [selectedCameraId, isInitializing]);

  const startScanner = async (cameraId: string) => {
    setErrorMsg(null);
    try {
      if (html5QrcodeRef.current) {
        await stopScanner();
      }

      const qrcode = new Html5Qrcode(scannerContainerId, {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.PDF_417,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.CODE_128,
        ],
        verbose: false,
      });

      html5QrcodeRef.current = qrcode;

      await qrcode.start(
        cameraId,
        {
          fps: 10,
          qrbox: { width: 300, height: 180 }, // Recuadro apaisado ideal para el DNI argentino
        },
        (decodedText) => {
          handleDecodedData(decodedText);
        },
        (errorMessage) => {
          // Fallbacks silenciosos de escaneo fallido o fuera de cuadro
        }
      );
    } catch (err: any) {
      console.error('Error al iniciar el escáner', err);
      setErrorMsg(
        'No se pudo acceder a la transmisión de la cámara. Verifique los permisos.'
      );
    }
  };

  const stopScanner = async () => {
    if (html5QrcodeRef.current && html5QrcodeRef.current.isScanning) {
      try {
        await html5QrcodeRef.current.stop();
      } catch (err) {
        console.error('Error al detener escáner', err);
      }
      html5QrcodeRef.current = null;
    }
  };

  const changeCamera = () => {
    if (cameras.length <= 1) return;
    const currentIndex = cameras.findIndex((c) => c.id === selectedCameraId);
    const nextIndex = (currentIndex + 1) % cameras.length;
    setSelectedCameraId(cameras[nextIndex].id);
  };

  // Función inteligente para parsear la cédula de identidad argentina (formato PDF417 o QR)
  const handleDecodedData = (rawText: string) => {
    console.log('DNI RAW DATA:', rawText);
    
    // El formato estandar de barras del DNI argentino es:
    // "00000000000@APELLIDO@NOMBRE@M@DNI_NUMERO@ejemplar@FECHA_NACIMIENTO@FECHA_EMISION@..."
    // Delimitador: @
    if (rawText.includes('@')) {
      const parts = rawText.split('@');
      
      if (parts.length >= 7) {
        let apellido = '';
        let nombre = '';
        let dni = '';
        let fechaNacimiento = '';
        let genero: 'Masculino' | 'Femenino' | 'Otro' | undefined = undefined;

        // Versión moderna (trámite nuevo) tiene unos campos desplazados, versión antigua otros
        // Haremos un parseador oportunista por expresión regular:
        
        // 1. Identificar el DNI (cadena de 7 u 8 números consecutivos)
        const dniToken = parts.find(p => /^\d{7,8}$/.test(p.trim()));
        if (dniToken) {
          dni = dniToken.trim();
        }

        // 2. Identificar el género ('M', 'F', 'X')
        const genToken = parts.find(p => /^(M|F|X)$/i.test(p.trim()));
        if (genToken) {
          const g = genToken.trim().toUpperCase();
          genero = g === 'M' ? 'Masculino' : g === 'F' ? 'Femenino' : 'Otro';
        }

        // 3. Identificar fecha de nacimiento (DD/MM/YYYY o DD-MM-YYYY)
        const dateToken = parts.find(p => /^\d{2}[\/\-]\d{2}[\/\-]\d{4}$/.test(p.trim()));
        if (dateToken) {
          const dParts = dateToken.trim().split(/[\/\-]/);
          if (dParts.length === 3) {
            // Convertir a YYYY-MM-DD
            fechaNacimiento = `${dParts[2]}-${dParts[1]}-${dParts[0]}`;
          }
        }

        // 4. Si no encontramos por tokens exactos, usamos posiciones heurísticas
        // Formato estándar:
        // [0] Nro Trámite
        // [1] Apellido
        // [2] Nombre
        // [3] Sexo
        // [4] Nro Documento
        // [5] Ejemplar
        // [6] Fecha Nacimiento (DD/MM/YYYY)
        if (!dni && parts[4] && /^\d+$/.test(parts[4])) {
          dni = parts[4].trim();
        }
        if (!apellido && parts[1]) {
          apellido = formatearPalabra(parts[1]);
        }
        if (!nombre && parts[2]) {
          nombre = formatearPalabra(parts[2]);
        }
        if (!fechaNacimiento && parts[6] && /^\d{2}\/\d{2}\/\d{4}$/.test(parts[6].trim())) {
          const dParts = parts[6].trim().split('/');
          fechaNacimiento = `${dParts[2]}-${dParts[1]}-${dParts[0]}`;
        }
        if (!genero && parts[3]) {
          const g = parts[3].trim().toUpperCase();
          genero = g === 'M' ? 'Masculino' : g === 'F' ? 'Femenino' : 'Otro';
        }

        // Si tenemos al menos el DNI o el Nombre/Apellido, completamos exitosamente!
        if (dni || (nombre && apellido)) {
          stopScanner().then(() => {
            onScanSuccess({
              dni: dni || 'No extraído',
              nombre: nombre || 'No extraído',
              apellido: apellido || 'No extraído',
              fechaNacimiento: fechaNacimiento || '2000-01-01',
              genero: genero || 'Masculino'
            });
          });
          return;
        }
      }
    }

    // Heurística alternativa: si no tiene arrobas pero empieza con dígitos o tiene
    // formato numérico, podría ser un DNI simple
    const cleanNumbers = rawText.replace(/\D/g, '');
    if (cleanNumbers.length >= 7 && cleanNumbers.length <= 9) {
      stopScanner().then(() => {
        onScanSuccess({
          dni: cleanNumbers,
          nombre: '',
          apellido: '',
          fechaNacimiento: '2000-01-01',
          genero: 'Masculino'
        });
      });
      return;
    }

    // Si no logramos parsear, informamos al usuario pero le permitimos reintentar
    setErrorMsg('Formato de código DNI no reconocido. Asegúrese de enfocar el código PDF417 de barras gris al dorso de la tarjeta o el código QR.');
  };

  const formatearPalabra = (str: string): string => {
    return str
      .trim()
      .toLowerCase()
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Cabecera */}
        <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-5 py-4">
          <div className="flex items-center space-x-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800">
              <Camera className="h-4.5 w-4.5" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-sm">Escáner de DNI Digital</h3>
              <p className="text-[11px] text-gray-500">Enfoque el código de barras gris del reverso o código QR</p>
            </div>
          </div>
          <button
            onClick={() => stopScanner().then(onClose)}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Zona del Escáner */}
        <div className="relative flex flex-col items-center justify-center bg-zinc-950 p-6">
          <div
            id={scannerContainerId}
            className="w-full max-w-full overflow-hidden rounded-xl bg-black border border-zinc-800"
            style={{ minHeight: '240px' }}
          ></div>

          {/* Guía visual */}
          <div className="pointer-events-none absolute inset-0 z-10 m-12 rounded-xl border-2 border-emerald-500/60 bg-black/0 shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]">
            <div className="absolute top-2 left-2 h-4 w-4 border-t-2 border-l-2 border-emerald-400"></div>
            <div className="absolute top-2 right-2 h-4 w-4 border-t-2 border-r-2 border-emerald-400"></div>
            <div className="absolute bottom-2 left-2 h-4 w-4 border-b-2 border-l-2 border-emerald-400"></div>
            <div className="absolute bottom-2 right-2 h-4 w-4 border-b-2 border-r-2 border-emerald-400"></div>
          </div>
        </div>

        {/* Mensajes y Controles */}
        <div className="bg-white p-5">
          {errorMsg && (
            <div className="mb-4 flex items-start space-x-2 rounded-xl bg-amber-50 p-3 text-xs text-amber-900 border border-amber-200">
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="flex items-center justify-between">
            {cameras.length > 1 ? (
              <button
                type="button"
                onClick={changeCamera}
                className="flex items-center space-x-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition"
              >
                <RefreshCw className="h-3.5 w-3.5 text-gray-500" />
                <span>Rotar Cámara</span>
              </button>
            ) : (
              <div className="text-[11px] text-gray-400">
                Cámara: {cameras[0]?.label || 'Buscando...'}
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                if (html5QrcodeRef.current && selectedCameraId) {
                  startScanner(selectedCameraId);
                }
              }}
              className="rounded-lg bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-zinc-200 transition"
            >
              Reiniciar Cámara
            </button>
          </div>

          <div className="mt-4 border-t border-gray-100 pt-3 text-center">
            <p className="text-[11px] leading-relaxed text-gray-400">
              Al escanear el reverso del DNI físico (código PDF417), el sistema extraerá automáticamente el nombre, el apellido, el número de documento y la fecha de nacimiento.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

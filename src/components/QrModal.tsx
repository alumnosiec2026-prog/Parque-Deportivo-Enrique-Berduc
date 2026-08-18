/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { X, Download, Share2, Calendar, ShieldCheck, Phone } from 'lucide-react';
import { Visitante } from '../types';

interface QrModalProps {
  visitante: Visitante;
  onClose: () => void;
}

export function QrModal({ visitante, onClose }: QrModalProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [qrUrl, setQrUrl] = useState<string>('');

  useEffect(() => {
    if (canvasRef.current && visitante) {
      // Objeto JSON con los datos solicitados
      const payload = {
        nombre: visitante.nombre,
        apellido: visitante.apellido,
        dni: visitante.dni,
        telefono: visitante.telefono,
        codigo: visitante.codigo,
        vigencia: visitante.vigencia,
        parque: "Parque Escolar Deportivo Enrique Berduc"
      };

      // Generar el código QR en el canvas y obtener data URL para descargar
      QRCode.toCanvas(
        canvasRef.current,
        JSON.stringify(payload),
        {
          width: 280,
          margin: 2,
          color: {
            dark: '#2C5F2D', // Verde Parque Berduc
            light: '#FFFFFF'
          }
        },
        (error) => {
          if (error) console.error("Error generando QR", error);
          if (canvasRef.current) {
            setQrUrl(canvasRef.current.toDataURL('image/png'));
          }
        }
      );
    }
  }, [visitante]);

  const descargarQR = () => {
    if (!qrUrl) return;
    const a = document.createElement('a');
    a.href = qrUrl;
    a.download = `QR_Ingreso_${visitante.apellido}_${visitante.codigo}.png`;
    a.click();
  };

  const compartirWhatsApp = () => {
    const formattedDate = new Date(visitante.vigencia).toLocaleDateString('es-AR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    const txt = `*PASE DE VISITANTE - PARQUE ENRIQUE BERDUC*%0A%0A` +
      `*Visitante:* ${visitante.nombre} ${visitante.apellido}%0A` +
      `*DNI:* ${visitante.dni}%0A` +
      `*Código Único:* ${visitante.codigo}%0A` +
      `*Vigilancia Vence:* ${formattedDate}hs%0A%0A` +
      `_Presente el código QR en la entrada del parque para efectuar su ingreso recreativo o deportivo._`;
    
    const url = `https://api.whatsapp.com/send?text=${txt}`;
    window.open(url, '_blank', 'noreferrer,noopener');
  };

  // Fecha con formato humano para el modal
  const formattedVence = new Date(visitante.vigencia).toLocaleString('es-AR', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl transition-all duration-300">
        {/* Encabezado con banner decorativo */}
        <div className="bg-emerald-800 px-6 py-5 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="h-6 w-6 text-emerald-300" />
              <h3 className="font-bold text-lg tracking-tight">Pase de Acceso Generado</h3>
            </div>
            <button
              onClick={onClose}
              className="rounded-full bg-black/10 p-1.5 text-white hover:bg-black/20 transition"
              id="close-qr-modal-btn"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>
          <p className="mt-1 text-xs text-emerald-100 uppercase tracking-wider font-semibold">
            Código: {visitante.codigo}
          </p>
        </div>

        {/* Cuerpo del Modal */}
        <div className="flex flex-col items-center p-6 text-center">
          {/* Card del QR / Diseño ID card */}
          <div className="mb-5 rounded-2xl border border-gray-100 bg-gray-50 p-4 shadow-xs">
            <canvas ref={canvasRef} className="rounded-lg shadow-sm max-w-full bg-white"></canvas>
            <div className="mt-3 text-xs font-mono font-bold text-emerald-800 uppercase tracking-widest">
              ★ PARQUE BERDUC ★
            </div>
          </div>

          {/* Información del titular */}
          <div className="w-full space-y-2.5 rounded-xl border border-gray-100 px-4 py-3.5 text-left bg-gray-50/50">
            <div>
              <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Nombre Completo</span>
              <p className="font-semibold text-gray-900 text-sm">
                {visitante.nombre} {visitante.apellido}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 border-t border-gray-100/70 pt-2 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Documento</span>
                <p className="font-semibold text-gray-800">{visitante.dni}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Localidad</span>
                <p className="font-semibold text-gray-800">{visitante.localidad}, {visitante.provincia}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-1.5 border-t border-gray-100/70 pt-2 text-xs">
              <Calendar className="h-4 w-4 text-emerald-600" />
              <div className="leading-tight text-gray-600">
                <span className="text-[10px] font-bold text-gray-400 block tracking-wider">VIGENCIA AUTO-PASE (24hs)</span>
                <span className="font-semibold text-emerald-800">Hasta {formattedVence}hs</span>
              </div>
            </div>
          </div>

          <p className="my-4 text-xs leading-relaxed text-gray-500 max-w-xs">
            Guarde una copia en su dispositivo móvil para desbloquear los molinetes inteligentes o presentar al personal de control edilicio.
          </p>

          {/* Botones de acción */}
          <div className="flex w-full gap-3">
            <button
              onClick={descargarQR}
              type="button"
              className="flex flex-1 items-center justify-center space-x-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 py-3 text-sm font-semibold transition"
              id="download-qr-btn"
            >
              <Download className="h-4 w-4" />
              <span>Descargar QR</span>
            </button>
            <button
              onClick={compartirWhatsApp}
              type="button"
              className="flex flex-1 items-center justify-center space-x-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white py-3 text-sm font-semibold transition"
              id="share-whatsapp-btn"
            >
              <Share2 className="h-4 w-4" />
              <span>WhatsApp</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

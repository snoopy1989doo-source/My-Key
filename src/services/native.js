import { Capacitor, registerPlugin } from '@capacitor/core';
export const isAndroid = Capacitor.getPlatform() === 'android';
export const NativeVault = registerPlugin('NativeVault');
export const nativeStatus = () => isAndroid ? NativeVault.status() : Promise.resolve({ available: false, enrolled: false, autofillEnabled: false });
export async function mirrorEnvelope(envelope) {
  if (isAndroid) await NativeVault.saveEnvelope({ envelope: JSON.stringify(envelope) });
}
export async function downloadFile(name, content, mime = 'application/json') {
  if (isAndroid) return NativeVault.exportFile({ name, content, mime });
  const url = URL.createObjectURL(new Blob([content], { type: mime }));
  const link = document.createElement('a'); link.href = url; link.download = name; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

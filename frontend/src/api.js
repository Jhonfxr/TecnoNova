const BASE = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8001').replace(/\/$/,'');
export async function api(path,{key,body,method='GET'}={}) {
  let res;
  try {res=await fetch(`${BASE}${path}`,{method,headers:{...(body?{'Content-Type':'application/json'}:{}),...(key?{'X-Admin-Key':key}:{})},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(60000)});}
  catch {throw new Error('No se pudo conectar con la tienda. El servidor puede estar despertando; vuelve a intentarlo en unos segundos.');}
  const data=await res.json().catch(()=>null);
  if(!res.ok) {const msg=typeof data?.detail==='string'?data.detail:res.status===422?'Revisa los campos: nombre, precio, existencias y categoría.':res.status===401?'La clave de administración no es válida.':'No se pudo completar la operación.';throw new Error(msg);}
  return data;
}
export const money=value=>new Intl.NumberFormat('es-BO',{style:'currency',currency:'BOB',maximumFractionDigits:2}).format(Number(value));

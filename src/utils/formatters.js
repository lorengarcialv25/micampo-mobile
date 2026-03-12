/**
 * Utilidades de formateo para la aplicación
 */

export const formatEuro = (amount) => {
  const num = parseFloat(amount);
  if (isNaN(num) || !isFinite(num)) {
    return '0,00 €';
  }
  return `${num.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
};

export const formatNumber = (num, decimals = 2) => {
  const n = parseFloat(num);
  if (isNaN(n) || !isFinite(n)) return '0';
  return n.toLocaleString('es-ES', { 
    minimumFractionDigits: 0, 
    maximumFractionDigits: decimals 
  });
};

export const formatArea = (ha) => {
  const n = parseFloat(ha);
  if (isNaN(n) || !isFinite(n)) return '0 ha';
  return `${formatNumber(n)} ha`;
};

export const formatDate = (date) => {
  if (!date) return "";
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
};

export const formatDateFull = (date) => {
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
};

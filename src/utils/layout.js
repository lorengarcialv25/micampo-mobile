/**
 * Utilidades de layout y safe area
 */

/**
 * Calcula un padding top reducido para el safe area
 * Útil cuando se necesita menos espacio en el header
 * 
 * @param {number} topInset - Valor del safe area top (de useSafeAreaInsets().top)
 * @param {number} multiplier - Multiplicador del safe area (default: 0.7)
 * @param {number} minValue - Valor mínimo en píxeles (default: 10)
 * @returns {number} Padding top calculado
 */
export const getReducedSafeAreaTop = (topInset, multiplier = 0.7, minValue = 10) => {
  return Math.max(topInset * multiplier, minValue);
};

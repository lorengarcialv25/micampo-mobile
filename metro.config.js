// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
let config = getDefaultConfig(__dirname);

// Configurar para manejar módulos ES6 y CommonJS
config.resolver = {
  ...config.resolver,
  sourceExts: [...(config.resolver?.sourceExts || []), 'mjs', 'cjs'],
  // Priorizar archivos .js (CommonJS) sobre .esm.js para paquetes en node_modules
  resolverMainFields: ['react-native', 'browser', 'main', 'module'],
};

// Aplicar NativeWind después de todas las configuraciones
config = withNativeWind(config, { input: './global.css' });

module.exports = config;


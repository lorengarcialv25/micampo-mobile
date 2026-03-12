#!/usr/bin/env node
/**
 * Test rápido para verificar que se puede importar @dypai-ai/client-sdk
 * Ejecutar con: node test-import.js
 * Nota: El paquete es ES Module, así que usamos import dinámico
 */

console.log('🧪 Probando importación de @dypai-ai/client-sdk...\n');

(async () => {
try {
  // Intentar importar el paquete (ES Module)
  const apiServiceModule = await import('@dypai-ai/client-sdk');
  
  console.log('✅ Importación exitosa!\n');
  console.log('📦 Contenido del módulo:');
  console.log('   Tipo:', typeof apiServiceModule);
  
  // Los módulos ES tienen una propiedad default y propiedades nombradas
  const apiService = apiServiceModule.default || apiServiceModule;
  const keys = Object.keys(apiServiceModule);
  
  console.log(`   Propiedades exportadas: ${keys.length}`);
  if (keys.length > 0) {
    console.log('   📌 Principales exports:');
    keys.slice(0, 15).forEach(key => {
      const value = apiServiceModule[key];
      const type = typeof value;
      console.log(`      - ${key}: ${type}${type === 'function' ? '()' : ''}`);
    });
    if (keys.length > 15) {
      console.log(`      ... y ${keys.length - 15} más`);
    }
  }
  
  // Verificar exports comunes esperados
  console.log('\n🔍 Verificando exports esperados:');
  const expectedExports = ['createClient', 'dypai', 'default'];
  expectedExports.forEach(exp => {
    if (apiServiceModule[exp] !== undefined) {
      console.log(`   ✅ ${exp} está disponible`);
    } else {
      console.log(`   ⚠️  ${exp} NO está disponible`);
    }
  });
  
  console.log('\n✅ Test completado exitosamente!');
  console.log('\n💡 El paquete está listo para usar en tu código React Native.');
  
} catch (error) {
  console.error('\n❌ Error al importar el paquete:');
  console.error('   Mensaje:', error.message);
  console.error('   Stack:', error.stack);
  console.error('\n⚠️  Posibles causas:');
  console.error('   1. El paquete necesita ser compilado (ejecuta "npm run build" en el paquete)');
  console.error('   2. El link no está funcionando correctamente');
  console.error('   3. Hay un problema con la configuración de módulos');
  process.exit(1);
}
})();

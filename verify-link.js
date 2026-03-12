#!/usr/bin/env node
/**
 * Script para verificar que @dypai-ai/client-sdk está correctamente vinculado
 */

console.log('🔍 Verificando link de @dypai-ai/client-sdk...\n');

// 1. Verificar que el paquete existe en node_modules
const fs = require('fs');
const path = require('path');

const packagePath = path.join(__dirname, 'node_modules', '@dypai-ai', 'client-sdk');
const packageJsonPath = path.join(packagePath, 'package.json');
const distPath = path.join(packagePath, 'dist', 'index.js');

console.log('1️⃣ Verificando estructura del paquete:');
console.log(`   📁 Ruta del paquete: ${packagePath}`);

if (!fs.existsSync(packagePath)) {
  console.error('   ❌ El paquete NO existe en node_modules');
  process.exit(1);
}

// Verificar si es un symlink
const stats = fs.lstatSync(packagePath);
if (stats.isSymbolicLink()) {
  const target = fs.readlinkSync(packagePath);
  console.log(`   ✅ Es un symlink → ${target}`);
} else {
  console.log('   ⚠️  NO es un symlink (instalación normal)');
}

if (!fs.existsSync(packageJsonPath)) {
  console.error('   ❌ package.json no encontrado');
  process.exit(1);
}
console.log('   ✅ package.json encontrado');

if (!fs.existsSync(distPath)) {
  console.error('   ❌ dist/index.js no encontrado');
  process.exit(1);
}
console.log('   ✅ dist/index.js encontrado\n');

// 2. Leer package.json y mostrar información
console.log('2️⃣ Información del paquete:');
try {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  console.log(`   📦 Nombre: ${packageJson.name}`);
  console.log(`   📌 Versión: ${packageJson.version}`);
  console.log(`   📝 Descripción: ${packageJson.description || 'N/A'}`);
  console.log(`   📄 Main: ${packageJson.main || 'N/A'}`);
  console.log(`   📄 Module: ${packageJson.module || 'N/A'}`);
  console.log(`   📄 Types: ${packageJson.types || 'N/A'}\n`);
} catch (error) {
  console.error('   ❌ Error leyendo package.json:', error.message);
  process.exit(1);
}

// 3. Verificar que se puede importar (solo si estamos en Node.js con ESM)
console.log('3️⃣ Verificando importación:');
try {
  // Intentar leer el archivo de tipos para ver qué exporta
  const typesPath = path.join(packagePath, 'dist', 'index.d.ts');
  if (fs.existsSync(typesPath)) {
    const typesContent = fs.readFileSync(typesPath, 'utf8');
    const exports = typesContent.match(/export\s+(?:declare\s+)?(?:class|function|const|interface|type|enum)\s+(\w+)/g) || [];
    console.log(`   ✅ Archivo de tipos encontrado`);
    console.log(`   📋 Exports encontrados: ${exports.length}`);
    if (exports.length > 0) {
      console.log('   📌 Principales exports:');
      exports.slice(0, 10).forEach(exp => {
        const match = exp.match(/(?:class|function|const|interface|type|enum)\s+(\w+)/);
        if (match) console.log(`      - ${match[1]}`);
      });
      if (exports.length > 10) {
        console.log(`      ... y ${exports.length - 10} más`);
      }
    }
  } else {
    console.log('   ⚠️  Archivo de tipos no encontrado');
  }
} catch (error) {
  console.error('   ❌ Error verificando tipos:', error.message);
}

console.log('\n4️⃣ Verificando package.json del proyecto:');
const projectPackageJsonPath = path.join(__dirname, 'package.json');
if (fs.existsSync(projectPackageJsonPath)) {
  const projectPackageJson = JSON.parse(fs.readFileSync(projectPackageJsonPath, 'utf8'));
  const hasDependency = projectPackageJson.dependencies?.['@dypai-ai/client-sdk'] ||
                        projectPackageJson.devDependencies?.['@dypai-ai/client-sdk'];
  
  if (hasDependency) {
    console.log(`   ✅ @dypai-ai/client-sdk está en package.json: ${hasDependency}`);
  } else {
    console.log('   ⚠️  @dypai-ai/client-sdk NO está en package.json');
    console.log('   💡 El link funciona, pero considera agregarlo a dependencies para documentación');
  }
} else {
  console.log('   ⚠️  package.json del proyecto no encontrado');
}

console.log('\n✅ Verificación completada!');
console.log('\n💡 Para usar el paquete en tu código:');
console.log('   import { createClient } from "@dypai-ai/client-sdk";');
console.log('   const dypai = createClient(url, apiKey);');

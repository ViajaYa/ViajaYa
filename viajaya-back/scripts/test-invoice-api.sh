#!/bin/bash

# Script de prueba completa para el sistema de facturas
BASE_URL="http://localhost:3001"

echo "🧪 INICIANDO PRUEBAS DEL SISTEMA DE FACTURAS"
echo "=============================================="

# 1. Probar obtener contratos pendientes
echo ""
echo "1️⃣ PROBANDO: Obtener contratos pendientes de facturar"
echo "GET $BASE_URL/invoices/pending"
curl -X GET "$BASE_URL/invoices/pending" -H "Content-Type: application/json" | jq '.'

echo ""
echo ""
echo "2️⃣ PROBANDO: Obtener todas las facturas existentes"
echo "GET $BASE_URL/invoices"
curl -X GET "$BASE_URL/invoices" -H "Content-Type: application/json" | jq '.'

echo ""
echo ""
echo "3️⃣ PROBANDO: Generar factura (necesita un contractId válido)"
echo "POST $BASE_URL/invoices/generate/CONTRACT_ID"
echo "⚠️  Primero necesitas crear datos de prueba con contractId válido"

echo ""
echo ""
echo "4️⃣ PROBANDO: Obtener factura por ID (necesita una factura existente)"
echo "GET $BASE_URL/invoices/INVOICE_ID"
echo "⚠️  Necesita un ID de factura válido"

echo ""
echo ""
echo "5️⃣ PROBANDO: Actualizar estado de factura"
echo "PATCH $BASE_URL/invoices/INVOICE_ID/status"
echo "⚠️  Necesita un ID de factura válido"

echo ""
echo ""
echo "🎯 PARA CREAR DATOS DE PRUEBA, EJECUTA:"
echo "   cd viajaya-back"
echo "   node scripts/seed-invoice-test-data.js"

echo ""
echo "✅ PRUEBAS COMPLETADAS"

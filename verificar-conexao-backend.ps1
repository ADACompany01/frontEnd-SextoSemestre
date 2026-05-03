# Script para verificar conexão com o backend
Write-Host "🔍 Verificando conexão com o backend..." -ForegroundColor Cyan
Write-Host ""

# Obter IP atual
$ipv4 = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -like "192.168.*" } | Select-Object -First 1).IPAddress
Write-Host "📍 IP atual da máquina: $ipv4" -ForegroundColor Yellow
Write-Host ""

# Verificar se porta 3000 está em uso
Write-Host "🔌 Verificando porta 3000..." -ForegroundColor Cyan
$port3000 = netstat -ano | findstr :3000
if ($port3000) {
    Write-Host "✅ Porta 3000 está em uso (backend provavelmente rodando)" -ForegroundColor Green
} else {
    Write-Host "❌ Porta 3000 não está em uso (backend não está rodando)" -ForegroundColor Red
    Write-Host "   Execute: cd ..\..\backEnd-QuintoSemestre\API_NEST\API_ADA_COMPANY_NESTJS" -ForegroundColor Yellow
    Write-Host "   Depois: npm run start:dev" -ForegroundColor Yellow
}
Write-Host ""

# Testar localhost
Write-Host "🌐 Testando localhost:3000..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api" -TimeoutSec 5 -UseBasicParsing
    Write-Host "✅ Backend acessível em localhost:3000 (Status: $($response.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "❌ Backend não acessível em localhost:3000" -ForegroundColor Red
    Write-Host "   Erro: $($_.Exception.Message)" -ForegroundColor Yellow
}
Write-Host ""

# Testar IP da rede local
Write-Host "🌐 Testando $ipv4:3000..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "http://$ipv4:3000/api" -TimeoutSec 5 -UseBasicParsing
    Write-Host "✅ Backend acessível em $ipv4:3000 (Status: $($response.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "❌ Backend não acessível em $ipv4:3000" -ForegroundColor Red
    Write-Host "   Erro: $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host "   Verifique o firewall do Windows" -ForegroundColor Yellow
}
Write-Host ""

# Verificar configuração do frontend
Write-Host "📝 Verificando configuração do frontend..." -ForegroundColor Cyan
$configFile = "config\api.config.ts"
if (Test-Path $configFile) {
    $configContent = Get-Content $configFile -Raw
    if ($configContent -match "LOCAL_IP = '([^']+)'") {
        $configuredIP = $matches[1]
        Write-Host "   IP configurado no frontend: $configuredIP" -ForegroundColor Yellow
        if ($configuredIP -ne $ipv4) {
            Write-Host "   ⚠️  IP diferente do atual! Atualize o arquivo config/api.config.ts" -ForegroundColor Red
            Write-Host "      Mude: const LOCAL_IP = '$configuredIP';" -ForegroundColor Yellow
            Write-Host "      Para: const LOCAL_IP = '$ipv4';" -ForegroundColor Green
        } else {
            Write-Host "   ✅ IP configurado corretamente" -ForegroundColor Green
        }
    }
} else {
    Write-Host "   ⚠️  Arquivo config/api.config.ts não encontrado" -ForegroundColor Yellow
}
Write-Host ""

Write-Host "📋 Resumo:" -ForegroundColor Cyan
Write-Host "   - IP da máquina: $ipv4" -ForegroundColor White
Write-Host "   - URL do backend: http://$ipv4:3000" -ForegroundColor White
Write-Host "   - URL do Swagger: http://$ipv4:3000/api" -ForegroundColor White
Write-Host ""


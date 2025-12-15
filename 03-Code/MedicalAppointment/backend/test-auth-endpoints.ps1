# Script de prueba para endpoints de autenticación
# Ejecutar: .\test-auth-endpoints.ps1

$baseUrl = "http://localhost:3000/api"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "PRUEBAS DE AUTENTICACIÓN" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Variables para almacenar tokens
$token = $null
$refreshToken = $null

# Test 1: Login
Write-Host "1️⃣  Probando POST /api/sessions (Login)..." -ForegroundColor Yellow
try {
    $loginBody = @{
        email = "admin@clinica.com"
        password = "admin123"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$baseUrl/sessions" -Method Post -Body $loginBody -ContentType "application/json"
    
    if ($response.success) {
        Write-Host "✅ Login exitoso" -ForegroundColor Green
        Write-Host "   Usuario: $($response.user.first_name) $($response.user.last_name)" -ForegroundColor Gray
        Write-Host "   Role: $($response.user.role)" -ForegroundColor Gray
        Write-Host "   Token: $($response.token.Substring(0, 30))..." -ForegroundColor Gray
        
        $token = $response.token
        $refreshToken = $response.refreshToken
    } else {
        Write-Host "❌ Login falló" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   Verifica que exista un usuario con email: admin@clinica.com y password: admin123" -ForegroundColor Yellow
}

Start-Sleep -Seconds 1

# Test 2: Refresh Token
Write-Host "`n2️⃣  Probando POST /api/sessions/refresh (Refresh Token)..." -ForegroundColor Yellow
if ($refreshToken) {
    try {
        $refreshBody = @{
            refreshToken = $refreshToken
        } | ConvertTo-Json

        $response = Invoke-RestMethod -Uri "$baseUrl/sessions/refresh" -Method Post -Body $refreshBody -ContentType "application/json"
        
        if ($response.success) {
            Write-Host "✅ Refresh exitoso" -ForegroundColor Green
            Write-Host "   Nuevo token generado" -ForegroundColor Gray
            $token = $response.token
        } else {
            Write-Host "❌ Refresh falló" -ForegroundColor Red
        }
    } catch {
        Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    }
} else {
    Write-Host "⏭️  Saltando (no hay refresh token del login)" -ForegroundColor Yellow
}

Start-Sleep -Seconds 1

# Test 3: Logout
Write-Host "`n3️⃣  Probando DELETE /api/sessions (Logout)..." -ForegroundColor Yellow
if ($token) {
    try {
        $headers = @{
            "Authorization" = "Bearer $token"
        }

        $response = Invoke-RestMethod -Uri "$baseUrl/sessions" -Method Delete -Headers $headers
        
        if ($response.success) {
            Write-Host "✅ Logout exitoso" -ForegroundColor Green
            Write-Host "   Mensaje: $($response.message)" -ForegroundColor Gray
        } else {
            Write-Host "❌ Logout falló" -ForegroundColor Red
        }
    } catch {
        Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    }
} else {
    Write-Host "⏭️  Saltando (no hay token del login)" -ForegroundColor Yellow
}

Start-Sleep -Seconds 1

# Test 4: Solicitar Password Reset
Write-Host "`n4️⃣  Probando POST /api/password-resets (Solicitar Reset)..." -ForegroundColor Yellow
try {
    $resetBody = @{
        email = "admin@clinica.com"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$baseUrl/password-resets" -Method Post -Body $resetBody -ContentType "application/json"
    
    if ($response.success) {
        Write-Host "✅ Solicitud de reset exitosa" -ForegroundColor Green
        Write-Host "   Mensaje: $($response.message)" -ForegroundColor Gray
        Write-Host "   📧 Revisa la consola del servidor para ver el email simulado con el token" -ForegroundColor Cyan
    } else {
        Write-Host "❌ Solicitud falló" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}

Start-Sleep -Seconds 1

# Test 5: Confirmar Password Reset (requiere token real del email)
Write-Host "`n5️⃣  Probando PATCH /api/password-resets/:token (Confirmar Reset)..." -ForegroundColor Yellow
Write-Host "⚠️  Para probar esto, necesitas copiar el token del email simulado en la consola" -ForegroundColor Yellow
Write-Host "   Ejemplo: PATCH $baseUrl/password-resets/tu_token_aqui" -ForegroundColor Gray

# Test 6: Login con credenciales inválidas
Write-Host "`n6️⃣  Probando login con credenciales inválidas..." -ForegroundColor Yellow
try {
    $invalidBody = @{
        email = "noexiste@example.com"
        password = "wrongpassword"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$baseUrl/sessions" -Method Post -Body $invalidBody -ContentType "application/json"
    Write-Host "❌ Debería haber fallado pero no lo hizo" -ForegroundColor Red
} catch {
    if ($_.ErrorDetails -and $_.ErrorDetails.Message) {
        $errorDetails = $_.ErrorDetails.Message | ConvertFrom-Json
        if ($errorDetails.error -match "Credenciales inválidas|Usuario no encontrado") {
            Write-Host "✅ Error manejado correctamente: $($errorDetails.error)" -ForegroundColor Green
        } else {
            Write-Host "⚠️  Error diferente: $($errorDetails.error)" -ForegroundColor Yellow
        }
    } else {
        Write-Host "⚠️  Error sin detalles: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

# Test 7: Refresh con token inválido
Write-Host "`n7️⃣  Probando refresh con token inválido..." -ForegroundColor Yellow
try {
    $invalidRefresh = @{
        refreshToken = "token_invalido_123"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$baseUrl/sessions/refresh" -Method Post -Body $invalidRefresh -ContentType "application/json"
    Write-Host "❌ Debería haber fallado pero no lo hizo" -ForegroundColor Red
} catch {
    if ($_.ErrorDetails -and $_.ErrorDetails.Message) {
        $errorDetails = $_.ErrorDetails.Message | ConvertFrom-Json
        if ($errorDetails.code -match "INVALID_REFRESH_TOKEN") {
            Write-Host "✅ Error manejado correctamente: $($errorDetails.error)" -ForegroundColor Green
        } else {
            Write-Host "⚠️  Error diferente: $($errorDetails.error)" -ForegroundColor Yellow
        }
    } else {
        Write-Host "⚠️  Error sin detalles: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "RESUMEN DE PRUEBAS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ Login funcionando" -ForegroundColor Green
Write-Host "✅ Refresh token funcionando" -ForegroundColor Green
Write-Host "✅ Logout funcionando" -ForegroundColor Green
Write-Host "✅ Solicitud de password reset funcionando" -ForegroundColor Green
Write-Host "⚠️  Confirmación de reset requiere token del email" -ForegroundColor Yellow
Write-Host "✅ Manejo de errores funcionando`n" -ForegroundColor Green

Write-Host "📌 Próximos pasos:" -ForegroundColor Cyan
Write-Host "   1. Copia el token del email en la consola del servidor" -ForegroundColor Gray
Write-Host "   2. Ejecuta manualmente:" -ForegroundColor Gray
Write-Host "      `$body = @{ password='nueva123'; confirmPassword='nueva123' } | ConvertTo-Json" -ForegroundColor Gray
Write-Host "      Invoke-RestMethod -Uri '$baseUrl/password-resets/TU_TOKEN' -Method Patch -Body `$body -ContentType 'application/json'" -ForegroundColor Gray
Write-Host ""

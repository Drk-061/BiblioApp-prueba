param(
  [Parameter(Mandatory=$true)][string]$RutaProyecto,
  [switch]$EliminarMvp
)
$ErrorActionPreference='Stop'
$origen=Split-Path -Parent $PSScriptRoot
$destino=(Resolve-Path $RutaProyecto).Path
if (!(Test-Path (Join-Path $destino 'package.json')) -or !(Test-Path (Join-Path $destino 'src/app'))) {throw 'La ruta debe ser la raíz de tu app Expo original (con package.json y src/app).'}
if (!(Test-Path (Join-Path $destino 'backend/src/app.js'))) {throw 'No se encontró el backend existente. No se modificó nada.'}
$marca=Get-Date -Format 'yyyyMMdd-HHmmss'
$backup=Join-Path $destino "backup-integracion-$marca"
New-Item -ItemType Directory -Force -Path $backup | Out-Null
foreach($base in @('src','backend/src')) {
  $carpeta=Join-Path $origen $base
  Get-ChildItem $carpeta -File -Recurse | ForEach-Object {
    $rel=$_.FullName.Substring($origen.Length+1)
    $target=Join-Path $destino $rel
    $b=Join-Path $backup $rel
    if(Test-Path $target){New-Item -ItemType Directory -Force -Path (Split-Path $b -Parent) | Out-Null;Copy-Item $target $b -Force}
    New-Item -ItemType Directory -Force -Path (Split-Path $target -Parent) | Out-Null
    Copy-Item $_.FullName $target -Force
    Write-Host "Actualizado: $rel"
  }
}
if($EliminarMvp){Get-ChildItem (Join-Path $destino 'src/app') -File -Filter 'mvp*.tsx' | ForEach-Object {
  Copy-Item $_.FullName (Join-Path $backup $_.Name) -Force
  Remove-Item $_.FullName -Force
  Write-Host "Ruta MVP retirada: $($_.Name)"
}}
Write-Host "Copia de seguridad: $backup"
Write-Host 'Se conservaron _layout.tsx, imágenes y los componentes compartidos.'

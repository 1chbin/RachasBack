$port = if ($env:PORT) { [int]$env:PORT } else { 3000 }
$listeners = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
if ($listeners) {
  $pids = $listeners.OwningProcess | Sort-Object -Unique
  Write-Warning "Puerto $port en uso (PID: $($pids -join ', ')). RachasBack no podrá arrancar hasta liberarlo."
  exit 0
}
Write-Host "Puerto $port libre."

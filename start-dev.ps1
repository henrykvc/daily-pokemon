Set-Location $PSScriptRoot
& "C:\Program Files\nodejs\npm.cmd" run dev 2>&1 | Tee-Object -FilePath "$PSScriptRoot\dev.log"

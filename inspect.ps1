$filePath = Join-Path $PSScriptRoot "OpTransactionHistory02-08-2026.xls"
$bytes = [System.IO.File]::ReadAllBytes($filePath)
$text = [System.Text.Encoding]::UTF8.GetString($bytes)
$matches = [regex]::Matches($text, '[\x20-\x7E]{3,}')
$counter = 0
foreach ($m in $matches) {
    $val = $m.Value.Trim()
    if ($val.Length -ge 3) {
        $counter++
        if ($counter -gt 295) {
            Write-Output "${counter}: [$val]"
        }
    }
}

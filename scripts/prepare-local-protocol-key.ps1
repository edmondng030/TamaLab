param(
  [Parameter(Mandatory = $true)][string]$InspectedSecretsFile
)
$ErrorActionPreference = 'Stop'
# Consume the local inspection output; never print or commit the shared key.
$sourceText = Get-Content -LiteralPath $InspectedSecretsFile -Raw
$keyMatch = [regex]::Match($sourceText, 'TcpSecret\s*=\s*Encoding\.ASCII\.GetBytes\("([^"\\\r\n]+)"\)')
if (-not $keyMatch.Success) { throw 'Unrecognized local key declaration; no configuration generated.' }
$keyBytes = [Text.Encoding]::ASCII.GetBytes($keyMatch.Groups[1].Value)
if ($keyBytes.Length -lt 1 -or $keyBytes.Length -gt 256) { throw 'Unexpected key size.' }
$outputDirectory = Join-Path (Split-Path $PSScriptRoot -Parent) '.local'
New-Item -ItemType Directory -Path $outputDirectory -Force | Out-Null
$outputFile = Join-Path $outputDirectory 'patchi-protocol-key.json'
$configuration = @{ format = 'tamalab-protocol-key-v1'; keyHex = [Convert]::ToHexString($keyBytes) } | ConvertTo-Json
[IO.File]::WriteAllText($outputFile, $configuration, [Text.UTF8Encoding]::new($false))
[Array]::Clear($keyBytes, 0, $keyBytes.Length)
Write-Output 'Created .local/patchi-protocol-key.json for browser import. Key contents were not printed.'

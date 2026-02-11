param(
  [string]$ProjectsRoot = "..",
  [string]$OutputFile = "templates-data.js"
)

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$forgeRoot = Resolve-Path (Join-Path $scriptDir "..")
$projectsPath = Resolve-Path (Join-Path $forgeRoot $ProjectsRoot)
$outputPath = Join-Path $forgeRoot $OutputFile

function Get-RelativePathCompat {
  param(
    [string]$BasePath,
    [string]$TargetPath
  )

  $baseFull = (Resolve-Path $BasePath).Path
  if (-not $baseFull.EndsWith("\") -and -not $baseFull.EndsWith("/")) {
    $baseFull = "$baseFull\"
  }
  $targetFull = (Resolve-Path $TargetPath).Path

  $baseUri = New-Object System.Uri($baseFull)
  $targetUri = New-Object System.Uri($targetFull)
  $relativeUri = $baseUri.MakeRelativeUri($targetUri).ToString()
  [System.Uri]::UnescapeDataString($relativeUri)
}

function Get-TierFromPath {
  param([string]$fullPath)
  $parts = $fullPath -split "[\\/]"
  foreach ($part in $parts) {
    if ($part -in @("starter", "business", "premium")) { return $part }
  }
  return "custom"
}

function Get-CategoryFromName {
  param([string]$name)
  $n = $name.ToLowerInvariant()
  if ($n -match "grill|diner|cheeze|candle|flower|donut|meats") { return "Food & Retail" }
  if ($n -match "quilt|hair|emporium|mall|shop|antique|boutique") { return "Local Business" }
  if ($n -match "league|team|sports|ring|killing floor") { return "Sports & Entertainment" }
  return "General Business"
}

function Pick-PreviewImage {
  param([string]$templateDir, [string]$projectDir)

  $preferredPatterns = @(
    "preview*.png",
    "preview*.jpg",
    "preview*.bmp",
    "screenshot*.png",
    "screenshot*.bmp",
    "hero*.png",
    "hero*.jpg",
    "hero*.bmp",
    "logo*.png",
    "logo*.bmp"
  )

  foreach ($pattern in $preferredPatterns) {
    $candidate = Get-ChildItem -Path $templateDir -File -Filter $pattern -Recurse -ErrorAction SilentlyContinue |
      Select-Object -First 1
    if ($candidate) { return $candidate.FullName }
  }

  $fallback = Get-ChildItem -Path $templateDir -File -Include *.png,*.jpg,*.jpeg,*.webp,*.bmp -Recurse -ErrorAction SilentlyContinue |
    Select-Object -First 1
  if ($fallback) { return $fallback.FullName }

  $projectFallback = Get-ChildItem -Path $projectDir -File -Include *.png,*.jpg,*.jpeg,*.webp,*.bmp -Recurse -ErrorAction SilentlyContinue |
    Select-Object -First 1
  if ($projectFallback) { return $projectFallback.FullName }

  return $null
}

$indexFiles = Get-ChildItem -Path $projectsPath -Recurse -File -Filter "index.html" |
  Where-Object {
    $_.FullName -notlike "*\ForgeAi-main\*"
  }

$items = @()

foreach ($indexFile in $indexFiles) {
  $templateDir = Split-Path -Parent $indexFile.FullName
  $relativeTemplateDir = Get-RelativePathCompat -BasePath $projectsPath.Path -TargetPath $templateDir
  $relativeParts = ($relativeTemplateDir -replace "\\", "/").Split("/")

  $projectName = $relativeParts[0]
  $projectDir = Join-Path $projectsPath.Path $projectName
  $folderName = Split-Path -Leaf $templateDir
  $tier = Get-TierFromPath -fullPath $templateDir
  $category = Get-CategoryFromName -name $projectName
  $status = if (Test-Path (Join-Path $projectDir "tier_complete.json")) { "Complete" } else { "In Progress" }

  $preview = Pick-PreviewImage -templateDir $templateDir -projectDir $projectDir
  $previewRel = if ($preview) {
    $rel = Get-RelativePathCompat -BasePath $forgeRoot.Path -TargetPath $preview
    ($rel -replace "\\", "/")
  } else {
    "./forgeai-logo.png"
  }

  $templateRel = (Get-RelativePathCompat -BasePath $forgeRoot.Path -TargetPath $indexFile.FullName) -replace "\\", "/"

  $item = [PSCustomObject]@{
    id = ("{0}-{1}-{2}" -f ($projectName -replace "[^A-Za-z0-9]+", "-").ToLowerInvariant(), ($folderName -replace "[^A-Za-z0-9]+", "-").ToLowerInvariant(), $tier)
    name = $projectName
    title = "{0} ({1})" -f $projectName, ($tier.Substring(0,1).ToUpper() + $tier.Substring(1))
    tier = $tier
    category = $category
    status = $status
    path = $templateRel
    preview = $previewRel
    updated = $indexFile.LastWriteTime.ToString("yyyy-MM-dd")
  }

  $items += $item
}

$sorted = $items | Sort-Object name, tier
$json = $sorted | ConvertTo-Json -Depth 5

$content = @"
window.TEMPLATES_DATA = $json;
"@

Set-Content -Path $outputPath -Value $content -Encoding UTF8
Write-Host "Generated templates manifest:"
Write-Host "  $outputPath"
Write-Host ("  Items: {0}" -f $sorted.Count)

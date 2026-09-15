<#
  Generates placeholder PWA icons (a simple leaf mark) using .NET System.Drawing.
  Replace these with real designed icons later — run again after editing this
  script if you want to tweak the placeholder art.
#>
Add-Type -AssemblyName System.Drawing

function New-LeafIcon {
    param(
        [int]$Size,
        [string]$OutPath,
        [bool]$FullBleed = $false   # true for maskable: no rounded corners, background fills edge-to-edge
    )

    $bmp = New-Object System.Drawing.Bitmap($Size, $Size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.Clear([System.Drawing.Color]::Transparent)

    $bgBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 22, 163, 74)) # #16a34a

    if ($FullBleed) {
        $g.FillRectangle($bgBrush, 0, 0, $Size, $Size)
    } else {
        $radius = [int]($Size * 0.22)
        $path = New-Object System.Drawing.Drawing2D.GraphicsPath
        $d = $radius * 2
        $path.AddArc(0, 0, $d, $d, 180, 90)
        $path.AddArc($Size - $d, 0, $d, $d, 270, 90)
        $path.AddArc($Size - $d, $Size - $d, $d, $d, 0, 90)
        $path.AddArc(0, $Size - $d, $d, $d, 90, 90)
        $path.CloseFigure()
        $g.FillPath($bgBrush, $path)
    }

    # leaf: two overlapping "petal" ellipses meeting on the vertical centerline
    $cx = $Size / 2
    $topY = $Size * 0.22
    $bottomY = $Size * 0.78
    $spread = $Size * 0.20

    $leafLight = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 187, 247, 208)) # #bbf7d0
    $leafDark  = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 74, 222, 128))  # #4ade80

    $rightPath = New-Object System.Drawing.Drawing2D.GraphicsPath
    $rightPath.AddBezier(
        [System.Drawing.PointF]::new($cx, $bottomY),
        [System.Drawing.PointF]::new($cx + $spread, $bottomY - ($Size * 0.30)),
        [System.Drawing.PointF]::new($cx + $spread * 1.15, $topY + ($Size * 0.10)),
        [System.Drawing.PointF]::new($cx, $topY)
    )
    $rightPath.CloseFigure()
    $g.FillPath($leafLight, $rightPath)

    $leftPath = New-Object System.Drawing.Drawing2D.GraphicsPath
    $leftPath.AddBezier(
        [System.Drawing.PointF]::new($cx, $bottomY),
        [System.Drawing.PointF]::new($cx - $spread, $bottomY - ($Size * 0.30)),
        [System.Drawing.PointF]::new($cx - $spread * 1.15, $topY + ($Size * 0.10)),
        [System.Drawing.PointF]::new($cx, $topY)
    )
    $leftPath.CloseFigure()
    $g.FillPath($leafDark, $leftPath)

    $stemPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(255, 22, 101, 52)), ([float]($Size * 0.018))
    $stemPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $stemPen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    $g.DrawLine($stemPen, $cx, $bottomY, $cx, $topY)

    $bmp.Save($OutPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
}

$root = Split-Path -Parent $PSScriptRoot
$iconsDir = Join-Path $root 'public\icons'
New-Item -ItemType Directory -Force -Path $iconsDir | Out-Null

New-LeafIcon -Size 192 -OutPath (Join-Path $iconsDir 'icon-192.png') -FullBleed $false
New-LeafIcon -Size 512 -OutPath (Join-Path $iconsDir 'icon-512.png') -FullBleed $false
New-LeafIcon -Size 512 -OutPath (Join-Path $iconsDir 'icon-maskable-512.png') -FullBleed $true
New-LeafIcon -Size 180 -OutPath (Join-Path $iconsDir 'apple-touch-icon.png') -FullBleed $false

Write-Output "Icons generated in $iconsDir"

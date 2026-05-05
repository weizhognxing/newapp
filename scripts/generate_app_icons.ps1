Add-Type -AssemblyName System.Drawing

function New-RoundedRectPath {
  param(
    [float]$X,
    [float]$Y,
    [float]$Width,
    [float]$Height,
    [float]$Radius
  )

  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $diameter = $Radius * 2

  $path.AddArc($X, $Y, $diameter, $diameter, 180, 90)
  $path.AddArc($X + $Width - $diameter, $Y, $diameter, $diameter, 270, 90)
  $path.AddArc($X + $Width - $diameter, $Y + $Height - $diameter, $diameter, $diameter, 0, 90)
  $path.AddArc($X, $Y + $Height - $diameter, $diameter, $diameter, 90, 90)
  $path.CloseFigure()

  return $path
}

function New-LinearBrush {
  param(
    [float]$X1,
    [float]$Y1,
    [float]$X2,
    [float]$Y2,
    [System.Drawing.Color]$StartColor,
    [System.Drawing.Color]$EndColor
  )

  return New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    ([System.Drawing.PointF]::new([float]$X1, [float]$Y1)),
    ([System.Drawing.PointF]::new([float]$X2, [float]$Y2)),
    $StartColor,
    $EndColor
  )
}

function New-PointF {
  param([float]$X, [float]$Y)
  return [System.Drawing.PointF]::new($X, $Y)
}

function New-RectangleF {
  param([float]$X, [float]$Y, [float]$Width, [float]$Height)
  return [System.Drawing.RectangleF]::new($X, $Y, $Width, $Height)
}

function Draw-BrandForeground {
  param(
    [System.Drawing.Graphics]$Graphics,
    [float]$CanvasSize,
    [float]$Scale,
    [bool]$TransparentBackground = $false
  )

  $blue1 = [System.Drawing.Color]::FromArgb(255, 6, 67, 196)
  $blue2 = [System.Drawing.Color]::FromArgb(255, 17, 149, 242)
  $blue3 = [System.Drawing.Color]::FromArgb(255, 0, 190, 255)
  $cyan = [System.Drawing.Color]::FromArgb(255, 133, 246, 255)
  $dotColor = [System.Drawing.Color]::FromArgb(90, 200, 246, 255)

  $left = $CanvasSize * (0.22 * $Scale + (1 - $Scale) / 2)
  $top = $CanvasSize * (0.18 * $Scale + (1 - $Scale) / 2)
  $height = $CanvasSize * 0.64 * $Scale
  $stemWidth = $CanvasSize * 0.17 * $Scale
  $right = $CanvasSize * (0.78 * $Scale + (1 - $Scale) / 2)
  $centerY = $CanvasSize * 0.5
  $innerX = $left + $stemWidth
  $armThickness = $CanvasSize * 0.11 * $Scale

  $stemRect = New-RectangleF -X $left -Y $top -Width $stemWidth -Height $height
  $kPath = New-Object System.Drawing.Drawing2D.GraphicsPath
  $kPath.AddPath((New-RoundedRectPath -X $stemRect.X -Y $stemRect.Y -Width $stemRect.Width -Height $stemRect.Height -Radius ($CanvasSize * 0.018 * $Scale)), $false)

  $topArm = New-Object System.Drawing.PointF[] 6
  $topArm[0] = New-PointF -X $innerX -Y ($centerY + $armThickness * 0.15)
  $topArm[1] = New-PointF -X ($right - $armThickness * 0.92) -Y $top
  $topArm[2] = New-PointF -X $right -Y $top
  $topArm[3] = New-PointF -X ($innerX + $armThickness * 0.92) -Y ($centerY + $armThickness)
  $topArm[4] = New-PointF -X ($innerX + $armThickness * 0.45) -Y ($centerY + $armThickness)
  $topArm[5] = New-PointF -X $innerX -Y ($centerY + $armThickness * 0.45)
  $kPath.AddPolygon($topArm)

  $bottomArm = New-Object System.Drawing.PointF[] 6
  $bottomArm[0] = New-PointF -X $innerX -Y ($centerY - $armThickness * 0.15)
  $bottomArm[1] = New-PointF -X ($right - $armThickness * 0.92) -Y ($top + $height)
  $bottomArm[2] = New-PointF -X $right -Y ($top + $height)
  $bottomArm[3] = New-PointF -X ($innerX + $armThickness * 0.92) -Y ($centerY - $armThickness)
  $bottomArm[4] = New-PointF -X ($innerX + $armThickness * 0.45) -Y ($centerY - $armThickness)
  $bottomArm[5] = New-PointF -X $innerX -Y ($centerY - $armThickness * 0.45)
  $kPath.AddPolygon($bottomArm)

  $brush = New-LinearBrush -X1 $left -Y1 ($top + $height) -X2 $right -Y2 $top -StartColor $blue1 -EndColor $blue2
  $Graphics.FillPath($brush, $kPath)
  $brush.Dispose()

  $glossPath = New-Object System.Drawing.Drawing2D.GraphicsPath
  $glossPoly = New-Object System.Drawing.PointF[] 4
  $glossPoly[0] = New-PointF -X $left -Y ($centerY + $CanvasSize * 0.015 * $Scale)
  $glossPoly[1] = New-PointF -X ($right - $CanvasSize * 0.18 * $Scale) -Y ($top + $CanvasSize * 0.1 * $Scale)
  $glossPoly[2] = New-PointF -X ($right - $CanvasSize * 0.02 * $Scale) -Y ($top + $CanvasSize * 0.1 * $Scale)
  $glossPoly[3] = New-PointF -X $left -Y ($centerY - $CanvasSize * 0.12 * $Scale)
  $glossPath.AddPolygon($glossPoly)
  $glossBrush = New-LinearBrush -X1 $left -Y1 $top -X2 $right -Y2 ($top + $height) -StartColor ([System.Drawing.Color]::FromArgb(85, 170, 245, 255)) -EndColor ([System.Drawing.Color]::FromArgb(10, 255, 255, 255))
  $Graphics.FillPath($glossBrush, $glossPath)
  $glossBrush.Dispose()
  $glossPath.Dispose()

  $waveCenterX = $CanvasSize * 0.5
  $barCount = 17
  $barSpacing = $CanvasSize * 0.031 * $Scale
  $barWidth = $CanvasSize * 0.016 * $Scale
  $maxBar = $CanvasSize * 0.19 * $Scale
  $barBrush = New-LinearBrush -X1 0 -Y1 ($centerY - $maxBar) -X2 0 -Y2 ($centerY + $maxBar) -StartColor $cyan -EndColor $blue3
  for ($i = 0; $i -lt $barCount; $i++) {
    $offset = $i - [math]::Floor($barCount / 2)
    $distance = [math]::Abs($offset)
    $heightFactor = [math]::Max(0.12, 1 - ($distance / 9.0))
    $barHeight = $maxBar * $heightFactor
    $x = $waveCenterX + $offset * $barSpacing - ($barWidth / 2)
    $rect = New-RectangleF -X $x -Y ($centerY - $barHeight / 2) -Width $barWidth -Height $barHeight
    $Graphics.FillPath($barBrush, (New-RoundedRectPath -X $rect.X -Y $rect.Y -Width $rect.Width -Height $rect.Height -Radius ($barWidth / 2)))
  }
  $barBrush.Dispose()

  $dotBrush = New-Object System.Drawing.SolidBrush($dotColor)
  $dotRadius = $CanvasSize * 0.0045 * $Scale
  $gridLeft = $CanvasSize * (0.57 * $Scale + (1 - $Scale) / 2)
  $gridTop = $CanvasSize * (0.19 * $Scale + (1 - $Scale) / 2)
  $gridStep = $CanvasSize * 0.017 * $Scale
  for ($row = 0; $row -lt 25; $row++) {
    for ($col = 0; $col -lt 15; $col++) {
      if ((($row + $col) % 3) -eq 0) {
        $Graphics.FillEllipse($dotBrush, $gridLeft + $col * $gridStep, $gridTop + $row * $gridStep, $dotRadius * 2, $dotRadius * 2)
      }
    }
  }
  $dotBrush.Dispose()

  if (-not $TransparentBackground) {
    $outlinePen = [System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(55, 3, 39, 130), [float]($CanvasSize * 0.0035))
    $Graphics.DrawPath($outlinePen, $kPath)
    $outlinePen.Dispose()
  }

  $kPath.Dispose()
}

function Save-Png {
  param(
    [System.Drawing.Bitmap]$Bitmap,
    [string]$Path
  )

  $Bitmap.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
  $Bitmap.Dispose()
}

function Save-ScaledPng {
  param(
    [System.Drawing.Bitmap]$Source,
    [int]$Width,
    [int]$Height,
    [string]$Path
  )

  $bitmap = New-Object System.Drawing.Bitmap $Width, $Height
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $graphics.Clear([System.Drawing.Color]::Transparent)
  $graphics.DrawImage($Source, 0, 0, $Width, $Height)
  $graphics.Dispose()
  $bitmap.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
  $bitmap.Dispose()
}

$root = Split-Path -Parent $PSScriptRoot
$assetsDir = Join-Path $root 'assets'

# Standard app icon with a clean white tile and no extra shadow haze.
$icon = New-Object System.Drawing.Bitmap 1024, 1024
$g = [System.Drawing.Graphics]::FromImage($icon)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$g.Clear([System.Drawing.Color]::FromArgb(255, 255, 255, 255))

$bgRect = New-RectangleF -X 0 -Y 0 -Width 1024 -Height 1024
$bgBrush = New-LinearBrush -X1 0 -Y1 0 -X2 1024 -Y2 1024 -StartColor ([System.Drawing.Color]::FromArgb(255, 255, 255, 255)) -EndColor ([System.Drawing.Color]::FromArgb(255, 244, 249, 255))
$g.FillRectangle($bgBrush, $bgRect)
$bgBrush.Dispose()

$tilePath = New-RoundedRectPath -X 84 -Y 84 -Width 856 -Height 856 -Radius 132

$tileBrush = New-LinearBrush -X1 84 -Y1 84 -X2 940 -Y2 940 -StartColor ([System.Drawing.Color]::FromArgb(255, 255, 255, 255)) -EndColor ([System.Drawing.Color]::FromArgb(255, 247, 251, 255))
$g.FillPath($tileBrush, $tilePath)
$tileBrush.Dispose()

Draw-BrandForeground -Graphics $g -CanvasSize 1024 -Scale 0.93

$edgePen = [System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(20, 6, 67, 196), [float]3)
$g.DrawPath($edgePen, $tilePath)
$edgePen.Dispose()
$tilePath.Dispose()
$g.Dispose()
Save-Png -Bitmap $icon -Path (Join-Path $assetsDir 'icon.png')

# Adaptive icon foreground only: transparent background and no white tile.
$adaptive = New-Object System.Drawing.Bitmap 1024, 1024
$ga = [System.Drawing.Graphics]::FromImage($adaptive)
$ga.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$ga.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$ga.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$ga.Clear([System.Drawing.Color]::Transparent)
Draw-BrandForeground -Graphics $ga -CanvasSize 1024 -Scale 0.72 -TransparentBackground $true
$ga.Dispose()
Save-Png -Bitmap $adaptive -Path (Join-Path $assetsDir 'adaptive-icon.png')

# Small square favicon that stays legible in web tabs.
$favicon = New-Object System.Drawing.Bitmap 256, 256
$gf = [System.Drawing.Graphics]::FromImage($favicon)
$gf.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$gf.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$gf.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$gf.Clear([System.Drawing.Color]::FromArgb(255, 17, 149, 242))
$favTile = New-RoundedRectPath -X 20 -Y 20 -Width 216 -Height 216 -Radius 44
$favBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
$gf.FillPath($favBrush, $favTile)
$favBrush.Dispose()
Draw-BrandForeground -Graphics $gf -CanvasSize 256 -Scale 0.9
$favTile.Dispose()
$gf.Dispose()
Save-Png -Bitmap $favicon -Path (Join-Path $assetsDir 'favicon.png')

# Update native Android launcher resources so local Gradle builds pick up the new icon.
$androidResDir = Join-Path $root 'android\app\src\main\res'
$iconSource = [System.Drawing.Image]::FromFile((Join-Path $assetsDir 'icon.png'))
$foregroundSource = [System.Drawing.Image]::FromFile((Join-Path $assetsDir 'adaptive-icon.png'))
$sizes = @{
  'mipmap-mdpi' = 48
  'mipmap-hdpi' = 72
  'mipmap-xhdpi' = 96
  'mipmap-xxhdpi' = 144
  'mipmap-xxxhdpi' = 192
}

foreach ($entry in $sizes.GetEnumerator()) {
  $dir = Join-Path $androidResDir $entry.Key
  if (Test-Path $dir) {
    foreach ($oldFile in @('ic_launcher.webp', 'ic_launcher_round.webp', 'ic_launcher_foreground.webp')) {
      $oldPath = Join-Path $dir $oldFile
      if (Test-Path $oldPath) {
        Remove-Item $oldPath -Force
      }
    }

    Save-ScaledPng -Source $iconSource -Width $entry.Value -Height $entry.Value -Path (Join-Path $dir 'ic_launcher.png')
    Save-ScaledPng -Source $iconSource -Width $entry.Value -Height $entry.Value -Path (Join-Path $dir 'ic_launcher_round.png')
    Save-ScaledPng -Source $foregroundSource -Width $entry.Value -Height $entry.Value -Path (Join-Path $dir 'ic_launcher_foreground.png')
  }
}

$iconSource.Dispose()
$foregroundSource.Dispose()

$csharpCode = @"
using System;
using System.Drawing;
using System.Drawing.Imaging;

public class ImageProcessor {
    public static void MakeTransparentGlobal(string inputPath, string outputPath, int tolerance, bool makeDarkPixelsWhite) {
        using (Bitmap bmp = new Bitmap(inputPath)) {
            int width = bmp.Width;
            int height = bmp.Height;
            
            using (Bitmap newBmp = new Bitmap(width, height, PixelFormat.Format32bppArgb)) {
                // Get background seed color from top-left corner (0,0)
                Color seedColor = bmp.GetPixel(0, 0);
                
                // Check if this is the bones logo to apply special outline cleanup
                bool isBones = inputPath.ToLower().EndsWith("bones.jpg");
                
                for (int y = 0; y < height; y++) {
                    for (int x = 0; x < width; x++) {
                        Color pixel = bmp.GetPixel(x, y);
                        
                        // Check similarity to seed color (Manhattan distance/channel difference)
                        int diffR = Math.Abs((int)pixel.R - (int)seedColor.R);
                        int diffG = Math.Abs((int)pixel.G - (int)seedColor.G);
                        int diffB = Math.Abs((int)pixel.B - (int)seedColor.B);
                        
                        // Handle existing transparent pixels if any
                        if (pixel.A < 10) {
                            newBmp.SetPixel(x, y, Color.FromArgb(0, 0, 0, 0));
                        }
                        else if (seedColor.A >= 10 && diffR <= tolerance && diffG <= tolerance && diffB <= tolerance) {
                            // Match background: Make transparent
                            newBmp.SetPixel(x, y, Color.FromArgb(0, 0, 0, 0));
                        }
                        else if (isBones && pixel.R > 210 && pixel.G > 210 && pixel.B > 210) {
                            // For Bones, remove the white outline/shadow so it doesn't overlap/duplicate the whitened text
                            newBmp.SetPixel(x, y, Color.FromArgb(0, 0, 0, 0));
                        }
                        else {
                            // Non-match: Keep original pixel, but convert dark/black text to white if requested
                            if (makeDarkPixelsWhite && pixel.R < 130 && pixel.G < 130 && pixel.B < 130) {
                                // Convert dark grey/black to white, maintaining the original alpha channel
                                newBmp.SetPixel(x, y, Color.FromArgb(pixel.A, 255, 255, 255));
                            } else {
                                newBmp.SetPixel(x, y, pixel);
                            }
                        }
                    }
                }
                
                newBmp.Save(outputPath, ImageFormat.Png);
            }
        }
    }
}
"@

Add-Type -TypeDefinition $csharpCode -ReferencedAssemblies System.Drawing

$logosDir = "C:\Users\mfeli\.gemini\antigravity\scratch\anime-ratings\logos"

$darkLogosList = @(
    "production_i_g.jpg",
    "bones.jpg",
    "wit_studio.jpg",
    "tatsunoko_production.jpg",
    "tokyo_movie_shinsha.jpg",
    "shaft.jpg",
    "science_saru.jpg",
    "bug_film.jpg",
    "pierrot.jpg",
    "artland.jpg",
    "trigger.jpg"
)

# 1. Process all JPEG files
Get-ChildItem -Path $logosDir -Filter *.jpg | ForEach-Object {
    $pngPath = Join-Path $logosDir ($_.BaseName + ".png")
    Write-Host "Processando JPG: $($_.Name) -> $($_.BaseName).png"
    
    $tolerance = 45
    if ($_.Name -eq "bones.jpg") {
        $tolerance = 130
    }
    
    $makeDarkPixelsWhite = $darkLogosList -contains $_.Name
    if ($makeDarkPixelsWhite) {
        Write-Host "  -> Ativando branqueamento de pixels escuros para preservação de cores"
    }
    
    [ImageProcessor]::MakeTransparentGlobal($_.FullName, $pngPath, $tolerance, $makeDarkPixelsWhite)
}

# 2. Process the white fallback logo PNG (a1_pictures_white.png)
$a1WhitePng = Join-Path $logosDir "a1_pictures_white.png"
if (Test-Path $a1WhitePng) {
    $tempPng = Join-Path $logosDir "temp_a1_white.png"
    Copy-Item $a1WhitePng $tempPng -Force
    
    Write-Host "Processando PNG: a1_pictures_white.png"
    [ImageProcessor]::MakeTransparentGlobal($tempPng, $a1WhitePng, 45, $false)
    
    Remove-Item $tempPng -Force
}

Write-Host "Conversão global finalizada com sucesso!"

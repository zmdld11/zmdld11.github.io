$files = Get-ChildItem -Path content -Recurse -Filter *.md
foreach ($file in $files) {
    if ($file.Name -eq "index.md") { continue }
    $content = [IO.File]::ReadAllText($file.FullName)
    $title = $file.BaseName
    
    $newContent = [regex]::Replace($content, '\{%\s*asset_img\s+([^\s]+)(?:\s+(.*?))?\s*%\}', {
        param($m)
        $img = $m.Groups[1].Value
        $cap = $m.Groups[2].Value.Trim()
        return "![${cap}](${title}/${img})"
    })
    
    if ($content -ne $newContent) {
        [IO.File]::WriteAllText($file.FullName, $newContent)
        Write-Host "Updated $($file.Name)"
    }
}

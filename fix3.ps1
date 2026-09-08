$content = Get-Content 'C:\Users\bharg\Downloads\DailyBloom\The Backbone\dailybloom-app-frontend\dailybloom-app\src\DailyBloomApp.jsx' -Raw
$content = $content -replace 'Manrope, sans-serif''', 'Manrope, sans-serif"'
Set-Content 'C:\Users\bharg\Downloads\DailyBloom\The Backbone\dailybloom-app-frontend\dailybloom-app\src\DailyBloomApp.jsx' -Value $content

$vaultdir = "$env:USERPROFILE\\Desktop\\ART\\_tablets-stuff" # change to your vault directory.
if (Test-Path -Path $vaultdir\.obsidian\plugins\obsidian-auto-checkbox) {
	Write-Output "folder exists! skipping creation."
} else {
	mkdir $vaultdir\.obsidian\plugins\obsidian-auto-checkbox
}


cp main.js $vaultdir\.obsidian\plugins\obsidian-auto-checkbox
cp manifest.json $vaultdir\.obsidian\plugins\obsidian-auto-checkbox
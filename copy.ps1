$vaultdir = "$env:USERPROFILE\\Desktop\\ART\\_tablets-stuff" # change to your vault directory.
if (Test-Path -Path $vaultdir\.obsidian\plugins\obsidian-task-completer) {
	Write-Output "folder exists! skipping creation."
} else {
	mkdir $vaultdir\.obsidian\plugins\obsidian-task-completer
}

Copy-Item main.js $vaultdir\.obsidian\plugins\obsidian-task-completer
Copy-Item manifest.json $vaultdir\.obsidian\plugins\obsidian-task-completer

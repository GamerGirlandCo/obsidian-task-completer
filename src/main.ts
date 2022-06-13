import { App, Editor, MarkdownView, Modal, Notice, Plugin, ListItemCache } from 'obsidian';
import {SampleSettingTab} from "./SettingsTab";
import { getAPI, DataviewApi, Literal} from "obsidian-dataview";
import {TaskUtil} from "./TaskUtil";
// import {findTasksInFile, parseMarkdown, parsePage} from "obsidian-dataview/lib/data/file";

// Remember to rename these classes and interfaces!

interface MyPluginSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	mySetting: 'default'
}

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;
	dvapi: DataviewApi;
	TU: TaskUtil;
	curnum: number;
	isWorking: boolean;
	
	
	subs(pa: any[]): Array<any> {
		const la: any = [];
		function tick(b) {
			la.push(b.children.map(tick))
			console.log("la", la, pa)
			return b.line
		}
		pa.map(a => {
			la.push(a.line)
		})
		pa.map(tick)
		return la;
	}
	
	async onload() {
		await this.loadSettings();
		this.isWorking = false;
		this.dvapi = getAPI();
		this.TU = new TaskUtil()
		this.addCommand({
			id: 'recursive-check-tik',
			name: 'check checkbox recursively',
			editorCallback: async (editor: Editor, view: MarkdownView) => {
				this.isWorking = true;
				const activeFile = this.app.workspace.getActiveFile();
				const curse = editor.offsetToPos(this.curnum).line;
				const source = this.dvapi.page(activeFile.path).file
				const children = source.tasks.values.filter(a => a.parent === curse)
				const parent = source.tasks.values.filter(a => a.line === curse)[0]
				editor.setCursor(curse)
				this.subs(children).flat(Infinity).forEach(l => {
					this.dvapi.index.touch();
					this.app.workspace.trigger("dataview:refresh-views");
					let origLine = editor.getLine(parent.line)
					let line = editor.getLine(l);
					if(parent.completed) {
						let edit = this.TU.check(line)
						editor.setLine(l, edit)
					} else {
						let edit = this.TU.uncheck(line);
						editor.setLine(l, edit);
					}
				})
				// console.log()
				console.log(source.tasks.values)
				console.log(curse)
				console.log(children, parent)
				/*const ws = this.app.workspace;
				const cache = mcache.getFileCache(ws.getActiveFile())
				// console.log(curs);
				// console.log(cache)
				const tasks = cache.listItems.filter(a => !!a.task)
				const currchildren = tasks.filter(a => a.parent === curs.line)
				curr
				console.log(tasks)
				console.log(currchildren)
				console.log(view)
				console.log(editor)*/
			}
		});
		this.registerDomEvent(document, 'click', async (evt: MouseEvent) => {
			let tgt = evt.target;
			if(tgt.tagName.toLowerCase() !== "input" || !!tgt.getAttribute("disabled")) {
				return
			}
			this.curnum = tgt.cmView.editorView.posAtDOM(tgt);
			this.dvapi.index.touch();
			this.app.workspace.trigger("dataview:refresh-views");
			tgt.setAttribute("disabled", "")
			await this.timeMe()
			tgt.removeAttribute("disabled")
			// console.log('clk', tgt);
			this.app.commands.executeCommandById("obsidian-auto-checkbox:recursive-check-tik")
			
		});
	}
	timeMe():Promise<void> {
		return new Promise((res, rej) => {
			this.isWorking = false;
			setTimeout(res, 2500)
		})
	}

	onunload() {

	}
	
	
	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
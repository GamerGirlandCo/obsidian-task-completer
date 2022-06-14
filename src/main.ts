import { Editor, MarkdownView, Plugin } from 'obsidian';
import { getAPI, DataviewApi } from "obsidian-dataview";
import {TaskUtil} from "./TaskUtil";
// import {findTasksInFile, parseMarkdown, parsePage} from "obsidian-dataview/lib/data/file";

// Remember to rename these classes and interfaces!

export default class MyPlugin extends Plugin {
	dvapi: DataviewApi;
	TU: TaskUtil;
	curnum: number;
	isWorking: boolean;
	
	
	
	async onload() {
		this.isWorking = false;
		this.dvapi = getAPI();
		this.TU = new TaskUtil()
		this.addCommand({
			id: 'recursive-tick',
			name: 'check checkbox recursively',
			editorCallback: async (editor: Editor, view: MarkdownView) => {
				this.isWorking = true;
				const activeFile = this.app.workspace.getActiveFile();
				const curse = editor.offsetToPos(this.curnum).line;
				const source = this.dvapi.page(activeFile.path).file
				const children = source.tasks.values.filter((a: any) => a.parent === curse)
				const parent = source.tasks.values.filter((a: any) => a.line === curse)[0]
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
			// @ts-ignore
			let tgt: EventTarget & HTMLElement & {cmView: any} = evt.target;
			if(tgt.tagName.toLowerCase() !== "input" || !!tgt.getAttribute("disabled")) {
				return
			}
			this.curnum = tgt.cmView.editorView.posAtDOM(tgt);
			this.dvapi.index.touch();
			this.app.workspace.trigger("dataview:refresh-views");
			tgt.setAttribute("disabled", "")
			await this.timeMe()
			tgt.removeAttribute("disabled")
			
			// @ts-ignore
			this.app.commands.executeCommandById("obsidian-auto-checkbox:recursive-check-tik")
			
		});
	}
	timeMe():Promise<void> {
		return new Promise((res, rej) => {
			this.isWorking = false;
			setTimeout(res, 2500)
		})
	}
	
	subs(pa: any[]): Array<any> {
		const la: any = [];
		function tick(b: any) {
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

	onunload() {

	}
}
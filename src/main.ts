import { Editor, MarkdownView, Plugin, editorViewField, editorEditorField } from 'obsidian';
import { EditorView } from 'codemirror';
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
				const cursor = editor.offsetToPos(this.curnum).line;
				const source = this.dvapi.page(activeFile.path).file
				const children = source.tasks.values.filter((a: any) => a.parent === cursor)
				const parent = source.tasks.values.filter((a: any) => a.line === cursor)[0]
				editor.setCursor(cursor)
				this.recurseSubtasks(children).flat(Infinity).forEach(l => {
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
				console.log("hi.")
				console.log(source.tasks.values)
				console.log(cursor)
				console.log(children, parent)
				console.log(view)
				console.log(editor)
				/*const ws = this.app.workspace;
				const cache = mcache.getFileCache(ws.getActiveFile())
				// console.log(curs);
				// console.log(cache)
				const tasks = cache.listItems.filter(a => !!a.task)
				const currchildren = tasks.filter(a => a.parent === curs.line)
				curr*/
			}
		});
		this.app.workspace.on("click", async (evt: MouseEvent) => {
			// @ts-ignore
			let tgt: EventTarget & HTMLElement & {cmView: any} = evt.target;
			if(tgt.tagName.toLowerCase() !== "input" || !!tgt.getAttribute("disabled")) {
				return
			}
			console.debug("tgt", tgt, editorViewField, editorEditorField)
			let ev = EditorView.findFromDOM(document.body)

			this.curnum = ev.posAtDOM(tgt);
			this.dvapi.index.touch();
			this.app.workspace.trigger("dataview:refresh-views");
			tgt.setAttribute("disabled", "")
			await this.timeMe()
			tgt.removeAttribute("disabled")
			
			// @ts-ignore
			this.app.commands.executeCommandById("obsidian-auto-checkbox:recursive-tick")
			
		})
		/* this.registerCodeMirror((cm) => {
				
		
		}) */
		/* this.registerDomEvent(document, 'click', async ); */
	}
	timeMe():Promise<void> {
		return new Promise((res, rej) => {
			this.isWorking = false;
			setTimeout(res, 2500)
		})
	}
	
	recurseSubtasks(tasks: any[]): Array<any> {
		const arr: any = [];
		function mapper(b: any) {
			arr.push(b.children.map(mapper))
			console.log("la", arr, tasks)
			return b.line
		}
		tasks.map(a => {
			arr.push(a.line)
		})
		tasks.map(mapper)
		return arr;
	}

	onunload() {

	}
}
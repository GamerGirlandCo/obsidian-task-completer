import { DataviewApi, getAPI } from "obsidian-dataview";
import { Editor, MarkdownView, Plugin, livePreviewState } from 'obsidian';

import { EditorView } from 'codemirror';
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
				const mapper = (z) => {
					return {
						line: z.line,
						parent: z.parent,
						children: z.children.map(mapper),
						text: z.text
					}
				}
				const activeFile = this.app.workspace.getActiveFile();
				const cursor = editor.offsetToPos(this.curnum).line;
				const source = this.dvapi.page(activeFile.path).file
				const children = source.tasks.values.filter((a: any) => a.parent === cursor)
				const parent = source.tasks.values.filter((a: any) => a.line === cursor)[0]
				editor.setCursor(cursor)
				this.recurseSubtasks(children).flat(Infinity).forEach(l => {
					this.dvapi.index.touch();
					this.app.workspace.trigger("dataview:refresh-views");
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
				// console.log(cursor)
				console.log(source.tasks.values.map(mapper))
				console.log(children, this.recurseSubtasks(children))
				// console.log(view)
				// console.log(editor)
				/*const ws = this.app.workspace;
				const cache = mcache.getFileCache(ws.getActiveFile())
				// console.log(curs);
				// console.log(cache)
				const tasks = cache.listItems.filter(a => !!a.task)
				const currchildren = tasks.filter(a => a.parent === curs.line)
				curr*/
			}
		});
		this.registerDomEvent<"click">(window, "click", async (evt) => {
			// console.log(evt)
			// @ts-ignore
			let tgt = evt.target as HTMLElement;
			let v = this.app.workspace.getActiveViewOfType(MarkdownView)
			let nes = tgt.nextElementSibling
			console.debug("tgt", nes, nes?.tagName)
			// const recurser = (item: any) => {
			// 	for(let i = 0; i < item.children.length; i++) {
			// 			let ii = item.children[i];
			// 			let iii = ii.children[0]  as HTMLElement;
			// 			let input = ii.querySelector("input[type='checkbox']")
			// 			console.debug("lili", item.children, ii.children[0], iii)
			// 			input.click()
			// 			recurser(iii)
			// 		}
			// }

			const recurser = (items: HTMLCollection) => {
				const arr: any = [];
				console.debug("items", items)
				for(let i = 0; i < items.length; i++) {
					console.log("ii", items[i])
					arr.push(items[i].querySelector("input[type='checkbox']"));
					recurser(items[i].children)
				}
				function mapper(b: any) {
					console.log("la", b)
					let thing = b.querySelector("ul")
					if(thing) {
						for(let i = 0; i < thing.children.length; i++) {
							console.log("looper", thing.children[i], thing.children)
							arr.push(thing.children[i].querySelector("input[type='checkbox']"))
							// recurser(thing.children)
						}
					} else {
					}
					if(b.querySelector("input[type='checkbox']")) {
						arr.push(b.querySelector("input[type='checkbox']"))
					} else {
						console.log("in else")

					}
					// arr.push(b.children.map(mapper))
					// return b.line
				}
				return arr;
			}
			if(tgt.tagName.toLowerCase() !== "input" && tgt.getAttr("type") !== "checkbox") {
				return
			}
			
			if (nes?.tagName.toLowerCase() === "ul" && nes?.classList.contains("contains-task-list")) {
				console.log("nessy", nes, nes.children)
				// @ts-ignore
				let wegottafind = recurser(nes.children).flat(Infinity)
				console.log("reee", wegottafind)
				wegottafind.forEach((a: any) => {
					a.click()
				})
				if(tgt.checked) {
				}
			} else if(tgt.tagName.toLowerCase() === "input" || !(!!tgt.getAttribute("disabled"))) {
				let ev = EditorView.findFromDOM(document.body)
				console.debug("elif")
				this.curnum = ev.posAtDOM(tgt);
				console.debug(ev.posAtDOM(tgt), this.curnum)
				this.dvapi.index.touch();
				this.app.workspace.trigger("dataview:refresh-views");
				tgt.setAttribute("disabled", "")
				await this.timeMe()
				tgt.removeAttribute("disabled")
				
				// @ts-ignore
				this.app.commands.executeCommandById("obsidian-task-completer:recursive-tick")
			}
			return;
			
		})
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
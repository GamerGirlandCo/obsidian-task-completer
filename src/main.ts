import { DataviewApi, getAPI } from "obsidian-dataview";
import { Editor, MarkdownView, Plugin, editorViewField } from 'obsidian';

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
			} else if(tgt.tagName.toLowerCase() === "input") {
				let ev = EditorView.findFromDOM(document.body)
				console.debug("elif")
				const {editor} = ev.state.field(editorViewField)
				const cursor = editor.offsetToPos(ev.posAtDOM(tgt)).line
				const activeFile = this.app.workspace.getActiveFile();
				const source = this.dvapi.page(activeFile.path).file
				const children = source.tasks.values.filter((a: any) => a.parent === cursor)
				console.debug("curious cat", children, this.recurseLivePreviewSubtasks(children).flat(Infinity))
				const all: any[] = []
				let l = this.recurseLivePreviewSubtasks(children).flat(Infinity)
				l.forEach(m => {
					let {node} = ev.domAtPos(m.end.offset);
					const forEachFunction = (g: Element) => {
						all.push(g);
						[].slice.call(g.children).forEach(forEachFunction);
					};
					// let qs = node.querySelectorAll()
					[].slice.call(node.children).forEach(forEachFunction);
				})
				
				let all_2 = all.filter(a => a.matches("input[type='checkbox']"))
				all_2.forEach(r => {
					let cH = (e) => {
						e.stopPropagation()
						console.log("clik", e)
					}
					// r.click()
					r.onclick = cH
					r.click()
					// @ts-ignore
					console.log("check status", r.checked, tgt.checked)
					if(!tgt.checked && r.checked) {
						r.click()
					} else if(tgt.checked && !r.checked) {
						r.click()
					}
					// r.click()
					// if(!node.checked && r.checked) {
					// }
				})
				console.debug("node", all_2)
				this.dvapi.index.touch();
				this.app.workspace.trigger("dataview:refresh-views");
				
				// @ts-ignore
			}
			
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
	recurseLivePreviewSubtasks(tasks: any[]): Array<any> {
		const arr: any = [];
		function mapper(b: any) {
			arr.push(b.children.map(mapper))
			return {
				...b.position, text: b.text
			}
		}
		tasks.map(a => {
			arr.push({...a.position, text: a.text})
		})
		tasks.map(mapper)
		console.debug("finalarr", arr.flat(Infinity))
		return arr;
	}

	onunload() {

	}
}
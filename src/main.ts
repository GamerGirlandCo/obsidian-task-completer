import { DataviewApi, getAPI } from "obsidian-dataview";
import { Editor, MarkdownView, Plugin, editorViewField } from 'obsidian';

import { EditorView } from 'codemirror';
import {TaskUtil} from "./TaskUtil";

// import {findTasksInFile, parseMarkdown, parsePage} from "obsidian-dataview/lib/data/file";

// Remember to rename these classes and interfaces!

export default class TaskCompleter extends Plugin {
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
				console.log(source.tasks.values.map(mapper))
				console.log(children, this.recurseSubtasks(children))
			}
		});
		this.registerDomEvent<"click">(window, "click", async (evt) => {
			// @ts-ignore
			let tgt = evt.target as HTMLElement;
			let v = this.app.workspace.getActiveViewOfType(MarkdownView)
			let nes = tgt.nextElementSibling
			console.debug("tgt", nes, nes?.tagName)

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
			} else if(tgt.tagName.toLowerCase() === "input") {
				let ev = EditorView.findFromDOM(document.body)
				console.debug("elif")
				const {editor} = ev.state.field(editorViewField)
				const cursor = editor.offsetToPos(ev.posAtDOM(tgt)).line;
				const activeFile = this.app.workspace.getActiveFile();
				const source = this.dvapi.page(activeFile.path).file
				console.debug(cursor)
				const children = source.tasks.values.filter((a: any) => a.parent === cursor)
				this.recurseLivePreviewSubtasks(children).flat(Infinity).forEach(l => {
					console.debug("take the", l)
					let {node} = ev.domAtPos(l.start.offset);	
					// @ts-ignore
					let qs = node.querySelectorAll("label > input")
					console.debug(node, qs)
					qs.forEach(r => r.click())
					this.dvapi.index.touch();
					this.app.workspace.trigger("dataview:refresh-views");
				})
				this.dvapi.index.touch();
				this.app.workspace.trigger("dataview:refresh-views");
			}
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
			console.log("la", arr, tasks)
			return b.position
		}
		tasks.map(a => {
			arr.push(a.position)
		})
		tasks.map(mapper)
		return arr;
	}

	onunload() {

	}
}
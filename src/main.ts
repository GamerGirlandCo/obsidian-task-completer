import { DataviewApi, getAPI } from "obsidian-dataview";
import { Editor, MarkdownView, Plugin, editorViewField } from 'obsidian';

import { EditorView } from 'codemirror';
import {TaskUtil} from "./TaskUtil";

// import {findTasksInFile, parseMarkdown, parsePage} from "obsidian-dataview/lib/data/file";

// Remember to rename these classes and interfaces!

export default class MyPlugin extends Plugin {
	dvapi: DataviewApi;
	TU: TaskUtil;
	
	async onload() {
		this.dvapi = getAPI();
		this.TU = new TaskUtil()
		this.registerDomEvent<"click">(window, "click", async (evt) => {
			// console.log(evt)
			// evt.stopImmediatePropagation()
			// @ts-ignore
			let tgt = evt.target as HTMLElement;
			let v = this.app.workspace.getActiveViewOfType(MarkdownView)
			let nes = tgt.nextElementSibling
			console.debug("tgt", tgt, nes, nes?.tagName)
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
					if(!tgt.checked && a.checked) {
						a.click()
						console.log("11")
					// @ts-ignore
					} else if(tgt.checked && !a.checked) {
						a.click()
						console.log("22")
					}
				})
				// if(tgt.checked) {
				// }
			} else if(tgt.tagName.toLowerCase() === "input") {
				if(tgt.offsetParent.classList.contains("cm-embed-block")) return
				let ev = EditorView.findFromDOM(tgt.offsetParent.cmView.dom)
				console.debug("elif", tgt.parentElement.cmView)
				const {editor} = ev.state.field(editorViewField)
				const cursor = editor.offsetToPos(ev.posAtDOM(tgt)).line
				const activeFile = this.app.workspace.getActiveFile();
				const source = this.dvapi.page(activeFile.path).file
				const children = source.tasks.values.filter((a: any) => a.parent === cursor)
				console.debug("curious cat", cursor, children, this.recurseLivePreviewSubtasks(children).flat(Infinity))
				const all: any[] = []
				let l = this.recurseLivePreviewSubtasks(children).flat(Infinity)
				l.forEach(m => {
					let {node} = ev.domAtPos(m.start.offset);
					const forEachFunction = (g: Element) => {
						// const element = 
						// node.parentElement.style.border = "3px solid red"
						// console.log("g = ", g, node)
						all.push(g);
						[].slice.call(g.children).forEach(forEachFunction);
					};

					// @ts-ignore

					[].slice.call(node.parentElement.parentElement.parentElement.children).forEach(forEachFunction);
				})
				console.log("all", all)
				let all_2 = all.filter(a => a.matches("input[type='checkbox']"))
				all_2.forEach(r => {
					let cH = (e: any) => {
						console.debug("check status", r.checked, tgt.checked)

						// e.stopPropagation()
						console.log("clik", r.checked, r, tgt.checked);
						(!!(tgt.checked | r.checked))  && party?.confetti(r)
					}
					r.onclick = cH
					r.click()

					// @ts-ignore
					// @ts-ignore
					if(!tgt.checked && r.checked) {
						console.log("1")
						// party?.confetti(tgt)
						r.click()
					// @ts-ignore
					} else if(tgt.checked && !r.checked) {
						console.log("2")
						r.click()
					}
				})
				console.debug("node", all_2)
				this.dvapi.index.touch();
				this.app.workspace.trigger("dataview:refresh-views");
				
				// @ts-ignore
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

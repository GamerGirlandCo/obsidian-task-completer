export class TaskUtil {
	unCheckedRE: RegExp;
	checkedRE: RegExp;
	constructor() {
		this.checkedRE = new RegExp(/^([\s>]*- \[)(x|X)(\] .*)$/);
		this.unCheckedRE = new RegExp(/^([\s>]*- \[)(.)(\] .*)$/);
	}
	check(text: string): string {
		return text.replace(this.unCheckedRE, "$1x$3")
	}
	uncheck(text: string): string {
		return text.replace(this.checkedRE, "$1 $3")
	}
}
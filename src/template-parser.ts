import fs from "fs";
import path from "path";

export class TemplateParser {
  private template: string;
  private cleanTemplate: string;
  private readonly QUESTION_REGEX = /-- ([^ ]*) (.*)$/m;
  private _QUESTION_KEY_REGEX = (key: string) => `<([lu]:)?${key}>`;

  constructor(templatePath: string) {
    this.template = fs
      .readFileSync(path.join(__dirname, templatePath))
      .toString()
      .replace(/\r/g, ""); // Removing CR characters

    this.cleanTemplate = this.template
      .replace(new RegExp(this.QUESTION_REGEX, "gm"), "")
      .trim();
  }

  getQuestionMap(): { [key: string]: string } {
    return Object.fromEntries(
      this._grouppedMatchAll(this.template, this.QUESTION_REGEX).map((a) =>
        a.slice(1, 3)
      )
    );
  }

  applyTemplate(answers: { [key: string]: string }): string {
    let outputText = this.cleanTemplate.slice();

    for (let entry of Object.entries(answers)) {
      const key = entry[0];
      let answer = entry[1];

      const placers = this._grouppedMatchAll(
        outputText,
        this._QUESTION_KEY_REGEX(key)
      );
      if (placers.length < 1) continue;
      
      placers.forEach((placer) => {
        if (placer[1]) {
          switch (placer[1].slice(0, 1)) {
            case "l":
              answer = answer.toLowerCase();
              break;

            case "u":
              answer = answer.toUpperCase();
              break;
          }
        }
        outputText = outputText.replace(placer[0], answer);
      });
    }

    return outputText.trim();
  }

  private _grouppedMatchAll(
    string: string,
    regex: string | RegExp
  ): RegExpMatchArray[] {
    let additionalFlags = "";
    if (regex instanceof RegExp) {
      additionalFlags = regex.flags;
    }
    const matches = string.match(new RegExp(regex, "g" + additionalFlags));
    if (!matches) return [];
    return matches
      .map((match) =>
        match.match(new RegExp(regex, additionalFlags.replace("g", "")))
      )
      .filter((match) => !!match) as RegExpMatchArray[];
  }
}

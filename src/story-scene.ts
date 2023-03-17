import { StepScene } from "@vk-io/scenes";
import { KeyboardBuilder, Keyboard } from "vk-io";
import { TemplateParser } from "./template-parser";

export function SceneFactory(
  templateParser: TemplateParser,
  slug = "CreateStory"
): StepScene {
  const questions = templateParser.getQuestionMap();
  return new StepScene(slug, [
    async (ctx) => {
      ctx.state.isActive = true;

      await ctx.send("Answer next answers:");

      return ctx.scene.step.next();
    },
    ...Object.keys(questions).map((key) => async (ctx) => {
      if (ctx.scene.step.firstTime || !ctx.text) {
        return ctx.send(questions[key]);
      }

      ctx.scene.state.answers = {
        [key]: ctx.text,
        ...(ctx.scene.state.answers || {}),
      };

      return ctx.scene.step.next();
    }),
    async (ctx) => {
      await ctx.send(templateParser.applyTemplate(ctx.scene.state.answers));

      const keyboard = new KeyboardBuilder();
      keyboard.oneTime();

      keyboard.textButton({
        label: "Create story",
        payload: slug,
        color: Keyboard.SECONDARY_COLOR,
      });

      ctx.state.isActive = false;

      await ctx.send(
        `Do you want to try again? Press the "Create story" button!`,
        { keyboard }
      );

      return ctx.scene.step.next();
    },
  ]);
}

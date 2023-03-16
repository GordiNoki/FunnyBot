import { config as runEnv } from "dotenv";
import { Keyboard, KeyboardBuilder, VK } from "vk-io";
import { SessionManager } from "@vk-io/session";
import { SceneManager } from "@vk-io/scenes";

import { TemplateParser } from "./template-parser";
import { SceneFactory } from "./story-scene";
runEnv();

const vk = new VK({
  token: process.env.API_KEY as string,
});

const sessionManager = new SessionManager();
const sceneManager = new SceneManager();
const templateParser = new TemplateParser(process.env.TEMPLATE_PATH as string);

sceneManager.addScenes([SceneFactory(templateParser)]);

vk.updates.on("message_new", sessionManager.middleware);
vk.updates.on("message_new", sceneManager.middleware);
vk.updates.on("message_new", sceneManager.middlewareIntercept);

vk.updates.on("message_new", (ctx, next) => {
  if (ctx.messagePayload) {
    switch (ctx.messagePayload) {
      case "NewStory":
        return ctx.scene.enter("CreateStory");
    }
  }

  if (!ctx.state.isActive) {
    const defaultAnswer = `Welcome to my story bot! I am designed to create interesting story based on your answers. To start using, press the "Create story" button!`;
    const keyboard = new KeyboardBuilder();
    keyboard.oneTime();

    keyboard.textButton({
      label: "Create story",
      payload: "NewStory",
      color: Keyboard.SECONDARY_COLOR,
    });

    return ctx.send(defaultAnswer, {
      keyboard,
    });
  }

  return next();
});

console.log("Bot started!");
vk.updates.start().catch(console.error);

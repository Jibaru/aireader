import { translate } from "@/lib/openai/helpers";

translate("Hello, how are you?").then(console.log).catch(console.error);

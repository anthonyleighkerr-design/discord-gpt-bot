const { Client, GatewayIntentBits } = require("discord.js");
const OpenAI = require("openai");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  if (message.content.startsWith("!ask")) {
    const question = message.content.replace("!ask", "").trim();

    if (!question) {
      return message.reply("Please ask a question after !ask");
    }

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: question }]
      });

      message.reply(response.choices[0].message.content);
    } catch (error) {
      console.error(error);
      message.reply("There was an error talking to OpenAI.");
    }
  }
});

client.login(process.env.DISCORD_TOKEN);

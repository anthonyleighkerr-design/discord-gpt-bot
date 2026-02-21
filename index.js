
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

// 5 hour cooldown in milliseconds
const COOLDOWN_TIME = 5 * 60 * 60 * 1000;

// Store last usage time per user
const userCooldowns = new Map();

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  if (message.content.startsWith("!ask")) {
    const now = Date.now();
    const lastUsed = userCooldowns.get(message.author.id);

    if (lastUsed && now - lastUsed < COOLDOWN_TIME) {
      const remaining = Math.ceil((COOLDOWN_TIME - (now - lastUsed)) / (60 * 60 * 1000));
      return message.reply(`You must wait ${remaining} more hour(s) before using this again.`);
    }

    const question = message.content.replace("!ask", "").trim();

    if (!question) {
      return message.reply("Please ask a question after !ask");
    }

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        max_tokens: 500,
        messages: [{ role: "user", content: question }]
      });

      userCooldowns.set(message.author.id, now);

      message.reply(response.choices[0].message.content);
    } catch (error) {
      console.error(error);
      message.reply("There was an error talking to OpenAI.");
    }
  }
});

client.login(process.env.DISCORD_TOKEN);

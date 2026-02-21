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

// Limit settings
const MAX_QUESTIONS = 5;
const BLOCK_TIME = 5 * 60 * 60 * 1000; // 5 hours

// Store user data
const userData = new Map();

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  if (!message.content.startsWith("!ask")) return;

  const userId = message.author.id;
  const now = Date.now();

  if (!userData.has(userId)) {
    userData.set(userId, { count: 0, blockedUntil: 0 });
  }

  const data = userData.get(userId);

  // Check if user is blocked
  if (data.blockedUntil && now < data.blockedUntil) {
    const remainingHours = Math.ceil((data.blockedUntil - now) / (60 * 60 * 1000));
    return message.reply(`You’ve reached your 5-question limit. Try again in ${remainingHours} hour(s).`);
  }

  // Reset after block expires
  if (data.blockedUntil && now >= data.blockedUntil) {
    data.count = 0;
    data.blockedUntil = 0;
  }

  // Check question limit
  if (data.count >= MAX_QUESTIONS) {
    data.blockedUntil = now + BLOCK_TIME;
    return message.reply("You’ve reached your 5-question limit. You are locked for 5 hours.");
  }

  const question = message.content.replace("!ask", "").trim();

  if (!question) {
    return message.reply("Please ask a question after !ask");
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 300,
      messages: [{ role: "user", content: question }]
    });

    data.count += 1;

    message.reply(response.choices[0].message.content);
  } catch (error) {
    console.error(error);
    message.reply("There was an error talking to OpenAI.");
  }
});

client.login(process.env.DISCORD_TOKEN);

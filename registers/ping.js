const { SlashCommandBuilder } = require("discord.js");
let langs = require("../langs.json");

let slashCommand = new SlashCommandBuilder().setDescription(
  "Check the bot's latency."
);

let locales = Object.keys(langs);

for (let locale of locales) {
  slashCommand.setNameLocalization(
    locale,
    langs[locale]["helpCommands"]["ping"]["localeName"]
  );
  slashCommand.setDescriptionLocalization(
    locale,
    langs[locale]["helpCommands"]["ping"]["localeDescription"]
  );
}

module.exports = slashCommand;

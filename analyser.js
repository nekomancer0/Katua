const { GuildMember, ActivityType } = require("discord.js");
const fs = require("fs");
const { openai } = require("./openai.js");

/**
 *
 * @param {GuildMember} member
 */
function analyser(member) {
  return new Promise(
    /**
     *
     * @param {(value: "invalid" | "neutral" | "valid")=>void} resolve
     * @param {(err: unknown)=>void} reject
     */
    async (resolve, reject) => {
      let guild = member.guild;

      try {
        let threadsFile = fs.readFileSync(`${__dirname}/threads.txt`, "utf-8");
        let threadIds = threadsFile.split("\n");

        let thread = null;

        for (let thread_id of threadIds) {
          if (thread_id === "") break;

          let threadx = await openai.threads.retrieve(thread_id);

          if (
            threadx.metadata.user === member.user.id &&
            threadx.metadata.guild === guild.id
          ) {
            thread = threadx;
          }
        }

        if (!thread) {
          thread = await openai.threads.create({
            metadata: { guild: guild.id, user: member.user.id },
          });

          fs.appendFileSync(`${__dirname}/threads.txt`, `${thread.id}\n`);
        }

        let content = "";

        content += `Displayname: ${member.displayName}\n`;
        content += `Username: ${member.user.username}\n`;
        content += `Presence Status: ${
          member.presence && member.presence.status
            ? member.presence.status
            : "offline"
        }\n`;

        let firstActivity = member.presence
          ? member.presence.activities[0]
          : undefined;

        content += `Custom status: ${
          firstActivity && firstActivity.type === ActivityType.Custom
            ? `"${firstActivity.state}"`
            : "No custom status"
        }\n`;

        content += `Profile picture: first image\n`;

        let date = member.user.createdAt;

        let year = date.getFullYear();
        let month = date.getMonth() + 1;
        let day = date.getDate();

        content += `Account creation date: ${day}/${month}/${year} \n`;

        let message = await openai.threads.messages.create(thread.id, {
          role: "user",
          content: [
            {
              type: "text",
              text: content,
            },
            {
              type: "image_url",
              image_url: {
                url:
                  member.displayAvatarURL({ extension: "png" }) ||
                  member.user.displayAvatarURL({ extension: "png" }),
                detail: "low",
              },
            },
          ],
        });

        let run = await openai.threads.runs.createAndPoll(thread.id, {
          assistant_id: process.env.OPENAI_ASSISTANT_ID,
        });

        if (run.status === "completed") {
          let messages = await openai.threads.messages.list(run.thread_id);
          let lastMessage = messages.data[0];

          resolve(lastMessage.content[0].text.value);
        } else {
          reject(new Error(run.status));
        }
      } catch (e) {
        console.error(e);
      }
    }
  );
}

// "Ask to explain the analysis" function

/**
 *
 * @param {import("openai/resources/beta/threads/threads.mjs").Thread} thread
 */
function askExplanation(thread) {}

module.exports = analyser;

const fetchAssignments = require("./fetchAssignments.js");
const line = require("@line/bot-sdk");
require("dotenv").config();

const config = {
  channelAccessToken: process.env.LINE_TOKEN, // 実際のチャネルアクセストークンに置き換えてください
  channelSecret: process.env.LINE_CHANNEL_SECRET, // 実際のチャネルシークレットに置き換えてください
};

const client = new line.Client(config);

fetchAssignments().then(async ({ unsubmittedAssignments, dueAssignments }) => {
  if (dueAssignments.length > 0) {
    // dueAssignmentsに要素がある場合のみ実行

    const initialWarning = {
      type: "text",
      text: "2日以内にやらなければならない課題があります",
    };

    const userId = process.env.LINE_USER_ID; // 実際のユーザーIDに置き換えてください

    // 最初の警告メッセージを送る
    client
      .pushMessage(userId, initialWarning)
      .then(() => console.log("Initial warning sent!"))
      .catch((err) => console.error(err));

    for (let assignment of dueAssignments) {
      let dueDate = new Date(assignment.dueTime.epochSecond * 1000);
      let formattedDueDate = `${
        dueDate.getMonth() + 1
      }/${dueDate.getDate()} ${dueDate.getHours()}:${
        dueDate.getMinutes() < 10 ? "0" : ""
      }${dueDate.getMinutes()}`;

      const message = {
        type: "text",
        text: `タイトル: ${assignment.title}\n期限: ${formattedDueDate}`,
      };

      // LINEにpush通知を送る
      await client
        .pushMessage(userId, message)
        .then(() => console.log("Assignment message sent!"))
        .catch((err) => console.error(err));
    }
  }
});

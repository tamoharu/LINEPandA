const playwright = require("playwright");
require("dotenv").config();

const fetchAssignments = async () => {
  const browser = await playwright.chromium.launch({
    headless: false, //ヘッドレスブラウザの設定
  });
  const context = await browser.newContext();
  const page = await context.newPage();
  //pandaにログイン
  await page.goto(
    "https://panda.ecs.kyoto-u.ac.jp/cas/login?service=https%3A%2F%2Fpanda.ecs.kyoto-u.ac.jp%2Fsakai-login-tool%2Fcontainer"
  );
  await page.getByLabel("ユーザ ID:").click();
  await page.getByLabel("ユーザ ID:").fill(process.env.USER_NAME);
  await page.getByLabel("パスワード:").click();
  await page.getByLabel("パスワード:").fill(process.env.USER_PASSWORD);
  await page.getByLabel("パスワード:").press("Enter");
  await page.waitForLoadState("load");
  const page1 = await context.newPage();
  //課題一覧を取得
  await page1.goto(
    "https://panda.ecs.kyoto-u.ac.jp/direct/assignment/my.json",
    { timeout: 120000 }
  );
  const content = await page1.$eval("body > pre", (el) => el.textContent);
  const jsonData = JSON.parse(content);
  //console.log(JSON.stringify(jsonData, null, 2));

  // 未提出課題の抽出
  let unsubmittedAssignments = jsonData.assignment_collection.filter(
    (assignment) => {
      // 提出可能な課題かどうか
      if (assignment.status === "OPEN") {
        // 課題がsubmissionsプロパティを持つかどうか
        if (assignment.submissions) {
          // 課題のsubmission.statusが'未開始'であればtrueを返す
          return assignment.submissions.some(
            (submission) => submission.status === "未開始"
          );
        } else {
          // 課題がsubmissionsプロパティを持たない場合、未提出とする
          return true;
        }
      }
    }
  );

  // 未提出課題一覧の確認
  /*unsubmittedAssignments.forEach((assignment) => {
    console.log(`Title: ${assignment.title}`);
    let dueDate = new Date(assignment.dueTime.epochSecond * 1000);
    console.log(`Due Date: ${dueDate}`);
  });*/

  // 未提出課題の中から締切が近い課題を抽出
  let dueAssignments = unsubmittedAssignments.filter((assignment) => {
    let dueDate = new Date(assignment.dueTime.epochSecond * 1000); // ミリ秒に変換
    let now = new Date();
    let timeDifference = dueDate - now; // ミリ秒単位

    // 締め切りが次の1時間以内かどうかを確認
    if (timeDifference <= 172800000) {
      // 3600000 ミリ秒 = 1 時間
      return true;
    } else {
      return false;
    }
  });

  await browser.close();

  return { unsubmittedAssignments, dueAssignments };
};

module.exports = fetchAssignments;

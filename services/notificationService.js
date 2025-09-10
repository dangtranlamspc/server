async function sendPushNotification(expoPushToken, title, body, data = {}) {
  await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      to: expoPushToken,
      sound: "default",
      title,
      body,
      data,
    }),
  });
}

module.exports = { sendPushNotification };
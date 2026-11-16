const format = new Intl.DateTimeFormat("vi-VN", {
  dateStyle: "short", timeStyle: "short", timeZone: "Asia/Ho_Chi_Minh",
});

export function reportTime(value) {
  return value ? format.format(new Date(value)) : "—";
}

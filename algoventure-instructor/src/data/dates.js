import { PORTAL_POLICY } from "./policy.js";

function parts(date) {
  return Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: PORTAL_POLICY.timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(date)
      .filter((item) => item.type !== "literal")
      .map((item) => [item.type, item.value]),
  );
}
export function isISO(value) {
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(
      value,
    ) ||
    !Number.isFinite(Date.parse(value))
  )
    return false;
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}
export function toDueInput(iso) {
  if (!iso || !isISO(iso)) return "";
  const p = parts(new Date(iso));
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}
export function fromDueInput(input) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(input ?? ""))
    throw new Error("Chọn ngày và giờ hợp lệ tại Việt Nam.");
  const [year, month, day, hour, minute] = input.match(/\d+/g).map(Number);
  const target = Date.UTC(year, month - 1, day, hour, minute);
  let guess = target;
  for (let i = 0; i < 3; i++) {
    const p = parts(new Date(guess));
    const local = Date.UTC(
      +p.year,
      +p.month - 1,
      +p.day,
      +p.hour,
      +p.minute,
      +p.second,
    );
    guess += target - local;
  }
  const iso = new Date(guess).toISOString();
  if (toDueInput(iso) !== input)
    throw new Error("Ngày hoặc giờ không tồn tại.");
  return iso;
}
export function defaultDueInput(now = () => new Date()) {
  const p = parts(new Date(now().getTime() + 86400000));
  return `${p.year}-${p.month}-${p.day}T${PORTAL_POLICY.defaultDueTime}`;
}
export function formatDate(iso) {
  return isISO(iso)
    ? new Intl.DateTimeFormat("vi-VN", {
        timeZone: PORTAL_POLICY.timezone,
        dateStyle: "short",
        timeStyle: "short",
        hourCycle: "h23",
      }).format(new Date(iso))
    : "Chưa đặt";
}
export function submissionDay(iso) {
  return toDueInput(iso).slice(0, 10);
}
export function dayLabel(day) {
  return day ? day.split("-").reverse().join("/") : "";
}

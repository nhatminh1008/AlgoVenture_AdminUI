import { useLocale } from "../../../preferences/preferencesContext";

const options = { dateStyle: "short", timeStyle: "short", timeZone: "Asia/Ho_Chi_Minh" };
const formats = {
  "vi-VN": new Intl.DateTimeFormat("vi-VN", options),
  "en-US": new Intl.DateTimeFormat("en-US", options),
};
const dateOptions = { year: "numeric", month: "2-digit", day: "2-digit", timeZone: "UTC" };
const dates = {
  "vi-VN": new Intl.DateTimeFormat("vi-VN", dateOptions),
  "en-US": new Intl.DateTimeFormat("en-US", dateOptions),
};

export function useReportTime() {
  const format = formats[useLocale()];
  return (value) => value ? format.format(new Date(value)) : "—";
}

export function useReportDate() {
  const format = dates[useLocale()];
  return (value) => format.format(new Date(value));
}

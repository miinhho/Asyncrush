import { exec } from "child_process";
import { resolve } from "path";

const url = resolve(
  __dirname, "../coverage/index.html");

const start =
  process.platform === 'darwin'
    ? 'open'
    : process.platform === 'win32'
    ? 'start'
      : 'xdg-open';

exec(`${start} ${url}`);

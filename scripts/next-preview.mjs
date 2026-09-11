import { spawn } from "node:child_process";

const forwarded = process.argv.slice(2);
const nextArgs = ["dev"];

for (let index = 0; index < forwarded.length; index += 1) {
  const value = forwarded[index];

  if (value === "--strictPort") continue;
  if (value === "--host") {
    nextArgs.push("--hostname");
    if (forwarded[index + 1]) nextArgs.push(forwarded[++index]);
    continue;
  }

  nextArgs.push(value);
}

const nextBin = process.platform === "win32" ? "next.cmd" : "next";
const child = spawn(nextBin, nextArgs, { stdio: "inherit", shell: true });

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 0);
});

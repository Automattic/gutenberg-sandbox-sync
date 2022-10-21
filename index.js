#!/usr/bin/env node

import { exec } from "child_process";
import chokidar from "chokidar";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { join } from "path";
import { readFile } from "fs/promises";

const { argv } = yargs(hideBin(process.argv))
  .version(false)
  .options({
    localPath: {
      type: "string",
      required: true,
    },
    watch: {
      type: "boolean",
      default: false,
    },
    version: {
      type: "string",
    },
  });

const VERBOSE = true;

let version = argv.version;

if (!version) {
  const gutenbergPackageJson = JSON.parse(
    await readFile(
      new URL(join(argv.localPath, "package.json"), import.meta.url)
    )
  );
  version = gutenbergPackageJson.version;
}

const buildPath = join(argv.localPath, "build");

const remotePath = join(
  `~/public_html/wp-content/plugins/gutenberg-core`,
  `v${version}`
);

await setupRemoteSync(buildPath, remotePath, argv.watch);

/**
 * Sets up remote syncing. In watch mode, schedules syncs to the remote after changes
 * have stopped happening and existing syncs have stopped. In non-watch mode, does
 * a single sync. Rejects if any errors happen during rsync. Resolves in non-watch
 * mode after a full sync. Is otherwise pending until the user kills the process.
 */
function setupRemoteSync(localPath, remotePath, shouldWatch = false) {
  return new Promise((resolve, reject) => {
    let rsync = null;
    const debouncedSync = debouncer(() => {
      if (VERBOSE) {
        console.log("Attempting sync...");
      }
      if (rsync) {
        // Kill any existing rsync attempt.
        rsync.kill("SIGINT");
      }

      rsync = exec(
        `rsync -ahz --exclude=".*" ${localPath} wpcom-sandbox:${remotePath}`,
        (err) => {
          rsync = null;
          // err.signal is null on macOS, so use error code 20 in that case.
          const wasRsyncCancelled =
            err && (err.signal === "SIGINT" || err.code === 20);
          if (err && !wasRsyncCancelled) {
            // If there's an error unrelated to cancellation, reject and abort.
            reject(err);
            return;
          } else if (wasRsyncCancelled) {
            if (VERBOSE) {
              console.log("Restarting sync.");
            }
            return;
          }

          // A full sync was completed.
          console.log("Sync to sandbox completed.");
          if (!shouldWatch) {
            // We only needed to sync once, so we can resolve the sync promise.
            resolve();
          }
        }
      );
    });

    if (shouldWatch) {
      chokidar.watch(localPath).on("all", debouncedSync);
    } else {
      debouncedSync();
    }
  });
}

/**
 * A debouncer that calls `cb` after it has not been called for at least 1s.
 */
function debouncer(cb) {
  let timeout = null;
  return () => {
    // Each time the debounced function is called, cancel the current schedule
    // and re-schedule it for +1s.
    clearTimeout(timeout);
    timeout = setTimeout(cb, 1000);
  };
}

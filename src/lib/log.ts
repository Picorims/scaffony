/*
Copyright (c) 2025 Charly Schmidt aka Picorims (picorims.contact@gmail.com), all rights reserved.

This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/

import { warn, debug, trace, info, error } from '@tauri-apps/plugin-log';

const listeners: ((type: LogType, message: string) => void)[] = [];
type LogType = 'log' | 'debug' | 'info' | 'warn' | 'error';
const og: Record<string, (...messages: unknown[]) => void> = {};

/**
 * @see https://v2.tauri.app/plugin/logging/#persisting-logs
 * @param fnName 
 * @param logger 
 */
function forwardConsole(
  fnName: LogType,
  logger: (message: string) => Promise<void>
) {
  const original = console[fnName];
  og[fnName] = original;
  console[fnName] = (...messages) => {
    original(...messages);
    const str = messages.map(m => m === null ? "null" : m === undefined ? "undefined" : m.toString()).join(" ");
    for (const listener of listeners) {
      listener(fnName, str);
    }
    logger(str);
  };
}

export function onConsoleLog(listener: (type: LogType, message: string) => void) {
  listeners.push(listener);
}

export function forwardConsoleToLogs() {
    forwardConsole('log', trace);
    forwardConsole('debug', debug);
    forwardConsole('info', info);
    forwardConsole('warn', warn);
    forwardConsole('error', error);
}
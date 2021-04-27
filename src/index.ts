import Pumpify from 'pumpify';
import split from 'split2';
import through from 'through2';

import { Args, setArgs } from './args';
import { handleLog } from './handle';

/**
 * Safely parses incoming JSON and logs the source if an error is thrown.
 * @param src
 */
function safeParse(src: string): any {
    try {
        const parsed = JSON.parse(src);
        return parsed;
    } catch (e) {
        console.log(src);
    }
}

/**
 * Passes the incoming stream through the proper callback.
 * @param args
 */
function streamHandler() {
    return through.obj((log, _enc, callback) => {
        handleLog(log, callback);
    });
}
/**
 * Validates the provided arguments, ensuring that all required arguments have been provided.
 * @param args
 */
function validateArgs(args: Args): void {
    if (!args.elkDomain || !args.elkDomain.trim()) {
        throw new Error('args.elkDomain is required.');
    }
    if (!args.elkRole || !args.elkRole.trim()) {
        throw new Error('args.elkRole is required.');
    }
    if (!args.elkIndex || !args.elkIndex.trim()) {
        throw new Error('args.elkIndex is required.');
    }
}

/**
 * Creates a writable stream that handles logs, batches them, and then sends
 * them to the configured endpoint.
 * @param args
 */
export function createWriteStream(args: Args): Pumpify {
    validateArgs(args);
    setArgs(args);
    return new Pumpify(split(safeParse), streamHandler());
}

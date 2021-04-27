export type Args = {
    batchSize?: number;
    timeout?: number;
    elkRole: string;
    elkDomain: string;
    elkIndex: string;
};

/**
 * Default arguments for the API.
 */
const defaultArgs: Args = {
    batchSize: 10,
    timeout: 5000,
    elkRole: '',
    elkDomain: '',
    elkIndex: '',
};

export let args: Args;

/**
 * Sets args to passed in values defaulting to above defaults.
 * @param newArgs The new arguments to set.
 */
export function setArgs(newArgs: Partial<Args>): void {
    args = {
        ...defaultArgs,
        ...newArgs,
    };
}

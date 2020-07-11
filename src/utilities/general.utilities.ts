export const sleep = async (t: number) => new Promise(r => setTimeout(r, t));

/**
 * Mutate an existing set by adding an array of sets to it (iterables)
 * @param set original set
 * @param iterables sets to be added to original set
 */
export function concatSets(set: Set<any>, ...iterables: Set<any>[]) {
    for (const iterable of iterables) {
        for (const item of iterable) {
            set.add(item);
        }
    }
}
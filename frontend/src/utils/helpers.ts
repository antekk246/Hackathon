// src/utils/helpers.ts

/**
 * Shuffles an array in place using the Fisher-Yates algorithm.
 * Returns a new array to avoid mutating the original (good for React state).
 */
export const shuffleArray = <T>(array: T[]): T[] => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
};
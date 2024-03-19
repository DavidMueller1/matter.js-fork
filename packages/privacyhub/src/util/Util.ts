export const stringifyWithBigint = (param: any): any => {
    return JSON.stringify(
        param,
        (_, value) => (typeof value === "bigint" ? value.toString() : value), // return everything else unchanged
        2
    );
};

export const mod = (n: number, m: number): number => {
    return ((n % m) + m) % m;
}
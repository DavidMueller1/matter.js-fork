export const stringifyWithBigint = (param: any): any => {
    return JSON.stringify(
        param,
        (_, value) => (typeof value === "bigint" ? value.toString() : value), // return everything else unchanged
        2
    );
};
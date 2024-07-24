export const stringifyWithBigint = (param: any): any => {
    return JSON.stringify(
        param,
        (_, value) => (typeof value === "bigint" ? value.toString() : value), // return everything else unchanged
        2
    );
};

export const stringifyIgnoreCircular = (param: any): any => {
    const cache: any[] = [];
    const str = JSON.stringify(param, function(_, value) {
        if (typeof value === "object" && value !== null) {
            if (cache.indexOf(value) !== -1) {
                // Circular reference found, discard key
                return;
            }
            // Store value in our collection
            cache.push(value);
        } else if (typeof value === "bigint") {
            return value.toString();
        }
        return value;
    });
    return str;
}

export const mod = (n: number, m: number): number => {
    return ((n % m) + m) % m;
}

export const xyToHueSat = (x: number, y: number): { hue: number; saturation: number } => {
    const hue = Math.atan2(y, x) * (180 / Math.PI);
    const saturation = Math.sqrt(x * x + y * y);
    return { hue, saturation };
}

export const hueSatToXy = (hue: number, saturation: number): { x: number; y: number } => {
    const rad = hue * (Math.PI / 180);
    const x = saturation * Math.cos(rad);
    const y = saturation * Math.sin(rad);
    return { x, y };
}
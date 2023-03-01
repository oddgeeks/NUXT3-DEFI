
export interface IPromo {
    title: string
    slug: string
    promo: string
    amount?: string
    description?: string
    content?: string
}

export const promos: IPromo[] = [
    {
        title: "ENS Internal Team",
        slug: "ens-team",
        promo: "ENS-Team-v1.0.0",
    }
];
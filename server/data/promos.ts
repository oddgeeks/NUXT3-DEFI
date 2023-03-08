
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
    },
    {
        title: "CryptoTesters",
        slug: "crypto-testers",
        promo: "Crypto-Testers-v1.0.0",
    },
    {
        title: "ENS Drop",
        slug: "ens-drop",
        promo: "ENS-Tweet-Drop-v1.0.0",
    }
];
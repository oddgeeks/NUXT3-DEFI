
interface IPromo {
    title: string
    slug: string
    amount: string
    description?: string
    content?: string
}

export const promos: IPromo[] = [
    {
        title: "Promo 420",
        slug: "promo420",
        amount: "50",
    }
];

interface IPromo {
  title: string
  slug: string
  amount: string
  description?: string
  content?: string
}

export default defineEventHandler<IPromo[]>(() => {
  return [
    {
      title: "Promo 420",
      slug: "promo420",
      amount: "50",
    }
  ];
});

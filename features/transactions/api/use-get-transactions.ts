import { useQuery } from "@tanstack/react-query";
import { client } from "@/lib/hono";
import { useSearchParams } from "next/navigation";

export const useGetPurchaseTransactions = (email: string) => {
  const params = useSearchParams();
  const from = params.get("from") || "";
  const to = params.get("to") || "";
  const categoryId = params.get("categoryId") || "";
  const query = useQuery({
    queryKey: ["purchase-transactions", { from, to, categoryId }],
    queryFn: async () => {
      const res = await client.api[":email"]["purchase-transactions"].$get({
        param: {
          email,
        },
        query: {
          from,
          to,
          categoryId,
        },
      });

      if (!res.ok) {
        throw new Error("Failed to fetch transactions");
      }
      const { data } = await res.json();
      return data;
    },
  });
  return query;
};

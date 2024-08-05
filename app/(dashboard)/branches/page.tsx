import { Metadata } from "next";
import BranchesPageClient from "./components/branch-client";
import getCurrentUser from "@/actions/getCurrentUser";

export const metadata: Metadata = {
  title: "Branches | FinFlow",
  description:
    "Efficiently manage your financial branches with FinFlow. Create, edit, and organize your branches in one place. Easy search and bulk operations for streamlined financial management.",
};

const BranchesPage = async () => {
  const user = await getCurrentUser();
  return (
    <>
      <BranchesPageClient email={user?.email || ""} />
    </>
  );
};

export default BranchesPage;

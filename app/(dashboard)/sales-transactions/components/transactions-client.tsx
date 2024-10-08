"use client";

import { useSession } from "next-auth/react";
import { Loader2, Plus, Upload } from "lucide-react";
import { columns, ResponseType } from "./column";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTable } from "@/components/data-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { insertSalesTransactionsSchema } from "@/db/schema";

import { useBulkDeleteSalesTransactions } from "@/features/sales-transactions/api/use-bulk-delete-sales-transactions";
import { useNewTransaction } from "@/features/sales-transactions/hooks/use-new-transaction";
import { useGetSalesTransactions } from "@/features/sales-transactions/api/use-get-sales-transactions";
import { useState } from "react";
import { useSelectBranch } from "@/hooks/use-select-branch";
import ImportCard from "./import-card";
import { toast } from "sonner";
import { z } from "zod";
import { useBulkCreateSalesTransactions } from "@/features/sales-transactions/api/use-bulk-create-sales-transactions";
import LoadingModal from "@/components/ui/loading-modal";

type VARIANT = "LIST" | "IMPORT";

const INITIAL_IMPORT_RESULTS = {
  data: [],
  errors: [],
  meta: {},
};

const CsvFormFields = insertSalesTransactionsSchema.omit({
  userId: true,
  id: true,
});

type CsvFormValues = z.input<typeof CsvFormFields>;

const SalesTransactionsPageClient = () => {
  const { data: authdata } = useSession();

  const [variant, setVariant] = useState<VARIANT>("LIST");
  const [importResults, setImportResults] = useState(INITIAL_IMPORT_RESULTS);

  const { onOpen } = useNewTransaction();

  const TransactionQuery = useGetSalesTransactions(authdata?.user?.email!);
  const deletetransactions = useBulkDeleteSalesTransactions(
    authdata?.user?.email!
  );
  const bulkCreateMutation = useBulkCreateSalesTransactions(
    authdata?.user?.email!
  );

  const [isLoading, setIsLoading] = useState(false);

  const [BranchDialog, confirm] = useSelectBranch();

  const isDisabled = TransactionQuery.isLoading || deletetransactions.isPending;

  const onUpload = (results: typeof INITIAL_IMPORT_RESULTS) => {
    setVariant("IMPORT");
    setImportResults(results);
  };

  const onCancelImport = () => {
    setImportResults(INITIAL_IMPORT_RESULTS);
    setVariant("LIST");
  };

  const handleSubmitImport = async (values: CsvFormValues[]) => {
    console.log(values);
    const branchId = await confirm();

    if (!branchId) {
      return toast.error("Please select a branch to continue.");
    }

    const data = values.map((v) => ({
      ...v,
      branchId: branchId as string,
    }));

    bulkCreateMutation.mutate(data, {
      onSuccess: () => {
        onCancelImport();
      },
    });
  };

  if (TransactionQuery.isLoading) {
    return (
      <div className="max-w-screen-2xl mx-auto w-full -mt-24 pb-10">
        <Card className="border-none drop-shadow-sm">
          <CardHeader>
            <Skeleton className="h-8 w-48" />
          </CardHeader>
          <CardContent>
            <div className="h-[500px] w-full flex items-center justify-center">
              <Loader2 className="size-12 text-slate-300 animate-spin" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (variant == "IMPORT") {
    return (
      <>
        <BranchDialog />
        <ImportCard
          data={importResults.data}
          onCancel={onCancelImport}
          onSubmit={handleSubmitImport}
        />
      </>
    );
  }

  const data: ResponseType[] = TransactionQuery.data || [];
  return (
    <>
      {isLoading && <LoadingModal />}
      <div className="max-w-screen-2xl mx-auto w-full -mt-24 pb-10">
        <Card className="border-none drop-shadow-sm">
          <CardHeader className="gap-y-2 lg:flex-row lg:items-center lg:justify-between">
            <CardTitle className="text-xl line-clamp-1">
              Sales Transactions History
            </CardTitle>
            <div className="flex flex-col lg:flex-row lg:items-center gap-3">
              <Button onClick={onOpen} size={"sm"}>
                <Plus className="size-4 mr-2" />
                Add New
              </Button>
              {/* <UploadButton onUpload={onUpload} /> */}
            </div>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={columns}
              data={data}
              filterKey="product"
              onDelete={(rows) => {
                const ids = rows.map((r) => r.original.id);
                const deleted = deletetransactions.mutate({
                  ids,
                });
              }}
              disabled={isDisabled}
            />
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default SalesTransactionsPageClient;

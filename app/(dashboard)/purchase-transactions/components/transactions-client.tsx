"use client";

import { useSession } from "next-auth/react";
import { Loader2, Plus, Upload } from "lucide-react";
import { columns, ResponseType } from "./column";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTable } from "@/components/data-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { insertPurchaseTransactionsSchema } from "@/db/schema";

import { useState } from "react";
import { useSelectBranch } from "@/hooks/use-select-branch";
import ImportCard from "./import-card";
import { toast } from "sonner";
import { z } from "zod";
import { useSelectPurchase } from "@/hooks/use-select-purchase";
import LoadingModal from "@/components/ui/loading-modal";

import { useNewTransaction } from "@/features/purchase-transactions/hooks/use-new-transaction";
import { useGetPurchaseTransactions } from "@/features/purchase-transactions/api/use-get-purchase-transactions";
import { useBulkDeletePurchaseTransactions } from "@/features/purchase-transactions/api/use-bulk-delete-purchase-transactions";
import { useBulkCreatePurchaseTransactions } from "@/features/purchase-transactions/api/use-bulk-create-purchase-transactions";
import { useCreatePurchasePdf } from "@/features/purchase-transactions/api/use-create-purchase-pdf";

type VARIANT = "LIST" | "IMPORT";

const INITIAL_IMPORT_RESULTS = {
  data: [],
  errors: [],
  meta: {},
};

const CsvFormFields = insertPurchaseTransactionsSchema.omit({
  userId: true,
  id: true,
});

type CsvFormValues = z.input<typeof CsvFormFields>;

const TransactionsPageClient = () => {
  const { data: authdata } = useSession();

  const [variant, setVariant] = useState<VARIANT>("LIST");
  const [importResults, setImportResults] = useState(INITIAL_IMPORT_RESULTS);
  const { onOpen } = useNewTransaction();

  const TransactionQuery = useGetPurchaseTransactions(authdata?.user?.email!);
  const deletetransactions = useBulkDeletePurchaseTransactions(
    authdata?.user?.email!
  );
  const bulkCreateMutation = useBulkCreatePurchaseTransactions(
    authdata?.user?.email!
  );

  const purchasePdfMutation = useCreatePurchasePdf(authdata?.user?.email!);
  const [PurchaseForm, purchaseConfirm] = useSelectPurchase();
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

  const handlePurchasePdf = (
    branchId: string,
    GST: number,
    paymentType: string,
    categoryIds: string[],
    totalAmount: number,
    date: Date
  ) => {
    setIsLoading(true);
    purchasePdfMutation.mutate(
      {
        branchId,
        GST,
        paymentType,
        categoryIds,
        totalAmount,
        date,
      },
      {
        onSuccess: (data) => {
          setIsLoading(false);
          const url = URL.createObjectURL(data);
          const link = document.createElement("a");
          link.href = url;
          link.target = "_blank";
          // link.download = "purchase-invoice.pdf";
          link.click();
        },
        onError: (error) => {
          setIsLoading(false);
          toast.error(error.message);
        },
      }
    );
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
      <PurchaseForm />
      <div className="max-w-screen-2xl mx-auto w-full -mt-24 pb-10">
        <Card className="border-none drop-shadow-sm">
          <CardHeader className="gap-y-2 lg:flex-row lg:items-center lg:justify-between">
            <CardTitle className="text-xl line-clamp-1">
              Purchase Transactions History
            </CardTitle>
            <div className="flex flex-col lg:flex-row lg:items-center gap-3">
              <Button onClick={onOpen} size={"sm"}>
                <Plus className="size-4 mr-2" />
                Add New
              </Button>
              <Button
                size="sm"
                onClick={async () => {
                  const {
                    branchId,
                    GST,
                    paymentType,
                    categoryIds,
                    totalAmount,
                    date,
                  } = await purchaseConfirm();
                  if (!branchId) {
                    return toast.error("Branch Name is required");
                  }
                  if (!GST) {
                    return toast.error("GST is required");
                  }
                  if (!paymentType) {
                    return toast.error("Payment Type is required");
                  }

                  if (!categoryIds || categoryIds.length === 0) {
                    return toast.error("Please select at least one category");
                  }

                  if (!totalAmount || totalAmount <= 0) {
                    return toast.error("Total Amount should be greater than 0");
                  }

                  if (!date) {
                    return toast.error("Date is required");
                  }

                  handlePurchasePdf(
                    branchId,
                    GST,
                    paymentType,
                    categoryIds,
                    totalAmount,
                    date
                  );
                }}
              >
                <Upload className="mr-2 h-4 w-4" />
                Export For Purchase
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
                console.log(deleted);
              }}
              disabled={isDisabled}
            />
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default TransactionsPageClient;

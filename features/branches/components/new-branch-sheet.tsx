import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useNewBranch } from "../hooks/use-new-branch";
import { BranchForm } from "./branch-form";
import { insertBranchSchema } from "@/db/schema";
import { z } from "zod";
import { useCreateBranch } from "../api/use-create-branch";

const formFields = insertBranchSchema.pick({
  name: true,
});

type FormValues = z.input<typeof formFields>;

const NewBranchSheet = ({ email }: { email: string }) => {
  const { isOpen, onClose } = useNewBranch();
  const mutation = useCreateBranch(email!);

  const onSubmit = (data: FormValues) => {
    mutation.mutate(
      {
        name: data.name,
      },
      {
        onSuccess: () => {
          onClose();
        },
      }
    );
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="space-y-4">
        <SheetHeader>
          <SheetTitle> New Branch </SheetTitle>
          <SheetDescription>
            Create a new branch to track your transactions.
          </SheetDescription>
        </SheetHeader>
        <BranchForm onSubmit={onSubmit} disabled={mutation.isPending} />
      </SheetContent>
    </Sheet>
  );
};

export default NewBranchSheet;

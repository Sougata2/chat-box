import { AxiosError } from "axios";
import { toast } from "sonner";

export function toastError(error: unknown) {
  const axiosError = error as AxiosError<{ message: string }>;
  toast.error(
    axiosError.response?.data.message ||
      axiosError.message ||
      "Something went wrong"
  );
}

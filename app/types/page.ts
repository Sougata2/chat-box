import { StackKey } from "@/components/PageRenderer";

export interface Page {
  name: string;
  import: string;
  closeable: boolean;
}

export interface PageLocator {
  stack: StackKey;
  page: Page | null;
  defaultPage: Page | null;
}

import { StackKey } from "@/components/PageRenderer";

export type Page = {
  name: string;
  import: string;
  closeable: boolean;
  props?: Record<string, unknown>;
};

export interface PageLocator {
  stack: StackKey;
  page: Page | null;
  defaultPage: Page | null;
}
